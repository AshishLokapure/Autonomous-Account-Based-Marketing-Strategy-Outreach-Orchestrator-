"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

import { getRun, startRun, type RunSnapshot } from "@/services/api";

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
  status: "idle" | "starting" | "running" | "completed" | "failed";
  currentAgent: string | null;
  currentStep: string | null;
  progress: number;
  running: boolean;
  started: boolean;
  completed: boolean;
  totalElapsed: number;
  currentAgentIndex: number;
  agents: AgentState[];
  product: string;
  error: string | null;
  agentResults: Record<string, unknown> | null;
  runId: string | null;
  logs: { agent?: string; message: string; timestamp: string }[];
}

const AGENT_DEFS = [
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
    steps: ["Loading Research Data", "Loading Stakeholder Data", "Extracting Keywords", "Matching Patterns", "Calculating Scores", "Ranking Companies", "Generating Intent Report"],
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
] as const;

function buildInitialAgents(): AgentState[] {
  return AGENT_DEFS.map((d) => ({
    id: d.id,
    name: d.name,
    href: d.href,
    steps: d.steps.map((label) => ({ label, done: false })),
    status: "idle",
    progress: 0,
    elapsed: 0,
    confidence: 0,
  }));
}

const INITIAL: CampaignState = {
  status: "idle",
  currentAgent: null,
  currentStep: null,
  progress: 0,
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
  logs: [],
};

interface CampaignCtx {
  state: CampaignState;
  startCampaign: (product?: string) => void;
  resetCampaign: () => void;
}

const Ctx = createContext<CampaignCtx | null>(null);

function mapAgentStatus(status: "idle" | "running" | "completed" | "failed"): AgentStatus {
  if (status === "failed") return "error";
  return status;
}

function mapRunSnapshot(snapshot: RunSnapshot, previous: CampaignState): CampaignState {
  const agents = AGENT_DEFS.map((def, index) => {
    const backendAgent = snapshot.agents.find((agent) => agent.id === def.id);
    return {
      id: def.id,
      name: def.name,
      href: def.href,
      status: backendAgent ? mapAgentStatus(backendAgent.status) : "idle",
      progress: backendAgent?.status === "completed" ? 100 : backendAgent?.status === "running"
        ? Math.round((backendAgent.steps.filter((step) => step.done).length / Math.max(backendAgent.steps.length, 1)) * 100)
        : 0,
      elapsed: backendAgent?.execution_time ?? 0,
      confidence: backendAgent?.confidence ?? 0,
      steps: backendAgent?.steps ?? def.steps.map((label) => ({ label, done: false })),
    };
  });

  const currentAgentIndex = agents.findIndex((agent) => agent.id === snapshot.current_agent);
  const currentAgent = agents.find((agent) => agent.id === snapshot.current_agent);
  const currentStep = currentAgent?.steps.find((step) => !step.done)?.label ?? null;
  const startedAt = snapshot.started_at ? new Date(snapshot.started_at).getTime() : null;
  const completedAt = snapshot.completed_at ? new Date(snapshot.completed_at).getTime() : null;
  const endTime = completedAt ?? Date.now();
  const totalElapsed = startedAt ? Math.max(0, Math.round((endTime - startedAt) / 1000)) : previous.totalElapsed;

  return {
    status: snapshot.status === "queued" ? "starting" : snapshot.status,
    currentAgent: snapshot.current_agent,
    currentStep,
    progress: snapshot.progress,
    running: snapshot.status === "queued" || snapshot.status === "running",
    started: snapshot.status !== "queued",
    completed: snapshot.status === "completed",
    totalElapsed,
    currentAgentIndex,
    agents,
    product: snapshot.product,
    error: snapshot.error,
    agentResults: snapshot.results ?? null,
    runId: snapshot.run_id,
    logs: snapshot.events.map((event) => ({
      agent: event.message.includes(":") ? event.message.split(":")[0] : undefined,
      message: event.message,
      timestamp: event.timestamp,
    })),
  };
}

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CampaignState>(INITIAL);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const resetCampaign = useCallback(() => {
    stopPolling();
    setState({ ...INITIAL, agents: buildInitialAgents() });
  }, [stopPolling]);

  const pollRun = useCallback(async (runId: string) => {
    try {
      const snapshot = await getRun(runId);
      setState((previous) => mapRunSnapshot(snapshot, previous));
      if (snapshot.status === "completed" || snapshot.status === "failed") {
        stopPolling();
      }
    } catch (error) {
      stopPolling();
      setState((previous) => ({
        ...previous,
        status: "failed",
        running: false,
        error: error instanceof Error ? error.message : "Failed to poll agent run",
      }));
    }
  }, [stopPolling]);

  const startCampaign = useCallback((product = "Azure AI") => {
    stopPolling();
    setState({
      ...INITIAL,
      agents: buildInitialAgents(),
      status: "starting",
      running: true,
      product,
    });

    void (async () => {
      try {
        const run = await startRun(product);
        setState((previous) => mapRunSnapshot(run, previous));
        pollRef.current = setInterval(() => {
          void pollRun(run.run_id);
        }, 1200);
      } catch (error) {
        setState((previous) => ({
          ...previous,
          status: "failed",
          running: false,
          error: error instanceof Error ? error.message : "Failed to start campaign",
        }));
      }
    })();
  }, [pollRun, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  return <Ctx.Provider value={{ state, startCampaign, resetCampaign }}>{children}</Ctx.Provider>;
}

export function useCampaign() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCampaign must be used inside CampaignProvider");
  return ctx;
}

