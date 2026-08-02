"use client";

import React, { useState } from "react";
import { useCampaign } from "@/stores/campaign-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Linkedin, PhoneCall, Copy, CheckCircle2, 
  ArrowRight, FileText, Send, RefreshCw, SlidersHorizontal,
  Clock, Type, AlertCircle, User
} from "lucide-react";
import Link from "next/link";

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

/* ── Empty placeholder for missing content ───────────── */

function EmptyField({ label }: { label: string }) {
  return (
    <div className="empty-field">
      <AlertCircle size={20} />
      <div>
        <p className="empty-field-title">No {label} generated</p>
        <p className="empty-field-hint">Run the Outreach Agent to generate this asset, or click Regenerate.</p>
      </div>
    </div>
  );
}

/* ── Content stats bar ───────────────────────────────── */

function ContentStats({ text }: { text: string | undefined | null }) {
  if (!text) return null;
  const words = wordCount(text);
  const chars = text.length;
  return (
    <div className="content-stats">
      <span><Type size={12} /> {words} words</span>
      <span>·</span>
      <span>{chars.toLocaleString()} chars</span>
      <span>·</span>
      <span><Clock size={12} /> {readTime(words)}</span>
    </div>
  );
}

/* ── Action bar (Regenerate + Edit Tone + Copy) ──────── */

