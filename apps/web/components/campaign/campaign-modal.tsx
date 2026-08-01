"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Users, Zap, Target, Brain, Mail, ShieldCheck,
  CheckCircle2, Loader2, Clock, BarChart3, Building2,
  TrendingUp, Activity,
} from "lucide-react";
import { useRouter } from "next/navigation";

type StepStatus = "queued" | "running" | "done";

interface WorkflowStep {
  id: number;
  title: string;
  icon: React.ElementType;
  detail: string;
  subItems: string[];
  duration: number;
}

interface AgentCard {
  name: string;
  icon: React.ElementType;
  status: StepStatus;
  progress: number;
  confidence: number;
  elapsed: number;
}

interface Metric {
  label: string;
  value: number | string;
  suffix?: string;
  icon: React.ElementType;
  color: string;
}

const STEPS: WorkflowStep[] = [
  { id: 1, title: "Campaign Initialization", icon: Activity,    detail: "Bootstrapping agent pipeline",       subItems: ["Loading CRM data", "Configuring agents", "Setting targets"],                               duration: 2000 },
  { id: 2, title: "Research Agent",          icon: Search,      detail: "Searching target companies",         subItems: ["Website Analysis", "CRM Analysis", "Company Research", "News Collection"],                duration: 3500 },
  { id: 3, title: "Stakeholder Agent",       icon: Users,       detail: "Mapping decision makers",            subItems: ["Decision Makers", "Champions", "Procurement", "Finance", "Cloud Architects"],             duration: 3000 },
  { id: 4, title: "Intent Agent",            icon: Zap,         detail: "Calculating buying signals",         subItems: ["Buying Signals", "Intent Score", "Urgency", "Priority"],                                  duration: 2500 },
  { id: 5, title: "Pain Point Analysis",     icon: Brain,       detail: "Analyzing business problems",        subItems: ["Business Problems", "Opportunities", "Competitors"],                                      duration: 2500 },
  { id: 6, title: "Strategy Agent",          icon: Target,      detail: "Generating sales strategy",          subItems: ["Sales Strategy", "Product Mapping", "Pitch Angle", "Recommended Channel"],                duration: 3000 },
  { id: 7, title: "Outreach Agent",          icon: Mail,        detail: "Generating personalized outreach",   subItems: ["Executive Email", "LinkedIn Message", "Call Script", "Meeting Agenda"],                   duration: 3000 },
  { id: 8, title: "Verification Agent",      icon: ShieldCheck, detail: "Validating evidence & confidence",   subItems: ["Evidence Check", "Hallucination Scan", "Confidence Score"],                              duration: 2000 },
  { id: 9, title: "Campaign Completed",      icon: CheckCircle2,detail: "Generating final report",            subItems: ["Executive Summary", "Pipeline Report", "Outreach Package"],                              duration: 1500 },
];

const INITIAL_METRICS: Metric[] = [
  { label: "Accounts Processed",     value: 0,    suffix: "",     icon: Building2,  color: "#2563eb" },
  { label: "Target Companies Found", value: 0,    suffix: "",     icon: Search,     color: "#7c3aed" },
  { label: "Decision Makers",        value: 0,    suffix: "",     icon: Users,      color: "#0891b2" },
  { label: "Buying Signals",         value: 0,    suffix: "",     icon: Zap,        color: "#d97706" },
  { label: "High Intent Accounts",   value: 0,    suffix: "",     icon: TrendingUp, color: "#16a34a" },
  { label: "Emails Generated",       value: 0,    suffix: "",     icon: Mail,       color: "#db2777" },
  { label: "Avg Intent Score",       value: "—",  suffix: "/100", icon: BarChart3,  color: "#2563eb" },
  { label: "Execution Time",         value: "0s", suffix: "",     icon: Clock,      color: "#64748b" },
  { label: "Confidence",             value: "—",  suffix: "%",    icon: ShieldCheck,color: "#16a34a" },
];

const LOG_MESSAGES: [number, string][] = [
  [0,    "Campaign pipeline initialized"],
  [500,  "Loading CRM account data..."],
  [2000, "Research Agent started"],
  [3000, "Retrieved 38 target companies"],
  [4200, "Website analysis complete — 38 domains scanned"],
  [5500, "Stakeholder Agent started"],
  [6200, "Identified 94 decision makers across accounts"],
  [7500, "Intent Agent started"],
  [8500, "Detected 67 buying signals"],
  [9200, "Pain Point Analysis started"],
  [10500,"Mapped 24 high-priority pain points"],
  [11500,"Strategy Agent started"],
  [12800,"Generated 38 personalized sales strategies"],
  [14000,"Outreach Agent started"],
  [15200,"Generated 38 executive emails"],
  [16000,"Generated 38 LinkedIn messages"],
  [17000,"Verification Agent started"],
  [18500,"Hallucination scan complete — 0 issues found"],
  [19500,"Confidence score: 94%"],
  [20500,"Campaign execution complete ✓"],
];

