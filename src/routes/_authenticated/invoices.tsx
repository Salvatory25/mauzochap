import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Printer, 
  Download, 
  Mail, 
  Share2, 
  Trash2, 
  Eye, 
  Calendar as CalendarIcon, 
  Copy,
  Receipt,
  FileText,
  TrendingUp,
  CreditCard,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/_authenticated/invoices")({
  component: InvoicesPage,
});

type InvoiceItem = {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products?: {
    name: string;
    sku: string | null;
    unit: string | null;
  } | null;
};

type Invoice = {
  id: string;
  invoice_number: string;
  sale_id: string;
  customer_id: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_method: string;
  payment_status: "Paid" | "Partial" | "Unpaid";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  profiles?: {
    full_name: string | null;
  } | null;
  invoice_items?: InvoiceItem[];
};

type DateFilter = "today" | "week" | "month" | "all";

function InvoicesPage() {
  const t = useT();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { isAdmin, isManager, user, business } = useAuth();
  
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<"a4" | "thermal">("a4");
  
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  // Fetch Invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", dateFilter, statusFilter],
    queryFn: async () => {
      let startDate = new Date(0).toISOString();
      const now = new Date();
      if (dateFilter === "today") {
        startDate = new Date(now.setHours(0,0,0,0)).toISOString();
      } else if (dateFilter === "week") {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
      } else if (dateFilter === "month") {
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
      }

      let q = supabase
        .from("invoices")
        .select(`
          *,
          customers(name, phone, email, address),
          profiles:created_by(full_name),
          invoice_items(
            id, product_id, quantity, unit_price, subtotal,
            products(name, sku, unit, cost_price)
          )
        `)
        .gte("created_at", startDate)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        q = q.eq("payment_status", statusFilter);
      }

      const { data, error } = await q;
      if (error) {
        toast.error("Failed to load invoices");
        throw error;
      }
      return (data ?? []) as unknown as Invoice[];
    },
  });

  // Search Filter
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchNumber = (inv.invoice_number || "").toLowerCase().includes(search.toLowerCase());
      const matchCustomer = (inv.customers?.name || "Walk-in Customer")
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchNumber || matchCustomer;
    });
  }, [invoices, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalCount = filtered.length;
    const totalBilled = filtered.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
    const totalPaid = filtered.reduce((acc, curr) => acc + Number(curr.amount_paid), 0);
    const totalOutstanding = filtered.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const paidCount = filtered.filter(i => i.payment_status === "Paid").length;
    const partialCount = filtered.filter(i => i.payment_status === "Partial").length;
    const unpaidCount = filtered.filter(i => i.payment_status === "Unpaid").length;

    return {
      totalCount,
      totalBilled,
      totalPaid,
      totalOutstanding,
      paidCount,
      partialCount,
      unpaidCount
    };
  }, [filtered]);

  // Invoice Deletion (Admin only)
  const handleDelete = async (invoiceId: string, saleId: string) => {
    if (!confirm("Are you sure you want to delete this invoice? This will also remove the linked sale.")) return;
    try {
      // Deleting the sale will cascade delete the invoice and invoice_items
      const { error } = await supabase.from("sales").delete().eq("id", saleId);
      if (error) throw error;
      toast.success("Invoice and linked sale deleted");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      if (selectedInvoice?.id === invoiceId) {
        setDetailOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete invoice");
    }
  };

  const getFilterLabel = () => {
    if (dateFilter === "today") return "Today";
    if (dateFilter === "week") return "Last 7 Days";
    if (dateFilter === "month") return "Last 30 Days";
    return "All Time";
  };

  // PDF Export
  const downloadPDF = (invoice: Invoice) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const businessName = business?.business_name || "MauzoChap System";
      
      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 38, "F");

      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(businessName.toUpperCase(), 14, 18);
      
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text("Professional Invoice Management", 14, 26);

      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("INVOICE", doc.internal.pageSize.getWidth() - 50, 18);

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`#${invoice.invoice_number}`, doc.internal.pageSize.getWidth() - 50, 26);

      // Business & Invoice Info
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text("Date:", 14, 48);
      doc.text(formatDate(invoice.created_at), 35, 48);

      doc.text("Cashier:", 14, 54);
      doc.text(invoice.profiles?.full_name || "System", 35, 54);

      doc.text("Billed To:", doc.internal.pageSize.getWidth() - 85, 48);
      doc.setFont("Helvetica", "bold");
      doc.text(invoice.customers?.name || "Walk-in Customer", doc.internal.pageSize.getWidth() - 85, 54);
      doc.setFont("Helvetica", "normal");
      
      if (invoice.customers?.phone) {
        doc.text(`Phone: ${invoice.customers.phone}`, doc.internal.pageSize.getWidth() - 85, 60);
      }
      if (invoice.customers?.email) {
        doc.text(`Email: ${invoice.customers.email}`, doc.internal.pageSize.getWidth() - 85, 66);
      }

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 72, doc.internal.pageSize.getWidth() - 14, 72);

      // Table Items
      const tableColumns = ["Product Description", "Qty", "Unit Price (TZS)", "Total (TZS)"];
      const tableRows = (invoice.invoice_items || []).map((item) => [
        item.products?.name || "Unknown Product",
        item.quantity,
        formatTZS(item.unit_price),
        formatTZS(item.subtotal),
      ]);

      autoTable(doc, {
        startY: 78,
        head: [tableColumns],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      let finalY = (doc as any).lastAutoTable.finalY || 80;

      // Totals
      doc.setFont("Helvetica", "normal");
      doc.text("Subtotal:", doc.internal.pageSize.getWidth() - 85, finalY + 12);
      doc.text(formatTZS(invoice.subtotal), doc.internal.pageSize.getWidth() - 35, finalY + 12, { align: "right" });

      if (invoice.discount > 0) {
        doc.text("Discount:", doc.internal.pageSize.getWidth() - 85, finalY + 18);
        doc.text(`-${formatTZS(invoice.discount)}`, doc.internal.pageSize.getWidth() - 35, finalY + 18, { align: "right" });
      }

      if (invoice.tax > 0) {
        doc.text("Tax:", doc.internal.pageSize.getWidth() - 85, finalY + 24);
        doc.text(formatTZS(invoice.tax), doc.internal.pageSize.getWidth() - 35, finalY + 24, { align: "right" });
      }

      doc.setFont("Helvetica", "bold");
      doc.text("Total Amount:", doc.internal.pageSize.getWidth() - 85, finalY + 30);
      doc.text(formatTZS(invoice.total_amount), doc.internal.pageSize.getWidth() - 35, finalY + 30, { align: "right" });

      doc.text("Amount Paid:", doc.internal.pageSize.getWidth() - 85, finalY + 36);
      doc.setTextColor(16, 185, 129); // Green
      doc.text(formatTZS(invoice.amount_paid), doc.internal.pageSize.getWidth() - 35, finalY + 36, { align: "right" });

      doc.setTextColor(15, 23, 42);
      doc.text("Balance Due:", doc.internal.pageSize.getWidth() - 85, finalY + 42);
      if (invoice.balance > 0) {
        doc.setTextColor(239, 68, 68); // Red
      }
      doc.text(formatTZS(invoice.balance), doc.internal.pageSize.getWidth() - 35, finalY + 42, { align: "right" });

      // QR Code
      const qrData = encodeURIComponent(`Invoice: ${invoice.invoice_number}\nTotal: ${invoice.total_amount}\nBalance: ${invoice.balance}`);
      doc.addImage(
        `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`,
        "JPEG",
        14,
        finalY + 10,
        30,
        30
      );
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(8);
      doc.setFont("Helvetica", "normal");
      doc.text("Scan to verify", 14, finalY + 43);

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.text(`Thank you for your business! Asante!`, doc.internal.pageSize.getWidth() / 2, pageHeight - 15, { align: "center" });
      doc.text(`Powered by MauzoChap POS`, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: "center" });

      doc.save(`Invoice_${invoice.invoice_number}.pdf`);
      toast.success("PDF Downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  // Sharing handlers
  const shareWhatsApp = (invoice: Invoice) => {
    const text = `Hello *${invoice.customers?.name || "Customer"}*,\n\nHere is your invoice *#${invoice.invoice_number}* from *${business?.business_name || "MauzoChap Store"}*.\n\n*Invoice Summary:*\n- Total: *${formatTZS(invoice.total_amount)}*\n- Paid: *${formatTZS(invoice.amount_paid)}*\n- Balance Due: *${invoice.balance > 0 ? `_${formatTZS(invoice.balance)}_ ⚠️` : `_No outstanding balance_`}\n- Status: *${invoice.payment_status}*\n\nThank you for choosing us!`;
    const encoded = encodeURIComponent(text);
    const phone = invoice.customers?.phone ? invoice.customers.phone.replace(/[^0-9]/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  };

  const shareEmail = (invoice: Invoice) => {
    const subject = `Invoice #${invoice.invoice_number} from ${business?.business_name || "Our Store"}`;
    const body = `Hello ${invoice.customers?.name || "Customer"},\n\nThank you for your business. Here is a summary of your invoice #${invoice.invoice_number}.\n\nTotal Amount: ${formatTZS(invoice.total_amount)}\nAmount Paid: ${formatTZS(invoice.amount_paid)}\nBalance Due: ${formatTZS(invoice.balance)}\n\nBest regards,\n${business?.business_name || "MauzoChap Store"}`;
    const mailto = `mailto:${invoice.customers?.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const duplicateInvoice = (invoice: Invoice) => {
    if (!invoice.invoice_items || invoice.invoice_items.length === 0) {
      return toast.error("Invoice contains no products");
    }

    const cartItems = invoice.invoice_items.map((item) => ({
      id: item.product_id || "",
      name: item.products?.name || "Product",
      price: Number(item.unit_price),
      qty: item.quantity,
      stock_quantity: 999, // default placeholder
      sku: item.products?.sku || null,
      category_id: null,
      barcode: null,
    }));

    const held = {
      cart: cartItems,
      discount: invoice.discount,
      taxRate: invoice.tax > 0 ? 18 : "", // standard tax estimate
      customerId: invoice.customer_id || "",
    };

    localStorage.setItem("held_sale", JSON.stringify(held));
    toast.success("Invoice copied to POS. Redirecting...");
    navigate({ to: "/pos" });
  };

  const handlePrint = (invoice: Invoice) => {
    const originalTitle = document.title;
    document.title = `${business?.business_name || "Invoice"} - #${invoice.invoice_number}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage and track your customer invoices.</p>
        </div>

        <div className="flex gap-2">
          {/* Date Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 border-border">
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                {getFilterLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setDateFilter("today"); setPage(1); }}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setDateFilter("week"); setPage(1); }}>Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setDateFilter("month"); setPage(1); }}>Last 30 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setDateFilter("all"); setPage(1); }}>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm h-10 w-36"
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 no-print">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billed Invoices</span>
            <div className="grid h-8 w-8 place-items-center rounded-md text-primary bg-primary/10">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">{stats.totalCount}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Total invoices generated in this period</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Invoiced</span>
            <div className="grid h-8 w-8 place-items-center rounded-md text-primary bg-primary/10">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-primary">{formatTZS(stats.totalBilled)}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Sum of subtotal + tax - discount</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount Collected</span>
            <div className="grid h-8 w-8 place-items-center rounded-md text-success bg-success/10">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-success">{formatTZS(stats.totalPaid)}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Total revenue collected from invoices</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding Balance</span>
            <div className="grid h-8 w-8 place-items-center rounded-md text-warning bg-warning/10">
              <CreditCard className="h-4 w-4 text-warning" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-warning">{formatTZS(stats.totalOutstanding)}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Remaining credits to be collected</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md no-print">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by invoice number or customer..."
          className="pl-10"
        />
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden no-print">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Invoice Number</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  {t("loading")}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  {t("noData")}
                </td>
              </tr>
            ) : (
              paginated.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold text-primary">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-medium">{inv.customers?.name || "Walk-in Customer"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.created_at)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    <div>{formatTZS(inv.total_amount)}</div>
                    {(() => {
                      const cost = (inv.invoice_items || []).reduce((acc, item) => acc + (item.quantity * (item.products?.cost_price || 0)), 0);
                      const profit = inv.total_amount - cost;
                      return (
                        <div className={`text-xs ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                          Profit: {formatTZS(profit)}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right text-success">{formatTZS(inv.amount_paid)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span className={inv.balance > 0 ? "text-warning" : "text-muted-foreground"}>
                      {formatTZS(inv.balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                        inv.payment_status === "Paid"
                          ? "bg-success/15 text-success"
                          : inv.payment_status === "Partial"
                          ? "bg-warning/15 text-warning"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-primary"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setDetailOpen(true);
                      }}
                      title="View Invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => downloadPDF(inv)}
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(inv.id, inv.sale_id)}
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-border bg-card p-3 rounded-lg mt-4 no-print">
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

      {/* Invoice Detail Dialog / Printing Section */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none print:border-none print:p-0">
          <DialogHeader className="no-print">
            <DialogTitle className="flex justify-between items-center pr-6">
              <span>Invoice Details</span>
              <div className="flex gap-2">
                <div className="rounded-lg border border-border p-0.5 bg-muted/20 flex text-xs">
                  <button
                    onClick={() => setPrintFormat("a4")}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      printFormat === "a4" ? "bg-primary text-primary-foreground shadow-sm" : "hover:text-foreground"
                    }`}
                  >
                    A4
                  </button>
                  <button
                    onClick={() => setPrintFormat("thermal")}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      printFormat === "thermal" ? "bg-primary text-primary-foreground shadow-sm" : "hover:text-foreground"
                    }`}
                  >
                    Thermal
                  </button>
                </div>

                <Button variant="outline" size="sm" onClick={() => handlePrint(selectedInvoice!)}>
                  <Printer className="h-4 w-4 mr-1.5" /> Print
                </Button>
                
                <Button variant="outline" size="sm" onClick={() => downloadPDF(selectedInvoice!)}>
                  <Download className="h-4 w-4 mr-1.5" /> PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="py-4">
              {printFormat === "a4" ? (
                <A4InvoiceView invoice={selectedInvoice} business={business} />
              ) : (
                <div className="flex justify-center bg-muted/10 py-6 border rounded-lg">
                  <ThermalInvoiceView invoice={selectedInvoice} business={business} />
                </div>
              )}

              {/* Action Toolbar on Screen */}
              <div className="mt-8 border-t pt-4 flex flex-wrap gap-2 justify-between no-print">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => shareWhatsApp(selectedInvoice)}>
                    <Share2 className="h-4 w-4 mr-1.5 text-success" /> Share WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => shareEmail(selectedInvoice)}>
                    <Mail className="h-4 w-4 mr-1.5 text-info" /> Email Invoice
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => duplicateInvoice(selectedInvoice)}>
                    <Copy className="h-4 w-4 mr-1.5" /> Duplicate / Load POS
                  </Button>
                  <Button variant="ghost" onClick={() => setDetailOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// A4 Layout Component
function A4InvoiceView({ invoice, business }: { invoice: Invoice; business: any }) {
  const isProforma = invoice.payment_method === 'credit' && invoice.payment_status === 'Unpaid';
  const docTitle = isProforma ? "PROFORMA INVOICE" : (invoice.balance > 0 ? "TAX INVOICE" : "INVOICE RECEIPT");
  
  return (
    <div className="print-area bg-white text-black p-8 border rounded-xl print:border-none print:shadow-none print:p-0 flex flex-col justify-between" style={{ minHeight: "260mm" }}>
      <div>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-extrabold text-sm">MC</span>
              <h2 className="text-2xl font-black tracking-tight text-gray-900">
                {business?.business_name || "MauzoChap System"}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {business?.email || "info@mauzochap.com"} · {business?.phone || ""}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-primary uppercase tracking-wider print:text-black">
              {docTitle}
            </div>
            <div className="text-xl font-bold text-gray-800 mt-0.5">
              #{invoice.invoice_number}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(invoice.created_at)}
            </div>
          </div>
        </div>

        {/* Brand line */}
        <div className="h-1 bg-gradient-to-r from-primary to-primary/40 print:bg-black w-full my-6 rounded-full" />

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-8 my-6 text-xs">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Billed To</span>
            <div className="font-semibold text-gray-800 mt-1 text-sm">{invoice.customers?.name || "Walk-in Customer"}</div>
            {invoice.customers?.phone && <div className="text-gray-500 mt-0.5">Phone: {invoice.customers.phone}</div>}
            {invoice.customers?.email && <div className="text-gray-500">Email: {invoice.customers.email}</div>}
            {invoice.customers?.address && <div className="text-gray-500">Address: {invoice.customers.address}</div>}
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Invoice Details</span>
            <div className="text-gray-700 mt-1">Cashier: <span className="font-medium">{invoice.profiles?.full_name || "System Cashier"}</span></div>
            <div className="text-gray-700">Payment: <span className="font-medium capitalize">{invoice.payment_method.replace("_", " ")}</span></div>
            <div className="mt-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                invoice.payment_status === "Paid"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : invoice.payment_status === "Partial"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {invoice.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Item Table */}
        <table className="w-full mt-8 text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-left bg-gray-50">
              <th className="py-2.5 px-3 font-bold text-gray-600 rounded-l-md">Product / Item</th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-600">Quantity</th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-600">Price</th>
              <th className="py-2.5 px-3 text-right font-bold text-gray-600 rounded-r-md">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(invoice.invoice_items || []).map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-3 text-gray-800 font-medium">
                  {item.products?.name || "Product"}
                  {item.products?.sku && <span className="text-[10px] text-gray-400 font-normal block">SKU: {item.products.sku}</span>}
                </td>
                <td className="py-3 px-3 text-right text-gray-700">
                  {item.quantity} {item.products?.unit || "pcs"}
                </td>
                <td className="py-3 px-3 text-right text-gray-700">
                  {formatTZS(item.unit_price)}
                </td>
                <td className="py-3 px-3 text-right font-semibold text-gray-900">
                  {formatTZS(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-12 flex justify-between items-start gap-12 border-t pt-6">
        <div className="flex-1 max-w-sm text-[10px] text-gray-400 leading-normal flex items-start gap-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`Invoice: ${invoice.invoice_number}\nTotal: ${invoice.total_amount}\nBalance: ${invoice.balance}`)}`}
            alt="QR Verification"
            className="w-16 h-16 object-contain border p-0.5 bg-white rounded shadow-sm"
          />
          <div>
            <p className="font-bold text-gray-500 uppercase tracking-wider mb-0.5">Verification QR Code</p>
            Scan this code to verify the authenticity of this document and check the latest payment balance.
          </div>
        </div>

        <div className="w-80 text-xs space-y-2.5 bg-gray-55/30 p-4 rounded-lg border border-gray-100 print:border-none print:p-0">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-900">{formatTZS(invoice.subtotal)}</span>
          </div>
          
          {invoice.discount > 0 && (
            <div className="flex justify-between text-red-500 font-medium">
              <span>Discount (-)</span>
              <span>-{formatTZS(invoice.discount)}</span>
            </div>
          )}
          
          {invoice.tax > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Tax ({invoice.tax > 0 ? '18%' : '0%'})</span>
              <span className="font-semibold text-gray-900">{formatTZS(invoice.tax)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-gray-200 text-gray-950">
            <span>Total</span>
            <span className="text-primary print:text-black">{formatTZS(invoice.total_amount)}</span>
          </div>

          <div className="flex justify-between text-xs font-bold pt-2 border-t border-gray-200 text-gray-950">
            <span>Estimated Profit</span>
            {(() => {
              const totalCost = (invoice.invoice_items || []).reduce((acc, item) => acc + (item.quantity * ((item.products as any)?.cost_price || 0)), 0);
              const estProfit = invoice.total_amount - totalCost;
              return (
                <span className={estProfit >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {formatTZS(estProfit)}
                </span>
              );
            })()}
          </div>

          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Amount Paid</span>
            <span>{formatTZS(invoice.amount_paid)}</span>
          </div>

          {invoice.balance > 0 && (
            <div className="flex justify-between text-red-600 font-bold pt-1.5 border-t border-dashed">
              <span>Balance Due</span>
              <span>{formatTZS(invoice.balance)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t text-center text-[10px] text-gray-400 space-y-0.5">
        <div className="font-semibold text-gray-500">Thank you for your business! Asante sana!</div>
        <div>MauzoChap POS Invoice System</div>
      </div>
    </div>
  );
}

// Thermal Receipt Component
function ThermalInvoiceView({ invoice, business }: { invoice: Invoice; business: any }) {
  return (
    <div className="print-area bg-white text-black font-mono text-[11px] p-4 shadow-sm w-[290px] border-x">
      <div className="text-center">
        <div className="font-bold text-sm uppercase">{business?.business_name || "MauzoChap Store"}</div>
        <div className="text-[9px] uppercase">{business?.email || ""}</div>
        <div className="text-[10px] mt-1 font-bold">TAX INVOICE</div>
        <div className="text-[9px]">---------------------------------</div>
      </div>

      <div className="my-2 text-[10px] space-y-0.5">
        <div>Invoice: #{invoice.invoice_number}</div>
        <div>Date: {formatDate(invoice.created_at)}</div>
        <div>Cashier: {invoice.profiles?.full_name || "Cashier"}</div>
        <div>Customer: {invoice.customers?.name || "Walk-in Customer"}</div>
        <div>Method: <span className="capitalize">{invoice.payment_method.replace("_", " ")}</span></div>
      </div>

      <div className="text-[9px]">---------------------------------</div>
      
      {(invoice.invoice_items || []).map((item) => (
        <div key={item.id} className="my-1">
          <div className="font-semibold text-[10px] truncate">{item.products?.name || "Item"}</div>
          <div className="flex justify-between text-[9px] text-gray-600 pl-2">
            <span>{item.quantity} x {formatTZS(item.unit_price)}</span>
            <span className="font-bold text-black">{formatTZS(item.subtotal)}</span>
          </div>
        </div>
      ))}

      <div className="text-[9px]">---------------------------------</div>

      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatTZS(invoice.subtotal)}</span>
        </div>
        {invoice.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount (-)</span>
            <span>-{formatTZS(invoice.discount)}</span>
          </div>
        )}
        {invoice.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatTZS(invoice.tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-dashed pt-1 text-[11px]">
          <span>TOTAL</span>
          <span>{formatTZS(invoice.total_amount)}</span>
        </div>
        <div className="flex justify-between text-emerald-600 font-bold">
          <span>Paid</span>
          <span>{formatTZS(invoice.amount_paid)}</span>
        </div>
        {invoice.balance > 0 && (
          <div className="flex justify-between text-red-600 font-bold">
            <span>Balance</span>
            <span>{formatTZS(invoice.balance)}</span>
          </div>
        )}
      </div>

      <div className="text-[9px]">---------------------------------</div>

      {/* Micro QR Code */}
      <div className="flex flex-col items-center mt-3 gap-1">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=80&data=${encodeURIComponent(`Invoice: ${invoice.invoice_number}\nTotal: ${invoice.total_amount}\nBalance: ${invoice.balance}`)}`}
          alt="QR"
          className="w-16 h-16 border rounded bg-white p-0.5"
        />
        <span className="text-[8px] text-gray-400">Scan to Verify</span>
      </div>

      <div className="text-center mt-3 text-[9px] text-gray-500">
        Asante Sana! Thank you!
        <br />
        Powered by MauzoChap POS
      </div>
    </div>
  );
}
