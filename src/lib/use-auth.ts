import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Role = "admin" | "manager" | "cashier" | "owner" | "super_admin";
export type Business = Database["public"]["Tables"]["businesses"]["Row"];

interface AuthContextType {
  user: User | null;
  roles: Role[];
  branchId: string | null;
  business: Business | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  availableBranches: any[];
  switchBranch: (branchId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableBranches, setAvailableBranches] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async (sessionUser: User | null) => {
      if (!sessionUser) {
        if (mounted) {
          setUser(null);
          setRoles([]);
          setBranchId(null);
          setBusiness(null);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setUser(sessionUser);
      }

      try {
        const [rolesRes, profileRes] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", sessionUser.id),
          supabase
            .from("profiles")
            .select("branch_id, business_id")
            .eq("id", sessionUser.id)
            .single()
        ]);

        const targetBizId = sessionUser.user_metadata?.business_id || profileRes.data?.business_id;
        const targetBranchId = sessionUser.user_metadata?.branch_id || profileRes.data?.branch_id;

        // Auto-heal profile and role if user was invited/added with metadata
        if (sessionUser.user_metadata?.business_id && profileRes.data?.business_id !== targetBizId) {
          supabase
            .from("profiles")
            .update({ business_id: targetBizId, branch_id: targetBranchId })
            .eq("id", sessionUser.id)
            .then();
        }

        let rolesList = (rolesRes.data?.map((r) => r.role) ?? []) as Role[];
        if (rolesList.length === 0 && sessionUser.user_metadata?.role) {
          const metaRole = sessionUser.user_metadata.role as Role;
          rolesList = [metaRole];
          supabase.from("user_roles").upsert({ user_id: sessionUser.id, role: metaRole as any }).then();
        }
        setRoles(rolesList);

        if (targetBranchId) {
          setBranchId(targetBranchId);
        }

        if (targetBizId) {
          const [{ data: bData }, { data: branchesData }] = await Promise.all([
            supabase.from("businesses").select("*").eq("id", targetBizId).single(),
            supabase.from("branches").select("id, name").eq("business_id", targetBizId)
          ]);
          
          if (mounted) {
            if (bData) setBusiness(bData);
            if (branchesData) setAvailableBranches(branchesData);
          }
        }
      } catch (err) {
        console.error("Error loading user roles/profile:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      loadData(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      loadData(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const switchBranch = async (newBranchId: string) => {
    if (!user) return;
    setBranchId(newBranchId);
    await supabase.from("profiles").update({ branch_id: newBranchId }).eq("id", user.id);
    // Reload window so all cached queries are cleanly reset
    window.location.reload();
  };

  const isSuperAdmin = roles.includes("super_admin");
  const value = {
    user,
    roles,
    branchId,
    business,
    loading,
    isAdmin: roles.includes("admin") || roles.includes("owner") || isSuperAdmin,
    isManager: roles.includes("manager") || roles.includes("admin") || roles.includes("owner") || isSuperAdmin,
    isSuperAdmin,
    availableBranches,
    switchBranch
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
