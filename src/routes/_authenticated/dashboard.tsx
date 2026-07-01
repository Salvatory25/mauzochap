import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT, formatTZS, formatDate } from "@/lib/i18n";
import { TrendingUp, Boxes, Users, AlertTriangle, CreditCard, Activity, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

import { useAuth } from "@/lib/use-auth";

function Dashboard() {
  const t = useT();
  const { branchId } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", branchId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 6 * 86400000); // Last 7 days including today
      weekAgo.setHours(0,0,0,0);
      const monthStart = new Date(Date.now() - 29 * 86400000); // Last 30 days
      monthStart.setHours(0,0,0,0);

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
      const topProducts = Object.values(byProduct).sort((a,b) => b.quantity - a.quantity).slice(0, 8);

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
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboardSubtitle")}</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className={`rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] ${isLoading ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {c.label}
              </span>
              <div
                className={`grid h-8 w-8 place-items-center rounded-md ${c.primary ? 'text-primary-foreground' : 'text-primary bg-primary/10'}`}
                style={c.primary ? { background: c.accent } : undefined}
              >
                <c.icon className={`h-4 w-4 ${c.color || ''}`} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {secondaryCards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border border-border bg-card p-4 flex items-center gap-4 ${isLoading ? 'animate-pulse' : ''}`}
          >
            <div className="p-3 bg-muted rounded-full text-muted-foreground">
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">{c.label}</div>
              <div className="text-xl font-bold">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Statistics */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">{t("invoiceSummary")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("totalInvoices"), value: String(stats?.totalInvoicesCount ?? 0), icon: FileText },
            { label: t("paidInvoices"), value: String(stats?.paidInvoicesCount ?? 0), icon: CheckCircle, color: "text-success bg-success/10" },
            { label: t("unpaidInvoices"), value: String(stats?.unpaidInvoicesCount ?? 0), icon: AlertCircle, color: "text-destructive bg-destructive/10" },
            { label: t("invoiceOutstanding"), value: formatTZS(stats?.outstandingInvoicesBalance ?? 0), icon: CreditCard, color: "text-warning bg-warning/10" },
          ].map((c) => (
            <div
              key={c.label}
              className={`rounded-xl border border-border bg-card p-4 flex items-center gap-4 ${isLoading ? 'animate-pulse' : ''}`}
            >
              <div className={`p-3 rounded-full ${c.color || "bg-muted text-muted-foreground"}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{c.label}</div>
                <div className="text-xl font-bold">{c.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Summary Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">{t("salesSummary7Days")}</h2>
          </div>
          <div className="p-5 flex-1 min-h-[300px]">
            {stats?.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} tickFormatter={(val) => `TZS ${val / 1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}
                    formatter={(value: number) => [formatTZS(value), "Revenue"]}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                {isLoading ? t("loadingChart") : t("noDataAvailable")}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2 bg-warning/5 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <h2 className="font-semibold">{t("lowStockAlerts")}</h2>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[300px]">
            {stats?.lowStock && stats.lowStock.length > 0 ? (
              stats.lowStock.map(
                (p: {
                  id: string;
                  name: string;
                  stock_quantity: number;
                  low_stock_threshold: number;
                }) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="font-medium truncate pr-2">{p.name}</span>
                    <span
                      className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold whitespace-nowrap"
                      style={{ color: "var(--warning)" }}
                    >
                      {p.stock_quantity} {t("left")}
                    </span>
                  </div>
                ),
              )
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                {t("allWellStocked")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        {/* Recent Transactions */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">{t("recentSales")}</h2>
          </div>
          <div className="divide-y divide-border overflow-y-auto flex-1">
            {recent && recent.length > 0 ? (
              recent.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{s.receipt_number}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(s.created_at)} · <span className="uppercase">{s.payment_method}</span>
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-base">{formatTZS(Number(s.total))}</div>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products This Month */}
        <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-primary/5">
            <h2 className="font-semibold text-primary">{t("topProducts30Days")}</h2>
            <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
              <Activity className="h-3 w-3" />
            </div>
          </div>
          <div className="divide-y divide-border overflow-y-auto flex-1 p-2">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((p: any, i: number) => (
                <div key={p.name} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{p.quantity}</span> {t("unitsSold")}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-sm text-right">
                    {formatTZS(p.revenue)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                {isLoading ? t("loadingProducts") : t("noSales30Days")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
