"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  startRun,
  getRun,
  type RunSnapshot,
  type AgentSnapshot,
} from "@/services/api";

/* ─── Public types ──────────────────────────────────────────────────────────── */

export type AgentStatus = "idle" | "running" | "completed" | "error";

export interface AgentStep {
  label: string;
  done: boolean;
}

export interface AgentState {
  id: string;
  name: string;
  status: AgentStatus;
  progress: number;
  elapsed: number;
  confidence: number;
  steps: AgentStep[];
  href: string;
}

export interface CampaignState {
  running: boolean;
  started: boolean;
  completed: boolean;
  totalElapsed: number;
  currentAgentIndex: number;
  agents: AgentState[];
  product: string;
  error: string | null;
  agentResults: Record<string, any> | null;
  runId: string | null;
}

/* ─── Static definitions ────────────────────────────────────────────────────── */

const AGENT_DEFS: { id: string; name: string; href: string; steps: string[] }[] = [
  {
    id: "research",
    name: "Research Agent",
    href: "/research",
    steps: ["Loading Website", "Loading LinkedIn", "Loading Reddit", "Generating Report"],
  },
  {
    id: "stakeholder",
    name: "Stakeholder Agent",
    href: "/stakeholders",
    steps: ["Loading Emails", "Loading Meeting Transcripts", "Finding Decision Makers", "Finding Champions", "Detecting Buying Signals"],
  },
  {
    id: "intent",
    name: "Intent Agent",
    href: "/intent",
    steps: ["Analyzing Intent", "Competitor Detection", "Urgency Detection"],
  },
  {
    id: "strategy",
    name: "Strategy Agent",
    href: "/strategy",
    steps: ["Building Strategy", "Finding White Space", "Prioritization"],
  },
  {
    id: "outreach",
    name: "Outreach Agent",
    href: "/outreach",
    steps: ["Generating Email", "Generating LinkedIn Message", "Generating Next Best Action"],
  },
];

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

function buildInitialAgents(): AgentState[] {
  return AGENT_DEFS.map((d) => ({
    id: d.id,
    name: d.name,
    href: d.href,
    steps: d.steps.map((s) => ({ label: s, done: false })),
    status: "idle",
    progress: 0,
    elapsed: 0,
    confidence: 0,
  }));
}

/** Map a backend AgentSnapshot status to the frontend AgentStatus enum */
function mapStatus(s: AgentSnapshot["status"]): AgentStatus {
  if (s === "failed") return "error";
  return s as AgentStatus;
}

/** Compute per-agent progress from step completion */
function stepProgress(agent: AgentSnapshot): number {
  if (agent.status === "completed") return 100;
  if (agent.status === "idle") return 0;
  const done = agent.steps.filter((s) => s.done).length;
  return Math.min(99, Math.round((done / agent.steps.length) * 100));
}

/** Reconcile a backend RunSnapshot into our CampaignState shape */
function reconcile(snap: RunSnapshot, elapsed: number): CampaignState {
  const currentIdx = snap.agents.findIndex((a) => a.status === "running");
  const agents: AgentState[] = snap.agents.map((a, i) => {
    const def = AGENT_DEFS[i];
    return {
      id: a.id,
      name: a.name,
      href: def?.href ?? "#",
      status: mapStatus(a.status),
      progress: stepProgress(a),
      elapsed: a.execution_time ? Math.round(a.execution_time) : 0,
      confidence: a.confidence ?? 0,
      steps: a.steps.map((s) => ({ label: s.label, done: s.done })),
    };
  });
  return {
    running: snap.status === "running" || snap.status === "queued",
    started: true,
    completed: snap.status === "completed",
    totalElapsed: elapsed,
    currentAgentIndex: currentIdx,
    agents,
    product: snap.product,
    error: snap.error,
    agentResults: Object.keys(snap.results).length > 0 ? (snap.results as Record<string, any>) : null,
    runId: snap.run_id,
  };
}

/* ─── Initial state ─────────────────────────────────────────────────────────── */

const INITIAL: CampaignState = {
  running: false,
  started: false,
  completed: false,
  totalElapsed: 0,
  currentAgentIndex: -1,
  agents: buildInitialAgents(),
  product: "Azure AI",
  error: null,
  agentResults: null,
  runId: null,
};

/* ─── Context ───────────────────────────────────────────────────────────────── */

interface CampaignCtx {
  state: CampaignState;
  startCampaign: (product?: string) => void;
  resetCampaign: () => void;
}

const Ctx = createContext<CampaignCtx | null>(null);

const POLL_MS = 800;

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CampaignState>(INITIAL);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedSec = useRef(0);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
    elapsedSec.current = 0;
  }, []);

  const resetCampaign = useCallback(() => {
    cleanup();
    setState({ ...INITIAL, agents: buildInitialAgents() });
  }, [cleanup]);

  const startCampaign = useCallback(
    async (product = "Azure AI") => {
      cleanup();
      elapsedSec.current = 0;

      // Optimistic UI — immediately show "running"
      setState({
        ...INITIAL,
        agents: buildInitialAgents(),
        running: true,
        started: true,
        product,
        runId: null,
      });

      try {
        // Call backend to start the pipeline
        const snap = await startRun(product);
        const runId = snap.run_id;

        // Update with the initial snapshot
        setState(reconcile(snap, 0));

        // Elapsed ticker
        elapsedRef.current = setInterval(() => {
          elapsedSec.current += 1;
          setState((s) => ({ ...s, totalElapsed: elapsedSec.current }));
        }, 1000);

        // Poll for updates
        pollRef.current = setInterval(async () => {
          try {
            const latest = await getRun(runId);
            const newState = reconcile(latest, elapsedSec.current);
            setState(newState);

            if (
              latest.status === "completed" ||
              latest.status === "failed"
            ) {
              cleanup();
            }
          } catch {
            // Silently retry — transient network hiccup
          }
        }, POLL_MS);
      } catch (err: any) {
        cleanup();
        setState((s) => ({
          ...s,
          running: false,
          error: err?.message ?? "Failed to start campaign",
        }));
      }
    },
    [cleanup],
  );

  return (
    <Ctx.Provider value={{ state, startCampaign, resetCampaign }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCampaign() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCampaign must be used inside CampaignProvider");
  return ctx;
}
