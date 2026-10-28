import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Plus, Store, Check, Pencil, Trash2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/locations")({
  component: LocationsPage,
});

const PACKAGE_LIMITS: Record<string, number> = {
  starter: 1,
  kilimanjaro: 3,
  serengeti: 9999,
};

type Branch = {
  id: string;
  business_id: string;
  name: string;
  location: string | null;
  created_at: string;
};

function LocationsPage() {
  const { business, isAdmin, branchId, switchBranch } = useAuth();
  const qc = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations", business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Branch[];
    },
    enabled: !!business?.id,
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Huna ruhusa ya kuona ukurasa huu. Wasiliana na msimamizi wa biashara.
      </div>
    );
  }

  const currentPackage = business?.package || "kilimanjaro";
  const limit = PACKAGE_LIMITS[currentPackage] || 1;
  const canAddMore = locations.length < limit;

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!newLocationName.trim()) return toast.error("Jina la tawi linahitajika (Branch name is required)");

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("branches")
        .insert({
          business_id: business.id,
          name: newLocationName.trim(),
          location: newLocationAddress.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success(`Tawi jipya "${newLocationName}" limeongezwa kikamilifu!`);
      setIsAddOpen(false);
      setNewLocationName("");
      setNewLocationAddress("");
      qc.invalidateQueries({ queryKey: ["locations"] });
      // Reload after slight delay to ensure AppShell branches update
      setTimeout(() => window.location.reload(), 600);
    } catch (err: any) {
      toast.error(err.message || "Failed to add branch");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setEditName(branch.name);
    setEditAddress(branch.location || "");
    setIsEditOpen(true);
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    if (!editName.trim()) return toast.error("Jina la tawi linahitajika");

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("branches")
        .update({
          name: editName.trim(),
          location: editAddress.trim() || null,
        })
        .eq("id", editingBranch.id);

      if (error) throw error;
      toast.success("Tawi limesasishwa kikamilifu!");
      setIsEditOpen(false);
      setEditingBranch(null);
      qc.invalidateQueries({ queryKey: ["locations"] });
      setTimeout(() => window.location.reload(), 600);
    } catch (err: any) {
      toast.error(err.message || "Failed to update branch");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLocation = async (branch: Branch) => {
    if (locations.length <= 1) {
      return toast.error("Huwezi kufuta tawi hili kwa sababu biashara lazima iwe na angalau tawi moja kuu.");
    }

    if (!window.confirm(`Una uhakika unataka kufuta tawi "${branch.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("branches").delete().eq("id", branch.id);
      if (error) throw error;
      toast.success(`Tawi "${branch.name}" limefutwa.`);
      qc.invalidateQueries({ queryKey: ["locations"] });
      setTimeout(() => window.location.reload(), 600);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete branch");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Matawi ya Biashara (Locations / Branches)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simamia matawi yako ya mauzo. Kifurushi chako cha sasa (
            <strong className="text-foreground uppercase">{currentPackage}</strong>) kinaruhusu hadi matawi{" "}
            <strong className="text-foreground">{limit === 9999 ? "Bila Kikomo" : limit}</strong>.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} disabled={!canAddMore} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Ongeza Tawi Jipya
        </Button>
      </div>

      {!canAddMore && (
        <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-sm border border-amber-500/20">
          <strong>Upeo Umefikiwa (Limit Reached):</strong> Umefikisha idadi ya juu ya matawi kwa kifurushi chako cha sasa ({currentPackage.toUpperCase()}). Tafadhali boresha kifurushi chako (Serengeti) ili kuongeza matawi mengine zaidi.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">Inapakia matawi...</div>
        ) : (
          locations.map((loc) => {
            const isCurrent = loc.id === branchId;
            return (
              <div
                key={loc.id}
                className={`bg-card border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all ${
                  isCurrent ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border hover:border-border/80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Tawi Linalotumika
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => switchBranch(loc.id)}
                          className="text-xs h-7 px-2.5 cursor-pointer"
                        >
                          Tumia Tawi Hili
                        </Button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-foreground tracking-tight">{loc.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                    <span>{loc.location || "Hakuna anwani iliyowekwa"}</span>
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ID: {loc.id.slice(0, 8)}...
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => openEdit(loc)}
                      title="Hariri Tawi"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {locations.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive/70 hover:text-destructive cursor-pointer"
                        onClick={() => handleDeleteLocation(loc)}
                        title="Futa Tawi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog: Add New Branch */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Ongeza Tawi Jipya (Add Location)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLocation} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="loc-name">Jina la Tawi</Label>
              <Input
                id="loc-name"
                placeholder="mfano: Tawi la Kariakoo au Duka la Posta"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-addr">Anwani / Eneo (Hiari)</Label>
              <Input
                id="loc-addr"
                placeholder="mfano: Mtaa wa Msimbazi, Dar es Salaam"
                value={newLocationAddress}
                onChange={(e) => setNewLocationAddress(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Ghairi
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Inahifadhi..." : "Hifadhi Tawi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Branch */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Hariri Tawi (Edit Branch)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateLocation} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Jina la Tawi</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-addr">Anwani / Eneo</Label>
              <Input
                id="edit-addr"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Ghairi
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Inasasisha..." : "Hifadhi Mabadiliko"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