function pad(n: number) { return String(n).padStart(2, "0"); }
function nowTs() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
function delay(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }
function animateCount(target: number, cb: (v: number) => void, duration = 1200) {
  const steps = 30;
  const interval = duration / steps;
  let current = 0;
  const inc = target / steps;
  const t = setInterval(() => {
    current = Math.min(current + inc, target);
    cb(Math.round(current));
    if (current >= target) clearInterval(t);
  }, interval);
}

function StatusBadge({ status }: { status: StepStatus }) {
  const map: Record<StepStatus, [string, string, string]> = {
    done:    ["✓ Done",   "#dcfce7", "#16a34a"],
    running: ["● Running","#eff6ff", "#2563eb"],
    queued:  ["Queued",   "#f1f5f9", "#94a3b8"],
  };
  const [label, bg, color] = map[status];
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>{label}</span>;
}

function ProgressBar({ pct, color = "#2563eb" }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
      <motion.div style={{ height: "100%", background: color, borderRadius: 4 }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
    </div>
  );
}

export function CampaignModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [logs, setLogs] = useState<{ time: string; msg: string }[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    let cancelled = false;

    async function run() {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        setCurrentStep(i + 1);
        setStepProgress(0);
        const dur = STEPS[i].duration;
        const ticks = 20;
        for (let t = 1; t <= ticks; t++) {
          await delay(dur / ticks);
          if (cancelled) return;
          setStepProgress(Math.round((t / ticks) * 100));
        }
      }
      setDone(true);
      setTimeout(() => { if (!cancelled) router.push("/analytics"); }, 2500);
    }
    run();

    const timers: ReturnType<typeof setTimeout>[] = [];

    LOG_MESSAGES.forEach(([ms, msg]) => {
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setLogs(prev => [...prev, { time: nowTs(), msg }]);
        setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
      }, ms));
    });

    const ticker = setInterval(() => {
      if (cancelled) return;
      const elapsed = Math.round((Date.now() - startRef.current) / 1000);
      setMetrics(prev => prev.map((m, i) => i === 7 ? { ...m, value: `${elapsed}s` } : m));
    }, 1000);

    const metricSchedule: [number, number, number][] = [
      [2000, 0, 142], [4000, 1, 38], [6000, 2, 94], [8500, 3, 67],
      [10000, 4, 24], [15500, 5, 38], [18000, 6, 81], [19500, 8, 94],
    ];
    metricSchedule.forEach(([ms, idx, target]) => {
      timers.push(setTimeout(() => {
        if (cancelled) return;
        animateCount(target, (v) => setMetrics(prev => prev.map((m, i) => i === idx ? { ...m, value: v } : m)));
      }, ms));
    });

    return () => { cancelled = true; timers.forEach(clearTimeout); clearInterval(ticker); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const agentSteps = STEPS.slice(1, 8);
  const agentCards: AgentCard[] = agentSteps.map((s, i) => {
    const stepIdx = i + 2;
    let status: StepStatus = "queued";
    let progress = 0;
    let confidence = 0;
    if (currentStep > stepIdx)      { status = "done";    progress = 100; confidence = 88 + i * 2; }
    else if (currentStep === stepIdx){ status = "running"; progress = stepProgress; confidence = Math.round(stepProgress * 0.94); }
    const elapsed = status === "done" ? STEPS[i + 1].duration / 1000 : status === "running" ? Math.round((stepProgress / 100) * STEPS[i + 1].duration / 1000) : 0;
    return { name: s.title, icon: s.icon, status, progress, confidence, elapsed };
  });

  const overallPct = done ? 100 : currentStep === 0 ? 0 : Math.round(((currentStep - 1 + stepProgress / 100) / STEPS.length) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        style={{ width: "min(1100px, 96vw)", height: "100vh", background: "#fff", display: "flex", flexDirection: "column", boxShadow: "-24px 0 80px rgba(15,23,42,0.18)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "22px 28px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e7eaf0", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed", letterSpacing: 1, marginBottom: 4 }}>AI CAMPAIGN EXECUTION</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: -0.8, color: "#0f172a" }}>
              {done ? "Campaign Completed ✓" : "Running Multi-Agent Campaign..."}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <motion.div key={overallPct} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                style={{ fontSize: 24, fontWeight: 800, color: done ? "#16a34a" : "#2563eb", letterSpacing: -1 }}>
                {overallPct}%
              </motion.div>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>OVERALL</div>
            </div>
            <button onClick={onClose} aria-label="Close"
              style={{ width: 36, height: 36, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", display: "grid", placeItems: "center", cursor: "pointer", color: "#64748b" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Overall progress */}
        <div style={{ padding: "0 28px 16px", borderBottom: "1px solid #e7eaf0", flexShrink: 0 }}>
          <ProgressBar pct={overallPct} color={done ? "#16a34a" : "#2563eb"} />
        </div>

        {/* 3-column body */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", overflow: "hidden" }}>

          {/* Col 1: Timeline */}
          <div style={{ padding: "18px 18px 24px", borderRight: "1px solid #e7eaf0", overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 1, marginBottom: 14 }}>WORKFLOW TIMELINE</div>
            {STEPS.map((step, i) => {
              const stepNum = i + 1;
              const status: StepStatus = currentStep > stepNum ? "done" : currentStep === stepNum ? "running" : "queued";
              const Icon = step.icon;
              return (
                <div key={step.id} style={{ display: "flex", gap: 10, position: "relative" }}>
                  {i < STEPS.length - 1 && (
                    <div style={{ position: "absolute", left: 14, top: 32, width: 2, height: "calc(100% - 8px)", background: status === "done" ? "#bbf7d0" : "#e2e8f0", zIndex: 0 }} />
                  )}
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0, zIndex: 1, display: "grid", placeItems: "center",
                    background: status === "done" ? "#dcfce7" : status === "running" ? "#eff6ff" : "#f1f5f9",
                    color: status === "done" ? "#16a34a" : status === "running" ? "#2563eb" : "#94a3b8",
                    border: status === "running" ? "2px solid #2563eb" : "2px solid transparent",
                  }}>
                    {status === "running"
                      ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><Loader2 size={14} /></motion.div>
                      : <Icon size={14} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: status === "queued" ? "#94a3b8" : "#0f172a" }}>{step.title}</span>
                      <StatusBadge status={status} />
                    </div>
                    {status !== "queued" && (
                      <>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>{step.detail}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {step.subItems.map((item, j) => (
                            <motion.span key={item} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: j * 0.1 }}
                              style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: status === "done" ? "#f0fdf4" : "#eff6ff", color: status === "done" ? "#16a34a" : "#2563eb", fontWeight: 600 }}>
                              {item}
                            </motion.span>
                          ))}
                        </div>
                        {status === "running" && <ProgressBar pct={stepProgress} />}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Col 2: Metrics + Agent Cards */}
          <div style={{ padding: "18px 18px 24px", borderRight: "1px solid #e7eaf0", overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 1, marginBottom: 12 }}>LIVE METRICS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
              {metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} style={{ background: "#f8fafc", border: "1px solid #e7eaf0", borderRadius: 11, padding: "11px 11px 9px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: m.color + "18", display: "grid", placeItems: "center" }}>
                        <Icon size={11} color={m.color} />
                      </div>
                      <span style={{ fontSize: 9, color: "#64748b", fontWeight: 600, lineHeight: 1.2 }}>{m.label}</span>
                    </div>
                    <motion.div key={String(m.value)} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 0.25 }}
                      style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.8, color: "#0f172a" }}>
                      {m.value}{m.suffix && m.value !== "—" ? <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>{m.suffix}</span> : ""}
                    </motion.div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 1, marginBottom: 12 }}>LIVE AGENT STATUS</div>
            <div style={{ display: "grid", gap: 7 }}>
              {agentCards.map((a) => {
                const Icon = a.icon;
                return (
                  <div key={a.name} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "#f8fafc", border: "1px solid #e7eaf0", borderRadius: 11, padding: "9px 11px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: a.status === "done" ? "#dcfce7" : a.status === "running" ? "#eff6ff" : "#f1f5f9", color: a.status === "done" ? "#16a34a" : a.status === "running" ? "#2563eb" : "#94a3b8" }}>
                      <Icon size={13} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{a.name}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      {a.status !== "queued" && (
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                          {a.elapsed}s elapsed · Confidence: {a.confidence}%
                        </div>
                      )}
                      {a.status === "running" && <ProgressBar pct={a.progress} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col 3: Log Console */}
          <div style={{ padding: "18px 18px 24px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: 1, marginBottom: 12 }}>LIVE EXECUTION LOG</div>
            <div ref={logRef} style={{ background: "#0f172a", borderRadius: 12, padding: "13px 15px", fontFamily: "'Courier New', monospace", fontSize: 11, lineHeight: 1.6, overflowY: "auto", minHeight: 200, maxHeight: 300 }}>
              <AnimatePresence initial={false}>
                {logs.map((l, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 4 }}>
                    <span style={{ color: "#4ade80", marginRight: 8 }}>[{l.time}]</span>
                    <span style={{ color: "#e2e8f0" }}>{l.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {!done && (
                <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ color: "#4ade80" }}>█</motion.span>
              )}
            </div>

            {done && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: 14, padding: "13px 15px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, display: "flex", gap: 11, alignItems: "center" }}>
                <CheckCircle2 size={20} color="#16a34a" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>Campaign Completed Successfully</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Redirecting to Analytics Dashboard...</div>
                </div>
              </motion.div>
            )}

            <div style={{ marginTop: 16, padding: 14, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", marginBottom: 10, letterSpacing: .5 }}>CAMPAIGN SUMMARY</div>
              {[
                ["Target Accounts",    "38 companies"],
                ["Outreach Generated", "38 emails · 38 LinkedIn"],
                ["Pipeline Value",     "$4.82M estimated"],
                ["Top Signal",         "Pricing review requested"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "5px 0", borderTop: "1px solid #e7eaf0" }}>
                  <span style={{ color: "#64748b" }}>{k}</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
