"use client";

import React, { useState, useEffect } from "react";
import { useCampaign } from "@/stores/campaign-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Linkedin, PhoneCall, Copy, CheckCircle2, 
  Send, RefreshCw, SlidersHorizontal,
  Clock, Type, AlertCircle, User,
  FileText, Sparkles, Check, Loader2, 
  Info, ShieldCheck, Edit3, ChevronRight, RotateCcw,
  Download, Eye, AlertTriangle, ArrowUpRight, Flame,
  FileCode, CheckCheck, ThumbsUp
} from "lucide-react";
import Link from "next/link";
import { 
  sendEmailDraft, 
  regenerateDraft, 
  updateEmailDraft, 
  listEmailDrafts, 
  EmailDraft 
} from "@/services/api";

/* ── Helpers ─────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function wordCount(text: string | undefined | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readTime(words: number): string {
  const minutes = Math.ceil(words / 200);
  return minutes <= 1 ? "< 1 min read" : `~${minutes} min read`;
}

const INITIALS_COLORS = [
  "#4B73FF", "#8069FF", "#FF72BA", "#1E9B65", "#D78427",
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6",
];

/* ── Tone Refinement Presets ─────────────────────────── */
type ToneType = 
  | "Executive & Concise" 
  | "Enterprise Consultative" 
  | "High-Urgency & ROI" 
  | "Warm & Peer-to-Peer" 
  | "Security & Compliance";

interface ToneOption {
  id: ToneType;
  label: string;
  badge: string;
  description: string;
  icon: string;
}

const TONE_OPTIONS: ToneOption[] = [
  {
    id: "Executive & Concise",
    label: "Executive & Concise",
    badge: "30-Sec Read",
    description: "Crisp value proposition, short sentences, zero filler, and a clear 10-minute calendar CTA.",
    icon: "🎯"
  },
  {
    id: "Enterprise Consultative",
    label: "Enterprise Consultative",
    badge: "C-Level",
    description: "Polished strategic framing, governance-oriented tone suitable for CIOs and VP Engineering.",
    icon: "💼"
  },
  {
    id: "High-Urgency & ROI",
    label: "High-Urgency & ROI",
    badge: "Fast-Track",
    description: "Emphasizes roadmap acceleration, competitive momentum, and rapid 48-hour proof-of-value.",
    icon: "🚀"
  },
  {
    id: "Warm & Peer-to-Peer",
    label: "Warm & Peer-to-Peer",
    badge: "Relationship",
    description: "Conversational, less aggressive, focusing on shared industry challenges and long-term partnership.",
    icon: "🤝"
  },
  {
    id: "Security & Compliance",
    label: "Security & Compliance",
    badge: "Risk-Averse",
    description: "Prioritizes SOC2, data residency, and risk mitigation. Ideal for CISOs and highly regulated sectors.",
    icon: "🛡️"
  }
];

