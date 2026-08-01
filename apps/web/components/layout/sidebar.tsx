import { Activity, Bell, Bot, BriefcaseBusiness, ChartNoAxesCombined, ChevronDown, CircleHelp, FileText, Gauge, LayoutDashboard, LogOut, Mail, Network, Search, Settings, Sparkles, Target, Users } from "lucide-react";

const navigation = [
  ["Dashboard", "/dashboard", LayoutDashboard], ["Accounts", "/accounts", BriefcaseBusiness], ["Research Center", "/research", Search], ["Stakeholders", "/stakeholders", Users], ["Intent Signals", "/intent", Activity], ["Strategy Center", "/strategy", Target], ["Outreach Studio", "/outreach", Mail], ["Documents", "/documents", FileText], ["Analytics", "/analytics", ChartNoAxesCombined], ["Agent Monitor", "/agent-monitor", Bot], ["Notifications", "/notifications", Bell], ["Settings", "/settings", Settings]
] as const;

export function Sidebar({ active = "Dashboard" }: { active?: string }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark"><Sparkles size={17}/></div><b>AccountPilot</b></div>
    <div className="workspace"><div><small>WORKSPACE</small>Northstar Revenue</div><ChevronDown size={15}/></div>
    <div className="nav-label">WORKSPACE</div><nav className="nav">{navigation.map(([label, href, Icon]) => <a className={active === label ? "active" : ""} href={href} key={label}><Icon size={17}/><span>{label}</span></a>)}</nav>
    <div className="sidebar-bottom"><a href="#help"><CircleHelp size={17}/><span>Help & resources</span></a><a href="#logout"><LogOut size={17}/><span>Log out</span></a><div className="profile"><div className="avatar">JS</div><div>John Smith<span>Admin · Northstar</span></div></div></div>
  </aside>;
}