function AssetActions({
  onCopy,
  copied,
  copyId,
}: {
  onCopy: () => void;
  copied: string | null;
  copyId: string;
}) {
  return (
    <div className="asset-actions">
      <button className="action-btn regen-btn" title="Regenerate content">
        <RefreshCw size={14} /> Regenerate
      </button>
      <button className="action-btn tone-btn" title="Adjust tone">
        <SlidersHorizontal size={14} /> Edit Tone
      </button>
      <button
        className={`copy-btn ${copied === copyId ? "copied" : ""}`}
        title="Copy to clipboard"
        onClick={onCopy}
      >
        <AnimatePresence mode="wait">
          {copied === copyId ? (
            <motion.span
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="copy-icon-wrap"
            >
              <CheckCircle2 size={16} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="copy-icon-wrap"
            >
              <Copy size={16} />
            </motion.span>
          )}
        </AnimatePresence>
        {copied === copyId ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */

export function OutreachStudio() {
  const { state } = useCampaign();
  const data = state.agentResults?.outreach as any;

  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'email'|'linkedin'|'call'>('email');
  const [copied, setCopied] = useState<string | null>(null);

  if (!data || !data.companies || data.companies.length === 0) {
    return (
      <div className="empty-state text-center py-20 flex flex-col items-center justify-center">
        <Send size={48} className="text-slate-400 mb-4 mx-auto" />
        <h3 className="text-xl font-bold mb-2">No Outreach Data</h3>
        <p className="text-slate-500 mb-6">Run a campaign to generate personalized outreach assets.</p>
        <Link href="/">
          <button className="primary-button bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">Run Campaign</button>
        </Link>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedCompany = data.companies[selectedCompanyIndex] || data.companies[0];

  const getCallScriptText = () => {
    const cs = selectedCompany.call_script;
    if (!cs) return "";
    return `${cs.opening}\n\nDiscovery Questions:\n${(cs.discovery_questions || []).join('\n')}\n\nClose:\n${cs.close}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="outreach-container p-6"
    >
      <header className="page-header mb-8">
        <p className="eyebrow text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">EXECUTION</p>
        <h1 className="page-title text-3xl font-extrabold text-slate-900 font-jakarta">Outreach Studio</h1>
      </header>

      <div className="kpi-grid mb-8">
        <div className="card metric-card">
          <p className="metric-label">Emails Generated</p>
          <p className="metric-number text-slate-900">{data.totals?.emails_generated || 0}</p>
        </div>
        <div className="card metric-card">
          <p className="metric-label">LinkedIn Msgs</p>
          <p className="metric-number text-slate-900">{data.totals?.linkedin_messages || 0}</p>
        </div>
        <div className="card metric-card">
          <p className="metric-label">Call Scripts</p>
          <p className="metric-number text-slate-900">{data.totals?.call_scripts || 0}</p>
        </div>
        <div className="card metric-card">
          <p className="metric-label">Total Assets</p>
          <p className="metric-number text-blue-600">{data.totals?.total_assets || 0}</p>
        </div>
      </div>

      {/* ── Company Tabs with Avatars ─────────────────── */}
      <div className="company-tabs mb-6 flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
        {data.companies.map((company: any, idx: number) => (
          <button
            key={idx}
            className={`company-tab ${idx === selectedCompanyIndex ? 'active' : ''}`}
            onClick={() => {
              setSelectedCompanyIndex(idx);
              setActiveTab('email');
            }}
          >
            <span
              className="company-avatar"
              style={{ background: INITIALS_COLORS[idx % INITIALS_COLORS.length] }}
            >
              {getInitials(company.company_name)}
            </span>
            <span className="company-tab-label">{company.company_name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card asset-card bg-white border border-slate-200 rounded-[15px] overflow-hidden flex flex-col shadow-sm">
            {/* ── Tab Bar ────────────────────────────────── */}
            <div className="asset-header bg-slate-50 border-b border-slate-200 p-4 flex gap-2">
              {(['email', 'linkedin', 'call'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'email' && <Mail size={16} />}
                  {tab === 'linkedin' && <Linkedin size={16} />}
                  {tab === 'call' && <PhoneCall size={16} />}
                  {tab === 'email' ? 'Email' : tab === 'linkedin' ? 'LinkedIn' : 'Call Script'}
                  {activeTab === tab && (
                    <motion.div
                      className="tab-indicator"
                      layoutId="activeTabIndicator"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
            
            {/* ── Asset Body ─────────────────────────────── */}
            <div className="asset-body p-8 flex-grow relative min-h-[400px]">
              <AnimatePresence mode="wait">
                {/* Email Tab */}
                {activeTab === 'email' && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="email-preview"
                  >
                    {selectedCompany.executive_email ? (
                      <>
                        {/* Envelope Header */}
                        <div className="envelope-header">
                          <div className="envelope-row">
                            <span className="envelope-label">From:</span>
                            <div className="envelope-chip">
                              <span className="envelope-avatar"><User size={12} /></span>
                              <span>AccountPilot AI</span>
                            </div>
                          </div>
                          <div className="envelope-row">
                            <span className="envelope-label">To:</span>
                            <div className="envelope-chip">
                              <span className="envelope-avatar" style={{ background: INITIALS_COLORS[selectedCompanyIndex % INITIALS_COLORS.length] }}>
                                {getInitials(selectedCompany.executive_email.to || selectedCompany.company_name)}
                              </span>
                              <span>{selectedCompany.executive_email.to}</span>
                            </div>
                          </div>
                          <div className="envelope-subject-row">
                            <span className="envelope-label">Subject:</span>
                            <span className="envelope-subject">{selectedCompany.executive_email.subject}</span>
                          </div>
                        </div>
                        <div className="email-body whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-medium mt-6">
                          {selectedCompany.executive_email.body}
                        </div>
                        <ContentStats text={selectedCompany.executive_email.body} />
                        <AssetActions
                          onCopy={() => handleCopy(selectedCompany.executive_email.body, 'email')}
                          copied={copied}
                          copyId="email"
                        />
                      </>
                    ) : (
                      <EmptyField label="email" />
                    )}
                  </motion.div>
                )}

                {/* LinkedIn Tab */}
                {activeTab === 'linkedin' && (
                  <motion.div
                    key="linkedin"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="linkedin-preview"
                  >
                    {selectedCompany.linkedin_message ? (
                      <>
                        <div className="envelope-header linkedin-header">
                          <div className="envelope-row">
                            <span className="envelope-label">To:</span>
                            <div className="envelope-chip">
                              <span className="envelope-avatar" style={{ background: INITIALS_COLORS[selectedCompanyIndex % INITIALS_COLORS.length] }}>
                                {getInitials(selectedCompany.linkedin_message.to || selectedCompany.company_name)}
                              </span>
                              <span>{selectedCompany.linkedin_message.to}</span>
                            </div>
                          </div>
                        </div>
                        <div className="linkedin-body whitespace-pre-wrap text-sm leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-200 text-slate-700 font-medium shadow-sm">
                          {selectedCompany.linkedin_message.body}
                        </div>
                        <ContentStats text={selectedCompany.linkedin_message.body} />
                        <AssetActions
                          onCopy={() => handleCopy(selectedCompany.linkedin_message.body, 'linkedin')}
                          copied={copied}
                          copyId="linkedin"
                        />
                      </>
                    ) : (
                      <EmptyField label="LinkedIn message" />
                    )}
                  </motion.div>
                )}

                {/* Call Script Tab */}
                {activeTab === 'call' && (
                  <motion.div
                    key="call"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="call-preview space-y-6"
                  >
                    {selectedCompany.call_script ? (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                            <PhoneCall size={20} className="text-blue-600" /> Call Script Outline
                          </h3>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Opening</h4>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedCompany.call_script.opening}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Discovery Questions</h4>
                          <ul className="space-y-3 text-sm text-slate-700 font-medium">
                            {selectedCompany.call_script.discovery_questions?.map((q: string, i: number) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="flex items-center justify-center bg-blue-100 text-blue-700 w-5 h-5 rounded-full text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Close</h4>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedCompany.call_script.close}</p>
                        </div>
                        <ContentStats text={getCallScriptText()} />
                        <AssetActions
                          onCopy={() => handleCopy(getCallScriptText(), 'call')}
                          copied={copied}
                          copyId="call"
                        />
                      </>
                    ) : (
                      <EmptyField label="call script" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar (NBA + Evidence) ─────────── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-slate-900 text-white p-6 rounded-[15px] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ArrowRight size={64} />
            </div>
            <h3 className="font-bold flex items-center gap-2 mb-4 text-lg relative z-10">
              <span className="bg-blue-600 p-1.5 rounded-lg">
                <ArrowRight size={18} className="text-white" />
              </span>
              Next Best Action
            </h3>
            {selectedCompany.next_best_action ? (
              <p className="text-sm leading-relaxed text-slate-300 font-medium relative z-10">
                {selectedCompany.next_best_action}
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-slate-500 italic relative z-10">
                No recommendation available yet.
              </p>
            )}
          </div>

          {selectedCompany.evidence && selectedCompany.evidence.length > 0 && (
            <div className="card p-6 bg-white border border-slate-200 rounded-[15px] shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-5 text-sm text-slate-800">
                <FileText size={16} className="text-slate-400" /> Evidence Trail
              </h3>
              <div className="space-y-4">
                {selectedCompany.evidence.map((ev: any, i: number) => (
                  <div key={i} className="text-xs border-l-2 border-blue-500 pl-4 py-1">
                    <span className="font-bold block mb-1 text-slate-700">{ev.source}</span>
                    <span className="text-slate-500 leading-relaxed">{ev.fact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        .metric-card {
          padding: 1.5rem;
          background: white;
          border: 1px solid var(--line, #e7eaf0);
          border-radius: 15px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .metric-label {
          font-size: 0.875rem;
          color: var(--muted, #64748b);
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .metric-number {
          font-size: 2rem;
          font-weight: 800;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        
        /* ── Company Tabs with Avatars ─────────────── */
        .company-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem 0.5rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 600;
          background: var(--canvas, #f6f8fc);
          color: var(--muted, #64748b);
          border: 1px solid var(--line, #e7eaf0);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .company-tab:hover {
          background: white;
          color: var(--navy, #0f172a);
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .company-tab.active {
          background: var(--navy, #0f172a);
          color: white;
          border-color: var(--navy, #0f172a);
          box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.25);
        }
        .company-tab.active .company-avatar {
          background: rgba(255,255,255,0.2) !important;
          color: white;
        }
        .company-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          font-size: 0.625rem;
          font-weight: 800;
          color: white;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        /* ── Channel Tabs ──────────────────────────── */
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--muted, #64748b);
          border-radius: 10px;
          transition: all 0.2s ease;
          position: relative;
        }
        .tab-btn:hover {
          background: rgba(0,0,0,0.05);
          color: var(--navy, #0f172a);
        }
        .tab-btn.active {
          background: white;
          color: var(--blue, #2563eb);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .tab-indicator {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 3px;
          border-radius: 3px;
          background: var(--blue, #2563eb);
        }

        /* ── Envelope-Style Email Header ───────────── */
        .envelope-header {
          background: var(--canvas, #f6f8fc);
          border: 1px solid var(--line, #e7eaf0);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .linkedin-header {
          background: #f0f7ff;
          border-color: #dbeafe;
        }
        .envelope-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.8125rem;
        }
        .envelope-subject-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          padding-top: 8px;
          border-top: 1px solid var(--line, #e7eaf0);
        }
        .envelope-label {
          color: var(--muted, #64748b);
          font-weight: 500;
          min-width: 52px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .envelope-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid var(--line, #e7eaf0);
          border-radius: 999px;
          padding: 3px 10px 3px 3px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--navy, #0f172a);
        }
        .envelope-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--blue, #2563eb);
          color: white;
          font-size: 0.5625rem;
          font-weight: 800;
        }
        .envelope-subject {
          font-weight: 700;
          font-size: 0.9375rem;
          color: var(--navy, #0f172a);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── Content Stats Bar ─────────────────────── */
        .content-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--line, #e7eaf0);
          font-size: 0.6875rem;
          color: var(--muted, #64748b);
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        .content-stats span {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        /* ── Asset Actions (Regenerate + Tone + Copy) ── */
        .asset-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--line, #e7eaf0);
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--line, #e7eaf0);
          background: white;
          color: var(--muted, #64748b);
        }
        .action-btn:hover {
          background: var(--canvas, #f6f8fc);
          color: var(--navy, #0f172a);
          border-color: #cbd5e1;
        }
        .regen-btn:hover {
          color: var(--blue, #2563eb);
          border-color: #93b4fd;
          background: #f0f4ff;
        }
        .tone-btn:hover {
          color: #8069FF;
          border-color: #c4b5fd;
          background: #f5f3ff;
        }
        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-left: auto;
          background: var(--canvas, #f6f8fc);
          color: var(--muted, #64748b);
          transition: all 0.2s ease;
          border: 1px solid transparent;
          cursor: pointer;
        }
        .copy-btn:hover {
          background: white;
          border-color: var(--line, #e7eaf0);
          color: var(--navy, #0f172a);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .copy-btn.copied {
          background: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
        }
        .copy-icon-wrap {
          display: flex;
          align-items: center;
        }

        /* ── Empty Field ───────────────────────────── */
        .empty-field {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 28px 24px;
          background: var(--canvas, #f6f8fc);
          border: 1px dashed var(--line, #e7eaf0);
          border-radius: 12px;
          color: var(--muted, #64748b);
        }
        .empty-field-title {
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--navy, #0f172a);
          margin-bottom: 4px;
        }
        .empty-field-hint {
          font-size: 0.8125rem;
          color: var(--muted, #64748b);
          line-height: 1.5;
        }

        /* ── Scrollbar ─────────────────────────────── */
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </motion.div>
  );
}
