import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldAlert, Building2, CreditCard, Activity, CheckCircle2, XCircle, Clock, MessageSquare, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { sendEmail } from "@/lib/email";

export const Route = createFileRoute("/_authenticated/super-admin")({
  component: SuperAdminDashboard,
});

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

function SuperAdminDashboard() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"businesses" | "payments">("businesses");

  const [bPage, setBPage] = useState(1);
  const [pPage, setPPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const { data: businesses = [], isLoading: bLoading } = useQuery({
    queryKey: ["super-admin-businesses"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*, payments(id, payment_reference, verification_status, amount, created_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: payments = [], isLoading: pLoading } = useQuery({
    queryKey: ["super-admin-payments"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*, businesses(business_name, email, package)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  if (!isSuperAdmin) {
    return <div className="p-8 text-center text-muted-foreground">Unauthorized. Super Admin access required.</div>;
  }

  const handleUpdateBusinessStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("businesses").update({ account_status: status as any }).eq("id", id);
      if (error) throw error;
      toast.success(`Business marked as ${status}`);
      qc.invalidateQueries({ queryKey: ["super-admin-businesses"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteBusiness = async (id: string, name: string) => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete the business "${name}" and all of its data? This action cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await supabase.from("businesses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Business permanently deleted");
      qc.invalidateQueries({ queryKey: ["super-admin-businesses"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete business");
    }
  };

  const handleApprovePayment = async (paymentId: string, businessId: string, pkg: string, clientEmail: string, businessName: string) => {
    try {
      // 1. Mark payment as paid
      const { error: pErr } = await supabase.from("payments").update({ verification_status: "paid" }).eq("id", paymentId);
      if (pErr) throw pErr;

      // 2. Calculate expiry date (30 days for Kilimanjaro and Serengeti monthly plans)
      const days = 30;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);

      // 3. Update business package, status to approved, set expiry and clear rejection reason
      const { error: bErr } = await supabase.from("businesses").update({
        account_status: "approved",
        package: pkg as any,
        expiry_date: expiry.toISOString().split("T")[0],
        rejection_reason: null as any
      }).eq("id", businessId);

      if (bErr) throw bErr;

      // 4. In-app notification
      await supabase.from("notifications" as any).insert({
        business_id: businessId,
        title: "Subscription Activated",
        message: `Your subscription to ${pkg.toUpperCase()} has been successfully activated. Expiry Date: ${expiry.toLocaleDateString()}`,
        type: "subscription"
      });

      // 5. Send email notification to client
      sendEmail({
        to: clientEmail || "client@mauzochap.com",
        subject: "MauzoChap POS Subscription Activated!",
        body: `Dear Client,\n\nWe have successfully verified your payment reference. Your subscription to the ${pkg.toUpperCase()} plan is now active!\n\nSubscription Details:\n- Business Name: ${businessName}\n- Validity Period: 30 Days\n- Expiry Date: ${expiry.toLocaleDateString()}\n\nYou can now access all business features according to your plan.\n\nThank you for choosing MauzoChap POS!\n\nBest regards,\nMauzoChap Team`
      });

      toast.success("Payment verified and subscription activated!");
      qc.invalidateQueries({ queryKey: ["super-admin-payments"] });
      qc.invalidateQueries({ queryKey: ["super-admin-businesses"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRejectPayment = async (paymentId: string, businessId: string, clientEmail: string, businessName: string) => {
    const reason = window.prompt(
      "Enter the reason for rejecting this payment:",
      "Payment reference could not be verified. Please check your transaction reference and submit the correct reference."
    );
    if (reason === null) return; // User cancelled

    try {
      // 1. Mark payment as rejected
      const { error: pErr } = await supabase.from("payments").update({
        verification_status: "rejected" as any,
        rejection_reason: reason as any
      } as any).eq("id", paymentId);
      if (pErr) throw pErr;

      // 2. Set business account status to rejected and update rejection reason
      const { error: bErr } = await supabase.from("businesses").update({
        account_status: "rejected",
        rejection_reason: reason as any
      }).eq("id", businessId);
      if (bErr) throw bErr;

      // 3. Notify the customer in-app
      await supabase.from("notifications" as any).insert({
        business_id: businessId,
        title: "Payment Verification Rejected",
        message: `Your payment reference was rejected. Reason: ${reason}`,
        type: "payment"
      });

      // 4. Send email notification to client
      sendEmail({
        to: clientEmail || "client@mauzochap.com",
        subject: "MauzoChap POS Payment Verification Rejected",
        body: `Dear Client,\n\nWe were unable to verify your payment reference for the subscription. Below are the details:\n\n- Business Name: ${businessName}\n- Rejection Reason: ${reason}\n\nPlease log back in to MauzoChap POS, go to the Billing section, and resubmit your payment with the correct reference number.\n\nIf you believe this is an error, please contact support.\n\nBest regards,\nMauzoChap Team`
      });

      toast.success("Payment rejected and client notified.");
      qc.invalidateQueries({ queryKey: ["super-admin-payments"] });
      qc.invalidateQueries({ queryKey: ["super-admin-businesses"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalRevenue = payments.filter(p => p.verification_status === "paid").reduce((acc, curr) => acc + Number(curr.amount), 0);
  const activeSubs = businesses.filter(b => b.account_status === "approved").length;
  const pendingApprovals = businesses.filter(b => b.account_status === "pending").length;
  const expiringSoon = businesses.filter(b => {
    if (b.account_status !== "approved" || !b.expiry_date) return false;
    const daysLeft = Math.ceil((new Date(b.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysLeft > 0 && daysLeft <= 5;
  }).length;

  const totalBPages = Math.ceil(businesses.length / ITEMS_PER_PAGE);
  const paginatedBusinesses = businesses.slice((bPage - 1) * ITEMS_PER_PAGE, bPage * ITEMS_PER_PAGE);

  const totalPPages = Math.ceil(payments.length / ITEMS_PER_PAGE);
  const paginatedPayments = payments.slice((pPage - 1) * ITEMS_PER_PAGE, pPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center tracking-tight">
          <ShieldAlert className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-primary shrink-0" />
          <span>Super Admin Dashboard</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage tenants, subscriptions, and verify payments.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4">
        <div className="bg-card border border-border p-3 sm:p-5 rounded-xl shadow-sm min-w-0">
          <div className="text-muted-foreground text-xs sm:text-sm font-medium mb-1 flex items-center"><Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" /> <span className="truncate">Businesses</span></div>
          <div className="text-xl sm:text-3xl font-bold">{businesses.length}</div>
        </div>
        <div className="bg-card border border-border p-3 sm:p-5 rounded-xl shadow-sm min-w-0">
          <div className="text-muted-foreground text-xs sm:text-sm font-medium mb-1 flex items-center"><Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" /> <span className="truncate">Active Subs</span></div>
          <div className="text-xl sm:text-3xl font-bold text-success">{activeSubs}</div>
        </div>
        <div className="bg-card border border-border p-3 sm:p-5 rounded-xl shadow-sm min-w-0">
          <div className="text-muted-foreground text-xs sm:text-sm font-medium mb-1 flex items-center"><Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" /> <span className="truncate">Pending</span></div>
          <div className="text-xl sm:text-3xl font-bold text-amber-500">{pendingApprovals}</div>
        </div>
        <div className="bg-card border border-border p-3 sm:p-5 rounded-xl shadow-sm min-w-0">
          <div className="text-muted-foreground text-xs sm:text-sm font-medium mb-1 flex items-center"><Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 text-amber-600 shrink-0" /> <span className="truncate">Expiring Soon</span></div>
          <div className="text-xl sm:text-3xl font-bold text-amber-600">{expiringSoon}</div>
        </div>
        <div className="bg-card border border-border p-3 sm:p-5 rounded-xl shadow-sm col-span-2 sm:col-span-1 min-w-0">
          <div className="text-muted-foreground text-xs sm:text-sm font-medium mb-1 flex items-center"><CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 shrink-0" /> <span className="truncate">Total Revenue</span></div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{totalRevenue.toLocaleString()} <span className="text-xs sm:text-sm font-normal text-muted-foreground">TZS</span></div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border mb-4 overflow-x-auto no-scrollbar gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("businesses")}
            className={`px-3.5 sm:px-4 py-2 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "businesses" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Businesses ({businesses.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-3.5 sm:px-4 py-2 font-medium text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === "payments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Payments & Verifications ({payments.length})
          </button>
        </div>

        <Link
          to="/sms"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors shrink-0 mb-1"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>SMS & Ujumbe Console</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </Link>
      </div>

      {activeTab === "businesses" && (
        <>
          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {bLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading businesses...</div>
            ) : paginatedBusinesses.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No businesses registered yet.</div>
            ) : (
              paginatedBusinesses.map((b) => {
                const latestP = b.payments?.[0];
                const daysLeft = b.expiry_date ? Math.ceil((new Date(b.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 5;
                const isExpired = daysLeft !== null && daysLeft <= 0;

                return (
                  <div key={b.id} className="rounded-xl border border-border bg-card p-3.5 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm sm:text-base text-foreground truncate">{b.business_name}</div>
                        <div className="text-xs text-muted-foreground">{b.owner_name}</div>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${b.account_status === "approved" ? "bg-success/15 text-success" :
                          b.account_status === "pending" ? "bg-amber-500/15 text-amber-600" : "bg-destructive/15 text-destructive"
                        }`}>
                        {b.account_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase">Contact</span>
                        <span className="truncate block font-medium">{b.email}</span>
                        <span className="text-muted-foreground truncate block">{b.phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase">Plan & Expiry</span>
                        <span className="font-bold text-primary uppercase text-[11px] block">{b.package || "N/A"}</span>
                        {b.expiry_date ? (
                          <span className={`text-[11px] font-semibold block ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-amber-500' : 'text-foreground'}`}>
                            {new Date(b.expiry_date).toLocaleDateString()}
                            {isExpiringSoon && ` (${daysLeft}d)`}
                            {isExpired && ` (Exp)`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">No expiry</span>
                        )}
                      </div>
                    </div>

                    {latestP?.payment_reference && (
                      <div className="bg-muted/60 p-2 rounded-lg text-xs flex items-center justify-between">
                        <span className="text-muted-foreground text-[10px] uppercase">Payment Ref:</span>
                        <span className="font-mono font-bold">{latestP.payment_reference}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                      {b.account_status !== "approved" && latestP && (
                        <Button
                          size="sm"
                          className="flex-1 bg-primary text-primary-foreground font-bold h-8 text-xs"
                          onClick={() => handleApprovePayment(latestP.id, b.id, b.package || "kilimanjaro", b.email, b.business_name)}
                        >
                          Verify & Activate
                        </Button>
                      )}
                      {b.account_status !== "approved" && !latestP && (
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleUpdateBusinessStatus(b.id, "approved")}>Approve</Button>
                      )}
                      {b.account_status !== "suspended" && (
                        <Button size="sm" variant="outline" className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10" onClick={() => handleUpdateBusinessStatus(b.id, "suspended")}>Suspend</Button>
                      )}
                      <Button size="sm" variant="outline" className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBusiness(b.id, b.business_name)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (Fits full width without horizontal swiping) */}
          <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-3.5 py-3 text-left">Business & Owner</th>
                  <th className="px-3 py-3 text-left">Contact</th>
                  <th className="px-3 py-3 text-left">Package & Ref</th>
                  <th className="px-3 py-3 text-left">Expiry & Status</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : paginatedBusinesses.map(b => {
                  const latestP = b.payments?.[0];
                  const expiry = b.expiry_date ? new Date(b.expiry_date) : null;
                  const daysLeft = expiry ? Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 5;
                  const isExpired = daysLeft !== null && daysLeft <= 0;

                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3.5 py-3">
                        <div className="font-bold text-foreground text-sm leading-snug">{b.business_name}</div>
                        <div className="text-xs text-muted-foreground">{b.owner_name || "Owner"}</div>
                      </td>

                      <td className="px-3 py-3 text-xs">
                        <div className="font-medium text-foreground">{b.phone || "No phone"}</div>
                        <div className="text-muted-foreground text-[11px] truncate max-w-[160px]">{b.email}</div>
                      </td>

                      <td className="px-3 py-3 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {b.package || "N/A"}
                          </span>
                          {latestP?.payment_reference ? (
                            <span className="font-mono text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded border border-border">
                              {latestP.payment_reference}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">No ref</span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${b.account_status === "approved" ? "bg-success/15 text-success" :
                                b.account_status === "pending" ? "bg-amber-500/15 text-amber-600" : "bg-destructive/15 text-destructive"
                              }`}>
                              {b.account_status}
                            </span>
                          </div>
                          <div>
                            {expiry ? (
                              <span className={`text-[11px] font-semibold ${isExpired ? 'text-destructive font-bold' : isExpiringSoon ? 'text-amber-600 font-bold' : 'text-foreground'}`}>
                                {expiry.toLocaleDateString()}
                                {isExpiringSoon && <span className="ml-1 text-[9px] uppercase bg-amber-500/10 px-1 py-0.2 rounded font-bold animate-pulse">({daysLeft}d left)</span>}
                                {isExpired && <span className="ml-1 text-[9px] uppercase bg-destructive/10 px-1 py-0.2 rounded font-bold">(Expired)</span>}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">No expiry</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1 flex-wrap">
                          {b.account_status !== "approved" && latestP && (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2.5 font-bold bg-primary text-primary-foreground shadow-xs"
                              onClick={() => handleApprovePayment(latestP.id, b.id, b.package || "kilimanjaro", b.email, b.business_name)}
                            >
                              Activate
                            </Button>
                          )}
                          {b.account_status !== "approved" && !latestP && (
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleUpdateBusinessStatus(b.id, "approved")}>
                              Approve
                            </Button>
                          )}
                          {b.account_status !== "suspended" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10" onClick={() => handleUpdateBusinessStatus(b.id, "suspended")}>
                              Suspend
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBusiness(b.id, b.business_name)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalBPages > 1 && (
            <div className="flex items-center justify-between border border-border bg-card p-3 rounded-lg mt-4 text-xs sm:text-sm">
              <Button variant="outline" size="sm" disabled={bPage === 1} onClick={() => setBPage(p => p - 1)}>Previous</Button>
              <span className="text-muted-foreground">Page {bPage} of {totalBPages}</span>
              <Button variant="outline" size="sm" disabled={bPage === totalBPages} onClick={() => setBPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {activeTab === "payments" && (
        <>
          {/* Mobile Payments Cards View */}
          <div className="md:hidden space-y-3">
            {pLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading payments...</div>
            ) : paginatedPayments.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No payments to display.</div>
            ) : (
              paginatedPayments.map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-card p-3.5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm sm:text-base text-foreground truncate">{p.businesses?.business_name || "Unknown Business"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${p.verification_status === "paid" ? "bg-success/15 text-success" :
                        p.verification_status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-600"
                      }`}>
                      {p.verification_status === "paid" ? <CheckCircle2 className="h-3 w-3" /> : p.verification_status === "rejected" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {p.verification_status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-muted/60 p-2.5 rounded-lg text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase block">Reference</span>
                      <span className="font-mono font-bold text-foreground">{p.payment_reference}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground text-[10px] uppercase block">Amount</span>
                      <span className="font-bold text-sm text-foreground">{Number(p.amount).toLocaleString()} TZS</span>
                    </div>
                  </div>

                  {p.verification_status === "waiting_verification" && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        className="flex-1 bg-primary text-primary-foreground font-bold h-8 text-xs"
                        onClick={() => handleApprovePayment(p.id, p.business_id, p.businesses?.package || "kilimanjaro", p.businesses?.email, p.businesses?.business_name)}
                      >
                        Verify & Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
                        onClick={() => handleRejectPayment(p.id, p.business_id, p.businesses?.email, p.businesses?.business_name)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Payments Table View */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Business</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Reference</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pLoading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> : paginatedPayments.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{p.businesses?.business_name || "Unknown"}</td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{p.payment_reference}</td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${p.verification_status === "paid" ? "bg-success/15 text-success" :
                          p.verification_status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-600"
                        }`}>
                        {p.verification_status === "paid" ? <CheckCircle2 className="h-3 w-3" /> : p.verification_status === "rejected" ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {p.verification_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      {p.verification_status === "waiting_verification" && (
                        <>
                          <Button size="sm" onClick={() => handleApprovePayment(p.id, p.business_id, p.businesses?.package || "kilimanjaro", p.businesses?.email, p.businesses?.business_name)}>
                            Verify & Activate
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRejectPayment(p.id, p.business_id, p.businesses?.email, p.businesses?.business_name)}>
                            Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPPages > 1 && (
            <div className="flex items-center justify-between border border-border bg-card p-3 rounded-lg mt-4 text-xs sm:text-sm">
              <Button variant="outline" size="sm" disabled={pPage === 1} onClick={() => setPPage(p => p - 1)}>Previous</Button>
              <span className="text-muted-foreground">Page {pPage} of {totalPPages}</span>
              <Button variant="outline" size="sm" disabled={pPage === totalPPages} onClick={() => setPPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
