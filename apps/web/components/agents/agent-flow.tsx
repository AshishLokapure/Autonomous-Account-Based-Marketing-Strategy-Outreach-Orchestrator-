"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, BarChart3, CheckCircle2, Clock, Cpu, Globe, Linkedin, Loader2,
  Mail, MessageCircle, Rocket, RotateCcw, Search, ShieldCheck, Target,
  Users, XCircle, Zap,
} from "lucide-react";
import { useCampaign, type AgentStatus as CampaignAgentStatus } from "@/stores/campaign-store";

/* ------------------------------------------------------------------ */
/* Pipeline definition — maps backend agents to a DAG                  */
/* ------------------------------------------------------------------ */

type NodeStatus = "waiting" | "running" | "completed" | "failed";

const STD = { w: 252, h: 108 };
const WIDE = { w: 470, h: 82 };

interface AgentDef {
  id: string;
  name: string;
  icon: React.ElementType;
  x: number;
  y: number;
  wide?: boolean;
  source?: boolean;
  deps: string[];
  duration: number;
  idleText: string;
  runningText: string;
  result: string;
  confidence?: number;
  failChance?: number;
  accent: string;
  /** Which backend agent id this node maps to, if any */
  backendAgent?: string;
}

const AGENTS: AgentDef[] = [
  { id: "orchestrator", name: "AI Multi-Agent Orchestrator", icon: Cpu, x: 490, y: 24, wide: true, deps: [], duration: 1500, idleText: "Awaiting campaign launch", runningText: "Bootstrapping agent pipeline…", result: "Pipeline configured — 5 agents online", accent: "#7c3aed" },

  { id: "website",  name: "Website",  icon: Globe,         x: 152, y: 196, source: true, deps: ["orchestrator"], duration: 2400, idleText: "Company domains", runningText: "Crawling company websites…", result: "38 pages analyzed",  accent: "#2563eb", backendAgent: "research" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin,      x: 152, y: 348, source: true, deps: ["orchestrator"], duration: 3000, idleText: "Professional graph", runningText: "Scanning company pages & people…", result: "94 profiles mapped", accent: "#0a66c2", backendAgent: "research" },
  { id: "reddit",   name: "Reddit",   icon: MessageCircle, x: 152, y: 500, source: true, deps: ["orchestrator"], duration: 2700, idleText: "Community signals", runningText: "Mining community discussions…", result: "27 threads scanned", accent: "#ff4500", backendAgent: "research" },

  { id: "research",     name: "Research Agent",     icon: Search,      x: 490, y: 348,  deps: ["website", "linkedin", "reddit"], duration: 3200, idleText: "Company, market & competitor context", runningText: "Aggregating multi-source intelligence…", result: "38 companies profiled",      confidence: 94, accent: "#2563eb", backendAgent: "research" },
  { id: "stakeholder",  name: "Stakeholder Agent",  icon: Users,       x: 490, y: 512,  deps: ["research"],     duration: 2800, idleText: "Buying committee mapping",             runningText: "Mapping decision makers & champions…",  result: "94 decision makers mapped",  confidence: 91, accent: "#0891b2", backendAgent: "stakeholder" },
  { id: "intent",       name: "Intent Agent",       icon: Zap,         x: 490, y: 676,  deps: ["stakeholder"],  duration: 2400, idleText: "Buying signal detection",              runningText: "Scoring verified buying signals…",      result: "67 buying signals scored",   confidence: 88, accent: "#d97706", backendAgent: "intent" },
  { id: "strategy",     name: "Strategy Agent",     icon: Target,      x: 490, y: 840,  deps: ["intent"],       duration: 2800, idleText: "Account strategy generation",          runningText: "Generating account strategies…",        result: "38 strategies generated",    confidence: 92, accent: "#16a34a", backendAgent: "strategy" },
  { id: "outreach",     name: "Outreach Agent",     icon: Mail,        x: 490, y: 1004, deps: ["strategy"],     duration: 3000, idleText: "Personalized outreach drafting",       runningText: "Drafting emails, scripts & briefs…",    result: "152 outreach assets drafted", confidence: 90, accent: "#db2777", backendAgent: "outreach" },

  { id: "analytics", name: "Dashboard Analytics", icon: BarChart3, x: 490, y: 1168, wide: true, deps: ["outreach"], duration: 1600, idleText: "Awaiting verified results", runningText: "Publishing campaign report…", result: "Report published to dashboard", accent: "#2563eb" },
];

