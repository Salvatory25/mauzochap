import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { buildSeoHead } from "@/lib/seo";

export const Route = createFileRoute("/update-password")({
  head: () =>
    buildSeoHead({
      title: "Badili Nenosiri — MauzoChap POS",
      description: "Weka nenosiri jipya kwa ajili ya akaunti yako ya MauzoChap POS.",
      path: "/update-password",
      noindex: true,
    }),
  component: UpdatePasswordPage,
});

function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success("Password updated successfully");
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="grid min-h-screen place-items-center p-6"
      style={{ background: "var(--gradient-subtle)" }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        <h1 className="text-2xl font-bold">Update Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Please enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
