import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/lib/use-auth";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiStepRegister } from "@/components/MultiStepRegister";
import { sendOtpSMS } from "@/lib/sms-service";
import { Eye, EyeOff, Smartphone, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";

import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/auth")({
  head: () =>
    buildSeoHead({
      title: "Ingia / Jisajili — MauzoChap POS",
      description: "Ingia kwenye akaunti yako ya MauzoChap POS au sajili duka lako kuanza kusimamia mauzo na stoo.",
      path: "/auth",
      noindex: true,
    }),
  component: AuthPage,
});

function AuthPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const modeParam = params.get("mode");
  const inviteId = params.get("invite");
  const inviteRole = params.get("role") || "cashier";
  const inviteBranch = params.get("branch") || "";

  const [mode, setMode] = useState<"signin" | "signup" | "reset" | "verify-otp">(
    modeParam === "signup" || modeParam === "register" || inviteId ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password / OTP states
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState<{ phone?: string; email?: string }>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  const [inviteBusinessName, setInviteBusinessName] = useState<string | null>(null);

  useEffect(() => {
    if (modeParam === "signup" || modeParam === "register" || inviteId) {
      setMode("signup");
    }
    if (inviteId) {
      supabase.rpc("get_business_name", { _business_id: inviteId })
        .then(({ data, error }) => {
          if (!error && data) {
            setInviteBusinessName(data as string);
          }
        });
    }
  }, [inviteId, modeParam]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (user) {
    const redirectParam = params.get("redirect");
    navigate({ to: (redirectParam || "/dashboard") as any, replace: true });
  }

  // Handle Standard Email/Password Sign-In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const redirectParam = params.get("redirect");
      const userMeta = signInData?.user?.user_metadata;
      const isStaff = !!(userMeta?.business_id || userMeta?.role === "cashier" || userMeta?.role === "manager");
      const targetDestination = redirectParam || (isStaff ? "/pos" : "/dashboard");
      navigate({ to: targetDestination as any, replace: true });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Imeshindwa kuingia. Tafadhali hakiki barua pepe na nenosiri lako.");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request Password Reset OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = resetIdentifier.trim() || email.trim();
    if (!identifier) {
      toast.error("Tafadhali weka barua pepe au namba yako ya simu.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)("request_password_reset_otp", {
        _identifier: identifier,
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || "Akaunti haijapatikana.");
      }

      setOtpSentTo({ phone: data.phone, email: data.email });

      // Dispatch SMS immediately via MauzoChap sender ID
      if (data.phone && data.otp_code) {
        try {
          await sendOtpSMS({
            phone: data.phone,
            code: data.otp_code,
          });
          toast.success(`Nambari ya siri (OTP) imetumwa kwa SMS kwenye ${data.phone}!`);
        } catch (smsErr) {
          console.warn("SMS dispatch notice:", smsErr);
          toast.info(`Nambari ya OTP imeundwa. Kama SMS imechelewa tafadhali subiri sekunde chache.`);
        }
      }

      // Also trigger Supabase magic email link if an email was resolved
      if (data.email) {
        supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: window.location.origin + "/update-password",
        }).catch(() => {});
      }

      setMode("verify-otp");
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err.message || "Imeshindwa kutuma OTP. Hakikisha taarifa zako ni sahihi.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      toast.error("Tafadhali jaza nambari yote 6 ya OTP.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Nenosiri jipya lazima liwe na angalau herufi 8.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Nenosiri halifanani na uthibitisho. Tafadhali rudia tena kwa usahihi.");
      return;
    }

    setLoading(true);
    try {
      const identifier = resetIdentifier.trim() || email.trim() || otpSentTo.phone || otpSentTo.email || "";
      const { data, error } = await (supabase.rpc as any)("verify_otp_and_reset_password", {
        _identifier: identifier,
        _otp_code: cleanOtp,
        _new_password: newPassword,
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || "Imeshindwa kubadili nenosiri.");
      }

      toast.success(data.message || "Nenosiri lako limebadilishwa kikamilifu!");

      // Attempt immediate automatic sign in
      const loginEmail = data.email || email.trim();
      if (loginEmail) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: newPassword,
        });

        if (!signInErr) {
          navigate({ to: "/dashboard" as any, replace: true });
          return;
        }
      }

      // If auto-login needs manual signin, pre-populate email and show login form
      if (data.email) setEmail(data.email);
      setMode("signin");
    } catch (err: any) {
      toast.error(err.message || "Imeshindwa kuthibitisha OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="grid min-h-screen lg:grid-cols-2"
      style={{ background: "var(--gradient-subtle)" }}
    >
      {/* Left Branding Side */}
      <div 
        className="hidden lg:flex flex-col justify-center items-center p-12 relative overflow-hidden text-sidebar-foreground"
        style={{ background: "var(--sidebar)" }}
      >
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <Link to="/" className="mb-8 flex flex-col items-center gap-3 transition-transform hover:scale-105 duration-300">
            <img src="/images/logo-white.png" alt="MauzoChap" className="w-20 h-20 object-contain drop-shadow-md" />
            <span className="text-3xl font-extrabold tracking-tight text-sidebar-foreground">MauzoChap</span>
          </Link>
          
          <h2 className="text-4xl font-extrabold tracking-tight leading-[1.15]">
            The intelligent way to run your business.
          </h2>
          <p className="mt-5 text-lg text-sidebar-foreground/80 leading-relaxed font-medium">
            A complete ecosystem for POS, inventory, customers, and analytics—built exclusively for modern Tanzanian enterprises.
          </p>
        </div>
        
        <p className="absolute bottom-8 text-sm text-sidebar-foreground/50 font-semibold tracking-wide">
          © {new Date().getFullYear()} MauzoChap. All rights reserved.
        </p>
      </div>

      {/* Right Form Side */}
      <div className="flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        {mode === "signup" ? (
          <MultiStepRegister
            onSuccess={() => {
              if (inviteId) {
                navigate({ to: "/pos" as any, replace: true });
              } else {
                const pkg = params.get("package");
                if (pkg) {
                  navigate({ to: `/setup-billing?package=${pkg}` as any, replace: true });
                } else {
                  navigate({ to: "/setup-billing", replace: true });
                }
              }
            }}
            onSwitchToSignIn={() => setMode("signin")}
            inviteId={inviteId}
            inviteRole={inviteRole}
            inviteBranch={inviteBranch}
            inviteBusinessName={inviteBusinessName}
          />
        ) : mode === "verify-otp" ? (
          /* Step 2: Enter OTP & Set New Password */
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] animate-in fade-in duration-200">
            <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-6">
              <img src="/images/logo-black.png" alt="MauzoChap" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold tracking-tight">MauzoChap</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Weka Nambari ya Siri (OTP)</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Weka OTP uliyopokea na nenosiri jipya
                </p>
              </div>
            </div>

            {/* Phone notification pill */}
            <div className="mt-4 p-3 bg-muted/50 border border-border rounded-xl flex items-start gap-2.5 text-xs">
              <Smartphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-muted-foreground">
                Tumetuma nambari ya siri ya tarakimu 6 (OTP) kwa SMS kwenda namba{" "}
                <strong className="text-foreground font-bold">{otpSentTo.phone || resetIdentifier}</strong>.
              </div>
            </div>

            <form onSubmit={handleVerifyOtpAndReset} className="space-y-4 mt-5">
              <div>
                <Label htmlFor="otpCode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nambari ya Siri ya SMS (OTP - Tarakimu 6)
                </Label>
                <Input
                  id="otpCode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  className="mt-1.5 text-center font-mono text-2xl tracking-[0.5em] font-bold h-12 bg-background border-primary/40 focus:border-primary shadow-xs"
                  autoFocus
                  required
                />
              </div>

              <div>
                <Label htmlFor="newPassword">Nenosiri Jipya (Angalau herufi 8)</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Weka nenosiri jipya lenye herufi 8+"
                    className="pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmNewPassword">Thibitisha Nenosiri Jipya</Label>
                <Input
                  id="confirmNewPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Rudia nenosiri jipya"
                  className="mt-1.5"
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full font-bold h-11 text-base active:scale-95 transition-all" disabled={loading}>
                {loading ? "Inathibitisha na Kuweka Nenosiri..." : "Thibitisha & Badili Nenosiri"}
              </Button>
            </form>

            {/* Resend and navigation helpers */}
            <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading || resendCooldown > 0}
                className="text-primary hover:underline font-semibold disabled:opacity-50 cursor-pointer"
              >
                {resendCooldown > 0 ? `Tuma tena OTP (${resendCooldown}s)` : "Hujapata SMS? Bonyeza kutuma tena"}
              </button>
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="h-3 w-3" /> Badili namba ya simu
              </button>
            </div>
          </div>
        ) : mode === "reset" ? (
          /* Step 1: Enter Phone / Email to Receive OTP */
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] animate-in fade-in duration-200">
            <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-6">
              <img src="/images/logo-black.png" alt="MauzoChap" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold tracking-tight">MauzoChap</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Umesahau Nenosiri?</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Weka namba ya simu au barua pepe kupokea OTP
                </p>
              </div>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4 mt-6">
              <div>
                <Label htmlFor="resetIdentifier">Namba ya Simu au Barua Pepe (Email)</Label>
                <Input
                  id="resetIdentifier"
                  type="text"
                  placeholder="mfano: 0712345678 au juma@example.com"
                  value={resetIdentifier || email}
                  onChange={(e) => {
                    setResetIdentifier(e.target.value);
                    setEmail(e.target.value);
                  }}
                  className="mt-1.5 h-11"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Smartphone className="h-3 w-3 text-primary shrink-0" />
                  Utapewa nambari ya siri ya uhakiki (OTP) moja kwa moja kwa SMS kutoka kwa <strong>MauzoChap</strong>.
                </p>
              </div>

              <Button type="submit" className="w-full font-bold h-11 text-base active:scale-95 transition-all" disabled={loading}>
                {loading ? "Inatuma OTP..." : "Tuma Nambari ya Siri (OTP)"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground pt-4 border-t border-border">
              Unakumbuka nenosiri lako?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-medium text-primary hover:underline cursor-pointer"
              >
                Rudi Kwenye Kuingia (Sign In)
              </button>
            </p>
          </div>
        ) : (
          /* Sign In Form */
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] animate-in fade-in duration-200">
            <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
              <img src="/images/logo-black.png" alt="MauzoChap" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold tracking-tight">MauzoChap</span>
            </Link>
            <h1 className="text-2xl font-bold">
              {t("signIn")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Karibu tena, tafadhali ingia kwenye akaunti yako.
            </p>

            <form onSubmit={handleSignIn} className="space-y-4 mt-6">
              <div>
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  placeholder="jina@biashara.com"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("password")}</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(email);
                      setMode("reset");
                    }}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Umesahau nenosiri?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    placeholder="Weka nenosiri lako"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full font-bold h-11 text-base active:scale-95 transition-all" disabled={loading}>
                {loading ? "Inaingia..." : t("signIn")}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground pt-4 border-t border-border">
              Huna akaunti bado?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold text-primary hover:underline cursor-pointer"
              >
                {t("signUp")}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
