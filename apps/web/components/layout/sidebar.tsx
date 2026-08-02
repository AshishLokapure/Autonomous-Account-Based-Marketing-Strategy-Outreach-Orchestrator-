"use client";

import {
  Activity, AlertTriangle, Bell, Bot, Check,
  ChevronDown, CircleHelp, LayoutDashboard, LogOut, Mail,
  MoreHorizontal, Plus, Search, Settings, Sparkles, Target, Trash2, Users,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

const navigationGroups = [
  { items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  {
    label: "ACCOUNT INTELLIGENCE",
    items: [
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
    label: "OPERATIONS",
    items: [
      { label: "Agent Monitor", href: "/agent-monitor", icon: Bot },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

function DeleteModal({ workspace, onClose, onDeleted }: { workspace: { id: string; name: string }; onClose: () => void; onDeleted: () => void }) {
  const { deleteWorkspace, allWorkspaces } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOnly = allWorkspaces.length === 1;
  const canDelete = confirm === workspace.name && !loading;

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    setError(null);
    try {
      await deleteWorkspace(workspace.id);
      onDeleted();
    } catch (e: any) {
      setError(e.message || "Failed to delete workspace.");
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(27,25,22,0.5)", zIndex: 1000, display: "grid", placeItems: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "32px 36px", width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(36,34,32,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--danger-soft)", display: "grid", placeItems: "center" }}>
            <Trash2 size={18} color="var(--danger)" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "var(--danger)" }}>DELETE WORKSPACE</div>
            <div style={{ font: "700 16px 'Plus Jakarta Sans'", color: "var(--ink)" }}>Permanently delete workspace</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 12px" }}>
          You are about to permanently delete:
        </p>
        <div style={{ background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 16 }}>
          {workspace.name}
        </div>

        {isOnly && (
          <div style={{ background: "var(--warning-soft)", border: "1px solid #F2DFC2", borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 12, color: "#8A5A1B", display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 16 }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            This is your only workspace. After deletion you will need to create another workspace before using AccountPilot.
          </div>
        )}

        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 16px" }}>
          This will delete all products, ICPs, accounts, research, strategies, documents, agent data and outreach belonging to this workspace. <strong style={{ color: "var(--danger)" }}>This action cannot be undone.</strong>
        </p>

        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", display: "block", marginBottom: 16 }}>
          To confirm, type: <span style={{ color: "var(--danger)" }}>{workspace.name}</span>
          <input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder={workspace.name}
            style={{ display: "block", width: "100%", marginTop: 7, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            autoFocus
          />
        </label>

        {error && <div style={{ background: "var(--danger-soft)", border: "1px solid #F2C7C7", color: "var(--danger)", padding: "8px 12px", borderRadius: "var(--radius-sm)", fontSize: 12, marginBottom: 14 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={loading} style={{ padding: "10px 18px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--surface)", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--muted)" }}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={!canDelete} style={{ padding: "10px 18px", border: 0, borderRadius: "var(--radius-md)", background: canDelete ? "var(--danger)" : "#EDA9A9", color: "#fff", fontSize: 13, fontWeight: 700, cursor: canDelete ? "pointer" : "not-allowed", transition: "0.15s" }}>
            {loading ? "Deleting…" : "Delete workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ active = "Dashboard" }: { active?: string }) {
  const { profile, workspace, allWorkspaces, role, switchWorkspace, signOut } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [hoveredWs, setHoveredWs] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const navScrollRef = useRef<HTMLDivElement>(null);

  const workspaceName = workspace?.name || "No workspace";
  const userName = profile?.full_name || "User";
  const userRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";
  const initials = userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const canManage = role === "owner" || role === "admin";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDeleted = () => {
    setDeleteTarget(null);
    setDropdownOpen(false);
    if (allWorkspaces.filter(w => w.id !== deleteTarget?.id).length === 0) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
    // toast would go here
  };

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={17} /></div>
          <b>AccountPilot</b>
        </div>

        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button onClick={() => { setDropdownOpen(o => !o); setContextMenu(null); }} style={{ width: "100%", background: "transparent", border: 0, cursor: "pointer", padding: 0 }}>
            <div className="workspace">
              <div><small>WORKSPACE</small>{workspaceName}</div>
              <ChevronDown size={15} style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "0.2s" }} />
            </div>
          </button>

          {dropdownOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 12, right: 12, background: "var(--sidebar-panel)", border: "1px solid var(--sidebar-border)", borderRadius: "var(--radius-md)", zIndex: 100, overflow: "visible", boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
              {allWorkspaces.map(ws => (
                <div key={ws.id} style={{ position: "relative" }}
                  onMouseEnter={() => setHoveredWs(ws.id)}
                  onMouseLeave={() => setHoveredWs(null)}>
                  <button
                    onClick={() => { switchWorkspace(ws.id); setDropdownOpen(false); setContextMenu(null); }}
                    style={{ width: "100%", background: "transparent", border: 0, padding: "10px 36px 10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#E7E4DF", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                    <span>{ws.name}</span>
                    {workspace?.id === ws.id && <Check size={14} color="#34d399" />}
                  </button>

                  {/* Three-dot button — only for owners/admins */}
                  {canManage && (hoveredWs === ws.id || contextMenu?.id === ws.id) && (
                    <button
                      onClick={e => { e.stopPropagation(); setContextMenu(contextMenu?.id === ws.id ? null : { id: ws.id, name: ws.name }); }}
                      style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "var(--sidebar-hover)", border: 0, borderRadius: 6, width: 24, height: 24, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--sidebar-text)" }}>
                      <MoreHorizontal size={13} />
                    </button>
                  )}

                  {/* Context menu */}
                  {contextMenu?.id === ws.id && (
                    <div ref={contextRef} style={{ position: "absolute", right: -4, top: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", zIndex: 200, minWidth: 180, boxShadow: "0 8px 24px rgba(36,34,32,0.18)", overflow: "hidden" }}>
                      <button onClick={() => { setContextMenu(null); router.push(`/settings?workspace=${ws.id}`); }}
                        style={{ width: "100%", background: "transparent", border: 0, padding: "10px 14px", textAlign: "left", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer", display: "block" }}>
                        Rename workspace
                      </button>
                      <button onClick={() => { setContextMenu(null); router.push(`/settings?workspace=${ws.id}`); }}
                        style={{ width: "100%", background: "transparent", border: 0, padding: "10px 14px", textAlign: "left", fontSize: 13, color: "var(--ink-soft)", cursor: "pointer", display: "block" }}>
                        Workspace settings
                      </button>
                      <div style={{ borderTop: "1px solid var(--border-soft)", margin: "4px 0" }} />
                      <button onClick={() => { setContextMenu(null); setDeleteTarget({ id: ws.id, name: ws.name }); }}
                        style={{ width: "100%", background: "transparent", border: 0, padding: "10px 14px", textAlign: "left", fontSize: 13, color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                        <Trash2 size={13} /> Delete workspace
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ borderTop: "1px solid var(--sidebar-border)", margin: "4px 0" }} />
              <button onClick={() => { setDropdownOpen(false); router.push("/onboarding"); }}
                style={{ width: "100%", background: "transparent", border: 0, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, color: "#A99DFF", fontSize: 13, cursor: "pointer" }}>
                <Plus size={14} /> Add workspace
              </button>
            </div>
          )}
        </div>

        <div
          ref={navScrollRef}
          style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingBottom: 10 }}
        >
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {group.label && <div className="nav-label">{group.label}</div>}
              <nav className="nav">
                {group.items.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    className={active === label ? "active" : ""}
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      const scrollTop = navScrollRef.current?.scrollTop ?? 0;
                      router.push(href);
                      // Restore scroll after navigation paint
                      requestAnimationFrame(() => {
                        if (navScrollRef.current) navScrollRef.current.scrollTop = scrollTop;
                      });
                    }}
                  >
                    <Icon size={17} /><span>{label}</span>
                  </a>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <a href="#help"><CircleHelp size={17} /><span>Help & resources</span></a>
          <button type="button" onClick={() => signOut()} style={{ background: "transparent", border: 0, color: "var(--sidebar-text)", display: "flex", gap: 12, alignItems: "center", padding: "9px 12px", fontSize: 13, cursor: "pointer", width: "100%" }}>
            <LogOut size={17} /><span>Log out</span>
          </button>
          <div className="profile">
            <div className="avatar">{initials || "AP"}</div>
            <div>{userName}<span>{userRole} · {workspaceName}</span></div>
          </div>
        </div>
      </aside>

      {deleteTarget && (
        <DeleteModal workspace={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
      )}
    </>
  );
}