const CANVAS = { w: 980, h: 1290 };

const dims = (a: AgentDef) => (a.wide ? WIDE : STD);
const byId = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<string, AgentDef>;

/* Edges derived from deps */
interface Edge { id: string; from: AgentDef; to: AgentDef; d: string }

function buildEdges(): Edge[] {
  const edges: Edge[] = [];
  for (const to of AGENTS) {
    for (const dep of to.deps) {
      const from = byId[dep];
      const fd = dims(from);
      const td = dims(to);
      let d: string;
      if (Math.abs(from.x - to.x) < 4) {
        d = `M ${from.x} ${from.y + fd.h} L ${to.x} ${to.y}`;
      } else if (from.source || to.source) {
        const x1 = from.source ? from.x + fd.w / 2 : from.x - fd.w / 2 + 30;
        const y1 = from.source ? from.y + fd.h / 2 : from.y + fd.h;
        const x2 = to.source ? to.x + td.w / 2 : to.x - td.w / 2;
        const y2 = to.source ? to.y : to.y + td.h / 2;
        if (from.wide) {
          const sx = from.x - fd.w / 2 + 60;
          d = `M ${sx} ${from.y + fd.h} C ${sx} ${from.y + fd.h + 60}, ${to.x} ${to.y - 60}, ${to.x} ${to.y}`;
        } else {
          const mx = (x1 + x2) / 2;
          d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
        }
      } else {
        d = `M ${from.x} ${from.y + fd.h} L ${to.x} ${to.y}`;
      }
      edges.push({ id: `edge-${from.id}-${to.id}`, from, to, d });
    }
  }
  return edges;
}

const EDGES = buildEdges();

/* ------------------------------------------------------------------ */
/* Map backend campaign state to node statuses                          */
/* ------------------------------------------------------------------ */

