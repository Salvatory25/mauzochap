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
import { MapPin, Plus, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/locations")({
  component: LocationsPage,
});

const PACKAGE_LIMITS: Record<string, number> = {
  trial: 1,
  kilimanjaro: 1,
  serengeti: 9999,
};

function LocationsPage() {
  const { business, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      return data;
    },
    enabled: !!business?.id,
  });

  if (!isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to view this page.</div>;
  }

  const currentPackage = business?.package || "trial";
  const limit = PACKAGE_LIMITS[currentPackage] || 1;
  const canAddMore = locations.length < limit;

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!newLocationName.trim()) return toast.error("Location name is required");

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("branches")
        .insert({
          business_id: business.id,
          name: newLocationName,
          location: newLocationAddress
        });

      if (error) throw error;
      toast.success("Location added successfully");
      setIsAddOpen(false);
      setNewLocationName("");
      setNewLocationAddress("");
      qc.invalidateQueries({ queryKey: ["locations"] });
      // Reload window to update the AppShell availableBranches state cleanly
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Locations (Branches)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your store locations. Your current package ({currentPackage.toUpperCase()}) allows up to {limit === 9999 ? "Unlimited" : limit} location(s).
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} disabled={!canAddMore}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {!canAddMore && (
        <div className="bg-warning/10 text-warning p-4 rounded-lg text-sm border border-warning/20">
          <strong>Limit Reached:</strong> You have reached the maximum number of locations for your current package. Please upgrade your subscription to add more branches.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">Loading...</div>
        ) : locations.map((loc) => (
          <div key={loc.id} className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Store className="h-5 w-5" />
                </div>
              </div>
              <h3 className="font-bold text-lg">{loc.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {loc.location || "No address provided"}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <span className="text-xs font-medium bg-muted px-2 py-1 rounded">Active</span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLocation} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Location Name</Label>
              <Input 
                placeholder="e.g. Kariakoo Branch" 
                value={newLocationName} 
                onChange={e => setNewLocationName(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Address / Region (Optional)</Label>
              <Input 
                placeholder="e.g. Msimbazi Street" 
                value={newLocationAddress} 
                onChange={e => setNewLocationAddress(e.target.value)} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Location"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
