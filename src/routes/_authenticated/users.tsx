import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Search, UserCog, Copy, Check, Eye, EyeOff, UserPlus, Link2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const inviteSchema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string(),
});

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

type Profile = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  phone: string | null;
  role?: string;
  role_id?: string;
  branch_id?: string | null;
  branches?: { name: string } | null;
};

function UsersPage() {
  const t = useT();
  const qc = useQueryClient();
  const { roles, user, isAdmin, business } = useAuth();
  const currentPackage = business?.package || "trial";
  const userLimit = currentPackage === "trial" ? 1 : currentPackage === "kilimanjaro" ? 3 : 9999;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"invite" | "edit-role" | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [page, setPage] = useState(1);

  const openDialog = (type: "invite" | "edit-role", user: Profile | null = null) => {
    setDialogType(type);
    setSelectedUser(user);
    setOpen(true);
  };
  const ITEMS_PER_PAGE = 50;

  const { data: usersList = [], isLoading } = useQuery({
    queryKey: ["users-list"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("*, branches(name)");
      if (pErr) throw pErr;

      let combined = profiles as Profile[];
      
      if (isAdmin) {
        const { data: userRoles, error: rErr } = await supabase.from("user_roles").select("*");
        if (!rErr && userRoles) {
          combined = profiles.map(p => {
            const roleObj = userRoles.find(r => r.user_id === p.id);
            return { ...p, role: roleObj?.role || "cashier", role_id: roleObj?.id };
          });
        }
      }
      return combined;
    },
  });

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-muted-foreground max-w-sm">
          You do not have the required permissions to access this page. Please contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  const canAddMoreUsers = usersList.length < userLimit;

  const filtered = usersList.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search)
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleRemoveUser = async (id: string) => {
    if (!confirm("Remove this user from your business? They will lose all access.")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", id);
    if (error) return toast.error(error.message);
    toast.success("User removed successfully");
    qc.invalidateQueries({ queryKey: ["users-list"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("users")}</h1>
          <p className="text-sm text-muted-foreground">{usersList.length} users registered</p>
        </div>
        {isAdmin && (
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) {
                setDialogType(null);
                setSelectedUser(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => openDialog("invite")} disabled={!canAddMoreUsers} className="shadow-[var(--shadow-soft)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                 <UserPlus className="h-4 w-4" /> Invite / Add User
              </Button>
            </DialogTrigger>
            {dialogType === "invite" && <InviteUserDialog onClose={() => setOpen(false)} />}
            {dialogType === "edit-role" && selectedUser && (
              <RoleDialog editing={selectedUser} onClose={() => setOpen(false)} />
            )}
          </Dialog>
        )}
      </div>

      {!canAddMoreUsers && (
        <div className="bg-warning/10 text-warning p-4 rounded-lg text-sm border border-warning/20">
          <strong>Limit Reached:</strong> You have reached the maximum number of users for your current package ({currentPackage.toUpperCase()}). Please upgrade your subscription to add more users.
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search users..."
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Branch</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  {t("loading")}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  {t("noData")}
                </td>
              </tr>
            ) : (
              paginated.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      {u.full_name || "Unknown"}
                      {user?.id === u.id && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">You</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.branches?.name || u.business_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-sidebar-accent px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider">
                      {u.role || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {isAdmin && user?.id !== u.id && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            openDialog("edit-role", u);
                          }}
                        >
                          Edit Access
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveUser(u.id)}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-border bg-card p-3 rounded-lg mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function RoleDialog({ editing, onClose }: { editing: Profile; onClose: () => void }) {
  const qc = useQueryClient();
  const { availableBranches } = useAuth();
  const [role, setRole] = useState(editing.role || "cashier");
  const [branchId, setBranchId] = useState(editing.branch_id || (availableBranches?.[0]?.id ?? ""));
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing.role_id) {
        const { error } = await supabase.from("user_roles").update({ role: role as any }).eq("id", editing.role_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: editing.id, role: role as any });
        if (error) throw error;
      }
      
      // Update Branch
      if (branchId) {
        await supabase.from("profiles").update({ branch_id: branchId }).eq("id", editing.id);
      }

      toast.success("User access updated");
      qc.invalidateQueries({ queryKey: ["users-list"] });
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Change User Role</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>User</Label>
          <div className="mt-1 text-sm">{editing.full_name}</div>
        </div>
        <div>
          <Label>Role</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        
        {availableBranches && availableBranches.length > 0 && (
          <div>
            <Label>Assigned Branch</Label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Save Role"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function InviteUserDialog({ onClose }: { onClose: () => void }) {
  const t = useT();
  const qc = useQueryClient();
  const { business, availableBranches } = useAuth();
  
  const [tab, setTab] = useState<"direct" | "link">("direct");
  const [role, setRole] = useState("cashier");
  const [branchId, setBranchId] = useState(availableBranches?.[0]?.id || "");
  
  // Direct Registration states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Invite Link states
  const [copied, setCopied] = useState(false);
  
  const inviteUrl = business?.id 
    ? `${window.location.origin}/auth?invite=${business.id}&role=${role}&branch=${branchId}` 
    : "";

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Invite link copied to clipboard!");
  };

  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) {
      toast.error("Business information is loading or missing. Please try again.");
      return;
    }
    const parsed = inviteSchema.safeParse({ fullName, phone, email, password, role });
    if (!parsed.success) {
      parsed.error.errors.forEach((err) => toast.error(err.message));
      return;
    }
    
    setSaving(true);
    try {
      // Create a temporary client with persistSession: false to avoid signing the admin out
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );

      const { error } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            business_id: business.id,
            branch_id: branchId || undefined,
            role: role
          }
        }
      });

      if (error) throw error;
      
      toast.success(`Account for ${fullName} created successfully!`);
      qc.invalidateQueries({ queryKey: ["users-list"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Invite / Add User</DialogTitle>
      </DialogHeader>
      
      {/* Premium custom tab pills */}
      <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl mt-2 text-sm">
        <button
          type="button"
          onClick={() => setTab("direct")}
          className={`py-2 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
            tab === "direct"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCog className="h-4 w-4" /> Direct Add
        </button>
        <button
          type="button"
          onClick={() => setTab("link")}
          className={`py-2 px-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
            tab === "link"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="h-4 w-4" /> Share Link
        </button>
      </div>

      {tab === "direct" ? (
        <form onSubmit={handleDirectRegister} className="space-y-4 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0712345678"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="pr-10"
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

          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {availableBranches && availableBranches.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="branch">Assigned Branch</Label>
              <select
                id="branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
            ℹ️ The user will be created under your business immediately. If email confirmation is enabled in Supabase, they must confirm their email before logging in.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 active:scale-95 transition-all">
              {saving ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 pt-3">
          <div className="space-y-1">
            <Label htmlFor="link_role">Role for Invite Link</Label>
            <select
              id="link_role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {availableBranches && availableBranches.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="link_branch">Assigned Branch</Label>
              <select
                id="link_branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Invite Link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteUrl}
                className="bg-muted/50 text-muted-foreground select-all text-xs"
              />
              <Button onClick={handleCopy} size="icon" className="shrink-0 active:scale-90 transition-transform">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-primary/5 border border-primary/10 p-3 rounded-lg leading-relaxed">
            💡 Send this link to your employee. They will be prompted to sign up and will be automatically added to your store (<strong>{business?.business_name}</strong>) as a <strong>{role}</strong>.
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
}
