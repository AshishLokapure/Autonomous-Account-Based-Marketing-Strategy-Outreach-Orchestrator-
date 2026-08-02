"use client";

import React, { useState } from "react";
import { useCampaign } from "@/stores/campaign-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Linkedin, PhoneCall, Copy, CheckCircle2, 
  Send, RefreshCw, SlidersHorizontal,
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
      <span><Type size={13} /> {words} words</span>
      <span className="dot-sep">•</span>
      <span>{chars.toLocaleString()} characters</span>
      <span className="dot-sep">•</span>
      <span><Clock size={13} /> {readTime(words)}</span>
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
        {copied === copyId ? "Copied!" : "Copy to Clipboard"}
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
      className="outreach-container"
    >
      <header className="page-header">
        <p className="eyebrow">EXECUTION</p>
        <h1 className="page-title">Outreach Studio</h1>
      </header>

      {/* ── KPI Metric Cards ───────────────────────── */}
      <div className="kpi-grid">
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
      <div className="company-tabs custom-scrollbar">
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

      {/* ── Main Full-Width Asset Card ────────────── */}
      <div className="asset-card-wrapper">
        <div className="card asset-card bg-white border border-slate-200 rounded-[16px] overflow-hidden flex flex-col shadow-sm">
          {/* ── Channel Tab Bar ────────────────────────── */}
          <div className="asset-header bg-slate-50/80 border-b border-slate-200/80 p-4 flex gap-3">
            {(['email', 'linkedin', 'call'] as const).map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'email' && <Mail size={16} />}
                {tab === 'linkedin' && <Linkedin size={16} />}
                {tab === 'call' && <PhoneCall size={16} />}
                <span>{tab === 'email' ? 'Email' : tab === 'linkedin' ? 'LinkedIn' : 'Call Script'}</span>
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
          <div className="asset-body p-8 flex-grow relative min-h-[420px]">
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
                      <div className="email-body whitespace-pre-wrap text-sm leading-relaxed text-slate-800 font-medium">
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
                      <div className="linkedin-body whitespace-pre-wrap text-sm leading-relaxed bg-slate-50/70 p-6 rounded-xl border border-slate-200/80 text-slate-800 font-medium shadow-sm">
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
                  className="call-preview"
                >
                  {selectedCompany.call_script ? (
                    <>
                      <div className="call-script-header">
                        <h3 className="font-bold text-lg flex items-center gap-2.5 text-slate-900">
                          <PhoneCall size={20} className="text-blue-600" /> Call Script Outline
                        </h3>
                      </div>
                      <div className="call-script-sections">
                        <div className="call-section">
                          <h4 className="call-section-title">Opening</h4>
                          <p className="call-section-text">{selectedCompany.call_script.opening}</p>
                        </div>
                        <div className="call-section">
                          <h4 className="call-section-title">Discovery Questions</h4>
                          <ul className="call-questions-list">
                            {selectedCompany.call_script.discovery_questions?.map((q: string, i: number) => (
                              <li key={i} className="call-question-item">
                                <span className="call-question-num">{i + 1}</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="call-section">
                          <h4 className="call-section-title">Close</h4>
                          <p className="call-section-text">{selectedCompany.call_script.close}</p>
                        </div>
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

      <style jsx global>{`
        .outreach-container {
          padding: 24px;
        }

        .page-header {
          margin-bottom: 24px;
        }
        .eyebrow {
          color: #2563eb;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .page-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── KPI Grid ────────────────────────────────── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .metric-card {
          padding: 1.25rem 1.5rem;
          background: white;
          border: 1px solid var(--line, #e7eaf0);
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .metric-label {
          font-size: 0.8125rem;
          color: var(--muted, #64748b);
          font-weight: 600;
          margin-bottom: 0.375rem;
        }
        .metric-number {
          font-size: 1.875rem;
          font-weight: 800;
          font-family: 'Plus Jakarta Sans', sans-serif;
          line-height: 1.2;
        }
        
        /* ── Company Tabs Container ─────────────────── */
        .company-tabs {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          gap: 12px !important;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }

        /* ── Company Tabs with Avatars ─────────────── */
        .company-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 1.125rem 0.5rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 600;
          background: var(--canvas, #f6f8fc);
          color: var(--muted, #64748b);
          border: 1px solid var(--line, #e7eaf0);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
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

        /* ── Asset Card Wrapper ──────────────────────── */
        .asset-card-wrapper {
          width: 100%;
        }
        .asset-card {
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px -2px rgba(0,0,0,0.05);
        }

        /* ── Channel Tab Bar Container ──────────────── */
        .asset-header {
          display: flex !important;
          flex-direction: row !important;
          align-items: center;
          gap: 10px;
          padding: 16px 24px;
        }

        /* ── Channel Tabs ──────────────────────────── */
        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 1.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--muted, #64748b);
          border-radius: 10px;
          transition: all 0.2s ease;
          position: relative;
          flex-shrink: 0;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        .tab-btn:hover {
          background: rgba(0,0,0,0.04);
          color: var(--navy, #0f172a);
        }
        .tab-btn.active {
          background: white;
          color: var(--blue, #2563eb);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .tab-indicator {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 3px;
          border-radius: 3px;
          background: var(--blue, #2563eb);
        }

        .asset-body {
          padding: 32px;
        }

        /* ── Envelope-Style Email Header ───────────── */
        .envelope-header {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
        }
        .linkedin-header {
          background: #f0f7ff;
          border-color: #dbeafe;
          margin-bottom: 20px;
        }
        .envelope-row {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 0.8125rem;
        }
        .envelope-subject-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }
        .envelope-label {
          color: var(--muted, #64748b);
          font-weight: 600;
          min-width: 56px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .envelope-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 4px 12px 4px 4px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--navy, #0f172a);
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
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

        .email-body {
          line-height: 1.7;
          font-size: 0.9375rem;
          color: #334155;
          margin-bottom: 24px;
        }
        .linkedin-body {
          line-height: 1.7;
          font-size: 0.9375rem;
          color: #334155;
          margin-bottom: 24px;
        }

        /* ── Call Script Layout ────────────────────── */
        .call-script-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .call-script-sections {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }
        .call-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px 24px;
        }
        .call-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        .call-section-text {
          font-size: 0.875rem;
          color: #334155;
          line-height: 1.65;
          font-weight: 500;
        }
        .call-questions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .call-question-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
          line-height: 1.5;
        }
        .call-question-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #dbeafe;
          color: #2563eb;
          font-size: 0.6875rem;
          font-weight: 800;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* ── Content Stats Bar ─────────────────────── */
        .content-stats {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
          font-size: 0.75rem;
          color: var(--muted, #64748b);
          font-weight: 500;
        }
        .content-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .dot-sep {
          color: #cbd5e1;
        }

        /* ── Asset Actions (Regenerate + Tone + Copy) ── */
        .asset-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 0.8125rem;
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
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-left: auto;
          background: #2563eb;
          color: white;
          transition: all 0.2s ease;
          border: 1px solid #2563eb;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
        }
        .copy-btn:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
          box-shadow: 0 3px 8px rgba(37, 99, 235, 0.3);
        }
        .copy-btn.copied {
          background: #059669;
          color: white;
          border-color: #059669;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
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
          padding: 32px 28px;
          background: var(--canvas, #f6f8fc);
          border: 1px dashed var(--line, #e7eaf0);
          border-radius: 14px;
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