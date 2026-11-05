import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const { user, business, isAdmin } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!error && data) {
        setFullName(data.full_name || "");
        setBusinessName(data.business_name || "");
        setPhone(data.phone || "");
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload: any = {
        full_name: fullName,
        phone,
      };
      if (isAdmin) {
        payload.business_name = businessName;
      }
      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;
      if (isAdmin && business?.id) {
        await supabase
          .from("businesses")
          .update({
            phone: phone || null,
            business_name: businessName || business.business_name,
            owner_name: fullName || business.owner_name,
          })
          .eq("id", business.id);
      }
      toast.success("Settings saved successfully");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{t("settings")}</h1>
          <p className="text-sm text-muted-foreground">Manage your account and business preferences.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="mt-1 bg-muted/50" />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                className="mt-1"
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="mt-1"
                placeholder="+255 123 456 789"
              />
            </div>
          </div>

          <div>
            <Label>Business Name</Label>
            <Input 
              value={businessName} 
              onChange={(e) => setBusinessName(e.target.value)} 
              className="mt-1"
              placeholder="My Shop"
              disabled={!isAdmin}
            />
            {!isAdmin && (
              <p className="text-xs text-muted-foreground mt-1">Only store administrators can update the business name.</p>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