export function OutreachStudio() {
  const { state } = useCampaign();
  const data = state.agentResults?.outreach as any;
  const currentProduct = state.product || "Azure AI";

  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"email" | "linkedin" | "call">("email");
  const [copied, setCopied] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const [showContextDetails, setShowContextDetails] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Supabase Draft state mapping
  const [draftsByCompany, setDraftsByCompany] = useState<Record<string, EmailDraft>>({});

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [editedRecipient, setEditedRecipient] = useState("");
  const [hasEdits, setHasEdits] = useState(false);

  // Fetch Supabase drafts on mount or when product changes
  useEffect(() => {
    async function loadRemoteDrafts() {
      try {
        const remoteDrafts = await listEmailDrafts({ product: currentProduct });
        if (remoteDrafts && remoteDrafts.length > 0) {
          const map: Record<string, EmailDraft> = {};
          remoteDrafts.forEach((d) => {
            map[d.company] = d;
          });
          setDraftsByCompany(map);
        }
      } catch (err) {
        console.warn("Could not fetch remote drafts:", err);
      }
    }
    loadRemoteDrafts();
  }, [currentProduct, data]);

  if (!data || !data.companies || data.companies.length === 0) {
    return (
      <div className="empty-state text-center py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 shadow-sm border border-blue-100">
          <Send size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2 text-slate-800">No Outreach Campaign Active</h3>
        <p className="text-slate-500 mb-6 max-w-md">
          Run an autonomous account-based campaign to generate personalized emails, LinkedIn messages, and call scripts using Grok.
        </p>
        <Link href="/">
          <button className="primary-button bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
            <Sparkles size={16} /> Run ABM Campaign
          </button>
        </Link>
      </div>
    );
  }

  const selectedCompany = data.companies[selectedCompanyIndex] || data.companies[0];
  const companyName = selectedCompany.company_name;
  const currentRemoteDraft = draftsByCompany[companyName];

  // Derive active values (Remote draft from Supabase takes precedence if available)
  const execEmail = selectedCompany.executive_email || {};
  const currentDraftId = currentRemoteDraft?.id || execEmail.draft_id;
  const currentSubject = hasEdits ? editedSubject : (currentRemoteDraft?.subject || execEmail.subject || "");
  const currentBody = hasEdits ? editedBody : (currentRemoteDraft?.body || execEmail.body || "");
  const currentRecipient = hasEdits ? editedRecipient : (currentRemoteDraft?.recipient_email || execEmail.recipient_email || "contact@prospect.com");
  const currentStatus = currentRemoteDraft?.status || execEmail.status || "draft";
  const intentScore = selectedCompany.intent_score || currentRemoteDraft?.intent_score || 85;
  const confidence = currentRemoteDraft?.confidence || execEmail.confidence || 92;
  const cta = currentRemoteDraft?.cta || execEmail.cta;
  const reason = currentRemoteDraft?.reason || execEmail.reason;
  const contextSummary = selectedCompany.context_summary || {};
  const buyingSignals = currentRemoteDraft?.metadata?.buying_signals || contextSummary.buying_signals || [];
  const painPoints = currentRemoteDraft?.metadata?.pain_points || contextSummary.pain_points || [];
  const meetingSummary = currentRemoteDraft?.metadata?.meeting_summary || contextSummary.meeting_summary || "";
  const researchSummary = currentRemoteDraft?.metadata?.research_summary || contextSummary.research_summary || "";

  // Reset editor inputs when company changes
  useEffect(() => {
    const draft = draftsByCompany[companyName];
    setEditedSubject(draft?.subject || execEmail.subject || "");
    setEditedBody(draft?.body || execEmail.body || "");
    setEditedRecipient(draft?.recipient_email || execEmail.recipient_email || "contact@prospect.com");
    setIsEditing(false);
    setHasEdits(false);
    setSendFeedback(null);
  }, [selectedCompanyIndex, companyName]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2200);
  };

  const handleSaveEdits = async () => {
    if (currentDraftId) {
      try {
        const updated = await updateEmailDraft(currentDraftId, {
          subject: editedSubject,
          body: editedBody,
          recipient_email: editedRecipient,
        });
        setDraftsByCompany((prev) => ({ ...prev, [companyName]: updated }));
      } catch (err) {
        console.error("Failed to sync draft update:", err);
      }
    }
    setIsEditing(false);
  };

  const handleApproveDraft = async () => {
    if (!currentDraftId) return;
    try {
      const updated = await updateEmailDraft(currentDraftId, { status: "approved" });
      setDraftsByCompany((prev) => ({ ...prev, [companyName]: updated }));
      setSendFeedback({ type: "success", msg: "Draft successfully approved for sending!" });
    } catch (err) {
      console.error("Approval error:", err);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setSendFeedback(null);
    try {
      const res = await sendEmailDraft({
        draft_id: currentDraftId,
        to_email: currentRecipient,
        subject: currentSubject,
        content: currentBody,
      });

      if (res.status === "success") {
        setSendFeedback({ type: "success", msg: res.message || "Email successfully sent!" });
        if (currentDraftId) {
          setDraftsByCompany((prev) => ({
            ...prev,
            [companyName]: {
              ...(prev[companyName] || ({} as any)),
              status: "sent",
              sent_time: new Date().toISOString(),
            } as EmailDraft,
          }));
        }
      } else {
        setSendFeedback({ type: "error", msg: res.message || "Email dispatch failed. Check SMTP settings." });
      }
    } catch (error: any) {
      setSendFeedback({ type: "error", msg: error?.message || "Failed to send email. Check API logs." });
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerateWithTone = async (tone: ToneType) => {
    setShowToneDropdown(false);
    if (!currentDraftId) {
      // Offline preset injection fallback
      setEditedBody(`[Grok-2 AI ${tone} Preset Applied]\n\n${currentBody}`);
      setHasEdits(true);
      return;
    }

    setIsRegenerating(true);
    try {
      const res = await regenerateDraft({
        draft_id: currentDraftId,
        tone: tone,
      });
      if (res?.draft) {
        setDraftsByCompany((prev) => ({ ...prev, [companyName]: res.draft }));
        setEditedSubject(res.draft.subject);
        setEditedBody(res.draft.body);
        setHasEdits(false);
        setSendFeedback({ type: "success", msg: `Regenerated with ${tone} tone using Grok.` });
      }
    } catch (err: any) {
      console.error("Regeneration failed:", err);
      setSendFeedback({ type: "error", msg: "Regeneration failed. Check API key in settings." });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = () => {
    const content = `To: ${currentRecipient}\nSubject: ${currentSubject}\nDate: ${new Date().toUTCString()}\n\n${currentBody}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${companyName.replace(/[^a-z0-9]/gi, "_")}_Executive_Email.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCallScriptText = () => {
    const cs = selectedCompany.call_script;
    if (!cs) return "";
    return `${cs.opening}\n\nDiscovery Questions:\n${(cs.discovery_questions || []).map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}\n\nClose:\n${cs.close}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="outreach-container max-w-[1400px] mx-auto p-4 md:p-6 space-y-6"
    >
      {/* ── Page Header ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100/80">
              Autonomous Outreach Center
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Grok-2 Context-Grounded Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Outreach Studio & Dispatch
          </h1>
        </div>

        {/* Global Stats Counter */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-600">
              {data.totals?.emails_generated || data.companies.length} Drafts Ready
            </span>
          </div>
          <button 
            onClick={() => setShowContextDetails(!showContextDetails)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
              showContextDetails 
                ? "bg-blue-50 border-blue-200 text-blue-700" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Info size={14} /> {showContextDetails ? "Hide Context" : "View Context & Signals"}
          </button>
        </div>
      </div>

      {/* ── Target Companies Navigation Ribbon ─────────── */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {data.companies.map((company: any, idx: number) => {
          const cDraft = draftsByCompany[company.company_name];
          const isSelected = idx === selectedCompanyIndex;
          const status = cDraft?.status || company.executive_email?.status || "draft";
          const score = company.intent_score || cDraft?.intent_score || 85;

          return (
            <button
              key={idx}
              onClick={() => {
                setSelectedCompanyIndex(idx);
                setActiveTab("email");
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all shrink-0 min-w-[240px] ${
                isSelected 
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20" 
                  : "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/60 shadow-sm"
              }`}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-inner"
                style={{ 
                  backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : INITIALS_COLORS[idx % INITIALS_COLORS.length] 
                }}
              >
                {getInitials(company.company_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className={`font-bold text-sm truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {company.company_name}
                  </p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isSelected 
                      ? "bg-white/20 text-white" 
                      : score >= 85 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    {score}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-xs truncate ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                    {company.executive_email?.decision_maker || "Technology Leader"}
                  </span>
                  <span className="text-[10px] uppercase font-bold opacity-80">
                    • {status}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Context & Grounded Intelligence Drawer ─────── */}
      <AnimatePresence>
        {showContextDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-400" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">
                    Grounded Intelligence & Evidence for {companyName}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Intent Score: {intentScore}/100 • Urgency: {selectedCompany.urgency || "High"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Buying Signals */}
                <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 space-y-2">
                  <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Flame size={14} /> Buying Signals
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {buyingSignals.length > 0 ? (
                      buyingSignals.map((sig: string, i: number) => (
                        <span key={i} className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-md text-[11px]">
                          {sig}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">Azure AI Rollout, Budget Approved</span>
                    )}
                  </div>
                </div>

                {/* Pain Points */}
                <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 space-y-2">
                  <p className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Pain Points & Objections
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {painPoints.length > 0 ? (
                      painPoints.map((p: string, i: number) => (
                        <span key={i} className="bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-md text-[11px]">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">HIPAA Compliance, Governance</span>
                    )}
                  </div>
                </div>

                {/* Meeting Transcript Quotes */}
                <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 space-y-2">
                  <p className="font-bold text-blue-400 flex items-center gap-1.5">
                    <PhoneCall size={14} /> Discovery Transcripts
                  </p>
                  <p className="text-slate-300 line-clamp-3 italic">
                    {meetingSummary || "Transcripts analyzed: leadership evaluating governance & compliance."}
                  </p>
                </div>

                {/* Research Summary */}
                <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 space-y-2">
                  <p className="font-bold text-purple-400 flex items-center gap-1.5">
                    <FileText size={14} /> Account Strategy
                  </p>
                  <p className="text-slate-300 line-clamp-3">
                    {researchSummary || selectedCompany.next_best_action || "Targeted architectural review with verified deployment blueprint."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status Feedback Alert ──────────────────────── */}
      {sendFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            sendFeedback.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {sendFeedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{sendFeedback.msg}</span>
          </div>
          <button 
            onClick={() => setSendFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* ── Main Outreach Canvas Card ──────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Channel Navigation Header */}
        <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("email")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "email" 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail size={14} /> Executive Email
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full">
                Grok AI
              </span>
            </button>
            <button
              onClick={() => setActiveTab("linkedin")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "linkedin" 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Linkedin size={14} /> LinkedIn InMail
            </button>
            <button
              onClick={() => setActiveTab("call")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "call" 
                  ? "bg-white text-blue-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PhoneCall size={14} /> Call Script & Discovery
            </button>
          </div>

          {/* Status & Confidence Badge */}
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
              currentStatus === "sent" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : currentStatus === "approved"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
            }`}>
              {currentStatus === "sent" ? "Dispatched" : currentStatus}
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>{confidence}% Confidence</span>
            </div>
          </div>
        </div>

        {/* Content Body Area */}
        <div className="p-6 space-y-6">
          {/* TAB 1: EXECUTIVE EMAIL */}
          {activeTab === "email" && (
            <div className="space-y-5">
              {/* Recipient Bar */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">To:</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <User size={14} className="text-blue-600" />
                    <span>{execEmail.decision_maker || "Technology Leader"}</span>
                    <span className="text-slate-400">({execEmail.decision_maker_title || "CTO"})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 uppercase tracking-wider">Email:</span>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedRecipient}
                      onChange={(e) => {
                        setEditedRecipient(e.target.value);
                        setHasEdits(true);
                      }}
                      className="border border-blue-300 rounded px-2 py-0.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {currentRecipient}
                    </span>
                  )}
                </div>
              </div>

              {/* Subject Line */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Subject Line</span>
                  <span className="font-normal lowercase text-slate-400">
                    {currentSubject.length} chars
                  </span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => {
                      setEditedSubject(e.target.value);
                      setHasEdits(true);
                    }}
                    className="w-full text-base font-bold text-slate-900 border-2 border-blue-400 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter email subject line..."
                  />
                ) : (
                  <div className="text-base font-bold text-slate-900 bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5">
                    {currentSubject || "Strategic Initiative Alignment"}
                  </div>
                )}
              </div>

              {/* Email Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Personalized Email Body</span>
                  <div className="flex items-center gap-3 font-normal text-slate-400 normal-case">
                    <span><Type size={12} className="inline mr-1" />{wordCount(currentBody)} words</span>
                    <span><Clock size={12} className="inline mr-1" />{readTime(wordCount(currentBody))}</span>
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    rows={12}
                    value={editedBody}
                    onChange={(e) => {
                      setEditedBody(e.target.value);
                      setHasEdits(true);
                    }}
                    className="w-full text-sm leading-relaxed text-slate-800 border-2 border-blue-400 rounded-xl p-4 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
                    placeholder="Write your email body..."
                  />
                ) : (
                  <div className="text-sm leading-relaxed text-slate-800 bg-white border border-slate-200 rounded-xl p-5 whitespace-pre-wrap font-sans shadow-inner">
                    {currentBody}
                  </div>
                )}
              </div>

              {/* Call To Action Highlight Card */}
              {cta && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <ArrowUpRight size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                      Target Call To Action (Low Friction)
                    </p>
                    <p className="text-sm font-semibold text-blue-950 mt-0.5">{cta}</p>
                  </div>
                </div>
              )}

              {/* AI Conversion Reasoning */}
              {reason && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
                  <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Why this email will convert: </span>
                    <span>{reason}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LINKEDIN INMAIL */}
          {activeTab === "linkedin" && (
            <div className="space-y-4">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex items-center gap-2 text-xs text-blue-900">
                <Linkedin size={16} className="text-blue-600 shrink-0" />
                <span>
                  Champion Outreach: Direct message tailored for <strong>{selectedCompany.linkedin_message?.to || "VP Engineering"}</strong>
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-sans shadow-inner">
                {selectedCompany.linkedin_message?.body || "Champion InMail message ready."}
              </div>
            </div>
          )}

          {/* TAB 3: DISCOVERY CALL SCRIPT */}
          {activeTab === "call" && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Opening Hook
                  </span>
                  <p className="text-sm text-slate-800 font-medium bg-white p-3 rounded-lg border border-slate-200">
                    {selectedCompany.call_script?.opening}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    High-Impact Discovery Questions
                  </span>
                  <div className="space-y-2">
                    {(selectedCompany.call_script?.discovery_questions || []).map((q: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-white p-3 rounded-lg border border-slate-200 text-slate-800">
                        <span className="font-bold text-blue-600">{i + 1}.</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Closing Alignment & Next Step
                  </span>
                  <p className="text-sm text-slate-800 font-medium bg-white p-3 rounded-lg border border-slate-200">
                    {selectedCompany.call_script?.close}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom Action Toolbar ─────────────────────── */}
        <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tone Presets Popover */}
            <div className="relative">
              <button
                onClick={() => setShowToneDropdown(!showToneDropdown)}
                disabled={isRegenerating}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {isRegenerating ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <SlidersHorizontal size={14} className="text-slate-500" />
                )}
                <span>Refine Tone</span>
              </button>

              {showToneDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Grok AI Tone Presets
                  </div>
                  <div className="space-y-1 mt-1">
                    {TONE_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleRegenerateWithTone(t.id)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>{t.icon}</span> {t.label}
                          </span>
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                            {t.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* In-Place Edit / Done Editing */}
            {activeTab === "email" && (
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSaveEdits();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
                  isEditing 
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Edit3 size={14} />
                <span>{isEditing ? "Save Edits" : "Edit Draft"}</span>
              </button>
            )}

            {/* Reset AI Draft */}
            {hasEdits && (
              <button
                onClick={() => {
                  const draft = draftsByCompany[companyName];
                  setEditedSubject(draft?.subject || execEmail.subject || "");
                  setEditedBody(draft?.body || execEmail.body || "");
                  setEditedRecipient(draft?.recipient_email || execEmail.recipient_email || "");
                  setHasEdits(false);
                  setIsEditing(false);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> Reset AI Draft
              </button>
            )}

            {/* Copy Button */}
            <button
              onClick={() => {
                if (activeTab === "email") {
                  handleCopy(`Subject: ${currentSubject}\n\n${currentBody}`, `email-${selectedCompanyIndex}`);
                } else if (activeTab === "linkedin") {
                  handleCopy(selectedCompany.linkedin_message?.body || "", `li-${selectedCompanyIndex}`);
                } else {
                  handleCopy(getCallScriptText(), `call-${selectedCompanyIndex}`);
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {copied ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
              title="Download draft"
            >
              <Download size={14} />
            </button>
          </div>

          {/* Right Action Hub: Approve & Send */}
          <div className="flex items-center gap-2.5">
            {currentStatus === "draft" && (
              <button
                onClick={handleApproveDraft}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <ThumbsUp size={14} /> Approve Draft
              </button>
            )}

            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-blue-500/20"
            >
              {isSending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Email Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}