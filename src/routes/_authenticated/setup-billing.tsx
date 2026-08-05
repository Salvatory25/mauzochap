import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, CheckCircle2, Package, ArrowRight, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sendEmail } from "@/lib/email";

export const Route = createFileRoute("/_authenticated/setup-billing")({
  component: SetupBilling,
});

const PACKAGES = [
  { 
    id: "starter", 
    name: "Starter", 
    price: 8500, 
    duration: "1 Month",
    features: [
      "1 Location",
      "1 User",
      "100 Products",
      "Basic Reports",
      "Unlimited Invoices",
      "Unlimited Receipts"
    ]
  },
  { 
    id: "kilimanjaro", 
    name: "Kilimanjaro", 
    price: 10500, 
    duration: "1 Month",
    features: [
      "1 Location",
      "3 Users",
      "Unlimited Reports",
      "Unlimited Invoices",
      "Unlimited Receipts",
      "Multiple Branches"
    ]
  },
  { 
    id: "serengeti", 
    name: "Serengeti", 
    price: 20500, 
    duration: "1 Month",
    features: [
      "Unlimited Locations",
      "Unlimited Users",
      "Unlimited Products",
      "Unlimited Reports",
      "Unlimited Invoices",
      "Unlimited Receipts",
      "Unlimited Branches"
    ]
  },
];

