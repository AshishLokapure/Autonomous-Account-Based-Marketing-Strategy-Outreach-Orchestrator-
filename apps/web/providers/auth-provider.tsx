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

interface WorkspaceMember {
  workspace_id: string;
  role: string;
  workspaces: Workspace;
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
  role: string | null;
  loading: boolean;
  refreshWorkspace: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  workspace: null,
  role: null,
  loading: true,
  refreshWorkspace: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchUserData = async (currentUser: User) => {
    try {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile({
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "User",
        });
      }

      // Fetch Workspace Membership
      const { data: memberData } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, workspaces(*)")
        .eq("user_id", currentUser.id)
        .limit(1)
        .maybeSingle();

      if (memberData && memberData.workspaces) {
        setWorkspace(memberData.workspaces as unknown as Workspace);
        setRole(memberData.role);
      } else {
        setWorkspace(null);
        setRole(null);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  const refreshWorkspace = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchUserData(currentSession.user);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchUserData(newSession.user);
      } else {
        setProfile(null);
        setWorkspace(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setWorkspace(null);
    setRole(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        workspace,
        role,
        loading,
        refreshWorkspace,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
