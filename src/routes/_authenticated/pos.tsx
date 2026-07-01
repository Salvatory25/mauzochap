import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT, formatTZS } from "@/lib/i18n";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Minus, Trash2, Receipt as ReceiptIcon, Pause, Play, Ban, SplitSquareHorizontal, Camera } from "lucide-react";
import { toast } from "sonner";
import { Receipt } from "@/components/Receipt";
import { CameraScanner } from "@/components/CameraScanner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/pos")({
  component: POSPage,
});

type Product = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  sku: string | null;
  category_id: string | null;
  barcode: string | null;
  low_stock_threshold?: number;
};
type CartItem = Product & { qty: number };
type PaymentMethod = "cash" | "mobile_money" | "card" | "credit" | "bank";

function POSPage() {
  const t = useT();
  const qc = useQueryClient();
  const { user, branchId } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number | "">("");
  const [taxRate, setTaxRate] = useState<number | "">(""); // percentage
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  
  const [isSplit, setIsSplit] = useState(false);
  const [splitMethod1, setSplitMethod1] = useState<PaymentMethod>("cash");
  const [splitAmount1, setSplitAmount1] = useState<number | "">("");
  const [splitMethod2, setSplitMethod2] = useState<PaymentMethod>("card");
  const [splitAmount2, setSplitAmount2] = useState<number | "">("");

  const [customerId, setCustomerId] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasHeldSale, setHasHeldSale] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    setHasHeldSale(!!localStorage.getItem("held_sale"));
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ["products", branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(`
          id,name,price,sku,barcode,category_id,low_stock_threshold,
          branch_inventory!inner(stock_quantity)
        `)
        .eq("is_active", true)
        .eq("branch_inventory.branch_id", branchId!)
        .limit(5000);
        
      return (data ?? []).map((p: any) => ({
        ...p,
        stock_quantity: p.branch_inventory?.[0]?.stock_quantity || 0
      })) as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name").order("name");
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id,name").order("name");
      return data ?? [];
    },
  });

  const filtered = products.filter((p) => {
    const matchSearch =
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || "").includes(search);
    const matchCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  const displayProducts = filtered.slice(0, 50);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const taxableAmount = Math.max(0, subtotal - Number(discount || 0));
  const taxAmount = (taxableAmount * Number(taxRate || 0)) / 100;
  const total = taxableAmount + taxAmount;

  const addToCart = (p: Product) => {
    setCart((c) => {
      const existing = c.find((i) => i.id === p.id);
      if (existing) return c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((c) =>
      c
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0),
    );
  };

  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const cancelSale = () => {
    setCart([]);
    setDiscount("");
    setTaxRate("");
    setAmountPaid("");
    setIsSplit(false);
    setSplitAmount1("");
    setSplitAmount2("");
    setCustomerId("");
  };

  const holdSale = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    const held = { cart, discount, taxRate, customerId };
    localStorage.setItem("held_sale", JSON.stringify(held));
    setHasHeldSale(true);
    cancelSale();
    toast.success("Sale held successfully");
  };

  const resumeSale = () => {
    const data = localStorage.getItem("held_sale");
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      setCart(parsed.cart || []);
      setDiscount(parsed.discount || "");
      setTaxRate(parsed.taxRate || "");
      setCustomerId(parsed.customerId || "");
      localStorage.removeItem("held_sale");
      setHasHeldSale(false);
      toast.success("Sale resumed");
    } catch {
      toast.error("Failed to resume sale");
    }
  };

  const completeSale = async (isInvoice: boolean = false) => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!user) return;
    setSubmitting(true);
    try {
      const receiptNumber = isInvoice 
        ? `INV-${Date.now().toString().slice(-6)}` 
        : `R${Date.now().toString().slice(-8)}`;
      
      let finalAmountPaid = 0;
      let finalMethod = paymentMethod;
      let notes = null;

      if (isInvoice) {
        finalAmountPaid = 0;
        finalMethod = "credit";
      } else if (isSplit) {
        const a1 = Number(splitAmount1 || 0);
        const a2 = Number(splitAmount2 || 0);
        finalAmountPaid = a1 + a2;
        // The primary method is the one with the larger amount
        finalMethod = a1 >= a2 ? splitMethod1 : splitMethod2;
        notes = `Split Payment: ${splitMethod1} (${formatTZS(a1)}), ${splitMethod2} (${formatTZS(a2)})`;
      } else {
        finalAmountPaid = amountPaid === "" ? total : Number(amountPaid);
      }

      const status = isInvoice ? "pending" : "completed";

      const { data: sale, error } = await supabase
        .from("sales")
        .insert({
          receipt_number: receiptNumber,
          cashier_id: user.id,
          branch_id: branchId,
          customer_id: customerId || null,
          subtotal,
          discount: Number(discount || 0),
          tax: taxAmount,
          total,
          amount_paid: finalAmountPaid,
          payment_method: finalMethod,
          status,
          notes: notes
        })
        .select()
        .single();
      if (error) throw error;

      const items = cart.map((i) => ({
        sale_id: sale.id,
        product_id: i.id,
        product_name: i.name,
        quantity: i.qty,
        unit_price: i.price,
        line_total: i.price * i.qty,
      }));
      const { error: itemErr } = await supabase.from("sale_items").insert(items);
      if (itemErr) throw itemErr;

      // Generate Invoice automatically after sale items are successfully inserted
      let paymentStatus: "Paid" | "Partial" | "Unpaid" = "Unpaid";
      if (finalAmountPaid >= total) {
        paymentStatus = "Paid";
      } else if (finalAmountPaid > 0) {
        paymentStatus = "Partial";
      } else {
        paymentStatus = "Unpaid";
      }

      const { data: invoice, error: invoiceErr } = await supabase
        .from("invoices")
        .insert({
          sale_id: sale.id,
          customer_id: customerId || null,
          subtotal,
          discount: Number(discount || 0),
          tax: taxAmount,
          total_amount: total,
          amount_paid: finalAmountPaid,
          balance: Math.max(0, total - finalAmountPaid),
          payment_method: finalMethod,
          payment_status: paymentStatus,
          created_by: user.id,
          business_id: sale.business_id || undefined
        })
        .select()
        .single();

      if (invoiceErr) throw invoiceErr;

      const invoiceItems = cart.map((i) => ({
        invoice_id: invoice.id,
        product_id: i.id,
        quantity: i.qty,
        unit_price: i.price,
        subtotal: i.price * i.qty,
        business_id: sale.business_id || undefined
      }));

      const { error: invoiceItemErr } = await supabase.from("invoice_items").insert(invoiceItems);
      if (invoiceItemErr) throw invoiceItemErr;

      const lowStockItems = cart.filter(item => {
        const newStock = item.stock_quantity - item.qty;
        return newStock <= (item.low_stock_threshold || 5);
      });

      if (lowStockItems.length > 0) {
        toast.error(
          `Low Stock Alert: ${lowStockItems.map(i => i.name).join(", ")} are now running low!`,
          { duration: 10000 }
        );
      }

      toast.success("Sale completed and Invoice generated");
      setCompletedSale({ ...sale, items: cart });
      cancelSale();
      qc.invalidateQueries();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (completedSale) {
    return <Receipt sale={completedSale} onClose={() => setCompletedSale(null)} />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 -mx-2 lg:mx-0">
      {/* Products */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("pos")}</h1>
          {hasHeldSale && cart.length === 0 && (
            <Button variant="outline" onClick={resumeSale} className="border-warning text-warning hover:bg-warning/10">
              <Play className="h-4 w-4 mr-2" />
              Resume Held Sale
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = e.currentTarget.value.trim();
                  if (!val) return;
                  const exactMatch = products.find(p => 
                    (p.barcode || "").trim().toLowerCase() === val.toLowerCase() || 
                    (p.sku || "").trim().toLowerCase() === val.toLowerCase()
                  );
                  if (exactMatch) {
                    addToCart(exactMatch);
                    setSearch(""); // clear search to be ready for next scan
                    if (exactMatch.stock_quantity <= 0) {
                      toast.warning(`Added ${exactMatch.name} (Stock was 0)`);
                    } else {
                      toast.success(`Added ${exactMatch.name}`);
                    }
                  } else {
                    toast.error(`No product found for barcode: ${val}`);
                  }
                }
              }}
              placeholder={t("search")}
              className="pl-10"
              autoFocus
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setScannerOpen(true)}>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </Button>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm h-10 w-48"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto pr-1">
          {displayProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock_quantity <= 0}
              className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary hover:shadow-[var(--shadow-soft)] disabled:opacity-40 transition"
            >
              <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</div>
              <div className="mt-2 text-base font-bold">{formatTZS(Number(p.price))}</div>
              <div className="mt-1 text-xs text-muted-foreground">{p.stock_quantity} in stock</div>
            </button>
          ))}
          {displayProducts.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground py-10">
              {t("noData")}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="rounded-xl border border-border bg-card flex flex-col h-[calc(100vh-8rem)] sticky top-4">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">{t("cart")}</h2>
            <span className="text-xs text-muted-foreground">({cart.length})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={cancelSale} disabled={cart.length === 0} className="text-destructive h-8 px-2 hover:bg-destructive/10 hover:text-destructive">
            <Ban className="h-4 w-4 mr-1" /> Cancel
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {cart.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">{t("emptyCart")}</div>
          ) : (
            cart.map((i) => (
              <div key={i.id} className="px-4 py-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{formatTZS(i.price)}</div>
                </div>
                <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                  <Button size="icon" variant="ghost" onClick={() => updateQty(i.id, -1)} className="h-6 w-6 rounded-sm hover:bg-background">
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{i.qty}</span>
                  <Button size="icon" variant="ghost" onClick={() => updateQty(i.id, 1)} className="h-6 w-6 rounded-sm hover:bg-background">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeItem(i.id)} className="h-8 w-8 ml-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border p-4 space-y-3 bg-muted/20">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span>{formatTZS(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{t("discount")} (-)</span>
              <Input
                type="number"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-24 h-7 text-right bg-background"
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Tax (%)</span>
              <Input
                type="number"
                placeholder="0%"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-24 h-7 text-right bg-background"
              />
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>{t("total")}</span>
              <span className="text-primary">{formatTZS(total)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">{t("paymentMethod")}</Label>
              <button 
                onClick={() => setIsSplit(!isSplit)}
                className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded ${isSplit ? 'bg-primary/20 text-primary font-medium' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                <SplitSquareHorizontal className="h-3 w-3" /> Split
              </button>
            </div>

            {isSplit ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select value={splitMethod1} onChange={(e) => setSplitMethod1(e.target.value as PaymentMethod)} className="rounded-md border border-input bg-background px-2 text-xs w-2/5">
                    <option value="cash">Cash</option><option value="mobile_money">Mobile</option><option value="card">Card</option><option value="bank">Bank</option><option value="credit">Credit</option>
                  </select>
                  <Input type="number" placeholder="Amt 1" value={splitAmount1} onChange={(e) => setSplitAmount1(e.target.value === "" ? "" : Number(e.target.value))} className="h-8 flex-1 text-right text-sm" />
                </div>
                <div className="flex gap-2">
                  <select value={splitMethod2} onChange={(e) => setSplitMethod2(e.target.value as PaymentMethod)} className="rounded-md border border-input bg-background px-2 text-xs w-2/5">
                    <option value="cash">Cash</option><option value="mobile_money">Mobile</option><option value="card">Card</option><option value="bank">Bank</option><option value="credit">Credit</option>
                  </select>
                  <Input type="number" placeholder="Amt 2" value={splitAmount2} onChange={(e) => setSplitAmount2(e.target.value === "" ? "" : Number(e.target.value))} className="h-8 flex-1 text-right text-sm" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-1">
                  {(["cash", "mobile_money", "card", "credit", "bank"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`rounded-md border py-1.5 text-[10px] font-medium leading-tight transition-colors ${
                        paymentMethod === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                      title={m}
                    >
                      {m === "mobile_money" ? "Mobile" : m === "credit" ? "Credit" : m}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="">{t("walkIn")} Customer</option>
                    {customers.map((c: { id: string; name: string }) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder={`Paid: ${total}`}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-1/2 h-8 text-right text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={holdSale}
              disabled={submitting || cart.length === 0}
              variant="outline"
              className="w-1/4 h-11 px-0"
            >
              <Pause className="h-4 w-4 mr-1" />
              Hold
            </Button>
            <Button
              onClick={() => completeSale(true)}
              disabled={submitting || cart.length === 0}
              variant="outline"
              className="w-1/4 h-11 border-primary text-primary px-0"
            >
              Invoice
            </Button>
            <Button
              onClick={() => completeSale(false)}
              disabled={submitting || cart.length === 0}
              className="w-2/4 h-11 text-base shadow-md px-2"
              style={{ background: "var(--gradient-primary)" }}
            >
              {submitting ? "..." : `${t("completeSale")}`}
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={!!completedSale} onOpenChange={() => setCompletedSale(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          {completedSale && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-success/15 p-3 rounded-full">
                <ReceiptIcon className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-bold">Sale Completed</h2>
              <p className="text-muted-foreground">Receipt #{completedSale.receipt_number}</p>
              
              <div className="w-full mt-4 bg-muted p-4 rounded-md">
                <Receipt sale={completedSale} onClose={() => setCompletedSale(null)} />
              </div>

              <div className="flex gap-2 w-full mt-6">
                <Button className="w-full" variant="outline" onClick={() => window.print()}>
                  Print Receipt
                </Button>
                <Button className="w-full" onClick={() => setCompletedSale(null)}>
                  New Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <CameraScanner 
        open={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
        onScan={(code) => {
          const val = code.trim();
          const exactMatch = products.find(p => 
            (p.barcode || "").trim().toLowerCase() === val.toLowerCase() || 
            (p.sku || "").trim().toLowerCase() === val.toLowerCase()
          );
          if (exactMatch) {
            addToCart(exactMatch);
            if (exactMatch.stock_quantity <= 0) {
              toast.warning(`Added ${exactMatch.name} (Stock was 0)`);
            } else {
              toast.success(`Added ${exactMatch.name}`);
            }
          } else {
             toast.error(`No product found for barcode: ${code}`);
          }
          setScannerOpen(false);
        }} 
      />
    </div>
  );
}
