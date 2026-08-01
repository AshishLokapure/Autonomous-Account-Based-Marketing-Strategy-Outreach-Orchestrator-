"use client";

import { Bell, Command, Moon, Search } from "lucide-react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/providers/auth-provider";
import { RunCampaignButton } from "@/components/campaign/run-campaign-button";

export function AppShell({ children, active }: { children: React.ReactNode; active?: string }) {
  const { profile } = useAuth();
  const userName = profile?.full_name || "John Smith";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

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
          <div className="ai-status">
            <span className="ai-dot" />
            AI agents online
          </div>
          <button className="icon-button" aria-label="Toggle dark theme">
            <Moon size={17} />
          </button>
          <button className="icon-button" aria-label="Notifications">
            <Bell size={17} />
          </button>
          <div className="avatar">{initials || "AP"}</div>
        </header>
        {children}
        <RunCampaignButton />
      </main>
    </div>
  );
}
