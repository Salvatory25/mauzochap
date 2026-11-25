import { supabase } from "@/integrations/supabase/client";

export type SupportSessionStatus = "active" | "ended" | "expired" | "revoked";

export interface SupportSession {
  session_id: string;
  super_admin_id: string;
  super_admin_email: string;
  target_business_id: string;
  target_business_name: string;
  target_owner_id: string | null;
  active_branch_id: string | null;
  reason: string | null;
  started_at: string;
  expires_at: string;
  status: SupportSessionStatus;
}

export interface SupportSessionRow {
  id: string;
  super_admin_id: string;
  super_admin_email: string;
  target_business_id: string;
  target_business_name: string;
  target_owner_id: string | null;
  active_branch_id: string | null;
  status: SupportSessionStatus;
  reason: string | null;
  started_at: string;
  expires_at: string;
  last_activity_at: string;
  ended_at: string | null;
}

export interface SupportAuditLogRow {
  id: string;
  session_id: string | null;
  super_admin_id: string;
  super_admin_email: string;
  business_id: string;
  business_name: string;
  action: string;
  module: string;
  record_id: string | null;
  result: string;
  metadata: Record<string, any>;
  created_at: string;
}

export function isSupportMigrationMissingError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  const message = String(error.message || error.details || "").toLowerCase();
  return (
    code === "PGRST202" ||
    code === "42883" ||
    code === "42P01" ||
    message.includes("could not find the function") ||
    message.includes("start_super_admin_support_session") ||
    message.includes("super_admin_support_sessions") ||
    message.includes("does not exist")
  );
}

export function isSupportSessionActive(session: SupportSession | null | undefined): boolean {
  if (!session || session.status !== "active" || !session.expires_at) {
    return false;
  }
  return new Date(session.expires_at).getTime() > Date.now();
}

export async function getCurrentSupportSessionRpc(): Promise<SupportSession | null> {
  try {
    const rpcFn = (supabase as any)?.rpc;
    if (typeof rpcFn !== "function") return null;

    const { data, error } = await (supabase as any).rpc(
      "get_current_super_admin_support_session",
    );
    if (error || !data) return null;

    const session = data as SupportSession;
    if (!session.session_id || !session.target_business_id) return null;
    if (!isSupportSessionActive(session)) return null;

    return session;
  } catch {
    return null;
  }
}

export async function startSupportSessionRpc(
  targetBusinessId: string,
  reason?: string,
  durationMinutes: number = 60,
): Promise<SupportSession> {
  const rpcFn = (supabase as any)?.rpc;
  if (typeof rpcFn !== "function") {
    throw new Error("Support session backend RPC is unavailable.");
  }

  const { data, error } = await (supabase as any).rpc(
    "start_super_admin_support_session",
    {
      _target_business_id: targetBusinessId,
      _reason: reason?.trim() || null,
      _duration_minutes: durationMinutes,
    },
  );

  if (error) {
    if (isSupportMigrationMissingError(error)) {
      throw new Error(
        "Database migration required: Apply 20261125000000_super_admin_support_access.sql to Supabase before starting a support session.",
      );
    }
    throw new Error(error.message || "Failed to initiate support session.");
  }

  if (!data || !data.session_id || !data.target_business_id) {
    throw new Error("Invalid support session response from server.");
  }

  return data as SupportSession;
}

export async function switchSupportBranchRpc(
  sessionId: string,
  branchId: string,
): Promise<void> {
  const rpcFn = (supabase as any)?.rpc;
  if (typeof rpcFn !== "function") {
    throw new Error("Support branch switch RPC is unavailable.");
  }

  const { error } = await (supabase as any).rpc("switch_support_session_branch", {
    _session_id: sessionId,
    _branch_id: branchId,
  });

  if (error) {
    throw new Error(error.message || "Failed to switch support branch.");
  }
}

export async function endSupportSessionRpc(sessionId?: string | null): Promise<void> {
  const rpcFn = (supabase as any)?.rpc;
  if (typeof rpcFn !== "function") return;

  const { error } = await (supabase as any).rpc(
    "end_super_admin_support_session",
    {
      _session_id: sessionId || null,
    },
  );

  if (error && !isSupportMigrationMissingError(error)) {
    throw new Error(error.message || "Failed to end support session.");
  }
}

export async function recordSupportAuditEventRpc(
  sessionId: string,
  action: string,
  module: string,
  recordId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const rpcFn = (supabase as any)?.rpc;
    if (typeof rpcFn !== "function" || !sessionId) return;

    await (supabase as any).rpc("record_support_audit_event", {
      _session_id: sessionId,
      _action: action,
      _module: module,
      _record_id: recordId || null,
      _metadata: metadata || {},
    });
  } catch {
    // Non-blocking UI telemetry; database mutations are independently audited via PostgreSQL triggers
  }
}

export async function updateSupportBusinessSettingsRpc(
  sessionId: string,
  payload: {
    businessName: string;
    ownerName: string;
    phone?: string | null;
  },
): Promise<void> {
  const rpcFn = (supabase as any)?.rpc;
  if (typeof rpcFn !== "function") {
    throw new Error("Support settings update RPC is unavailable.");
  }

  const { error } = await (supabase as any).rpc(
    "support_update_business_settings",
    {
      _session_id: sessionId,
      _business_name: payload.businessName,
      _owner_name: payload.ownerName,
      _phone: payload.phone || null,
    },
  );

  if (error) {
    throw new Error(error.message || "Failed to update customer business settings.");
  }
}