function SetupBilling() {
  const { business } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string>("kilimanjaro");
  const [paymentRef, setPaymentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch payments for this business to check pending status
  const { data: payments = [], isLoading: pLoading, refetch: refetchPayments } = useQuery({
    queryKey: ["payments-list", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("business_id", business!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  if (!business) {
    return <div className="p-8 text-center text-muted-foreground">Loading business info...</div>;
  }

  // Find if there is a pending payment reference
  const pendingPayment = payments.find(p => p.verification_status === "waiting_verification");
  const latestPayment = payments[0];
  const isRejected = latestPayment && (latestPayment.verification_status as string) === "rejected";

  const handleRefresh = async () => {
    toast.promise(
      Promise.all([
        refetchPayments(),
        // Trigger window reload to refresh the auth context state cleanly if approved
        qc.invalidateQueries({ queryKey: ["auth"] })
      ]),
      {
        loading: "Checking verification status...",
        success: () => {
          // If approved in background, navigate to dashboard
          if (business.account_status === "approved" && (!business.expiry_date || new Date(business.expiry_date) > new Date())) {
            navigate({ to: "/dashboard", replace: true });
            return "Your subscription has been verified!";
          }
          return "Verification status checked.";
        },
        error: "Failed to refresh status"
      }
    );
  };

  // If already approved and not expired, and there's no pending payment verification screen block needed, redirect to dashboard
  if (business.account_status === "approved" && (!business.expiry_date || new Date(business.expiry_date) > new Date()) && !pendingPayment) {
    navigate({ to: "/dashboard", replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = paymentRef.trim();
    if (!cleanRef) return toast.error("Payment reference is required");
    
    // Alphanumeric code validation (must be at least 4 characters long)
    const refRegex = /^[A-Z0-9]{4,30}$/i;
    if (!refRegex.test(cleanRef)) {
      return toast.error("Invalid payment reference format. Please enter a valid alphanumeric transaction ID (4+ characters).");
    }
    
    setSubmitting(true);
    try {
      const selectedInfo = PACKAGES.find(p => p.id === selectedPackage);
      if (!selectedInfo) throw new Error("Invalid package");

      // 1. Update business package selection and set account_status to pending (Pending Verification)
      const { error: bErr } = await supabase
        .from("businesses")
        .update({ 
          package: selectedPackage as any,
          account_status: "pending",
          rejection_reason: null as any // Clear any previous rejection reason
        })
        .eq("id", business.id);
      
      if (bErr) throw bErr;

      // 2. Submit payment record
      const { error: pErr } = await supabase
        .from("payments")
        .insert({
          business_id: business.id,
          amount: selectedInfo.price,
          payment_reference: cleanRef,
          verification_status: "waiting_verification"
        });
        
      if (pErr) throw pErr;

      // 3. Send mock email notification to the administrator
      const submissionDate = new Date();
      sendEmail({
        to: "admin@mauzochap.com",
        subject: "New MauzoChap Subscription Payment Requires Verification",
        body: `Hello Admin,\n\nA new subscription payment reference has been submitted and requires verification.\n\nCustomer details:\n- Business Name: ${business.business_name}\n- Owner Name: ${business.owner_name || "N/A"}\n- Email: ${business.email || "N/A"}\n- Phone: ${business.phone || "N/A"}\n\nPayment details:\n- Selected Plan: ${selectedInfo.name}\n- Amount: ${selectedInfo.price.toLocaleString()} TZS\n- Transaction Reference: ${cleanRef}\n- Submission Time: ${submissionDate.toLocaleString()}\n- Current Status: Pending Verification\n\nPlease log in to the Super Admin panel to verify this payment.\n\nBest,\nMauzoChap System`
      });

      // 4. Send in-app notification (we insert into the database table public.notifications)
      await supabase.from("notifications" as any).insert({
        business_id: business.id,
        title: "Payment Submitted Successfully",
        message: `Your payment reference for ${selectedInfo.name} has been submitted and is currently pending verification.`,
        type: "payment"
      });

      toast.success("Payment submitted successfully! Awaiting admin verification.");
      setPaymentRef("");
      refetchPayments();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Render Pending verification page if applicable
  if (pendingPayment) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-12 mt-10">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-lg space-y-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Payment Verification Pending</h1>
            <p className="text-muted-foreground text-sm">
              Thank you for choosing MauzoChap POS!
            </p>
          </div>
          
          <div className="bg-muted/40 p-5 rounded-xl text-left space-y-3 border border-border text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selected Plan:</span>
              <span className="font-bold capitalize">{(pendingPayment as any).package || selectedPackage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold">{Number(pendingPayment.amount).toLocaleString()} TZS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction Reference:</span>
              <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded text-xs">{pendingPayment.payment_reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submission Date:</span>
              <span className="font-medium">{new Date(pendingPayment.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border/60">
              <span className="text-muted-foreground">Status:</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                <Clock className="h-3 w-3" /> Pending Verification
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground leading-relaxed bg-amber-500/5 border border-amber-500/10 p-4 rounded-lg">
            We have successfully received your payment details and transaction reference. Our administration team is currently reviewing your payment. 
            Please don't worry — your payment verification request has been successfully received. You can safely wait while our team completes the verification process. 
            Once your payment has been verified, your subscription will be activated and you will be able to continue using MauzoChap POS.
          </div>

          <Button onClick={handleRefresh} size="lg" className="w-full flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh Status
          </Button>
        </div>
      </div>
    );
  }

  const isTrialExpired = business.package === "trial" && business.expiry_date && new Date(business.expiry_date) < new Date();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {isTrialExpired && (
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl border border-destructive/20 max-w-4xl mx-auto text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/25 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Your 14-Day Free Trial Has Ended</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Thank you for using MauzoChap POS. Your free trial period has ended. To continue using MauzoChap POS and access your business features, please choose a subscription plan that suits your business.
          </p>
        </div>
      )}

      {isRejected && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm border border-destructive/20 max-w-4xl mx-auto flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Payment Verification Rejected</strong>
            <p className="text-muted-foreground mt-1">
              {(latestPayment as any).rejection_reason || "Payment reference could not be verified. Please check your transaction reference and submit the correct reference."}
            </p>
          </div>
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Select a Subscription Package</h1>
        <p className="text-muted-foreground mt-2">
          Choose the right plan to activate your business account for <strong>{business.business_name}</strong>.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PACKAGES.map((pkg) => (
          <div 
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            className={`cursor-pointer rounded-2xl border p-6 transition-all flex flex-col ${
              selectedPackage === pkg.id 
                ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary scale-[1.02]" 
                : "border-border bg-card hover:border-primary/50 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${selectedPackage === pkg.id ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}>
                <Package className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg tracking-tight uppercase">{pkg.name}</h3>
            </div>
            
            <div className="text-3xl font-extrabold mb-1 tracking-tight">
              {pkg.price.toLocaleString()} <span className="text-base font-medium text-muted-foreground">TZS</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-6 bg-muted/50 w-fit px-2 py-0.5 rounded-full">
              Billed {pkg.duration}
            </p>
            
            <ul className="space-y-3 mb-8 flex-1">
              {pkg.features.map((feature, i) => (
                <li key={i} className="flex items-start text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground leading-tight">{feature}</span>
                </li>
              ))}
            </ul>

            <div className={`w-full py-2.5 rounded-lg text-center font-semibold text-sm transition-colors ${
              selectedPackage === pkg.id ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
            }`}>
              {selectedPackage === pkg.id ? "Selected Plan" : "Choose Plan"}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden max-w-4xl mx-auto">
        <div className="p-6 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Details
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Please transfer the amount to our business number and enter the transaction reference below.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-primary/10 text-primary p-6 rounded-lg text-sm mb-6 space-y-4 border border-primary/20">
            <div>
              <strong>Payment Instructions:</strong> Please send exactly <strong>{PACKAGES.find(p => p.id === selectedPackage)?.price.toLocaleString()} TZS</strong> using any of the following methods:
            </div>
            <div className="grid gap-3 sm:grid-cols-2 text-xs pt-2">
              <div className="bg-background/50 p-3 rounded-lg border border-primary/10">
                <span className="font-bold block text-muted-foreground">Bank Transfer (NMB):</span>
                <span className="font-mono font-bold text-sm block mt-0.5">40310127484</span>
              </div>
              <div className="bg-background/50 p-3 rounded-lg border border-primary/10">
                <span className="font-bold block text-muted-foreground">Mix By Yass:</span>
                <span className="font-mono font-bold text-sm block mt-0.5">0674673494</span>
              </div>
              <div className="bg-background/50 p-3 rounded-lg border border-primary/10">
                <span className="font-bold block text-muted-foreground">Airtel Money:</span>
                <span className="font-mono font-bold text-sm block mt-0.5">0668632187</span>
              </div>
              <div className="bg-background/50 p-3 rounded-lg border border-primary/10">
                <span className="font-bold block text-muted-foreground">HaloPesa:</span>
                <span className="font-mono font-bold text-sm block mt-0.5">0627274168</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label>Mobile Money Reference Number</Label>
            <Input 
              placeholder="e.g. 5K92J1LX" 
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="max-w-md uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Enter the exact transaction ID you received from M-Pesa / Tigo Pesa / Airtel Money.
            </p>
          </div>

          <Button type="submit" size="lg" disabled={submitting || !paymentRef.trim()} className="w-full sm:w-auto">
            {submitting ? "Submitting..." : "Submit Payment for Verification"}
            {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