interface NodeState { status: NodeStatus; progress: number; elapsed: number; retried: boolean }
interface LogEntry { t: number; msg: string; kind: "start" | "ok" | "err" | "info" }

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function mapBackendStatus(s: CampaignAgentStatus): NodeStatus {
  if (s === "error") return "failed";
  if (s === "idle") return "waiting";
  return s;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AgentFlow() {
  const { state: campaign, startCampaign } = useCampaign();
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoStarted = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const prevAgentsRef = useRef<string>(""); // track changes for log entries
  const [log, setLog] = useState<LogEntry[]>([]);
  const [product, setProduct] = useState("Azure AI");

  // Derive node states from backend campaign state
  const nodeStates: Record<string, NodeState> = {};

  // Build a lookup from backend agent id -> campaign agent state
  const backendMap = new Map(campaign.agents.map(a => [a.id, a]));

  for (const def of AGENTS) {
    if (def.backendAgent) {
      const ba = backendMap.get(def.backendAgent);
      if (ba) {
        // Special handling for source nodes (website, linkedin, reddit)
        // They map to the research agent's sub-steps
        if (def.source && def.backendAgent === "research") {
          const stepMap: Record<string, number> = { website: 0, linkedin: 1, reddit: 2 };
          const stepIdx = stepMap[def.id];
          const step = ba.steps[stepIdx];
          let status: NodeStatus = "waiting";
          if (ba.status === "completed" || step?.done) {
            status = "completed";
          } else if (ba.status === "running") {
            const currentStepIdx = ba.steps.findIndex((s) => !s.done);
            if (currentStepIdx === stepIdx) {
              status = "running";
            } else if (currentStepIdx > stepIdx) {
              status = "completed";
            } else {
              status = "waiting";
            }
          } else if (ba.status === "error") {
            status = "failed";
          }
          nodeStates[def.id] = {
            status,
            progress: status === "completed" ? 100 : status === "running" ? ba.progress : 0,
            elapsed: ba.elapsed,
            retried: false,
          };
        } else {
          // Direct mapping for main agents
          nodeStates[def.id] = {
            status: mapBackendStatus(ba.status),
            progress: ba.progress,
            elapsed: ba.elapsed,
            retried: false,
          };
        }
      } else {
        nodeStates[def.id] = { status: "waiting", progress: 0, elapsed: 0, retried: false };
      }
    } else if (def.id === "orchestrator") {
      // Orchestrator should complete once the first agent has started.
      const s: NodeStatus = campaign.started
        ? campaign.currentAgent && campaign.currentAgent !== "orchestrator"
          ? "completed"
          : "running"
        : "waiting";
      nodeStates[def.id] = {
        status: s,
        progress: s === "completed" ? 100 : s === "running" ? 50 : 0,
        elapsed: 0,
        retried: false,
      };
    } else if (def.id === "analytics") {
      // Analytics is "completed" when campaign is completed
      const s: NodeStatus = campaign.completed ? "completed"
        : (backendMap.get("outreach")?.status === "completed" ? "running" : "waiting");
      nodeStates[def.id] = {
        status: s,
        progress: s === "completed" ? 100 : s === "running" ? 75 : 0,
        elapsed: 0,
        retried: false,
      };
    } else {
      nodeStates[def.id] = { status: "waiting", progress: 0, elapsed: 0, retried: false };
    }
  }

  // Build log entries from backend events
  useEffect(() => {
    const sig = campaign.agents.map(a => `${a.id}:${a.status}`).join(",");
    if (sig === prevAgentsRef.current) return;
    prevAgentsRef.current = sig;

    const newLog: LogEntry[] = [];
    if (campaign.started && log.length === 0) {
      newLog.push({ t: 0, msg: "Campaign pipeline initialized", kind: "info" });
    }
    for (const a of campaign.agents) {
      if (a.status === "running") {
        const exists = log.some(l => l.msg.includes(`${a.name} started`));
        if (!exists) newLog.push({ t: campaign.totalElapsed, msg: `${a.name} started`, kind: "start" });
      }
      if (a.status === "completed") {
        const exists = log.some(l => l.msg.includes(`${a.name} completed`));
        if (!exists) newLog.push({ t: campaign.totalElapsed, msg: `${a.name} completed in ${a.elapsed}s — confidence ${a.confidence}%`, kind: "ok" });
      }
      if (a.status === "error") {
        const exists = log.some(l => l.msg.includes(`${a.name} failed`));
        if (!exists) newLog.push({ t: campaign.totalElapsed, msg: `${a.name} failed`, kind: "err" });
      }
    }
    if (campaign.completed) {
      const exists = log.some(l => l.msg.includes("all agents"));
      if (!exists) newLog.push({ t: campaign.totalElapsed, msg: "Campaign completed — all agents verified ✓", kind: "info" });
    }
    if (newLog.length > 0) setLog(prev => [...prev, ...newLog]);
  }, [campaign, log]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log.length]);

  const start = useCallback(() => {
    setLog([]);
    startCampaign(product);
  }, [startCampaign, product]);

  // Auto-start from floating CTA
  useEffect(() => {
    if (!autoStarted.current && searchParams.get("autostart") === "1") {
      autoStarted.current = true;
      const t = setTimeout(start, 600);
      return () => clearTimeout(t);
    }
  }, [searchParams, start]);

  const completedAgents = AGENTS.filter((a) => a.confidence && nodeStates[a.id]?.status === "completed");
  const avgConfidence = completedAgents.length
    ? Math.round(completedAgents.reduce((s, a) => {
        const ba = backendMap.get(a.backendAgent ?? "");
        return s + (ba?.confidence ?? a.confidence ?? 0);
      }, 0) / completedAgents.length)
    : null;

  const phase = campaign.status === "failed"
    ? "failed"
    : !campaign.started
      ? "idle"
      : campaign.completed
        ? "done"
        : "running";

  const statusPill =
    phase === "idle" ? { text: "Idle", cls: "idle" } :
    phase === "done" ? { text: "Campaign Completed", cls: "done" } :
    phase === "failed" ? { text: "Campaign Failed", cls: "fail" } :
    { text: "Agents Running", cls: "live" };

  const PRODUCTS = ["Azure AI", "AWS Cloud", "Claude Enterprise"] as const;

  const completedCount = campaign.agents.filter((a) => a.status === "completed").length;
  const failedCount = campaign.agents.filter((a) => a.status === "error").length;
  const remainingCount = campaign.agents.filter((a) => a.status !== "completed").length;
  const currentStepText = campaign.currentStep ?? (campaign.currentAgent ? "Orchestrating step…" : "Waiting for pipeline start");

  return (
    <div className="agent-flow">
      {/* ---------- Header ---------- */}
      <div className="af-header">
        <div>
          <div className="eyebrow">AI OPERATIONS</div>
          <h1 className="page-title">Enterprise Agent Monitor</h1>
          <p className="subtle">Watch specialized AI agents research, strategize, and draft outreach in real time.</p>
        </div>
        <div className="af-header-right">
          <span className={`af-pill ${statusPill.cls}`}>
            {phase === "running" && <span className="af-live-dot" />}
            {statusPill.text}
          </span>
          <span className="af-pill idle"><Clock size={13} /> {fmt(campaign.totalElapsed)}</span>
          {avgConfidence !== null && (
            <span className="af-pill done"><ShieldCheck size={13} /> {avgConfidence}% confidence</span>
          )}

          {/* Product Selector */}
          <select
            className="af-product-select"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            disabled={phase === "running"}
          >
            {PRODUCTS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <motion.button
            className="af-run"
            onClick={start}
            disabled={phase === "running"}
            whileHover={phase !== "running" ? { scale: 1.04 } : undefined}
            whileTap={phase !== "running" ? { scale: 0.97 } : undefined}
          >
            {phase === "running"
              ? <><Loader2 size={16} className="af-spin" /> Running…</>
              : phase === "done"
                ? <><RotateCcw size={16} /> Run Again</>
                : <><Rocket size={16} /> Run Campaign</>}
          </motion.button>
        </div>
      </div>

      {campaign.error && (
        <div className="af-error-banner">
          <XCircle size={16} />
          <div>
            <strong>Campaign start failed</strong>
            <p>{campaign.error}</p>
          </div>
        </div>
      )}

      <div className="af-status-strip">
        <div className="af-status-block">
          <span className="label">Campaign Status</span>
          <strong>{statusPill.text}</strong>
        </div>
        <div className="af-status-block">
          <span className="label">Current Agent</span>
          <strong>{campaign.currentAgent ? campaign.currentAgent.replace(/\b\w/g, c => c.toUpperCase()) : "Idle"}</strong>
        </div>
        <div className="af-status-block">
          <span className="label">Current Step</span>
          <strong>{currentStepText}</strong>
        </div>
        <div className="af-status-block">
          <span className="label">Progress</span>
          <strong>{campaign.progress}%</strong>
        </div>
        <div className="af-status-block">
          <span className="label">Completed</span>
          <strong>{completedCount} / 5 agents</strong>
        </div>
        <div className="af-status-block">
          <span className="label">Errors</span>
          <strong>{failedCount}</strong>
        </div>
      </div>

      <div className="af-main-grid">
        <div className="af-scroll">
          <div className="af-canvas" style={{ width: CANVAS.w, height: CANVAS.h }}>
          <svg className="af-edges" width={CANVAS.w} height={CANVAS.h}>
            <defs>
              <linearGradient id="af-flow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            {EDGES.map((e) => {
              const target = nodeStates[e.to.id];
              const from = nodeStates[e.from.id];
              const active = target?.status === "running";
              const done = target?.status === "completed" && from?.status === "completed";
              return (
                <g key={e.id}>
                  <path id={e.id} d={e.d} className={`af-edge ${active ? "active" : ""} ${done ? "done" : ""}`} fill="none" />
                  {active && [0, 1, 2].map((i) => (
                    <circle key={i} r={3.5} className="af-particle">
                      <animateMotion dur="1.4s" repeatCount="indefinite" begin={`${i * 0.45}s`}>
                        <mpath href={`#${e.id}`} />
                      </animateMotion>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>

          {AGENTS.map((a) => {
            const n = nodeStates[a.id] ?? { status: "waiting", progress: 0, elapsed: 0, retried: false };
            const d = dims(a);
            const Icon = a.icon;
            const ba = a.backendAgent ? backendMap.get(a.backendAgent) : null;
            const displayConfidence = ba?.confidence ?? a.confidence;
            return (
              <motion.button
                type="button"
                key={a.id}
                className={`af-node ${n.status} ${a.wide ? "wide" : ""} ${a.source ? "source" : ""}`}
                style={{ left: a.x - d.w / 2, top: a.y, width: d.w, minHeight: d.h }}
                whileHover={{ y: -3, boxShadow: "0 20px 44px rgba(15,23,42,0.16)" }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                onClick={() => {
                  const href = a.backendAgent
                    ? {
                        research: "/research",
                        stakeholder: "/stakeholders",
                        intent: "/intent",
                        strategy: "/strategy",
                        outreach: "/outreach",
                      }[a.backendAgent]
                    : "/dashboard";
                  if (href) router.push(href);
                }}
              >
                {n.status === "running" && <span className="af-ring" />}

                <div className="af-node-head">
                  <span className="af-node-icon" style={{ background: `${a.accent}18`, color: a.accent }}>
                    <Icon size={17} />
                  </span>
                  <div className="af-node-title">
                    <strong>{a.name}</strong>
                    <span className="af-node-kind">{a.wide ? "SYSTEM" : a.source ? "DATA SOURCE" : "AI AGENT"}</span>
                  </div>
                  <span className="af-node-state">
                    {n.status === "waiting" && <Clock size={15} className="af-dim" />}
                    {n.status === "running" && <Loader2 size={15} className="af-spin af-blue" />}
                    {n.status === "failed" && <XCircle size={16} className="af-red" />}
                    <AnimatePresence>
                      {n.status === "completed" && (
                        <motion.span
                          initial={{ scale: 0, rotate: -40 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 16 }}
                        >
                          <CheckCircle2 size={16} className="af-green" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </div>

                <p className="af-node-desc">
                  {n.status === "waiting" && a.idleText}
                  {n.status === "running" && a.runningText}
                  {n.status === "completed" && a.result}
                  {n.status === "failed" && "Agent execution failed."}
                </p>

                {n.status === "running" && (
                  <div className="af-progress-row">
                    <div className="af-progress"><span style={{ width: `${Math.min(n.progress, 99)}%` }} /></div>
                    <span className="af-timer">{fmt(n.elapsed)}</span>
                  </div>
                )}

                {n.status === "completed" && (
                  <div className="af-badges">
                    <span className="af-badge time"><Clock size={11} /> {n.elapsed.toFixed(1)}s</span>
                    {displayConfidence != null && <span className="af-badge conf"><ShieldCheck size={11} /> {displayConfidence}% confidence</span>}
                  </div>
                )}

                {n.status === "failed" && (
                  <div className="af-badges">
                    <span className="af-badge err"><XCircle size={11} /> Error</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="af-badge retry"
                      onClick={(e) => { e.stopPropagation(); start(); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); start(); } }}
                    >
                      <RotateCcw size={11} /> Retry
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
          </div>
        </div>
        <aside className="af-sidebar">
          <div className="af-sidebar-card">
            <div className="aside-head">
              <div>
                <p className="aside-label">Live orchestration</p>
                <h2>Campaign insights</h2>
              </div>
            </div>
            <div className="aside-summary">
              <div className="aside-chip">Product: {campaign.product}</div>
              <div className="aside-chip">Elapsed: {fmt(campaign.totalElapsed)}</div>
              <div className="aside-chip">Agent count: {campaign.agents.length}</div>
            </div>
            <div className="aside-meter">
              <span>{campaign.progress}% complete</span>
              <div className="aside-progress"><span style={{ width: `${campaign.progress}%` }} /></div>
            </div>
            <div className="aside-items">
              <div>
                <span className="aside-value">{completedCount}</span>
                <span>Agents completed</span>
              </div>
              <div>
                <span className="aside-value">{remainingCount}</span>
                <span>Remaining</span>
              </div>
              <div>
                <span className="aside-value">{failedCount}</span>
                <span>Errors</span>
              </div>
            </div>
          </div>

          <div className="af-sidebar-card">
            <div className="aside-head">
              <div>
                <p className="aside-label">Pipeline health</p>
                <h3>Live pulse</h3>
              </div>
            </div>
            <div className="af-sidebar-row">
              <div>
                <strong>{campaign.currentAgent ? campaign.currentAgent.toUpperCase() : "IDLE"}</strong>
                <p>Active agent</p>
              </div>
              <div>
                <strong>{campaign.currentStep ?? "Waiting"}</strong>
                <p>Current step</p>
              </div>
            </div>
            <div className="af-sidebar-row">
              <div>
                <strong>{completedAgents.length}</strong>
                <p>Success count</p>
              </div>
              <div>
                <strong>{failedCount}</strong>
                <p>Failure count</p>
              </div>
            </div>
            <div className="af-sidebar-note">The next agent begins automatically after the previous one completes.</div>
          </div>
        </aside>
      </div>

      {/* ---------- Live activity log ---------- */}
      <section className="af-log-card">
        <div className="af-log-head">
          <Activity size={15} />
          <strong>Live Agent Activity</strong>
          {phase === "running" && <span className="af-pill live sm"><span className="af-live-dot" /> LIVE</span>}
        </div>
        <div className="af-log" ref={logRef}>
          {log.length === 0 && <div className="af-log-empty">Launch a campaign to stream agent activity…</div>}
          {log.map((entry, i) => (
            <div key={i} className={`af-log-line ${entry.kind}`}>
              <span className="af-log-time">[{fmt(entry.t)}]</span> {entry.msg}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Styles ---------- */}
      <style jsx global>{`
        .agent-flow { --af-blue:#2563eb; --af-violet:#8b5cf6; }
        .af-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
        .af-header-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .af-pill { display:inline-flex; align-items:center; gap:7px; padding:7px 13px; border-radius:999px; font-size:11.5px; font-weight:800; letter-spacing:.2px; border:1px solid #e2e8f0; color:#64748b; background:#fff; }
        .af-pill.live { color:#1d4ed8; border-color:#bfdbfe; background:#eff6ff; }
        .af-pill.done { color:#15803d; border-color:#bbf7d0; background:#f0fdf4; }
        .af-pill.fail { color:#b91c1c; border-color:#fecaca; background:#fef2f2; }
        .af-error-banner { display:flex; align-items:flex-start; gap:10px; padding:14px 16px; margin-bottom:18px; border-radius:14px; border:1px solid #fecaca; background:#fef2f2; color:#991b1b; }
        .af-error-banner p { margin:4px 0 0; font-size:12px; color:#7f1d1d; }
        .af-pill.sm { padding:4px 9px; font-size:10px; }
        .af-live-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; animation:af-blink 1.1s ease-in-out infinite; }

        .af-product-select { height:40px; padding:0 14px; border:1px solid #e2e8f0; border-radius:12px; background:#fff; font:700 12px 'Plus Jakarta Sans','DM Sans',sans-serif; color:#0f172a; cursor:pointer; outline:none; transition:border-color .2s; }
        .af-product-select:focus { border-color:#3b82f6; }
        .af-product-select:disabled { opacity:.55; cursor:default; }

        .af-run { display:inline-flex; align-items:center; gap:9px; height:44px; padding:0 20px; border:0; border-radius:12px; background:linear-gradient(135deg,#2563eb,#4f46e5); color:#fff; font-size:13px; font-weight:800; cursor:pointer; box-shadow:0 10px 26px rgba(37,99,235,.35); }
        .af-run:disabled { opacity:.75; cursor:default; }

        .af-scroll { overflow-x:auto; padding-bottom:8px; }
        .af-canvas { position:relative; margin:0 auto; }
        .af-edges { position:absolute; inset:0; pointer-events:none; }

        .af-edge { stroke:#dbe3ef; stroke-width:2; transition:stroke .3s; }
        .af-edge.active { stroke:url(#af-flow-grad); stroke-width:2.5; stroke-dasharray:7 9; animation:af-dash 1s linear infinite; }
        .af-edge.done { stroke:#6ee7b7; }
        .af-particle { fill:#60a5fa; filter:drop-shadow(0 0 5px rgba(59,130,246,.9)); }

        .af-node { position:absolute; background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:14px 16px 13px; box-shadow:0 8px 22px rgba(15,23,42,.06); transition:border-color .3s; text-align:left; cursor:pointer; width:100%; }
        .af-node.waiting { opacity:.78; }
        .af-node.waiting .af-node-icon { filter:grayscale(.7); opacity:.6; }
        .af-node.running { border-color:transparent; background:linear-gradient(#fff,#fff) padding-box, linear-gradient(120deg,#3b82f6,#8b5cf6,#06b6d4,#3b82f6) border-box; background-size:100% 100%, 300% 300%; animation:af-border-flow 3s linear infinite, af-glow 1.8s ease-in-out infinite; }
        .af-node.completed { border-color:#4ade80; animation:af-success .7s ease-out 1; }
        .af-node.failed { border-color:#f87171; background:#fffbfb; animation:af-shake .5s ease-in-out 1; }

        .af-ring { position:absolute; inset:-7px; border-radius:21px; padding:2px; background:conic-gradient(from 0deg, transparent 0 300deg, #3b82f6 330deg, #8b5cf6 360deg); -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite:xor; mask-composite:exclude; animation:af-spin-ring 1.3s linear infinite; pointer-events:none; }

        .af-node-head { display:flex; align-items:center; gap:11px; }
        .af-node-icon { display:grid; place-items:center; width:34px; height:34px; border-radius:10px; flex-shrink:0; transition:filter .3s, opacity .3s; }
        .af-node-title { flex:1; min-width:0; }
        .af-node-title strong { display:block; font:800 13.5px 'Plus Jakarta Sans','DM Sans',sans-serif; letter-spacing:-.3px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .af-node-kind { font-size:9px; font-weight:800; letter-spacing:1px; color:#94a3b8; }
        .af-node-state { display:grid; place-items:center; width:22px; }
        .af-dim { color:#cbd5e1; } .af-blue { color:#3b82f6; } .af-green { color:#22c55e; } .af-red { color:#ef4444; }
        .af-spin { animation:af-spin-ring 1s linear infinite; }

        .af-node-desc { margin:9px 0 0; font-size:11.5px; line-height:1.45; color:#64748b; }
        .af-node.completed .af-node-desc { color:#15803d; font-weight:600; }
        .af-node.failed .af-node-desc { color:#b91c1c; }

        .af-status-strip { display:grid; grid-template-columns:repeat(3, minmax(180px, 1fr)); gap:14px; margin-bottom:22px; }
        .af-status-block { padding:16px 18px; border-radius:16px; background:#f8fafc; border:1px solid #e2e8f0; }
        .af-status-block .label { display:block; font-size:10.5px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#64748b; margin-bottom:8px; }
        .af-status-block strong { display:block; font-size:15px; color:#0f172a; line-height:1.35; }

        .af-main-grid { display:grid; grid-template-columns:1fr 320px; gap:22px; align-items:flex-start; }
        .af-sidebar { display:flex; flex-direction:column; gap:18px; }
        .af-sidebar-card { background:#0f172a; color:#f8fafc; border-radius:22px; padding:20px; box-shadow:0 20px 50px rgba(15,23,42,.16); border:1px solid rgba(255,255,255,.08); }
        .aside-head { display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:18px; }
        .aside-label { font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#94a3b8; margin-bottom:8px; }
        .aside-head h2, .aside-head h3 { margin:0; font-size:18px; line-height:1.2; }
        .aside-summary { display:grid; gap:10px; margin-bottom:18px; }
        .aside-chip { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; background:rgba(255,255,255,.08); color:#e2e8f0; font-size:11px; }
        .aside-meter { margin-bottom:18px; }
        .aside-meter span { display:block; font-size:12px; color:#cbd5e1; margin-bottom:10px; }
        .aside-progress { height:10px; background:rgba(255,255,255,.08); border-radius:999px; overflow:hidden; }
        .aside-progress span { display:block; height:100%; background:linear-gradient(90deg,#60a5fa,#8b5cf6); }
        .aside-items { display:grid; gap:12px; }
        .aside-items div { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:#e2e8f0; }
        .aside-value { font-size:22px; font-weight:800; color:#fff; }
        .af-sidebar-row { display:grid; gap:14px; }
        .af-sidebar-row > div { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:16px; }
        .af-sidebar-row strong { display:block; font-size:20px; font-weight:800; margin-bottom:6px; }
        .af-sidebar-row p { margin:0; color:#cbd5e1; font-size:12px; }
        .af-sidebar-note { margin-top:14px; color:#cbd5e1; font-size:12px; line-height:1.6; }

        .af-progress-row { display:flex; align-items:center; gap:10px; margin-top:10px; }
        .af-progress { flex:1; height:6px; border-radius:99px; background:#eef2f8; overflow:hidden; }
        .af-progress span { display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,#3b82f6,#8b5cf6); transition:width .12s linear; }
        .af-timer { font:800 10.5px 'DM Mono',ui-monospace,monospace; color:#3b82f6; min-width:38px; text-align:right; }

        .af-badges { display:flex; align-items:center; gap:8px; margin-top:10px; flex-wrap:wrap; }
        .af-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 9px; border-radius:7px; font-size:10px; font-weight:800; }
        .af-badge.time { background:#f1f5f9; color:#475569; }
        .af-badge.conf { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
        .af-badge.err  { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
        .af-badge.retry { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; cursor:pointer; }
        .af-badge.retry:hover { background:#dbeafe; }

        .af-log-card { margin-top:26px; border:1px solid #e2e8f0; border-radius:16px; background:#fff; overflow:hidden; }
        .af-log-head { display:flex; align-items:center; gap:9px; padding:13px 18px; border-bottom:1px solid #eef2f8; color:#0f172a; font-size:13px; }
        .af-log-head svg { color:#7c3aed; }
        .af-log { max-height:210px; overflow-y:auto; background:#0b1220; padding:14px 18px; font:11.5px/1.9 'DM Mono',ui-monospace,monospace; }
        .af-log-empty { color:#475569; }
        .af-log-line { color:#94a3b8; }
        .af-log-line.start { color:#93c5fd; }
        .af-log-line.ok { color:#6ee7b7; }
        .af-log-line.err { color:#fca5a5; }
        .af-log-line.info { color:#c4b5fd; }
        .af-log-time { color:#475569; margin-right:6px; }

        @keyframes af-dash { to { stroke-dashoffset:-16; } }
        @keyframes af-spin-ring { to { transform:rotate(360deg); } }
        @keyframes af-blink { 0%,100% { opacity:1; } 50% { opacity:.25; } }
        @keyframes af-border-flow { to { background-position:0 0, 300% 0; } }
        @keyframes af-glow { 0%,100% { box-shadow:0 0 0 0 rgba(59,130,246,.28), 0 10px 30px rgba(59,130,246,.18); } 50% { box-shadow:0 0 0 9px rgba(59,130,246,0), 0 10px 34px rgba(139,92,246,.28); } }
        @keyframes af-success { 0% { box-shadow:0 0 0 0 rgba(34,197,94,.45); } 100% { box-shadow:0 0 0 18px rgba(34,197,94,0); } }
        @keyframes af-shake { 0%,100% { transform:translateX(0); } 20% { transform:translateX(-7px); } 40% { transform:translateX(6px); } 60% { transform:translateX(-4px); } 80% { transform:translateX(3px); } }
      `}</style>
    </div>
  );
}
