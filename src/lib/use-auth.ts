import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rememberMerchantPhone } from "@/lib/merchant-phone-sync";
import {
  endSupportSessionRpc,
  getCurrentSupportSessionRpc,
  isSupportSessionActive,
  startSupportSessionRpc,
  switchSupportBranchRpc,
  type SupportSession,
} from "@/lib/support-session";
import { toast } from "sonner";

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
  isSupportMode: boolean;
  supportSession: SupportSession | null;
  availableBranches: any[];
  switchBranch: (branchId: string) => Promise<void>;
  startSupportSession: (
    targetBusinessId: string,
    reason?: string,
    durationMinutes?: number,
  ) => Promise<SupportSession>;
  endSupportSession: () => Promise<void>;
  refreshSupportSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableBranches, setAvailableBranches] = useState<any[]>([]);
  const [supportSession, setSupportSession] = useState<SupportSession | null>(null);
  const mountedRef = useRef(true);

  const loadData = useCallback(async (sessionUser: User | null) => {
    if (!sessionUser) {
      if (mountedRef.current) {
        setUser(null);
        setRoles([]);
        setBranchId(null);
        setBusiness(null);
        setAvailableBranches([]);
        setSupportSession(null);
        setLoading(false);
      }
      return;
    }

    if (mountedRef.current) {
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
          .select("branch_id, business_id, phone, full_name")
          .eq("id", sessionUser.id)
          .single(),
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

      if (mountedRef.current) {
        setRoles(rolesList);
      }

      // Check for active server-authorized Super Admin support session
      if (rolesList.includes("super_admin")) {
        const activeSupport = await getCurrentSupportSessionRpc();
        if (activeSupport && isSupportSessionActive(activeSupport)) {
          const [{ data: supportBiz }, { data: supportBranches }] = await Promise.all([
            supabase
              .from("businesses")
              .select("*")
              .eq("id", activeSupport.target_business_id)
              .single(),
            supabase
              .from("branches")
              .select("id, name")
              .eq("business_id", activeSupport.target_business_id),
          ]);

          if (mountedRef.current) {
            const branchesArr = supportBranches || [];
            const resolvedBranch =
              activeSupport.active_branch_id || branchesArr[0]?.id || null;
            setSupportSession({
              ...activeSupport,
              active_branch_id: resolvedBranch,
            });
            setBusiness(supportBiz ?? null);
            setAvailableBranches(branchesArr);
            setBranchId(resolvedBranch);
          }
          return;
        } else if (mountedRef.current) {
          setSupportSession(null);
        }
      } else if (mountedRef.current) {
        setSupportSession(null);
      }

      if (mountedRef.current) {
        setBranchId(targetBranchId ?? null);
      }

      if (targetBizId) {
        const [{ data: bData }, { data: branchesData }] = await Promise.all([
          supabase.from("businesses").select("*").eq("id", targetBizId).single(),
          supabase.from("branches").select("id, name").eq("business_id", targetBizId),
        ]);

        if (mountedRef.current) {
          const metaPhone = (sessionUser.user_metadata?.phone || (profileRes.data as any)?.phone || "").trim();
          if (metaPhone) {
            rememberMerchantPhone({
              email: sessionUser.email,
              phone: metaPhone,
              businessId: targetBizId,
              businessName: bData?.business_name,
              ownerName: sessionUser.user_metadata?.full_name || (profileRes.data as any)?.full_name,
            });

            if (!(profileRes.data as any)?.phone) {
              supabase.from("profiles").update({ phone: metaPhone }).eq("id", sessionUser.id).then();
            }
          }

          if (bData) {
            if (!bData.phone && metaPhone) {
              bData.phone = metaPhone;
              const bizTable = supabase.from("businesses") as any;
              bizTable.update?.({ phone: metaPhone })?.eq?.("id", bData.id)?.then?.();
            }
            setBusiness(bData);
          } else {
            setBusiness(null);
          }
          setAvailableBranches(branchesData ?? []);
        }
      } else if (mountedRef.current) {
        setBusiness(null);
        setAvailableBranches([]);
      }
    } catch (err) {
      console.error("Error loading user roles/profile:", err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getSession().then(({ data }) => {
      loadData(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      loadData(session?.user ?? null);
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, [loadData]);

  // Automatic support session expiration monitor
  useEffect(() => {
    if (!supportSession || !user) return;

    const handleExpired = async () => {
      await getCurrentSupportSessionRpc();
      if (mountedRef.current) {
        setSupportSession(null);
      }
      await loadData(user);
      toast.warning("Support session expired. Returned to Super Admin console.");
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/super-admin")) {
        window.location.assign("/super-admin");
      }
    };

    const remainingMs = new Date(supportSession.expires_at).getTime() - Date.now();
    if (remainingMs <= 0) {
      void handleExpired();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void handleExpired();
    }, Math.min(remainingMs + 250, 2_147_483_647));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [supportSession, user, loadData]);

  const startSupportSession = useCallback(
    async (
      targetBusinessId: string,
      reason?: string,
      durationMinutes: number = 60,
    ): Promise<SupportSession> => {
      if (!user || !roles.includes("super_admin")) {
        throw new Error("Unauthorized: Super Admin privileges required.");
      }

      const session = await startSupportSessionRpc(
        targetBusinessId,
        reason,
        durationMinutes,
      );

      const [{ data: bData }, { data: branchesData }] = await Promise.all([
        supabase.from("businesses").select("*").eq("id", session.target_business_id).single(),
        supabase.from("branches").select("id, name").eq("business_id", session.target_business_id),
      ]);

      const branchesArr = branchesData || [];
      const resolvedBranch = session.active_branch_id || branchesArr[0]?.id || null;
      const hydratedSession: SupportSession = {
        ...session,
        active_branch_id: resolvedBranch,
      };

      if (mountedRef.current) {
        setSupportSession(hydratedSession);
        setBusiness(bData ?? null);
        setAvailableBranches(branchesArr);
        setBranchId(resolvedBranch);
      }

      return hydratedSession;
    },
    [user, roles],
  );

  const endSupportSession = useCallback(async () => {
    if (!user) return;
    await endSupportSessionRpc(supportSession?.session_id);
    if (mountedRef.current) {
      setSupportSession(null);
    }
    await loadData(user);
  }, [user, supportSession, loadData]);

  const refreshSupportSession = useCallback(async () => {
    if (!user) return;
    await loadData(user);
  }, [user, loadData]);

  const isSuperAdmin = roles.includes("super_admin");
  const isSupportMode = isSuperAdmin && isSupportSessionActive(supportSession);

  const switchBranch = async (newBranchId: string) => {
    if (!user) return;
    if (isSupportMode && supportSession) {
      await switchSupportBranchRpc(supportSession.session_id, newBranchId);
      setBranchId(newBranchId);
      setSupportSession((prev) =>
        prev ? { ...prev, active_branch_id: newBranchId } : null,
      );
      window.location.reload();
      return;
    }

    setBranchId(newBranchId);
    await supabase.from("profiles").update({ branch_id: newBranchId }).eq("id", user.id);
    // Reload window so all cached queries are cleanly reset
    window.location.reload();
  };

  const value: AuthContextType = {
    user,
    roles,
    branchId,
    business,
    loading,
    isAdmin: roles.includes("admin") || roles.includes("owner") || isSuperAdmin,
    isManager: roles.includes("manager") || roles.includes("admin") || roles.includes("owner") || isSuperAdmin,
    isSuperAdmin,
    isSupportMode,
    supportSession: isSupportMode ? supportSession : null,
    availableBranches,
    switchBranch,
    startSupportSession,
    endSupportSession,
    refreshSupportSession,
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
