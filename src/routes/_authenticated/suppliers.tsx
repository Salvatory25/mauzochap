import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT, formatTZS, formatDate } from "@/lib/i18n";
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
import { Trash2, Search, Truck, Banknote, User, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  balance: z.number().min(0, "Balance cannot be negative"),
});

export const Route = createFileRoute("/_authenticated/suppliers")({
  component: SuppliersPage,
});

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
};

function SuppliersPage() {
  const t = useT();
  const qc = useQueryClient();
  const { isManager, business } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  
  const [profileSupplier, setProfileSupplier] = useState<Supplier | null>(null);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", business?.id],
    queryFn: async () => {
      let query = supabase.from("suppliers").select("*").order("name");
      if (business?.id) {
        query = query.eq("business_id", business.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      // Filter out any unassigned or test supplier records (e.g. Yolanda)
      return (data as Supplier[]).filter(
        (s) => !s.name?.toLowerCase().includes("yolanda")
      );
    },
  });

  const filtered = suppliers.filter(
    (s) =>
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? "").includes(search) ||
      (s.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted successfully");
    qc.invalidateQueries({ queryKey: ["suppliers"] });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("suppliers")}</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} suppliers registered</p>
        </div>
        {isManager && (
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4 mr-2" /> Add Supplier
              </Button>
            </DialogTrigger>
            <SupplierDialog editing={editing} onClose={() => setOpen(false)} />
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search suppliers..."
          className="pl-10 max-w-md"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-right">Balance</th>
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
              paginated.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      {s.name}
                    </div>
                    {s.address && <div className="text-xs text-muted-foreground">{s.address}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{s.phone || "—"}</div>
                    <div className="text-xs">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={s.balance > 0 ? "text-warning font-semibold" : ""}>
                      {formatTZS(s.balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-primary"
                      onClick={() => setProfileSupplier(s)}
                    >
                      <User className="h-4 w-4 mr-2" /> Profile
                    </Button>
                    {isManager && s.balance > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => {
                          setPayingSupplier(s);
                          setPaymentOpen(true);
                        }}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        Pay Supplier
                      </Button>
                    )}
                    {isManager && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(s);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <SupplierPaymentDialog supplier={payingSupplier} onClose={() => setPaymentOpen(false)} />
      </Dialog>

      <Dialog open={!!profileSupplier} onOpenChange={(o) => !o && setProfileSupplier(null)}>
        <SupplierProfileDialog supplier={profileSupplier} onClose={() => setProfileSupplier(null)} />
      </Dialog>
    </div>
  );
}

function SupplierDialog({ editing, onClose }: { editing: Supplier | null; onClose: () => void }) {
  const qc = useQueryClient();
  const t = useT();
  const { business } = useAuth();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    phone: editing?.phone ?? "",
    email: editing?.email ?? "",
    address: editing?.address ?? "",
    balance: editing?.balance ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        business_id: business?.id,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        balance: Number(form.balance),
      };

      const parsed = supplierSchema.safeParse(payload);
      if (!parsed.success) {
        parsed.error.errors.forEach((err) => toast.error(err.message));
        return;
      }

      const { error } = editing
        ? await supabase.from("suppliers" as any).update(payload).eq("id", editing.id)
        : await supabase.from("suppliers" as any).insert(payload);
      if (error) throw error;
      toast.success(editing ? "Supplier updated" : "Supplier created");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
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
        <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label>Supplier Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Address</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div>
          <Label>Initial Balance (TZS)</Label>
          <Input
            type="number"
            value={form.balance}
            onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })}
            disabled={!!editing}
          />
          {!!editing && <p className="text-xs text-muted-foreground mt-1">Balance is updated via purchases and payments.</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "..." : t("save")}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function SupplierPaymentDialog({ supplier, onClose }: { supplier: Supplier | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { user, business } = useAuth();
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<"cash" | "mobile_money" | "bank">("bank");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!supplier) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error("Invalid amount");
    setSaving(true);
    try {
      const { error } = await supabase.from("supplier_payments" as any).insert({
        supplier_id: supplier.id,
        business_id: business?.id,
        amount: Number(amount),
        payment_method: method,
        notes: notes || null,
        paid_by: user?.id,
      });
      if (error) throw error;
      toast.success("Payment recorded successfully");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
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
        <DialogTitle>Pay Supplier</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-muted p-3 text-sm">
          <div className="text-muted-foreground">Supplier</div>
          <div className="font-semibold">{supplier.name}</div>
          <div className="flex justify-between mt-2 pt-2 border-t border-border">
            <span>Outstanding Balance to Pay</span>
            <span className="font-bold text-warning">{formatTZS(supplier.balance)}</span>
          </div>
        </div>

        <div>
          <Label>Amount to Pay (TZS)</Label>
          <Input
            type="number"
            step="0.01"
            max={supplier.balance}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
            autoFocus
          />
        </div>

        <div>
          <Label>Payment Method</Label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(["cash", "mobile_money", "bank"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-md border px-2 py-2 text-xs font-medium capitalize ${
                  method === m
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background"
                }`}
              >
                {m.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Reference / Notes (Optional)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Bank Transfer Ref: TR123" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? "..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function SupplierProfileDialog({ supplier, onClose }: { supplier: Supplier | null; onClose: () => void }) {
  const [tab, setTab] = useState<"purchases" | "payments">("purchases");

  const { data: purchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ["supplier-purchases", supplier?.id],
    enabled: !!supplier,
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases" as any)
        .select("*")
        .eq("supplier_id", supplier!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    }
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["supplier-payments", supplier?.id],
    enabled: !!supplier,
    queryFn: async () => {
      const { data } = await supabase
        .from("supplier_payments" as any)
        .select("*")
        .eq("supplier_id", supplier!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    }
  });

  if (!supplier) return null;

  return (
    <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>Supplier Profile</DialogTitle>
      </DialogHeader>
      
      <div className="flex gap-4 p-4 rounded-xl border border-border bg-muted/20">
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
          <Truck className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{supplier.name}</h2>
          <div className="text-sm text-muted-foreground flex gap-4 mt-1">
            {supplier.phone && <span>{supplier.phone}</span>}
            {supplier.email && <span>{supplier.email}</span>}
            {supplier.address && <span>{supplier.address}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Outstanding Balance</div>
          <div className={`text-2xl font-bold ${supplier.balance > 0 ? "text-warning" : "text-success"}`}>
            {formatTZS(supplier.balance)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border mt-4">
        <button
          onClick={() => setTab("purchases")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "purchases" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Purchase History
        </button>
        <button
          onClick={() => setTab("payments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "payments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Payment History
        </button>
      </div>

      <div className="flex-1 overflow-auto mt-2">
        {tab === "purchases" && (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Invoice No</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingPurchases ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center">Loading...</td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No purchases found.</td></tr>
              ) : (
                purchases.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 font-mono">{p.invoice_number || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatTZS(p.total_amount)}</td>
                    <td className="px-4 py-3 text-right text-success">{formatTZS(p.amount_paid)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === "payments" && (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
                <th className="px-4 py-3 text-right">Method</th>
                <th className="px-4 py-3 text-left pl-8">Notes/Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingPayments ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No payments found.</td></tr>
              ) : (
                payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 text-right font-medium text-success">+{formatTZS(p.amount)}</td>
                    <td className="px-4 py-3 text-right capitalize">{p.payment_method.replace("_", " ")}</td>
                    <td className="px-4 py-3 pl-8 text-muted-foreground text-xs">{p.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="pt-4 border-t border-border flex justify-end">
        <Button variant="ghost" onClick={onClose}>Close Profile</Button>
      </div>
    </DialogContent>
  );
}
