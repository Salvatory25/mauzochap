import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import {
  endSupportSessionRpc,
  isSupportMigrationMissingError,
  type SupportAuditLogRow,
  type SupportSessionRow,
} from "@/lib/support-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  LogOut,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

function formatDuration(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatActionLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function SupportActivityLogsTab({
  businesses = [],
}: {
  businesses?: Array<{ id: string; business_name: string }>;
}) {
  const { isSuperAdmin, supportSession, refreshSupportSession } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["super-admin-support-activity"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const [sessionsRes, logsRes] = await Promise.all([
        (supabase as any)
          .from("super_admin_support_sessions")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(200),
        (supabase as any)
          .from("super_admin_support_audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (sessionsRes.error) {
        if (isSupportMigrationMissingError(sessionsRes.error)) {
          return {
            migrationPending: true,
            sessions: [] as SupportSessionRow[],
            logs: [] as SupportAuditLogRow[],
          };
        }
        throw sessionsRes.error;
      }

      if (logsRes.error && !isSupportMigrationMissingError(logsRes.error)) {
        throw logsRes.error;
      }

      return {
        migrationPending: false,
        sessions: (sessionsRes.data || []) as SupportSessionRow[],
        logs: (logsRes.data || []) as SupportAuditLogRow[],
      };
    },
  });

  const sessions = data?.sessions || [];
  const logs = data?.logs || [];

  const logsBySession = useMemo(() => {
    const map = new Map<string, SupportAuditLogRow[]>();
    for (const log of logs) {
      if (!log.session_id) continue;
      const bucket = map.get(log.session_id) || [];
      bucket.push(log);
      map.set(log.session_id, bucket);
    }
    return map;
  }, [logs]);

  const uniqueAdmins = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      if (s.super_admin_email) set.add(s.super_admin_email);
    });
    return Array.from(set);
  }, [sessions]);

  const uniqueModules = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      const sessionLogs = logsBySession.get(s.id) || [];
      const effectiveStatus =
        s.status === "active" && new Date(s.expires_at).getTime() <= Date.now()
          ? "expired"
          : s.status;

      if (businessFilter !== "all" && s.target_business_id !== businessFilter) {
        return false;
      }
      if (adminFilter !== "all" && s.super_admin_email !== adminFilter) {
        return false;
      }
      if (statusFilter !== "all" && effectiveStatus !== statusFilter) {
        return false;
      }
      if (dateFilter) {
        const startedDate = new Date(s.started_at).toISOString().slice(0, 10);
        if (startedDate !== dateFilter) return false;
      }
      if (moduleFilter !== "all") {
        const hasModule = sessionLogs.some(
          (l) => l.module === moduleFilter || l.action.toLowerCase().includes(moduleFilter.toLowerCase()),
        );
        if (!hasModule) return false;
      }
      if (q) {
        const matchesSession =
          s.target_business_name.toLowerCase().includes(q) ||
          s.target_business_id.toLowerCase().includes(q) ||
          s.super_admin_email.toLowerCase().includes(q) ||
          (s.reason || "").toLowerCase().includes(q);
        const matchesLogs = sessionLogs.some(
          (l) =>
            l.action.toLowerCase().includes(q) ||
            l.module.toLowerCase().includes(q) ||
            (l.record_id || "").toLowerCase().includes(q),
        );
        if (!matchesSession && !matchesLogs) return false;
      }
      return true;
    });
  }, [
    sessions,
    logsBySession,
    businessFilter,
    adminFilter,
    statusFilter,
    dateFilter,
    moduleFilter,
    search,
  ]);

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId);
    try {
      await endSupportSessionRpc(sessionId);
      if (supportSession?.session_id === sessionId) {
        await qc.cancelQueries();
        qc.clear();
        await refreshSupportSession?.();
      }
      toast.success("Support session terminated");
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to terminate session");
    } finally {
      setTerminatingId(null);
    }
  };

  if (data?.migrationPending) {
    return (
      <div
        data-testid="support-logs-migration-notice"
        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-2 text-sm"
      >
        <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>Support Audit Schema Not Yet Deployed</span>
        </div>
        <p className="text-muted-foreground">
          Apply migration{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
            supabase/migrations/20261125000000_super_admin_support_access.sql
          </code>{" "}
          to your Supabase database to activate server-side support sessions and immutable audit logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="support-activity-logs-tab">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Support Activity & Immutable Audit Trail</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Append-only internal log of every Super Admin support session, module access, and operational record change.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 text-xs self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh Logs
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              aria-label="Search support logs"
              placeholder="Search business, ID, admin, action, record..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            aria-label="Filter by business"
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
          >
            <option value="all">All Businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.business_name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by administrator"
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
          >
            <option value="all">All Administrators</option>
            {uniqueAdmins.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by module or action"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
          >
            <option value="all">All Modules & Actions</option>
            {uniqueModules.map((mod) => (
              <option key={mod} value={mod}>
                {mod.toUpperCase()}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Filter by session status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="expired">Expired</option>
            </select>
            <Input
              aria-label="Filter by date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 text-xs px-2"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading support sessions and audit trail...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No support sessions match the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((sess) => {
            const sessionLogs = logsBySession.get(sess.id) || [];
            const affectedModules = Array.from(
              new Set(sessionLogs.map((l) => l.module).filter(Boolean)),
            );
            const effectiveStatus =
              sess.status === "active" && new Date(sess.expires_at).getTime() <= Date.now()
                ? "expired"
                : sess.status;
            const isExpanded = expandedSessionId === sess.id;

            return (
              <div
                key={sess.id}
                data-testid={`support-session-row-${sess.id}`}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {sess.target_business_name}
                      </span>
                      <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
                        {sess.target_business_id.slice(0, 8)}
                      </code>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          effectiveStatus === "active"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : effectiveStatus === "expired"
                              ? "bg-amber-500/15 text-amber-600"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {effectiveStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        Admin: <strong className="text-foreground">{sess.super_admin_email}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(sess.started_at).toLocaleString()}
                      </span>
                      <span>
                        Duration:{" "}
                        <strong className="text-foreground">
                          {formatDuration(sess.started_at, sess.ended_at)}
                        </strong>
                      </span>
                      <span>
                        Activities: <strong className="text-foreground">{sessionLogs.length}</strong>
                      </span>
                    </div>

                    {sess.reason && (
                      <div className="text-xs text-muted-foreground">
                        Reason: <span className="italic text-foreground/90">{sess.reason}</span>
                      </div>
                    )}

                    {affectedModules.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {affectedModules.map((mod) => (
                          <span
                            key={mod}
                            className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {effectiveStatus === "active" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={terminatingId === sess.id}
                        onClick={() => handleTerminateSession(sess.id)}
                        className="h-8 text-xs"
                      >
                        <LogOut className="h-3.5 w-3.5 mr-1.5" />
                        {terminatingId === sess.id ? "Ending..." : "End Session"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedSessionId(isExpanded ? null : sess.id)}
                      className="h-8 text-xs"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5 mr-1" /> Hide Activities
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5 mr-1" /> View Activities ({sessionLogs.length})
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3 overflow-x-auto">
                    {sessionLogs.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        No detailed events recorded for this session.
                      </p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                          <tr>
                            <th className="py-2 pr-3 text-left">Timestamp</th>
                            <th className="py-2 px-3 text-left">Module</th>
                            <th className="py-2 px-3 text-left">Action Performed</th>
                            <th className="py-2 px-3 text-left">Record ID</th>
                            <th className="py-2 px-3 text-left">Result</th>
                            <th className="py-2 pl-3 text-left">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {sessionLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold uppercase">
                                  {log.module}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                                {formatActionLabel(log.action)}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                {log.record_id ? log.record_id.slice(0, 12) : "—"}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span className="text-[10px] font-bold uppercase text-emerald-600">
                                  {log.result}
                                </span>
                              </td>
                              <td className="py-2 pl-3 text-muted-foreground max-w-xs truncate">
                                {log.metadata && Object.keys(log.metadata).length > 0
                                  ? JSON.stringify(log.metadata)
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
