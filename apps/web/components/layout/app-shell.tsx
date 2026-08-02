"use client";

import { Bell, Command, Moon, Search, Bot } from "lucide-react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/providers/auth-provider";
import { RunCampaignButton } from "@/components/campaign/run-campaign-button";
import { useCampaign } from "@/stores/campaign-store";
import Link from "next/link";

const CAMPAIGN_BUTTON_PAGES = [
  "Dashboard",
  "Research Center",
  "Stakeholders",
  "Intent Signals",
  "Strategy Center",
  "Outreach Studio",
];

export function AppShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const { profile } = useAuth();
  const { state } = useCampaign();
  const userName = profile?.full_name || "John Smith";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const isRunning = state.status === "running" || state.status === "starting";
  const isCompleted = state.status === "completed";
  const showCampaignButton = active ? CAMPAIGN_BUTTON_PAGES.includes(active) : false;

  return (
    <div className="app-shell">
      <Sidebar active={active} />
      <main className="main">
        <header className="topbar">
          <div className="search">
            <Search size={16} />
            <span>Search accounts, signals, or products...</span>
            <Command size={13} />
          </div>
          <div className="top-spacer" />
          
          {/* Dynamic AI Status indicator */}
          <Link href="/agent-monitor" style={{ textDecoration: "none" }}>
            <div className={`ai-status ${isRunning ? "status-running" : isCompleted ? "status-completed" : ""}`}>
              <span className={`ai-dot ${isRunning ? "dot-pulsing" : ""}`} />
              {isRunning 
                ? `${state.currentAgent || "Orchestrating"} · ${state.progress}%`
                : isCompleted 
                ? "5 Agents Synced" 
                : "AI agents online"}
            </div>
          </Link>

          <button className="icon-button" aria-label="Toggle dark theme">
            <Moon size={17} />
          </button>
          <button className="icon-button" aria-label="Notifications">
            <Bell size={17} />
          </button>
          <div className="avatar">{initials || "AP"}</div>
        </header>
        {children}
        {showCampaignButton && <RunCampaignButton />}
      </main>

      <style jsx>{`
        .status-running {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          border: 1px solid #bfdbfe;
          cursor: pointer;
        }
        .status-completed {
          background: #f0fdf4 !important;
          color: #15803d !important;
          cursor: pointer;
        }
        .dot-pulsing {
          background: #3b82f6 !important;
          box-shadow: 0 0 8px #60a5fa;
          animation: pulseDot 1.2s infinite ease-in-out;
        }
        @keyframes pulseDot {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
