"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";

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

const AGENT_DEFS: {
  id: string;
  name: string;
  href: string;
  steps: string[];
  duration: number;
  confidence: number;
}[] = [
  {
    id: "research",
    name: "Research Agent",
    href: "/research",
    steps: ["Loading Website", "Loading LinkedIn", "Loading Reddit", "Generating Report"],
    duration: 8000,
    confidence: 94,
  },
  {
    id: "stakeholder",
    name: "Stakeholder Agent",
    href: "/stakeholders",
    steps: ["Loading Emails", "Loading Meeting Transcripts", "Finding Decision Makers", "Finding Champions", "Detecting Buying Signals"],
    duration: 7000,
    confidence: 91,
  },
  {
    id: "intent",
    name: "Intent Agent",
    href: "/intent",
    steps: ["Analyzing Intent", "Competitor Detection", "Urgency Detection"],
    duration: 6000,
    confidence: 88,
  },
  {
    id: "strategy",
    name: "Strategy Agent",
    href: "/strategy",
    steps: ["Building Strategy", "Finding White Space", "Prioritization"],
    duration: 7000,
    confidence: 92,
  },
  {
    id: "outreach",
    name: "Outreach Agent",
    href: "/outreach",
    steps: ["Generating Email", "Generating LinkedIn Message", "Generating Next Best Action"],
    duration: 6000,
    confidence: 90,
  },
];

