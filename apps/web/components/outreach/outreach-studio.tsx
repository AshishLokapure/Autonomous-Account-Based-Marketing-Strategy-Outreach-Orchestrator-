"use client";

import React, { useState } from "react";
import { useCampaign } from "@/stores/campaign-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Linkedin, PhoneCall, Copy, CheckCircle2, 
  ArrowRight, FileText, Send
} from "lucide-react";
import Link from "next/link";

export function OutreachStudio() {
  const { state } = useCampaign();
  const data = state.agentResults?.outreach;

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
            {company.company_name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card asset-card bg-white border border-slate-200 rounded-[15px] overflow-hidden flex flex-col shadow-sm">
            <div className="asset-header bg-slate-50 border-b border-slate-200 p-4 flex gap-2">
              <button 
                className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
                onClick={() => setActiveTab('email')}
              >
                <Mail size={16} /> Email
              </button>
              <button 
                className={`tab-btn ${activeTab === 'linkedin' ? 'active' : ''}`}
                onClick={() => setActiveTab('linkedin')}
              >
                <Linkedin size={16} /> LinkedIn
              </button>
              <button 
                className={`tab-btn ${activeTab === 'call' ? 'active' : ''}`}
                onClick={() => setActiveTab('call')}
              >
                <PhoneCall size={16} /> Call Script
              </button>
            </div>
            
            <div className="asset-body p-8 flex-grow relative min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 'email' && selectedCompany.executive_email && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="email-preview"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-3 w-full text-sm">
                        <div className="flex items-center border-b border-slate-100 pb-3">
                          <span className="text-slate-400 w-20 font-medium">To:</span>
                          <span className="font-semibold text-slate-800">{selectedCompany.executive_email.to}</span>
                        </div>
                        <div className="flex items-center border-b border-slate-100 pb-3">
                          <span className="text-slate-400 w-20 font-medium">Subject:</span>
                          <span className="font-bold text-slate-900">{selectedCompany.executive_email.subject}</span>
                        </div>
                      </div>
                      <button 
                        className="copy-btn ml-4 shrink-0"
                        title="Copy to clipboard"
                        onClick={() => handleCopy(selectedCompany.executive_email.body, 'email')}
                      >
                        {copied === 'email' ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                    <div className="email-body whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-medium mt-6">
                      {selectedCompany.executive_email.body}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'linkedin' && selectedCompany.linkedin_message && (
                  <motion.div
                    key="linkedin"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="linkedin-preview"
                  >
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                      <div className="flex items-center w-full text-sm">
                        <span className="text-slate-400 w-20 font-medium">To:</span>
                        <span className="font-semibold text-slate-800">{selectedCompany.linkedin_message.to}</span>
                      </div>
                      <button 
                        className="copy-btn ml-4 shrink-0"
                        title="Copy to clipboard"
                        onClick={() => handleCopy(selectedCompany.linkedin_message.body, 'linkedin')}
                      >
                        {copied === 'linkedin' ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                    <div className="linkedin-body whitespace-pre-wrap text-sm leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-200 text-slate-700 font-medium shadow-sm">
                      {selectedCompany.linkedin_message.body}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'call' && selectedCompany.call_script && (
                  <motion.div
                    key="call"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="call-preview space-y-6"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                        <PhoneCall size={20} className="text-blue-600" /> Call Script Outline
                      </h3>
                      <button 
                        className="copy-btn shrink-0"
                        title="Copy to clipboard"
                        onClick={() => handleCopy(
                          `${selectedCompany.call_script.opening}\n\nDiscovery Questions:\n${selectedCompany.call_script.discovery_questions.join('\n')}\n\nClose:\n${selectedCompany.call_script.close}`, 
                          'call'
                        )}
                      >
                        {copied === 'call' ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

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
            <p className="text-sm leading-relaxed text-slate-300 font-medium relative z-10">
              {selectedCompany.next_best_action}
            </p>
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
        
        .company-tab {
          padding: 0.6rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
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
        }
        .company-tab.active {
          background: var(--navy, #0f172a);
          color: white;
          border-color: var(--navy, #0f172a);
          box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);
        }

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

        .copy-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--canvas, #f6f8fc);
          color: var(--muted, #64748b);
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .copy-btn:hover {
          background: white;
          border-color: var(--line, #e7eaf0);
          color: var(--navy, #0f172a);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

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
