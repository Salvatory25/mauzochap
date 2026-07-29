import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT, formatTZS, formatDate } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { FileDown, Calendar as CalendarIcon, DownloadCloud, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import domtoimage from "dom-to-image-more";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

type DateFilter = "today" | "week" | "month" | "all";

function ReportsPage() {
  const t = useT();
  const { branchId, isManager, business } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", branchId, dateFilter],
    enabled: isManager,
    queryFn: async () => {
      let startDate = new Date(0).toISOString(); // all time
      const now = new Date();
      if (dateFilter === "today") {
        startDate = new Date(now.setHours(0,0,0,0)).toISOString();
      } else if (dateFilter === "week") {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
      } else if (dateFilter === "month") {
        startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
      }

      let salesQuery = supabase
        .from("sales")
        .select("id, total, payment_method, created_at, status, cashier_id")
        .gte("created_at", startDate);
      if (branchId) {
        salesQuery = salesQuery.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      let expensesQuery = supabase
        .from("expenses")
        .select("amount, category, expense_date")
        .gte("expense_date", startDate.slice(0, 10));
      if (branchId) {
        expensesQuery = expensesQuery.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      let productsQuery = branchId
        ? supabase
            .from("products")
            .select("name, cost, price, branch_inventory!inner(stock_quantity)")
            .eq("branch_inventory.branch_id", branchId)
        : supabase
            .from("products")
            .select("name, cost, price, branch_inventory(stock_quantity)");

      let invoicesQuery = supabase
        .from("invoices")
        .select(`
          id, invoice_number, total_amount, amount_paid, balance, payment_status, created_at, customer_id,
          customers(name, phone, email),
          sales!inner(branch_id)
        `)
        .gte("created_at", startDate)
        .order("created_at", { ascending: false });
      if (branchId) {
        invoicesQuery = invoicesQuery.eq("sales.branch_id", branchId);
      }

      const results = await Promise.all([
        salesQuery,
        expensesQuery,
        productsQuery,
        // Customers/Suppliers are global for now
        supabase.from("customers").select("name, phone, email, balance").gt("balance", 0),
        supabase.from("suppliers").select("name, phone, email, balance").gt("balance", 0),
        supabase.from("profiles").select("id, full_name"),
        invoicesQuery,
      ]);
      
      if (results[0].error) console.error("Sales query error:", results[0].error);
      if (results[1].error) console.error("Expenses query error:", results[1].error);
      if (results[2].error) console.error("Products query error:", results[2].error);

      const salesData = (results[0].data ?? []).filter((s) => s.status === "completed");
      const expenses = results[1].data ?? [];
      const products = results[2].data ?? [];
      const customersData = results[3].data || [];
      const suppliersData = results[4].data || [];
      const profilesData = results[5].data || [];
      
      const profileMap = new Map(profilesData.map((p) => [p.id, p.full_name]));

      // Fetch sale items for the matched sales to compute product performance
      let saleItems: any[] = [];
      if (salesData.length > 0) {
        const saleIds = salesData.map(s => s.id);
        const { data: items } = await supabase
          .from("sale_items")
          .select("product_id, quantity, subtotal, products(name)")
          .in("sale_id", saleIds);
        saleItems = items ?? [];
      }

      // Compute User Performance
      const byUser: Record<string, { name: string, total: number, count: number }> = {};
      salesData.forEach(s => {
        const name = profileMap.get(s.cashier_id) || 'System / Admin';
        if (!byUser[name]) byUser[name] = { name, total: 0, count: 0 };
        byUser[name].total += Number(s.total);
        byUser[name].count += 1;
      });
      const topUsers = Object.values(byUser).sort((a,b) => b.total - a.total);

      // Compute Top Products
      const byProduct: Record<string, { name: string, quantity: number, revenue: number }> = {};
      saleItems.forEach(item => {
        const name = item.products?.name || "Unknown Product";
        if (!byProduct[name]) byProduct[name] = { name, quantity: 0, revenue: 0 };
        byProduct[name].quantity += Number(item.quantity);
        byProduct[name].revenue += Number(item.subtotal);
      });
      const topProducts = Object.values(byProduct).sort((a,b) => b.revenue - a.revenue).slice(0, 10);

      const byDay: Record<string, number> = {};
      salesData.forEach((s) => {
        const d = String(s.created_at).slice(0, 10);
        byDay[d] = (byDay[d] || 0) + Number(s.total);
      });
      const days = Object.entries(byDay).sort().slice(-14);
      const maxDay = Math.max(1, ...days.map((d) => d[1]));

      const byPayment: Record<string, number> = {};
      salesData.forEach((s) => {
        byPayment[s.payment_method] = (byPayment[s.payment_method] || 0) + Number(s.total);
      });

      const byCategory: Record<string, number> = {};
      expenses.forEach((e: { category: string; amount: number | null | string }) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
      });

      const inventoryValue = products.reduce(
        (s, p: any) => {
          const totalStock = Array.isArray(p.branch_inventory)
            ? p.branch_inventory.reduce((sumStock: number, bi: any) => sumStock + Number(bi.stock_quantity || 0), 0)
            : Number(p.branch_inventory?.[0]?.stock_quantity || 0);
          return s + Number(p.cost) * totalStock;
        },
        0,
      );
      const totalSales = salesData.reduce((s, x) => s + Number(x.total), 0);
      const totalExpenses = expenses.reduce(
        (s: number, x: { amount: number | null | string }) => s + Number(x.amount),
        0,
      );

      const customerDebt = customersData.reduce((s: number, c: any) => s + Number(c.balance), 0);
      const supplierDebt = suppliersData.reduce((s: number, c: any) => s + Number(c.balance), 0);
      const invoicesData = results[6].data || [];

      return {
        days,
        maxDay,
        byPayment,
        byCategory,
        inventoryValue,
        totalSales,
        totalExpenses,
        products,
        customerDebt,
        supplierDebt,
        customers: customersData,
        suppliers: suppliersData,
        topUsers,
        topProducts,
        invoices: invoicesData,
      };
    },
  });

  if (!isManager) {
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

  const profit = data ? data.totalSales - data.totalExpenses : 0;

  const getFilterLabel = () => {
    if (dateFilter === "today") return "Today";
    if (dateFilter === "week") return "Last 7 Days";
    if (dateFilter === "month") return "Last 30 Days";
    return "All Time";
  };

  const generateTabularPDF = (title: string, columns: string[], rows: any[][], summary?: string[]) => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const businessName = business?.business_name || "MauzoChap System";
      
      // Header
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 35, "F");
      
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${businessName} - ${title}`, 14, 18);
      
      // Date & Time
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Date Range: ${getFilterLabel()}   |   Generated on: ${new Date().toLocaleString()}`, 14, 26);
      
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, 30, pdf.internal.pageSize.getWidth() - 14, 30);
      
      autoTable(pdf, {
        startY: 38,
        head: [columns],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 10, cellPadding: 4 },
      });
      
      let finalY = (pdf as any).lastAutoTable.finalY || 40;
      
      // Add summary if provided
      if (summary && summary.length > 0) {
        finalY += 10;
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        summary.forEach((line, i) => {
          pdf.text(line, 14, finalY + (i * 6));
        });
      }
      
      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`© ${new Date().getFullYear()} ${businessName}. All rights reserved. Powered by MauzoChap.`, 14, pageHeight - 10);
        pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() - 30, pageHeight - 10);
      }
      
      pdf.save(`MauzoChap_${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`${title} downloaded successfully!`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const exportDebtPDF = () => {
    if (!data) return;
    const columns = ["Type", "Name", "Phone", "Email", "Outstanding Balance (TZS)"];
    const rows: any[][] = [];
    data.customers.forEach((c: any) => {
      rows.push(["Customer (Owes Us)", c.name, c.phone || "-", c.email || "-", formatTZS(c.balance)]);
    });
    data.suppliers.forEach((s: any) => {
      rows.push(["Supplier (We Owe)", s.name, s.phone || "-", s.email || "-", formatTZS(s.balance)]);
    });
    generateTabularPDF("Outstanding Debt Report", columns, rows);
  };

  const exportSalesPDF = () => {
    if (!data) return;
    const columns = ["Date", "Sales Revenue (TZS)"];
    const rows = data.days.map(([d, val]) => [d, formatTZS(val)]);
    const summary = [
      `TOTAL SALES: ${formatTZS(data.totalSales)}`,
      `TOTAL EXPENSES: ${formatTZS(data.totalExpenses)}`,
      `NET PROFIT (ESTIMATE): ${formatTZS(profit)}`
    ];
    generateTabularPDF("Sales & Profit Report", columns, rows, summary);
  };

  const exportProductsPDF = () => {
    if (!data) return;
    const columns = ["Product Name", "Quantity Sold", "Total Revenue (TZS)"];
    const rows = data.topProducts.map(p => [p.name, p.quantity, formatTZS(p.revenue)]);
    generateTabularPDF("Product Performance Report", columns, rows);
  };

  const exportUsersPDF = () => {
    if (!data) return;
    const columns = ["User/Cashier", "Sales Processed", "Total Revenue Generated (TZS)"];
    const rows = data.topUsers.map(u => [u.name, u.count, formatTZS(u.total)]);
    generateTabularPDF("Cashier Performance Report", columns, rows);
  };

  const exportInvoicesPDF = (type: "daily" | "monthly" | "outstanding") => {
    if (!data) return;
    const columns = ["Invoice No", "Date", "Customer", "Total (TZS)", "Paid (TZS)", "Balance (TZS)", "Status"];
    
    let filteredInvoices = data.invoices;
    const todayStr = new Date().toISOString().slice(0, 10);
    
    if (type === "daily") {
      filteredInvoices = data.invoices.filter((i: any) => i.created_at.slice(0, 10) === todayStr);
    } else if (type === "outstanding") {
      filteredInvoices = data.invoices.filter((i: any) => Number(i.balance) > 0);
    }
    
    const rows = filteredInvoices.map((i: any) => [
      i.invoice_number || "-",
      formatDate(i.created_at),
      i.customers?.name || "Walk-in Customer",
      formatTZS(i.total_amount),
      formatTZS(i.amount_paid),
      formatTZS(i.balance),
      i.payment_status
    ]);
    
    const totalBilled = filteredInvoices.reduce((acc: number, curr: any) => acc + Number(curr.total_amount), 0);
    const totalPaid = filteredInvoices.reduce((acc: number, curr: any) => acc + Number(curr.amount_paid), 0);
    const totalOutstanding = filteredInvoices.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0);
    
    const summary = [
      `TOTAL BILLED: ${formatTZS(totalBilled)}`,
      `TOTAL PAID: ${formatTZS(totalPaid)}`,
      `TOTAL OUTSTANDING: ${formatTZS(totalOutstanding)}`
    ];
    
    const title = type === "daily" 
      ? "Daily Invoices Report" 
      : type === "outstanding" 
      ? "Outstanding Invoices Report" 
      : "Monthly Invoices Report";
      
    generateTabularPDF(title, columns, rows, summary);
  };

  const exportCustomerBalancesReportPDF = () => {
    if (!data) return;
    const columns = ["Customer Name", "Phone", "Email", "Outstanding Balance (TZS)"];
    const rows = data.customers.map((c: any) => [
      c.name,
      c.phone || "-",
      c.email || "-",
      formatTZS(c.balance)
    ]);
    const summary = [`TOTAL CUSTOMER DEBT: ${formatTZS(data.customerDebt)}`];
    generateTabularPDF("Customer Balances Report", columns, rows, summary);
  };

  const exportToPDF = async () => {
    const input = document.getElementById("report-content");
    if (!input) return;
    
    setIsExportingPDF(true);
    try {
      // Small delay to ensure any charts or animations are settled
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const width = input.offsetWidth;
      const height = input.offsetHeight;
      
      const imgData = await domtoimage.toPng(input, {
        bgcolor: "#ffffff",
        quality: 1.0,
        width: width * 2, // Scale up for better quality
        height: height * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left'
        }
      });
      
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      // Calculate height maintaining aspect ratio
      const pdfHeight = (height * pdfWidth) / width;
      
      // Add custom header/copyrights
      const businessName = business?.business_name || "MauzoChap System";
      
      // Header Background
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 0, pdfWidth, 42, "F");
      
      pdf.setFontSize(22);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${businessName} - Analytics Report`, 14, 20);
      
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Date Range: ${getFilterLabel()}`, 14, 28);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);
      
      // Draw a separator line
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(14, 42, pdfWidth - 14, 42);
      
      // Add the captured image (offset by header height)
      pdf.addImage(imgData, "PNG", 0, 45, pdfWidth, pdfHeight);
      
      // Footer with Copyrights
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, pageHeight - 15, pdfWidth, 15, "F");
      
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`© ${new Date().getFullYear()} ${businessName}. All rights reserved. Powered by MauzoChap.`, 14, pageHeight - 6);
      
      pdf.save(`MauzoChap_Report_${dateFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Visual Dashboard PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF", error);
      toast.error("Failed to generate Visual PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (isLoading || !data) return <div className="text-muted-foreground p-8 text-center">{t("loading")}</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" data-html2canvas-ignore>
        <div>
          <h1 className="text-3xl font-bold">{t("reports")} & Analytics</h1>
          <p className="text-sm text-muted-foreground">Comprehensive business performance insights</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-border">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getFilterLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDateFilter("today")}>Today (Daily)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("week")}>Last 7 Days (Weekly)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("month")}>Last 30 Days (Monthly)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("all")}>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isExportingPDF}>
                <DownloadCloud className={`mr-2 h-4 w-4 ${isExportingPDF ? 'animate-bounce' : ''}`} />
                {isExportingPDF ? "Generating PDF..." : "Export Reports"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToPDF} className="font-medium text-primary">
                Download Visual Dashboard PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportSalesPDF}>Download Sales & Profit PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={exportProductsPDF}>Download Product Performance PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={exportUsersPDF}>Download User Performance PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={exportDebtPDF}>Download Outstanding Debt PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportInvoicesPDF("daily")}>Download Daily Invoices PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportInvoicesPDF("monthly")}>Download Monthly Invoices PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportInvoicesPDF("outstanding")}>Download Outstanding Invoices PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={exportCustomerBalancesReportPDF}>Download Customer Balances PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div id="report-content" className="space-y-6 bg-background rounded-xl p-2 sm:p-0">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Total Sales", v: formatTZS(data.totalSales), color: "" },
          { l: "Total Expenses", v: formatTZS(data.totalExpenses), color: "text-destructive" },
          { l: "Net Profit (estimate)", v: formatTZS(profit), color: profit > 0 ? "text-success" : "" },
          { l: "Inventory Value", v: formatTZS(data.inventoryValue), color: "" },
        ].map((c) => (
          <div key={c.l} className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.l}</div>
            <div className={`mt-2 text-2xl font-bold ${c.color}`}>{c.v}</div>
          </div>
        ))}
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mt-4">
        <div className="rounded-xl border border-border bg-card p-5 bg-muted/10">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Customer Debt (To Collect)</div>
          <div className="mt-2 text-xl font-bold text-warning">{formatTZS(data.customerDebt)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 bg-muted/10">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Supplier Debt (To Pay)</div>
          <div className="mt-2 text-xl font-bold text-destructive">{formatTZS(data.supplierDebt)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Sales Trend ({getFilterLabel()})</h2>
        <div className="flex items-end gap-2 h-48">
          {data.days.length === 0 ? (
            <div className="text-sm text-muted-foreground m-auto">{t("noData")}</div>
          ) : (
            data.days.map(([d, val]) => (
              <div key={d} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${(val / data.maxDay) * 100}%`,
                    background: "var(--gradient-primary)",
                    minHeight: "4px",
                  }}
                  title={`${d}: ${formatTZS(val)}`}
                />
                <span className="text-[10px] text-muted-foreground">{d.slice(5)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Top 10 Products by Revenue</h2>
          <div className="space-y-4">
            {data.topProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("noData")}</div>
            ) : (
              data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</div>
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.quantity} units sold</div>
                    </div>
                  </div>
                  <div className="font-semibold">{formatTZS(p.revenue)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Cashier Performance</h2>
          <div className="space-y-4">
            {data.topUsers.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("noData")}</div>
            ) : (
              data.topUsers.map((u, i) => (
                <div key={u.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.count} sales processed</div>
                    </div>
                  </div>
                  <div className="font-semibold text-success">{formatTZS(u.total)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">By Payment Method</h2>
          <div className="space-y-3">
            {Object.entries(data.byPayment).length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("noData")}</div>
            ) : (
              Object.entries(data.byPayment).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{k.replace("_", " ")}</span>
                    <span className="font-semibold">{formatTZS(v)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${(v / data.totalSales) * 100}%`,
                        background: "var(--gradient-primary)",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Expenses by Category</h2>
          <div className="space-y-3">
            {Object.entries(data.byCategory).length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("noData")}</div>
            ) : (
              Object.entries(data.byCategory).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{k}</span>
                    <span className="font-semibold">{formatTZS(v)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-warning"
                      style={{
                        width: `${(v / data.totalExpenses) * 100}%`,
                        background: "var(--warning)",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
