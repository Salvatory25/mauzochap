import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT, formatTZS, formatDate } from "@/lib/i18n";
import { TrendingUp, Boxes, Users, AlertTriangle, CreditCard, Activity, FileText, CheckCircle, AlertCircle, ArrowRight, ShieldAlert, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

import { useAuth } from "@/lib/use-auth";

function Dashboard() {
  const t = useT();
  const { branchId, business } = useAuth();
  const [inventoryWidgetTab, setInventoryWidgetTab] = useState<"lowStock" | "expiry">("lowStock");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", branchId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 6 * 86400000); // Last 7 days including today
      weekAgo.setHours(0, 0, 0, 0);
      const monthStart = new Date(Date.now() - 29 * 86400000); // Last 30 days
      monthStart.setHours(0, 0, 0, 0);

      const [
        todayRes,
        weekRes,
        monthRes,
        allTimeRes,
        productsRes,
        lowStockRes,
        customersRes,
        debtsRes,
        invoicesRes
      ] = await Promise.all([
        (() => {
          let q = supabase.from("sales").select("total").gte("created_at", today.toISOString()).eq("status", "completed");
          if (branchId) q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
          return q;
        })(),
        (() => {
          let q = supabase.from("sales").select("total, created_at").gte("created_at", weekAgo.toISOString()).eq("status", "completed");
          if (branchId) q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
          return q;
        })(),
        (() => {
          let q = supabase.from("sales").select("id, total").gte("created_at", monthStart.toISOString()).eq("status", "completed");
          if (branchId) q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
          return q;
        })(),
        (() => {
          let q = supabase.from("sales").select("total").eq("status", "completed");
          if (branchId) q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
          return q;
        })(),
        supabase.from("products").select("id", { count: "exact", head: true }),
        (() => {
          let q = supabase
            .from("products")
            .select("id, name, low_stock_threshold, branch_inventory!inner(stock_quantity)")
            .eq("is_active", true);
          if (branchId) q = q.eq("branch_inventory.branch_id", branchId);
          return q;
        })(),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("balance").gt("balance", 0),
        (() => {
          let q = supabase
            .from("invoices")
            .select("id, balance, payment_status, created_at, sales!inner(branch_id)");
          if (branchId) q = q.eq("sales.branch_id", branchId);
          return q;
        })()
      ]);

      const sum = (rows: { total: number | null | string }[] | null) =>
        (rows ?? []).reduce(
          (s: number, r: { total: number | null | string }) => s + Number(r.total || 0),
          0,
        );

      const sumDebts = (rows: { balance: number | null }[] | null) =>
        (rows ?? []).reduce((s: number, r: { balance: number | null }) => s + Number(r.balance || 0), 0);

      const monthTotal = sum(monthRes.data);
      const monthCount = monthRes.data?.length || 0;
      const avgOrderValue = monthCount > 0 ? monthTotal / monthCount : 0;

      const invoicesData = invoicesRes.data ?? [];
      const totalInvoicesCount = invoicesData.length;
      const paidInvoicesCount = invoicesData.filter((i: any) => i.payment_status === "Paid").length;
      const unpaidInvoicesCount = invoicesData.filter((i: any) => i.payment_status === "Unpaid").length;
      const outstandingInvoicesBalance = invoicesData.reduce((sum: number, i: any) => sum + Number(i.balance), 0);

      // Group week sales by day for the chart
      const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toISOString().split('T')[0],
          name: d.toLocaleDateString('en-US', { weekday: 'short' }),
          total: 0
        };
      });

      weekRes.data?.forEach(sale => {
        const dateString = sale.created_at.split('T')[0];
        const day = chartData.find(d => d.date === dateString);
        if (day) {
          day.total += Number(sale.total);
        }
      });

      const allInventory = (lowStockRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        low_stock_threshold: p.low_stock_threshold,
        stock_quantity: p.branch_inventory?.[0]?.stock_quantity || 0
      }));
      const lowStockList = allInventory
        .filter(p => p.stock_quantity <= (p.low_stock_threshold || 5))
        .sort((a, b) => a.stock_quantity - b.stock_quantity)
        .slice(0, 15);

      const monthData = monthRes.data || [];
      const monthSaleIds = monthData.map((s: any) => s.id);
      let saleItemsThisMonth: any[] = [];

      if (monthSaleIds.length > 0) {
        const { data, error } = await supabase
          .from("sale_items")
          .select("quantity, subtotal, products(name)")
          .in("sale_id", monthSaleIds.slice(0, 1000));

        if (error) {
          console.error("Error fetching top products:", error);
        }
        saleItemsThisMonth = data || [];
      }

      const byProduct: Record<string, { name: string, quantity: number, revenue: number }> = {};
      saleItemsThisMonth.forEach((item: any) => {
        const name = item.products?.name || "Unknown Product";
        if (!byProduct[name]) byProduct[name] = { name, quantity: 0, revenue: 0 };
        byProduct[name].quantity += Number(item.quantity);
        byProduct[name].revenue += Number(item.subtotal);
      });
      const topProducts = Object.values(byProduct).sort((a, b) => b.quantity - a.quantity).slice(0, 8);

      return {
        today: sum(todayRes.data),
        week: sum(weekRes.data),
        month: monthTotal,
        allTime: sum(allTimeRes.data),
        productCount: productsRes.count ?? 0,
        lowStock: lowStockList,
        customerCount: customersRes.count ?? 0,
        pendingDebts: sumDebts(debtsRes.data),
        avgOrderValue,
        chartData,
        totalInvoicesCount,
        paidInvoicesCount,
        unpaidInvoicesCount,
        outstandingInvoicesBalance,
        topProducts
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-sales", branchId],
    queryFn: async () => {
      let q = supabase
        .from("sales")
        .select("id, receipt_number, total, payment_method, created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      if (branchId) {
        q = q.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: expiryBatches = [] } = useQuery({
    queryKey: ["dashboard-expiry-batches", branchId],
    queryFn: async () => {
      let q = supabase
        .from("product_batches")
        .select("id, batch_number, expiry_date, stock_quantity, products(name, sku)")
        .gt("stock_quantity", 0)
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true })
        .limit(10);
      if (branchId) {
        q = q.eq("branch_id", branchId);
      }
      const { data } = await q;
      return (data || []) as any[];
    },
  });

  const nowMs = new Date().getTime();
  const criticalExpiryItems = expiryBatches.filter((b) => {
    if (!b.expiry_date) return false;
    const diff = (new Date(b.expiry_date).getTime() - nowMs) / 86400000;
    return diff <= 30; // expired or expiring within 30 days
  });

  const cards: { label: string; value: string; icon: any; accent?: string; primary?: boolean; color?: string }[] = [
    {
      label: t("totalSalesAllTime"),
      value: formatTZS(stats?.allTime ?? 0),
      icon: TrendingUp,
      accent: "var(--gradient-primary)",
      primary: true
    },
    { label: t("todaySales"), value: formatTZS(stats?.today ?? 0), icon: TrendingUp },
    { label: t("weekSales"), value: formatTZS(stats?.week ?? 0), icon: TrendingUp },
    { label: t("monthSales"), value: formatTZS(stats?.month ?? 0), icon: TrendingUp },
  ];

  const secondaryCards = [
    { label: t("pendingDebts"), value: formatTZS(stats?.pendingDebts ?? 0), icon: CreditCard, color: "text-warning" },
    { label: t("totalProducts"), value: String(stats?.productCount ?? 0), icon: Boxes },
    { label: t("customers"), value: String(stats?.customerCount ?? 0), icon: Users },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t("dashboard")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t("dashboardSubtitle")}</p>
        </div>
      </div>

      {/* Subscription Expiry & Plan Status Card for Business Admins (Visible immediately without swiping) */}
      {business && (
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg shrink-0 ${
              business.expiry_date && new Date(business.expiry_date) < new Date()
                ? 'bg-destructive/15 text-destructive'
                : business.expiry_date && Math.ceil((new Date(business.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 5
                ? 'bg-amber-500/15 text-amber-600'
                : 'bg-primary/10 text-primary'
            }`}>
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  Kifurushi: <span className="uppercase text-primary font-extrabold">{business.package || "Starter"}</span>
                </span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  business.account_status === "approved" ? "bg-success/15 text-success" : 
                  business.account_status === "pending" ? "bg-amber-500/15 text-amber-600" : "bg-destructive/15 text-destructive"
                }`}>
                  {business.account_status === "approved" ? "Active" : business.account_status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                <span>Tarehe ya Kuisha:</span>
                {business.expiry_date ? (() => {
                  const days = Math.ceil((new Date(business.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  const isExp = days <= 0;
                  const isSoon = days > 0 && days <= 5;
                  return (
                    <strong className={isExp ? "text-destructive" : isSoon ? "text-amber-600 font-bold" : "text-foreground font-semibold"}>
                      {new Date(business.expiry_date).toLocaleDateString()}
                      {isExp ? " (Kimekwisha)" : ` (Zimebaki siku ${days})`}
                    </strong>
                  );
                })() : (
                  <span className="italic">Bila kikomo</span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <Link
              to="/setup-billing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Boresha / Lipia Kifurushi</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Product Expiry Alert Banner (Immediately visible without swiping) */}
      {criticalExpiryItems.length > 0 && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-destructive text-destructive-foreground shrink-0 shadow-xs">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-destructive">
                  Tahadhari ya Bidhaa Zinazoisha Muda (Product Expiry Alert)
                </span>
                <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-destructive text-destructive-foreground">
                  {criticalExpiryItems.length} Bidhaa Hatari
                </span>
              </div>
              <div className="text-xs text-foreground/80 leading-snug">
                {criticalExpiryItems.some(b => new Date(b.expiry_date!).getTime() < nowMs) ? (
                  <span className="font-semibold text-destructive">
                    Kuna bidhaa zilizokwisha muda wa matumizi stoo. Ondoa mara moja au ubadilishe!
                  </span>
                ) : (
                  <span>
                    Kuna bidhaa zitakazoisha muda ndani ya siku 30 zijazo. Zipe kipaumbele cha mauzo au punguzo!
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <Link
              to="/inventory"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Kagua Kwenye Stoo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Primary KPIs (2x2 grid on mobile, 4 cols on desktop) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border border-border bg-card p-3 sm:p-5 shadow-[var(--shadow-soft)] transition-all flex flex-col justify-between ${isLoading ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                {c.label}
              </span>
              <div
                className={`grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-lg ${c.primary ? 'text-primary-foreground' : 'text-primary bg-primary/10'}`}
                style={c.primary ? { background: c.accent } : undefined}
              >
                <c.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${c.color || ''}`} />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-sm sm:text-xl lg:text-2xl font-bold tracking-tight truncate" title={c.value}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Secondary KPIs (Mobile responsive: 2-col with first full-width for TZS currency, 3-col on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        {secondaryCards.map((c, idx) => (
          <div
            key={c.label}
            className={`rounded-xl border border-border bg-card p-2.5 sm:p-4 flex items-center gap-2.5 sm:gap-4 ${idx === 0 ? "col-span-2 sm:col-span-1" : "col-span-1"} ${isLoading ? 'animate-pulse' : ''}`}
          >
            <div className="p-2 sm:p-3 bg-muted rounded-xl text-muted-foreground shrink-0">
              <c.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">{c.label}</div>
              <div className="text-sm sm:text-xl font-bold truncate" title={c.value}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Statistics (2x2 on mobile, 4 cols on desktop) */}
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-sm sm:text-lg font-bold tracking-tight">{t("invoiceSummary")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          {[
            { label: t("totalInvoices"), value: String(stats?.totalInvoicesCount ?? 0), icon: FileText },
            { label: t("paidInvoices"), value: String(stats?.paidInvoicesCount ?? 0), icon: CheckCircle, color: "text-success bg-success/10" },
            { label: t("unpaidInvoices"), value: String(stats?.unpaidInvoicesCount ?? 0), icon: AlertCircle, color: "text-destructive bg-destructive/10" },
            { label: t("invoiceOutstanding"), value: formatTZS(stats?.outstandingInvoicesBalance ?? 0), icon: CreditCard, color: "text-warning bg-warning/10" },
          ].map((c) => (
            <div
              key={c.label}
              className={`rounded-xl border border-border bg-card p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 ${isLoading ? 'animate-pulse' : ''}`}
            >
              <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${c.color || "bg-muted text-muted-foreground"}`}>
                <c.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">{c.label}</div>
                <div className="text-xs sm:text-base font-bold truncate" title={c.value}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Sales Summary Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm sm:text-base">{t("salesSummary7Days")}</h2>
          </div>
          <div className="p-2 sm:p-5 flex-1 min-h-[220px] sm:min-h-[300px]">
            {stats?.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickFormatter={(val) => `${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', fontSize: '12px' }}
                    formatter={(value: number) => [formatTZS(value), "Revenue"]}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                {isLoading ? t("loadingChart") : t("noDataAvailable")}
              </div>
            )}
          </div>
        </div>

        {/* Inventory Health: Low Stock & Expiry Alert */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setInventoryWidgetTab("lowStock")}
                className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                  inventoryWidgetTab === "lowStock"
                    ? "bg-warning/20 text-warning"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Low Stock ({stats?.lowStock?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setInventoryWidgetTab("expiry")}
                className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                  inventoryWidgetTab === "expiry"
                    ? "bg-destructive/20 text-destructive"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Expiry ({criticalExpiryItems.length})</span>
              </button>
            </div>
            <Link to="/inventory" className="text-[11px] font-semibold text-primary hover:underline flex items-center shrink-0">
              Stoo <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[220px] sm:max-h-[300px]">
            {inventoryWidgetTab === "lowStock" ? (
              stats?.lowStock && stats.lowStock.length > 0 ? (
                stats.lowStock.map(
                  (p: {
                    id: string;
                    name: string;
                    stock_quantity: number;
                    low_stock_threshold: number;
                  }) => (
                    <div key={p.id} className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm">
                      <span className="font-medium truncate pr-2">{p.name}</span>
                      <span
                        className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0"
                        style={{ color: "var(--warning)" }}
                      >
                        {p.stock_quantity} {t("left")}
                      </span>
                    </div>
                  ),
                )
              ) : (
                <div className="px-5 py-8 text-center text-xs sm:text-sm text-muted-foreground">
                  {t("allWellStocked")}
                </div>
              )
            ) : (
              criticalExpiryItems.length > 0 ? (
                criticalExpiryItems.map((b: any) => {
                  const expiryDateObj = new Date(b.expiry_date);
                  const diffDays = Math.ceil((expiryDateObj.getTime() - nowMs) / 86400000);
                  const isExp = diffDays < 0;
                  return (
                    <div key={b.id} className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm">
                      <div className="min-w-0 pr-2">
                        <div className="font-medium truncate text-foreground">{b.products?.name || "Bidhaa"}</div>
                        <div className="text-[10px] text-muted-foreground">Batch: {b.batch_number} · Baki: {b.stock_quantity}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-bold whitespace-nowrap shrink-0 ${
                        isExp ? "bg-destructive/15 text-destructive font-black" : "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold"
                      }`}>
                        {isExp ? `Imeisha (${Math.abs(diffDays)}d)` : `Siku ${diffDays} zimebaki`}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="px-5 py-8 text-center text-xs sm:text-sm text-muted-foreground">
                  Hakuna bidhaa zilizokaribia kwisha muda
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 mt-2 sm:mt-6">
        {/* Recent Transactions */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col h-[340px] sm:h-[400px]">
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-border">
            <h2 className="font-semibold text-sm sm:text-base">{t("recentSales")}</h2>
          </div>
          <div className="divide-y divide-border overflow-y-auto flex-1">
            {recent && recent.length > 0 ? (
              recent.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                    <div className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">{s.receipt_number}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                        {formatDate(s.created_at)} · <span className="uppercase">{s.payment_method}</span>
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-xs sm:text-base shrink-0 ml-2">{formatTZS(Number(s.total))}</div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-xs sm:text-sm text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products This Month */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col h-[340px] sm:h-[400px]">
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-border flex justify-between items-center bg-primary/5">
            <h2 className="font-semibold text-primary text-sm sm:text-base">{t("topProducts30Days")}</h2>
            <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
              <Activity className="h-3 w-3" />
            </div>
          </div>
          <div className="divide-y divide-border overflow-y-auto flex-1 p-1.5 sm:p-2">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((p: any, i: number) => (
                <div key={p.name} className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 hover:bg-muted/30 rounded-lg transition-colors">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted text-[10px] sm:text-xs font-bold text-muted-foreground shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">{p.name}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{p.quantity}</span> {t("unitsSold")}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-xs sm:text-sm text-right shrink-0 ml-2">
                    {formatTZS(p.revenue)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-xs sm:text-sm text-muted-foreground">
                {isLoading ? t("loadingProducts") : t("noSales30Days")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
