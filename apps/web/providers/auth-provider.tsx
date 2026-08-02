"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

interface Workspace {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  company_size?: string;
  country?: string;
  logo_url?: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  workspace: Workspace | null;
  allWorkspaces: Workspace[];
  role: string | null;
  loading: boolean;
  switchWorkspace: (id: string) => void;
  refreshWorkspace: () => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, workspace: null, allWorkspaces: [],
  role: null, loading: true,
  switchWorkspace: () => {},
  refreshWorkspace: async () => {},
  deleteWorkspace: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchUserData = async (currentUser: User) => {
    try {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", currentUser.id)
        .limit(1);

      if (profileError) {
        console.warn("Profile lookup skipped:", profileError.message);
      }

      const profileData = profileRows?.[0] ?? null;

      setProfile(
        profileData ?? {
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "User",
        }
      );

      const { data: memberships, error: membershipsError } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces(*)")
        .eq("user_id", currentUser.id);

      if (membershipsError) {
        console.warn("Workspace lookup skipped:", membershipsError.message);
        setAllWorkspaces([]);
        setWorkspace(null);
        setRole(null);
        return;
      }

      if (memberships && memberships.length > 0) {
        const workspaceList = memberships.map((m: any) => m.workspaces as Workspace).filter((item: Workspace | null | undefined): item is Workspace => Boolean(item));
        setAllWorkspaces(workspaceList);

        // Use saved workspace or default to first
        const savedId = typeof window !== "undefined" ? localStorage.getItem("activeWorkspaceId") : null;
        const active = workspaceList.find((w: Workspace) => w.id === savedId) ?? workspaceList[0];
        setWorkspace(active);
        setRole(memberships.find((m: any) => m.workspace_id === active.id)?.role ?? null);
      } else {
        setAllWorkspaces([]);
        setWorkspace(null);
        setRole(null);
      }
    } catch (err) {
      console.warn("Auth data lookup skipped:", err);
    }
  };

  const switchWorkspace = (id: string) => {
    const found = allWorkspaces.find((w: Workspace) => w.id === id);
    if (found) {
      setWorkspace(found);
      if (typeof window !== "undefined") localStorage.setItem("activeWorkspaceId", id);
    }
  };

  const refreshWorkspace = async () => { if (user) await fetchUserData(user); };

  const deleteWorkspace = async (id: string) => {
    const { error } = await supabase.rpc("delete_workspace", { p_workspace_id: id });
    if (error) throw new Error(error.message);
    const remaining = allWorkspaces.filter((w: Workspace) => w.id !== id);
    setAllWorkspaces(remaining);
    if (workspace?.id === id) {
      const next = remaining[0] ?? null;
      setWorkspace(next);
      setRole(null);
      if (typeof window !== "undefined") {
        if (next) localStorage.setItem("activeWorkspaceId", next.id);
        else localStorage.removeItem("activeWorkspaceId");
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) await fetchUserData(s.user);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, s: Session | null) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) await fetchUserData(s.user);
      else { setProfile(null); setAllWorkspaces([]); setWorkspace(null); setRole(null); }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setSession(null); setProfile(null); setAllWorkspaces([]); setWorkspace(null); setRole(null);
    if (typeof window !== "undefined") localStorage.removeItem("activeWorkspaceId");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, workspace, allWorkspaces, role, loading, switchWorkspace, refreshWorkspace, deleteWorkspace, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);




