import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Clock, ArrowLeft, LogOut, Building2, UserCheck, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function SupportSessionBanner() {
  const { user, business, isSuperAdmin, isSupportMode, supportSession, endSupportSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [ending, setEnding] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isSupportMode || !supportSession) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isSupportMode, supportSession]);

  if (!isSuperAdmin || !isSupportMode || !supportSession) {
    return null;
  }

  const expiresMs = new Date(supportSession.expires_at).getTime();
  const remainingMs = Math.max(0, expiresMs - nowMs);
  const isExpiringSoon = remainingMs <= 5 * 60 * 1000;
  const startedTimeStr = new Date(supportSession.started_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const businessName = business?.business_name || supportSession.target_business_name;
  const businessId = supportSession.target_business_id;
  const adminEmail = user?.email || supportSession.super_admin_email;
  const onSuperAdminPage = location.pathname.startsWith("/super-admin");

  const handleReturnToSuperAdmin = () => {
    navigate({ to: "/super-admin" });
  };

  const handleResumeDashboard = () => {
    navigate({ to: "/dashboard" });
  };

  const handleEndSession = async () => {
    setEnding(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await endSupportSession();
      toast.success(`Ended support session for ${businessName}`);
      navigate({ to: "/super-admin" });
    } catch (err: any) {
      toast.error(err.message || "Failed to end support session");
    } finally {
      setEnding(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Super Admin Support Mode Toolbar"
      data-testid="support-session-banner"
      className="no-print print:hidden w-full border-b border-indigo-500/30 bg-slate-950 text-slate-100 px-3 py-2 sm:px-6 shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 px-2.5 py-0.5 font-bold text-[11px] uppercase tracking-wider text-indigo-200 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            Support Mode Active
          </span>

          <span className="inline-flex items-center gap-1.5 font-semibold text-white min-w-0">
            <Building2 className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
            <span className="truncate max-w-[180px] sm:max-w-[260px]" title={businessName}>
              {businessName}
            </span>
            <code
              className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700"
              title={`Business ID: ${businessId}`}
            >
              ID: {businessId.slice(0, 8)}
            </code>
          </span>

          <span className="hidden md:inline-flex items-center gap-1 text-slate-300">
            <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Admin:</span>
            <strong className="text-slate-100 font-medium">{adminEmail}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <Clock className={`h-3.5 w-3.5 shrink-0 ${isExpiringSoon ? "text-amber-400 animate-pulse" : "text-slate-400"}`} />
            <span className="hidden sm:inline">Started {startedTimeStr} •</span>
            <span
              data-testid="support-session-remaining"
              className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                isExpiringSoon
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-800 text-emerald-300 border border-slate-700"
              }`}
            >
              {formatRemaining(remainingMs)} left
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSuperAdminPage ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleResumeDashboard}
              className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 cursor-pointer"
            >
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              Open Active Dashboard
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleReturnToSuperAdmin}
              className="h-7 px-2.5 text-xs bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Return to Super Admin
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={ending}
            onClick={handleEndSession}
            className="h-7 px-2.5 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            {ending ? "Ending..." : "End Support Session"}
          </Button>
        </div>
      </div>
    </div>
  );
}
