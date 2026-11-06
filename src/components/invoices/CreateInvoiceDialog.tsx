import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatTZS, formatDate } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Calendar,
  User,
  Package,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessLogo } from "@/lib/business-logo";
import { LogoUploader } from "@/components/LogoUploader";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: (invoiceId: string) => void;
}

interface InvoiceLineItemDraft {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  onInvoiceCreated,
}: CreateInvoiceDialogProps) {
  const { business, user } = useAuth();
  const qc = useQueryClient();
  const { logo } = useBusinessLogo(business?.id);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    return `INV-${year}-${randomSuffix}`;
  });

  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // Default 14 days net
    return d.toISOString().split("T")[0];
  });

  // Customer State
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");

  // Line items state
  const [items, setItems] = useState<InvoiceLineItemDraft[]>([
    {
      id: "item-1",
      productId: null,
      name: "",
      quantity: 1,
      unitPrice: 0,
    },
  ]);

  // Financials State
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0 or 18%
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "bank" | "credit">("cash");
  const [notes, setNotes] = useState<string>(
    "Asante kwa kufanya biashara nasi! Malipo yafanyike ndani ya siku za makubaliano kabla ya tarehe ya mwisho.",
  );
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch available products from inventory
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-invoicing", business?.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity, sku, unit")
        .order("name");
      if (error) return [];
      return data || [];
    },
  });

  // 2. Fetch existing customers
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-for-invoicing", business?.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email, address")
        .order("name");
      if (error) return [];
      return data || [];
    },
  });

  // Filtered customer list for dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.email || "").toLowerCase().includes(q),
    );
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Line item helpers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: null,
        name: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("Ankara lazima iwe na angalau bidhaa au huduma moja.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSelectProduct = (itemId: string, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId: prod.id,
              name: prod.name,
              unitPrice: Number(prod.price) || 0,
            }
          : item,
      ),
    );
  };

  const handleUpdateItem = (
    itemId: string,
    field: "name" | "quantity" | "unitPrice",
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          [field]: field === "quantity" || field === "unitPrice" ? Number(value) || 0 : value,
        };
      }),
    );
  };

  // Computations
  const subtotal = useMemo(() => {
    return items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    if (taxRate <= 0) return 0;
    const taxableBase = Math.max(0, subtotal - (Number(discountAmount) || 0));
    return Math.round((taxableBase * taxRate) / 100);
  }, [subtotal, discountAmount, taxRate]);

  const totalAmount = useMemo(() => {
    const rawTotal = subtotal - (Number(discountAmount) || 0) + taxAmount;
    return Math.max(0, rawTotal);
  }, [subtotal, discountAmount, taxAmount]);

  const balanceDue = useMemo(() => {
    const rawBalance = totalAmount - (Number(amountPaid) || 0);
    return Math.max(0, rawBalance);
  }, [totalAmount, amountPaid]);

  const paymentStatus = useMemo(() => {
    if (totalAmount === 0) return "Paid";
    if (amountPaid >= totalAmount) return "Paid";
    if (amountPaid > 0) return "Partial";
    return "Unpaid";
  }, [totalAmount, amountPaid]);

  // Set paid shortcuts
  const handleSetPaidShortcut = (type: "zero" | "half" | "full") => {
    if (type === "zero") setAmountPaid(0);
    else if (type === "half") setAmountPaid(Math.round(totalAmount / 2));
    else if (type === "full") setAmountPaid(totalAmount);
  };

  // Due date shortcuts
  const handleSetDueDateDays = (days: number) => {
    const d = new Date(issueDate);
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split("T")[0]);
  };

  // Submission handler
  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!invoiceNumber.trim()) {
      return toast.error("Weka namba ya ankara (Invoice Number)");
    }

    // Customer resolution
    let finalCustomerId = selectedCustomerId || null;
    let finalCustomerName = selectedCustomer?.name || "";

    if (isNewCustomer) {
      if (!newCustomerName.trim()) {
        return toast.error("Weka jina la mteja mpya.");
      }
      finalCustomerName = newCustomerName.trim();
    } else if (!finalCustomerId) {
      if (!newCustomerName.trim()) {
        finalCustomerName = "Walk-in Customer";
      }
    }

    // Items validation
    const validItems = items.filter((i) => i.name.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      return toast.error("Weka angalau bidhaa moja au huduma yenye idadi na bei sahihi.");
    }

    setSubmitting(true);
    try {
      // 1. If brand new customer was entered, insert into customers table first
      if (isNewCustomer && newCustomerName.trim()) {
        const { data: newCust, error: custErr } = await supabase
          .from("customers")
          .insert({
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim() || null,
            email: newCustomerEmail.trim() || null,
            address: newCustomerAddress.trim() || null,
            business_id: business?.id,
          })
          .select("id")
          .single();

        if (!custErr && newCust) {
          finalCustomerId = newCust.id;
        }
      }

      // 1.5 Create linked sale record to keep accounting, cash flow & reports 100% in sync
      let linkedSaleId: string | null = null;
      try {
        const { data: saleData } = await supabase
          .from("sales")
          .insert({
            receipt_number: invoiceNumber.trim(),
            cashier_id: user?.id,
            customer_id: finalCustomerId,
            business_id: business?.id,
            subtotal,
            discount: Number(discountAmount) || 0,
            tax: taxAmount,
            total: totalAmount,
            amount_paid: Number(amountPaid) || 0,
            payment_method: paymentMethod,
            status: paymentStatus === "Paid" ? "completed" : "pending",
            notes: notes ? `${notes} (Invoice #${invoiceNumber})` : `Invoice #${invoiceNumber}`,
          } as any)
          .select("id")
          .single();

        if (saleData?.id) {
          linkedSaleId = saleData.id;

          const saleItemsPayload = validItems
            .filter((i) => i.productId)
            .map((item) => ({
              sale_id: saleData.id,
              product_id: item.productId,
              product_name: item.name,
              quantity: Number(item.quantity) || 1,
              unit_price: Number(item.unitPrice) || 0,
              line_total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
            }));

          if (saleItemsPayload.length > 0) {
            await supabase.from("sale_items").insert(saleItemsPayload as any);
          }
        }
      } catch (saleErr) {
        console.warn("Notice: sale record creation skipped or handled by invoice:", saleErr);
      }

      // 2. Insert into invoices table
      const invoicePayload: any = {
        invoice_number: invoiceNumber.trim(),
        sale_id: linkedSaleId,
        customer_id: finalCustomerId,
        business_id: business?.id,
        created_by: user?.id,
        subtotal,
        discount: Number(discountAmount) || 0,
        tax: taxAmount,
        total_amount: totalAmount,
        amount_paid: Number(amountPaid) || 0,
        balance: balanceDue,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        created_at: `${issueDate}T12:00:00Z`,
        updated_at: new Date().toISOString(),
      };

      const { data: insertedInvoice, error: invErr } = await supabase
        .from("invoices")
        .insert(invoicePayload)
        .select("id")
        .single();

      if (invErr) throw invErr;

      // 3. Insert invoice line items
      const itemsPayload = validItems.map((item) => ({
        invoice_id: insertedInvoice.id,
        business_id: business?.id,
        product_id: item.productId || null,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unitPrice) || 0,
        subtotal: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      }));

      const { error: itemsErr } = await supabase.from("invoice_items").insert(itemsPayload);
      if (itemsErr) {
        console.warn("Notice inserting invoice items:", itemsErr);
      }

      toast.success(`Ankara #${invoiceNumber} imetengenezwa kikamilifu!`);

      // Refresh queries
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["invoices"] }),
        qc.invalidateQueries({ queryKey: ["customers"] }),
        qc.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      ]);

      // Reset form & close
      onInvoiceCreated?.(insertedInvoice.id);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      toast.error(err?.message || "Imeshindwa kuhifadhi ankara. Tafadhali jaribu tena.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Professional Tax Invoice Creator</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight">
                Unda Ankara Mpya (Create Invoice)
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Tengeneza ankara ya kodi yenye nembo ya duka lako, orodha ya bidhaa, kodi (VAT), na masharti ya malipo.
              </p>
            </div>

            {/* Logo Widget */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              {logo ? (
                <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border">
                  <img
                    src={logo}
                    alt="Store Logo"
                    className="w-8 h-8 object-contain rounded bg-white p-0.5 border"
                  />
                  <div className="text-[11px] leading-tight">
                    <div className="font-bold text-foreground">Logo Ipo</div>
                    <div className="text-muted-foreground text-[10px]">Itaonekana kwenye ankara</div>
                  </div>
                </div>
              ) : (
                <LogoUploader compact businessId={business?.id} />
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmitInvoice} className="space-y-6 pt-2">
          {/* Section 1: Meta Information (Number & Dates) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/20 p-3.5 rounded-xl border border-border/60">
            <div>
              <Label className="text-xs font-bold">Namba ya Ankara (Invoice #)</Label>
              <Input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="mt-1 font-mono font-bold text-xs sm:text-sm bg-background"
                placeholder="INV-2026-0001"
              />
            </div>
            <div>
              <Label className="text-xs font-bold">Tarehe ya Kutolewa (Issue Date)</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="mt-1 text-xs sm:text-sm bg-background"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Tarehe ya Mwisho (Due Date)</Label>
                <div className="flex gap-1 text-[10px] text-primary">
                  <button
                    type="button"
                    onClick={() => handleSetDueDateDays(0)}
                    className="hover:underline cursor-pointer"
                  >
                    Leo
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => handleSetDueDateDays(7)}
                    className="hover:underline cursor-pointer"
                  >
                    +7d
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => handleSetDueDateDays(14)}
                    className="hover:underline cursor-pointer font-bold"
                  >
                    +14d
                  </button>
                </div>
              </div>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="mt-1 text-xs sm:text-sm bg-background"
              />
            </div>
          </div>

          {/* Section 2: Customer Selection */}
          <div className="space-y-2 border border-border p-4 rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Mteja Anayepewa Ankara (Billed To)</span>
              </Label>
              <button
                type="button"
                onClick={() => {
                  setIsNewCustomer(!isNewCustomer);
                  setSelectedCustomerId("");
                }}
                className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                {isNewCustomer ? "← Chagua Mteja Aliyepo" : "+ Weka Mteja Mpya"}
              </button>
            </div>

            {isNewCustomer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <Label className="text-[11px]">Jina Kamili la Mteja / Kampuni *</Label>
                  <Input
                    type="text"
                    placeholder="mfano: Bakari Juma au Vodacom Tanzania"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    required
                    className="mt-1 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Namba ya Simu</Label>
                  <Input
                    type="tel"
                    placeholder="0712345678"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="mt-1 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Barua Pepe (Email)</Label>
                  <Input
                    type="email"
                    placeholder="mteja@gmail.com"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className="mt-1 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Mahali / Anuani / TIN</Label>
                  <Input
                    type="text"
                    placeholder="Kariakoo, Dar es Salaam (TIN: 123-456-789)"
                    value={newCustomerAddress}
                    onChange={(e) => setNewCustomerAddress(e.target.value)}
                    className="mt-1 text-xs sm:text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm h-10"
                    >
                      <option value="">-- Chagua Mteja kutoka Orodha (au Walk-in) --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Tafuta mteja kwa jina au namba..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="text-xs sm:text-sm h-10"
                    />
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="bg-muted/40 p-2.5 rounded-lg text-xs flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground border border-border/50">
                    <div>
                      Mteja: <strong className="text-foreground">{selectedCustomer.name}</strong>
                    </div>
                    {selectedCustomer.phone && (
                      <div>
                        Simu: <strong className="text-foreground">{selectedCustomer.phone}</strong>
                      </div>
                    )}
                    {selectedCustomer.email && <div>Email: {selectedCustomer.email}</div>}
                    {selectedCustomer.address && <div>Mahali: {selectedCustomer.address}</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Line Items */}
          <div className="space-y-3 border border-border p-4 rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" />
                <span>Orodha ya Bidhaa au Huduma (Line Items)</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-xs font-bold gap-1 h-8"
              >
                <Plus className="w-3.5 h-3.5" /> Ongeza Bidhaa
              </Button>
            </div>

            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-bold uppercase text-muted-foreground px-2">
                <div className="col-span-5">Bidhaa / Maelezo</div>
                <div className="col-span-2 text-right">Idadi (Qty)</div>
                <div className="col-span-2 text-right">Bei ya Kipande (TZS)</div>
                <div className="col-span-2 text-right">Jumla (TZS)</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, index) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-muted/20 p-2.5 rounded-lg border border-border/60"
                  >
                    {/* Product picker / custom title */}
                    <div className="col-span-5 space-y-1">
                      <div className="flex gap-1.5">
                        <select
                          value={item.productId || ""}
                          onChange={(e) => handleSelectProduct(item.id, e.target.value)}
                          className="w-1/2 rounded-md border border-input bg-background px-2 py-1 text-xs h-8"
                        >
                          <option value="">-- Chagua Stoo --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatTZS(p.price)})
                            </option>
                          ))}
                        </select>
                        <Input
                          type="text"
                          placeholder="Jina au maelezo ya huduma..."
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                          required
                          className="flex-1 text-xs h-8"
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity || ""}
                        onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                        required
                        className="text-right text-xs h-8 font-mono"
                        placeholder="Qty"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice || ""}
                        onChange={(e) => handleUpdateItem(item.id, "unitPrice", e.target.value)}
                        required
                        className="text-right text-xs h-8 font-mono"
                        placeholder="Bei"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="col-span-2 text-right font-mono font-bold text-xs sm:text-sm text-foreground">
                      {formatTZS(lineTotal)}
                    </div>

                    {/* Delete button */}
                    <div className="col-span-1 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Ondoa bidhaa hii"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Financials & Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment & Terms Section */}
            <div className="space-y-3 bg-muted/10 border border-border p-4 rounded-xl">
              <div>
                <Label className="text-xs font-bold">Njia ya Malipo (Payment Method)</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm h-9"
                >
                  <option value="cash">Pesa Taslimu (Cash)</option>
                  <option value="mobile_money">Mitandao (M-Pesa / TigoPesa / Airtel)</option>
                  <option value="bank">Benki (Bank Transfer / CRDB / NMB)</option>
                  <option value="credit">Deni / Ankara Isiyolipwa (Credit)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Kiasi Kilicholipwa Sasa (Amount Paid)</Label>
                  <div className="flex gap-1 text-[10px] text-primary">
                    <button
                      type="button"
                      onClick={() => handleSetPaidShortcut("zero")}
                      className="hover:underline cursor-pointer"
                    >
                      Bila (0)
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => handleSetPaidShortcut("half")}
                      className="hover:underline cursor-pointer"
                    >
                      50%
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => handleSetPaidShortcut("full")}
                      className="hover:underline cursor-pointer font-bold"
                    >
                      100% Yote
                    </button>
                  </div>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={amountPaid || ""}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  className="mt-1 font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400"
                  placeholder="0"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Maelezo na Masharti (Notes & Terms)</Label>
                <Textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 text-xs resize-none"
                  placeholder="Maelezo maalum kwa mteja, namba ya akaunti ya benki au Lipa Namba..."
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 bg-muted/30 border border-border p-4 rounded-xl flex flex-col justify-between">
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Jumla Ndogo (Subtotal):</span>
                  <span className="font-mono font-bold text-foreground">{formatTZS(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground">Punguzo (Discount TZS):</span>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={discountAmount || ""}
                    onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                    className="w-28 text-right font-mono text-xs h-7"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground">Kodi ya Ongezeko (VAT):</span>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                    className="rounded border border-input bg-background px-2 py-0.5 text-xs h-7"
                  >
                    <option value="0">0% (Bila Kodi)</option>
                    <option value="18">18% (Tanzania VAT)</option>
                  </select>
                </div>

                {taxAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Kiasi cha Kodi (VAT Amount):</span>
                    <span className="font-mono">{formatTZS(taxAmount)}</span>
                  </div>
                )}

                <div className="border-t border-border pt-2 flex justify-between items-center text-base font-black">
                  <span>JUMLA KUU (TOTAL):</span>
                  <span className="text-primary font-mono text-lg">{formatTZS(totalAmount)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Kiasi Kilicholipwa:</span>
                  <span className="font-mono">{formatTZS(amountPaid)}</span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed">
                  <span className="font-bold">Baki / Deni (Balance Due):</span>
                  <span
                    className={`font-mono font-bold ${
                      balanceDue > 0 ? "text-destructive text-sm" : "text-muted-foreground"
                    }`}
                  >
                    {formatTZS(balanceDue)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    paymentStatus === "Paid"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : paymentStatus === "Partial"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hali ya Ankara: {paymentStatus}</span>
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4 flex flex-col sm:flex-row gap-2 justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Ghairi (Cancel)
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-primary text-primary-foreground font-black px-6 shadow-sm gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Inahifadhi...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" /> Hifadhi na Toa Ankara
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
