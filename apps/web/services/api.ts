/**
 * AccountPilot API Service
 *
 * Thin wrapper around the FastAPI backend.
 * Base URL defaults to localhost:8000 for development,
 * override via NEXT_PUBLIC_API_URL.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

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
  const res = await fetch(url, opts);
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} failed (${res.status}): ${detail}`);
  }
  return res.json();
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