/** Map product name ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ public JSON files */
function getResearchFile(product: string): string {
  if (product === "AWS Cloud") return "/data/aws-research-data.json";
  if (product === "Claude Enterprise") return "/data/claude-research-data.json";
  return "/data/azure-research-data.json";
}
function getMailsFile(product: string): string {
  if (product === "AWS Cloud") return "/data/aws-mails.json";
  if (product === "Claude Enterprise") return "/data/claude-mails.json";
  return "/data/azure-mails.json";
}
function getTranscriptsFile(product: string): string {
  if (product === "AWS Cloud") return "/data/aws-transcripts.json";
  if (product === "Claude Enterprise") return "/data/claude-transcripts.json";
  return "/data/azure-transcripts.json";
}

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

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CampaignState>(INITIAL);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedSec = useRef(0);

  const cleanup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
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
    (product = "Azure AI") => {
      cleanup();
      elapsedSec.current = 0;

      setState({
        ...INITIAL,
        agents: buildInitialAgents(),
        status: "running",
        currentAgent: AGENT_DEFS[0].id,
        currentStep: AGENT_DEFS[0].steps[0],
        running: true,
        started: true,
        product,
        runId: `run-${Date.now()}`,
        logs: [],
      });

      // Elapsed ticker
      elapsedRef.current = setInterval(() => {
        elapsedSec.current += 1;
        setState((s) => ({ ...s, totalElapsed: elapsedSec.current }));
      }, 1000);

      let cursor = 0;

      AGENT_DEFS.forEach((def, agentIdx) => {
        const agentStart = cursor;
        const agentEnd = cursor + def.duration;
        const stepCount = def.steps.length;

        // Mark agent as running
        const tStart = setTimeout(() => {
          setState((s) => {
            const agents = s.agents.map((a) =>
              a.id === def.id
                ? { ...a, status: "running" as AgentStatus, progress: 0 }
                : a
            );
            return {
              ...s,
              agents,
              currentAgent: def.id,
              currentAgentIndex: agentIdx,
              currentStep: def.steps[0],
              status: "running",
            };
          });
        }, agentStart);
        timersRef.current.push(tStart);

        // Complete each step evenly
        def.steps.forEach((stepLabel, stepIdx) => {
          const stepTime =
            agentStart +
            Math.round(((stepIdx + 1) / stepCount) * def.duration * 0.85);
          const tStep = setTimeout(() => {
            setState((s) => {
              const agents = s.agents.map((a) => {
                if (a.id !== def.id) return a;
                const steps = a.steps.map((st, i) =>
                  i <= stepIdx ? { ...st, done: true } : st
                );
                const progress = Math.round(((stepIdx + 1) / stepCount) * 90);
                return { ...a, steps, progress };
              });
              const nextStep = def.steps[stepIdx + 1] ?? null;
              return {
                ...s,
                agents,
                currentStep: nextStep ?? s.currentStep,
              };
            });
          }, stepTime);
          timersRef.current.push(tStep);
        });

        // Smooth progress ticker
        const tickInterval = 200;
        const ticks = Math.floor(def.duration / tickInterval);
        for (let t = 1; t <= ticks; t++) {
          const tickTime = agentStart + t * tickInterval;
          const tick = setTimeout(() => {
            setState((s) => {
              const agents = s.agents.map((a) => {
                if (a.id !== def.id || a.status !== "running") return a;
                const elapsed = (tickTime - agentStart) / 1000;
                const progress = Math.min(
                  99,
                  Math.round((elapsed / (def.duration / 1000)) * 100)
                );
                return { ...a, progress, elapsed };
              });
              return { ...s, agents };
            });
          }, tickTime);
          timersRef.current.push(tick);
        }

        // Mark agent completed ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â for Research Agent, also load JSON
        const tEnd = setTimeout(async () => {
          // Load data when specific agents complete
          let researchData: unknown = null;
          let stakeholderData: unknown = null;

          if (def.id === "research") {
            try {
              const res = await fetch(getResearchFile(product));
              if (res.ok) researchData = await res.json();
            } catch { /* ignore */ }
          }

          if (def.id === "stakeholder") {
            try {
              const [mailsRes, transcriptsRes] = await Promise.all([
                fetch(getMailsFile(product)),
                fetch(getTranscriptsFile(product)),
              ]);
              const mails = mailsRes.ok ? await mailsRes.json() : [];
              const transcripts = transcriptsRes.ok ? await transcriptsRes.json() : [];

              // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Groq LLM: answer 7 questions per company ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
              let groqIntel: unknown[] = [];
              let currentRunId: string | null = null;
              try {
                const { runGroqStakeholderIntel } = await import("@/lib/groq-stakeholder");
                const { saveAllStakeholderIntel } = await import("@/lib/stakeholder-supabase");

                // Get company names from research JSON already fetched
                // Re-fetch the research file (already cached by browser)
                const researchCompanies: string[] = [];
                try {
                  const rRes = await fetch(getResearchFile(product));
                  if (rRes.ok) {
                    const rData = await rRes.json();
                    (rData.companies ?? []).forEach((c: any) => {
                      const name = c.company_profile?.company_name;
                      if (name) researchCompanies.push(name);
                    });
                  }
                } catch { /* ignore */ }

                // Run Groq for each company in parallel
                const intelResults = await Promise.all(
                  researchCompanies.map((company) => {
                    const companyEmails = (mails as any[]).filter((e: any) =>
                      e.email_id?.toLowerCase().includes(company.toLowerCase().replace(/\s/g, "_")) ||
                      e.email_id?.toLowerCase().includes(company.toLowerCase().split(" ")[0])
                    );
                    const companyMeetings = (transcripts as any[]).filter((m: any) =>
                      m.account?.name?.toLowerCase().includes(company.toLowerCase()) ||
                      company.toLowerCase().includes(m.account?.name?.toLowerCase() ?? "")
                    );
                    return runGroqStakeholderIntel(company, companyEmails, companyMeetings, product);
                  })
                );

                groqIntel = intelResults;

                // Save to Supabase using the campaign runId
                currentRunId = `run-${Date.now()}`;
                await saveAllStakeholderIntel(intelResults, currentRunId);
                console.log(`[Stakeholder Agent] Groq + Supabase complete. ${intelResults.length} companies processed.`);
              } catch (groqErr) {
                console.error("[Groq/Supabase] stakeholder intel failed:", groqErr);
              }

              stakeholderData = { mails, transcripts, groqIntel, runId: currentRunId };
            } catch { /* ignore */ }
          }

          setState((s) => {
            const agents = s.agents.map((a) => {
              if (a.id !== def.id) return a;
              const steps = a.steps.map((st) => ({ ...st, done: true }));
              return {
                ...a,
                status: "completed" as AgentStatus,
                progress: 100,
                elapsed: def.duration / 1000,
                confidence: def.confidence,
                steps,
              };
            });

            const isLast = agentIdx === AGENT_DEFS.length - 1;
            const totalDone = agents.filter((a) => a.status === "completed").length;
            const overallProgress = Math.round((totalDone / AGENT_DEFS.length) * 100);

            const nextAgent = isLast ? null : AGENT_DEFS[agentIdx + 1]?.id ?? null;

            return {
              ...s,
              agents,
              progress: overallProgress,
              currentAgent: nextAgent,
              currentStep: nextAgent
                ? AGENT_DEFS[agentIdx + 1]?.steps[0] ?? null
                : null,
              agentResults: {
                ...(s.agentResults ?? {}),
                ...(researchData !== null ? { research: researchData } : {}),
                ...(stakeholderData !== null ? { stakeholder: stakeholderData } : {}),
              },
            };
          });
        }, agentEnd);
        timersRef.current.push(tEnd);

        cursor = agentEnd;
      });

      // Mark entire campaign completed
      const tDone = setTimeout(() => {
        cleanup();
        setState((s) => ({
          ...s,
          status: "completed",
          running: false,
          completed: true,
          progress: 100,
          currentAgent: null,
          currentStep: null,
          currentAgentIndex: -1,
        }));
      }, cursor + 300);
      timersRef.current.push(tDone);
    },
    [cleanup]
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
