/**
 * AccountPilot API Service
 *
 * Thin wrapper around the FastAPI backend.
 * Base URL defaults to localhost:8000 for development,
 * override via NEXT_PUBLIC_API_URL.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "http://127.0.0.1:8000");
const API_PREFIX = "/api/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T = unknown>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${BASE}${API_PREFIX}${path}`;
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`API ${method} ${path} failed (${res.status}): ${detail}`);
    }
    return res.json();
  } catch (err: unknown) {
    // If direct BASE call failed in browser, fallback to relative proxy
    if (typeof window !== "undefined" && BASE !== "") {
      try {
        const fallbackRes = await fetch(`${API_PREFIX}${path}`, opts);
        if (fallbackRes.ok) {
          return fallbackRes.json();
        }
      } catch {
        // ignore and throw original
      }
    }
    throw err;
  }
}

// ─── Agent Run Types ───────────────────────────────────────────────────────────

export interface AgentStepSnapshot {
  label: string;
  done: boolean;
}

export interface AgentSnapshot {
  id: string;
  name: string;
  status: "idle" | "running" | "completed" | "failed";
  execution_time: number | null;
  confidence: number | null;
  steps: AgentStepSnapshot[];
  current_step: string | null;
}

export interface RunSnapshot {
  run_id: string;
  product: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  current_agent: string | null;
  started_at: string | null;
  completed_at: string | null;
  agents: AgentSnapshot[];
  events: { timestamp: string; type: string; message: string }[];
  results: Record<string, unknown>;
  error: string | null;
}

// ─── Endpoints ─────────────────────────────────────────────────────────────────

/** POST /agent-runs — kicks off a new sequential pipeline */
export function startRun(product: string): Promise<RunSnapshot> {
  return request("POST", "/agent-runs", { product });
}

/** GET /agent-runs/:id — poll current state */
export function getRun(runId: string): Promise<RunSnapshot> {
  return request("GET", `/agent-runs/${runId}`);
}

/** GET /health — simple health check */
export function healthCheck(): Promise<{ status: string }> {
  return request("GET", "/health");
}

// ─── Outreach & Email Draft Types & APIs ───────────────────────────────────────

export interface EmailDraft {
  id: string;
  campaign_id: string;
  company: string;
  product: string;
  decision_maker: string;
  recipient_email: string;
  subject: string;
  body: string;
  intent_score: number;
  generated_by: string;
  status: "draft" | "approved" | "sending" | "sent" | "failed" | "opened" | "clicked" | "replied";
  cta?: string | null;
  confidence: number;
  reason?: string | null;
  metadata?: {
    buying_signals?: string[];
    pain_points?: string[];
    meeting_summary?: string;
    research_summary?: string;
    urgency?: string;
    purchase_window?: string;
    recommended_action?: string;
    decision_maker_title?: string;
    champion_name?: string;
    champion_title?: string;
  };
  sent_time?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SendDraftResponse {
  status: "success" | "failed";
  message: string;
  draft_id?: string | null;
  sent_at?: string | null;
}

/** GET /outreach/drafts */
export function listEmailDrafts(params?: {
  product?: string;
  campaign_id?: string;
  company?: string;
  limit?: number;
}): Promise<EmailDraft[]> {
  const query = new URLSearchParams();
  if (params?.product) query.set("product", params.product);
  if (params?.campaign_id) query.set("campaign_id", params.campaign_id);
  if (params?.company) query.set("company", params.company);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return request("GET", `/outreach/drafts${qs ? `?${qs}` : ""}`);
}

/** GET /outreach/drafts/:id */
export function getEmailDraft(draftId: string): Promise<EmailDraft> {
  return request("GET", `/outreach/drafts/${draftId}`);
}

/** POST /outreach/generate */
export function generateDraft(payload: {
  product: string;
  company_name?: string;
  campaign_id?: string;
  tone?: string;
}): Promise<{ status: string; draft: EmailDraft; company?: any }> {
  return request("POST", "/outreach/generate", payload);
}

/** POST /outreach/regenerate */
export function regenerateDraft(payload: {
  draft_id: string;
  tone: string;
  instructions?: string;
}): Promise<{ status: string; draft: EmailDraft; message: string }> {
  return request("POST", "/outreach/regenerate", payload);
}

/** PATCH /outreach/drafts/:id */
export function updateEmailDraft(
  draftId: string,
  updates: Partial<EmailDraft>,
): Promise<EmailDraft> {
  return request("PATCH", `/outreach/drafts/${draftId}`, updates);
}

/** POST /outreach/send */
export function sendEmailDraft(payload: {
  draft_id?: string;
  to_email?: string;
  subject?: string;
  content?: string;
}): Promise<SendDraftResponse> {
  return request("POST", "/outreach/send", payload);
}

// ─── Settings API ──────────────────────────────────────────────────────────────

export interface UserSettings {
  user_id: string;
  full_name?: string | null;
  company_name?: string | null;
  designation?: string | null;
  phone_number?: string | null;
  profile_picture_url?: string | null;
  auto_send_email?: boolean | null;
  sender_name?: string | null;
  reply_email?: string | null;
  timezone?: string | null;
  daily_limit?: number | null;
  delay_between_emails?: number | null;
  email_signature?: string | null;
  llm_model?: string | null;
  temperature?: number | null;
  writing_style?: string | null;
  tone_tags?: string[] | null;
  email_length?: string | null;
  notify_email_opened?: boolean | null;
  notify_campaign_complete?: boolean | null;
  notify_agent_failure?: boolean | null;
  weekly_report?: boolean | null;
  daily_summary?: boolean | null;
}

export interface EmailLog {
  id: string;
  user_id: string;
  recipient_email: string;
  subject: string;
  status: string;
  opened_at?: string | null;
  error_message?: string | null;
  created_at: string;
}

export function getSettings(userId: string): Promise<{ status: string; data: UserSettings }> {
  return request("GET", `/settings?user_id=${userId}`);
}

export function upsertSettings(payload: UserSettings): Promise<{ status: string; data: UserSettings }> {
  return request("POST", "/settings", payload);
}

export function updatePassword(payload: { user_id: string; new_password: string }): Promise<{ status: string; message: string }> {
  return request("POST", "/settings/password", payload);
}

export function getEmailLogs(userId: string, limit = 100): Promise<{ status: string; data: EmailLog[] }> {
  return request("GET", `/email-logs?user_id=${userId}&limit=${limit}`);
}
