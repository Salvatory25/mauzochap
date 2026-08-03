import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldAlert, Building2, CreditCard, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
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
      const { data, error } = await supabase.from("businesses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Business[];
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
        rejection_reason: null
      }).eq("id", businessId);
      
      if (bErr) throw bErr;

      // 4. In-app notification
      await supabase.from("notifications").insert({
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
        rejection_reason: reason
      }).eq("id", paymentId);
      if (pErr) throw pErr;

      // 2. Set business account status to rejected and update rejection reason
      const { error: bErr } = await supabase.from("businesses").update({ 
        account_status: "rejected",
        rejection_reason: reason
      }).eq("id", businessId);
      if (bErr) throw bErr;

      // 3. Notify the customer in-app
      await supabase.from("notifications").insert({
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

  const totalBPages = Math.ceil(businesses.length / ITEMS_PER_PAGE);
  const paginatedBusinesses = businesses.slice((bPage - 1) * ITEMS_PER_PAGE, bPage * ITEMS_PER_PAGE);

  const totalPPages = Math.ceil(payments.length / ITEMS_PER_PAGE);
  const paginatedPayments = payments.slice((pPage - 1) * ITEMS_PER_PAGE, pPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <ShieldAlert className="h-8 w-8 mr-3 text-primary" />
          Super Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Manage tenants, subscriptions, and verify payments.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><Building2 className="h-4 w-4 mr-2" /> Total Businesses</div>
          <div className="text-3xl font-bold">{businesses.length}</div>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><Activity className="h-4 w-4 mr-2" /> Active Subs</div>
          <div className="text-3xl font-bold text-success">{activeSubs}</div>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><Clock className="h-4 w-4 mr-2" /> Pending</div>
          <div className="text-3xl font-bold text-amber-500">{pendingApprovals}</div>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><CreditCard className="h-4 w-4 mr-2" /> Total Revenue</div>
          <div className="text-3xl font-bold">{totalRevenue.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">TZS</span></div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border mb-6">
        <button 
          onClick={() => setActiveTab("businesses")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === "businesses" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Businesses
        </button>
        <button 
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === "payments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Payments & Verifications
        </button>
      </div>

      {activeTab === "businesses" && (
        <>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Business Name</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Package</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bLoading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> : paginatedBusinesses.map(b => (
                <tr key={b.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{b.business_name}</td>
                  <td className="px-4 py-3">{b.owner_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{b.email}<br/>{b.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      b.account_status === "approved" ? "bg-success/15 text-success" : 
                      b.account_status === "pending" ? "bg-amber-500/15 text-amber-600" : "bg-destructive/15 text-destructive"
                    }`}>
                      {b.account_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{b.package}</td>
                  <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                    {b.account_status !== "approved" && (
                      <Button size="sm" variant="outline" onClick={() => handleUpdateBusinessStatus(b.id, "approved")}>Approve</Button>
                    )}
                    {b.account_status !== "suspended" && (
                      <Button size="sm" variant="outline" className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10" onClick={() => handleUpdateBusinessStatus(b.id, "suspended")}>Suspend</Button>
                    )}
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBusiness(b.id, b.business_name)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalBPages > 1 && (
          <div className="flex items-center justify-between border border-border bg-card p-3 rounded-lg mt-4">
            <Button variant="outline" size="sm" disabled={bPage === 1} onClick={() => setBPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {bPage} of {totalBPages}</span>
            <Button variant="outline" size="sm" disabled={bPage === totalBPages} onClick={() => setBPage(p => p + 1)}>Next</Button>
          </div>
        )}
        </>
      )}

      {activeTab === "payments" && (
        <>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Business</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pLoading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> : paginatedPayments.map(p => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium">{p.businesses?.business_name || "Unknown"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.payment_reference}</td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      p.verification_status === "paid" ? "bg-success/15 text-success" : 
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
          <div className="flex items-center justify-between border border-border bg-card p-3 rounded-lg mt-4">
            <Button variant="outline" size="sm" disabled={pPage === 1} onClick={() => setPPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {pPage} of {totalPPages}</span>
            <Button variant="outline" size="sm" disabled={pPage === totalPPages} onClick={() => setPPage(p => p + 1)}>Next</Button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
