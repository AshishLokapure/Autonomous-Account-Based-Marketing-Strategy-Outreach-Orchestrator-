import { Bell, Command, Moon, Plus, Search, Sparkles } from "lucide-react";
import { Sidebar } from "./sidebar";

export function AppShell({ children, active }: { children: React.ReactNode; active?: string }) {
 return <div className="app-shell"><Sidebar active={active}/><main className="main"><header className="topbar"><div className="search"><Search size={16}/><span>Search accounts, signals, or anything...</span><Command size={13}/></div><div className="top-spacer"/><div className="ai-status"><span className="ai-dot"/>AI agents online</div><button className="icon-button" aria-label="Toggle dark theme"><Moon size={17}/></button><button className="icon-button" aria-label="Notifications"><Bell size={17}/></button><div className="avatar">JS</div></header>{children}<button className="float-ai" aria-label="Open AccountPilot AI"><Sparkles size={23}/></button></main></div>;
}
