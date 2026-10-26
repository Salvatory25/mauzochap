import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT, formatTZS, formatDate } from "@/lib/i18n";
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
import { Plus, Pencil, Trash2, Banknote, Search, User, Phone, Mail, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
});

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
};

function CustomersPage() {
  const t = useT();
  const qc = useQueryClient();
  const { isManager } = useAuth();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);

  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("*").order("name");
      return (data ?? []) as Customer[];
    },
  });

  const filtered = customers.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const debtCustomers = customers.filter((c) => Number(c.balance || 0) > 0);
  const totalDebt = debtCustomers.reduce((acc, c) => acc + Number(c.balance || 0), 0);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["customers"] });
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-12">
      {/* Header and Add Customer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("customers")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{customers.length} {t("customers").toLowerCase()}</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)} className="w-full sm:w-auto h-10 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              {t("addCustomer")}
            </Button>
          </DialogTrigger>
          <CustomerDialog editing={editing} onClose={() => setOpen(false)} />
        </Dialog>
      </div>

      {/* Customer Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Jumla ya Wateja</div>
            <div className="text-lg sm:text-2xl font-bold">{customers.length}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Wateja Wenye Madeni</div>
            <div className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{debtCustomers.length}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <Banknote className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Jumla ya Madeni</div>
            <div className="text-lg sm:text-2xl font-bold text-destructive truncate">{formatTZS(totalDebt)}</div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t("search") + " wateja kwa jina au simu..."}
          className="pl-10 w-full sm:max-w-md h-10"
        />
      </div>

      {/* Mobile Customer Cards View (md:hidden) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("loading")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("noData")}
          </div>
        ) : (
          paginated.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-3.5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{c.name}</h3>
                    {c.phone ? (
                      <a href={`tel:${c.phone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors mt-0.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{c.phone}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">Bila namba</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">Salio</div>
                  <span
                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                      c.balance > 0 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium"
                    }`}
                  >
                    {formatTZS(Number(c.balance))}
                  </span>
                </div>
              </div>

              {c.email && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate pt-1 border-t border-border/40">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{c.email}</span>
                </div>
              )}

              {/* Action Buttons on Mobile */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-2.5"
                    onClick={() => setProfileCustomer(c)}
                  >
                    <User className="h-3.5 w-3.5 mr-1" /> Profile
                  </Button>
                  {c.balance > 0 && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => {
                        setPayingCustomer(c);
                        setPaymentOpen(true);
                      }}
                    >
                      <Banknote className="h-3.5 w-3.5 mr-1" />
                      Lipa Deni
                    </Button>
                  )}
                </div>
                {isManager && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditing(c);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (hidden on mobile, visible on md and up) */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">{t("phone")}</th>
              <th className="px-4 py-3 text-left">{t("email")}</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {t("loading")}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {t("noData")}
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        c.balance > 0 ? "text-warning font-semibold" : ""
                      }
                    >
                      {formatTZS(Number(c.balance))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-primary"
                      onClick={() => setProfileCustomer(c)}
                    >
                      <User className="h-4 w-4 mr-2" /> Profile
                    </Button>
                    {c.balance > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => {
                          setPayingCustomer(c);
                          setPaymentOpen(true);
                        }}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        {t("receivePayment")}
                      </Button>
                    )}
                    {isManager && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(c);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDelete(c.id)}
                        >
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
        <PaymentDialog customer={payingCustomer} onClose={() => setPaymentOpen(false)} />
      </Dialog>

      <Dialog open={!!profileCustomer} onOpenChange={(o) => !o && setProfileCustomer(null)}>
        <CustomerProfileDialog customer={profileCustomer} onClose={() => setProfileCustomer(null)} />
      </Dialog>
    </div>
  );
}

function CustomerDialog({ editing, onClose }: { editing: Customer | null; onClose: () => void }) {
  const t = useT();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    phone: editing?.phone ?? "",
    email: editing?.email ?? "",
    address: editing?.address ?? "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
      };

      const parsed = customerSchema.safeParse(payload);
      if (!parsed.success) {
        parsed.error.errors.forEach((err) => toast.error(err.message));
        return;
      }

      const { error } = editing
        ? await supabase.from("customers").update(payload).eq("id", editing.id)
        : await supabase.from("customers").insert(payload);
      if (error) throw error;
      toast.success(editing ? "Customer updated" : "Customer added");
      qc.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6">
      <DialogHeader>
        <DialogTitle>{editing ? t("edit") : t("addCustomer")}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>{t("phone")}</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label>{t("email")}</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <Label>Address</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
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

