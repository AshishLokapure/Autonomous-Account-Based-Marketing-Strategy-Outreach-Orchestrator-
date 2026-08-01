"use client";

import {
  Activity,
  Bell,
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

interface NavGroup {
  label?: string;
  items: { label: string; href: string; icon: any }[];
}

const navigationGroups: NavGroup[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "PRODUCT INTELLIGENCE",
    items: [{ label: "Products & ICP", href: "/products", icon: Package }],
  },
  {
    label: "ACCOUNT INTELLIGENCE",
    items: [
      { label: "Accounts", href: "/accounts", icon: BriefcaseBusiness },
      { label: "Research Center", href: "/research", icon: Search },
      { label: "Stakeholders", href: "/stakeholders", icon: Users },
      { label: "Intent Signals", href: "/intent", icon: Activity },
    ],
  },
  {
    label: "EXECUTION",
    items: [
      { label: "Strategy Center", href: "/strategy", icon: Target },
      { label: "Outreach Studio", href: "/outreach", icon: Mail },
    ],
  },
  {
    label: "KNOWLEDGE",
    items: [{ label: "Documents", href: "/documents", icon: FileText }],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
      { label: "Agent Monitor", href: "/agent-monitor", icon: Bot },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ active = "Dashboard" }: { active?: string }) {
  const { profile, workspace, role, signOut } = useAuth();

  const workspaceName = workspace?.name || "Northstar Revenue";
  const userName = profile?.full_name || "John Smith";
  const userRole = role ? `${role.charAt(0).toUpperCase() + role.slice(1)}` : "Owner";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Sparkles size={17} />
        </div>
        <b>AccountPilot</b>
      </div>

      <div className="workspace">
        <div>
          <small>WORKSPACE</small>
          {workspaceName}
        </div>
        <ChevronDown size={15} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingBottom: 10 }}>
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {group.label && <div className="nav-label">{group.label}</div>}
            <nav className="nav">
              {group.items.map(({ label, href, icon: Icon }) => (
                <a className={active === label ? "active" : ""} href={href} key={label}>
                  <Icon size={17} />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="sidebar-bottom">
        <a href="#help">
          <CircleHelp size={17} />
          <span>Help & resources</span>
        </a>
        <button
          type="button"
          onClick={() => signOut()}
          style={{
            background: "transparent",
            border: 0,
            color: "#aab6ca",
            display: "flex",
            gap: 12,
            alignItems: "center",
            padding: "9px 12px",
            fontSize: 13,
            cursor: "pointer",
            width: "100%",
          }}
        >
          <LogOut size={17} />
          <span>Log out</span>
        </button>
        <div className="profile">
          <div className="avatar">{initials || "AP"}</div>
          <div>
            {userName}
            <span>{userRole} · {workspaceName}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
