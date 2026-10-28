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

  const [mode, setMode] = useState<"signin" | "signup" | "reset">(
    modeParam === "signup" || modeParam === "register" || inviteId ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetPhone, setResetPhone] = useState("");
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

  if (user) {
    const redirectParam = params.get("redirect");
    navigate({ to: (redirectParam || "/dashboard") as any, replace: true });
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/update-password",
        });
        if (error) throw error;

        // Dispatch OTP SMS with Sender ID MauzoChap if phone is provided or registered
        try {
          let phoneToNotify = resetPhone.trim();
          if (!phoneToNotify) {
            const { data: bizData } = await supabase
              .from("businesses")
              .select("phone")
              .eq("email", email)
              .limit(1);
            if (bizData && bizData[0]?.phone) {
              phoneToNotify = bizData[0].phone;
            }
          }

          if (phoneToNotify) {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            await sendOtpSMS({
              phone: phoneToNotify,
              code: otpCode,
            });
            toast.success(`Nambari ya siri (OTP) na kiungo vimetumwa kwenye SMS ya MauzoChap (${phoneToNotify}) na Email yako!`);
          } else {
            toast.success("Barua pepe ya kubadili nenosiri imetumwa! Tafadhali fungua inbox yako.");
          }
        } catch (smsErr) {
          console.warn("SMS dispatch notice:", smsErr);
          toast.success("Barua pepe ya kubadili nenosiri imetumwa! Tafadhali fungua inbox yako.");
        }

        setMode("signin");
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const redirectParam = params.get("redirect");
      navigate({ to: (redirectParam || "/dashboard") as any, replace: true });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Auth failed");
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
        ) : (
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
            <Link to="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
              <img src="/images/logo-black.png" alt="MauzoChap" className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold tracking-tight">MauzoChap</span>
            </Link>
            <h1 className="text-2xl font-bold">
              {mode === "signin" ? t("signIn") : "Reset Password"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Welcome back, please sign in."
                : "Enter your email to receive a password reset link."}
            </p>

            <form onSubmit={handleEmail} className="space-y-4 mt-6">
              <div>
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              {mode !== "reset" ? (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("password")}</Label>
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    required
                    minLength={8}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="resetPhone">Namba ya Simu kwa MauzoChap SMS (Hiari)</Label>
                  <Input
                    id="resetPhone"
                    type="tel"
                    placeholder="mfano: 0712345678"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Utapewa nambari ya siri ya uhakiki (OTP) moja kwa moja kwa SMS kutoka kwa <strong>MauzoChap</strong>.
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full font-bold" disabled={loading}>
                {loading ? "..." : mode === "signin" ? t("signIn") : "Send Reset Link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? "No account?" : "Remember your password?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="font-medium text-primary hover:underline"
              >
                {mode === "signin" ? t("signUp") : "Back to Sign In"}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