function PaymentDialog({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const t = useT();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<"cash" | "mobile_money" | "card" | "bank">("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!customer) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error("Invalid amount");
    setSaving(true);
    try {
      const { error } = await supabase.from("customer_payments").insert({
        customer_id: customer.id,
        amount: Number(amount),
        payment_method: method,
        notes: notes || null,
        received_by: user?.id,
      });
      if (error) throw error;
      toast.success("Payment recorded successfully");
      qc.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6">
      <DialogHeader>
        <DialogTitle>{t("receivePayment")}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-muted p-3 text-sm">
          <div className="text-muted-foreground">Customer</div>
          <div className="font-semibold">{customer.name}</div>
          <div className="flex justify-between mt-2 pt-2 border-t border-border">
            <span>Outstanding Balance</span>
            <span className="font-bold text-warning">{formatTZS(customer.balance)}</span>
          </div>
        </div>

        <div>
          <Label>{t("paymentAmount")} (TZS)</Label>
          <Input
            type="number"
            step="0.01"
            max={customer.balance}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
            autoFocus
          />
        </div>

        <div>
          <Label>{t("paymentMethod")}</Label>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["cash", "mobile_money", "card", "bank"] as const).map((m) => (
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
          <Label>Notes (Optional)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
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

function CustomerProfileDialog({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [tab, setTab] = useState<"purchases" | "payments" | "outstanding_invoices">("purchases");

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["customer-sales", customer?.id],
    enabled: !!customer,
    queryFn: async () => {
      const { data } = await supabase
        .from("sales")
        .select("*")
        .eq("customer_id", customer!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    }
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["customer-payments", customer?.id],
    enabled: !!customer,
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_payments")
        .select("*")
        .eq("customer_id", customer!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    }
  });

  const { data: outstandingInvoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ["customer-outstanding-invoices", customer?.id],
    enabled: !!customer && tab === "outstanding_invoices",
    queryFn: async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customer!.id)
        .gt("balance", 0)
        .order("created_at", { ascending: false });
      return data ?? [];
    }
  });

  if (!customer) return null;

  return (
    <DialogContent className="max-w-4xl w-[calc(100vw-1.5rem)] sm:w-full max-h-[88vh] flex flex-col p-3.5 sm:p-6 overflow-hidden">
      <DialogHeader>
        <DialogTitle className="text-lg sm:text-xl">Customer Profile</DialogTitle>
      </DialogHeader>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-border bg-muted/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
            {customer.name ? customer.name.charAt(0).toUpperCase() : "C"}
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-bold truncate">{customer.name}</h2>
            <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
              {customer.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{customer.phone}</span>}
              {customer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{customer.email}</span>}
              {customer.address && <span>{customer.address}</span>}
            </div>
          </div>
        </div>
        <div className="w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border flex justify-between sm:block sm:text-right">
          <div className="text-[11px] sm:text-xs text-muted-foreground">Current Balance</div>
          <div className={`text-base sm:text-2xl font-bold ${customer.balance > 0 ? "text-warning" : "text-success"}`}>
            {formatTZS(customer.balance)}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 border-b border-border mt-3 overflow-x-auto pb-1 text-xs sm:text-sm">
        <button
          onClick={() => setTab("purchases")}
          className={`px-3 py-1.5 font-medium border-b-2 whitespace-nowrap transition-colors ${tab === "purchases" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Purchase History
        </button>
        <button
          onClick={() => setTab("payments")}
          className={`px-3 py-1.5 font-medium border-b-2 whitespace-nowrap transition-colors ${tab === "payments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Payment History
        </button>
        <button
          onClick={() => setTab("outstanding_invoices")}
          className={`px-3 py-1.5 font-medium border-b-2 whitespace-nowrap transition-colors ${tab === "outstanding_invoices" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Outstanding Invoices
        </button>
      </div>

      <div className="flex-1 overflow-auto mt-2">
        {tab === "purchases" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[500px]">
              <thead className="bg-muted/50 sticky top-0 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 sm:px-4 py-2.5 text-left">Date</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left">Receipt</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right">Total</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right">Paid</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingSales ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs">Loading...</td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">No purchases found.</td></tr>
                ) : (
                  sales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">{formatDate(s.created_at)}</td>
                      <td className="px-3 sm:px-4 py-2.5 font-mono">{s.receipt_number}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right font-medium">{formatTZS(s.total)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-success">{formatTZS(s.amount_paid)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right capitalize">{s.payment_method}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "payments" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[460px]">
              <thead className="bg-muted/50 sticky top-0 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 sm:px-4 py-2.5 text-left">Date</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right">Amount Paid</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right">Method</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left pl-6 sm:pl-8">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingPayments ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs">Loading...</td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-xs">No payments found.</td></tr>
                ) : (
                  payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right font-medium text-success">+{formatTZS(p.amount)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right capitalize">{p.payment_method.replace("_", " ")}</td>
                      <td className="px-3 sm:px-4 py-2.5 pl-6 sm:pl-8 text-muted-foreground text-[11px]">{p.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "outstanding_invoices" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[500px]">
              <thead className="bg-muted/50 sticky top-0 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 sm:px-4 py-2.5 text-left">Invoice Number</th>
                  <th className="px-3 sm:px-4 py-2.5 text-left">Date</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right">Total</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right">Paid</th>
                  <th className="px-3 sm:px-4 py-2.5 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingInvoices ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs">Loading...</td></tr>
                ) : outstandingInvoices.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">No outstanding invoices found.</td></tr>
                ) : (
                  outstandingInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-muted/30">
                      <td className="px-3 sm:px-4 py-2.5 font-semibold text-primary">{inv.invoice_number}</td>
                      <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">{formatDate(inv.created_at)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right font-medium">{formatTZS(inv.total_amount)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-success">{formatTZS(inv.amount_paid)}</td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-warning font-semibold">{formatTZS(inv.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="pt-3 border-t border-border flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>Close Profile</Button>
      </div>
    </DialogContent>
  );
}
