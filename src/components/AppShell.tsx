import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Users,
  Receipt,
  BarChart3,
  LogOut,
  Languages,
  Wallet,
  Truck,
  ClipboardList,
  UserCog,
  Settings,
  ShieldAlert,
  CreditCard,
  FileText,
  MapPin,
  ChevronDown,
  Menu,
  Bell,
  BellRing,
  Check,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { useLang, useT } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function Blocker({ title, message, icon: Icon, action }: { title: string, message: string, icon: any, action?: React.ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl border border-border p-8 text-center space-y-6 shadow-sm">
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-2">{message}</p>
        </div>
        {action}
        <div className="pt-4 border-t border-border">
          <Button variant="ghost" onClick={handleSignOut} className="w-full">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationCenter() {
  const { business, branchId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const [readLowStock, setReadLowStock] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("read_low_stock") || "[]");
    }
    return [];
  });

  const { data: dbNotifications = [], refetch: refetchNotifications } = useQuery<any[]>({
    queryKey: ["notifications-list", business?.id],
    enabled: !!business?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("business_id", business!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  const { data: productsData = [] } = useQuery({
    queryKey: ["low-stock-notifications", branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, low_stock_threshold, branch_inventory(stock_quantity, branch_id)");
      if (error) throw error;
      return data || [];
    }
  });

  const lowStockNotifications: any[] = productsData
    .map(p => {
      const branchStock = (p.branch_inventory as any)?.find((bi: any) => bi.branch_id === branchId);
      const qty = branchStock?.stock_quantity || 0;
      return { ...p, stock_quantity: qty };
    })
    .filter(p => p.stock_quantity <= p.low_stock_threshold)
    .map(p => {
      const id = `low-stock-${p.id}`;
      return {
        id,
        title: "Low Stock Alert",
        message: `${p.name} is running low on stock (${p.stock_quantity} left).`,
        type: "stock",
        is_read: readLowStock.includes(id),
        created_at: new Date().toISOString()
      };
    });

  const allNotifications: any[] = [...dbNotifications, ...lowStockNotifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const unreadCount = allNotifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    if (id.startsWith("low-stock-")) {
      const newList = [...readLowStock, id];
      setReadLowStock(newList);
      localStorage.setItem("read_low_stock", JSON.stringify(newList));
      return;
    }
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (!error) refetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    const unreadDbIds = dbNotifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadDbIds.length > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadDbIds);
      refetchNotifications();
    }
    
    const unreadLowStockIds = lowStockNotifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadLowStockIds.length > 0) {
      const newList = [...readLowStock, ...unreadLowStockIds];
      setReadLowStock(newList);
      localStorage.setItem("read_low_stock", JSON.stringify(newList));
    }
    toast.success("All notifications marked as read");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer text-sidebar-foreground/80 flex items-center justify-center"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="h-5 w-5 text-primary animate-pulse" />
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[8px] font-extrabold flex items-center justify-center border border-sidebar shadow-md">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />
          <div className="fixed right-4 top-20 lg:top-auto lg:bottom-12 lg:left-64 lg:right-auto z-[100] w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden text-foreground animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] sm:max-h-96 overflow-y-auto divide-y divide-border/50">
              {allNotifications.length === 0 ? (
                <div className="p-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <Bell className="h-8 w-8 opacity-30 text-muted-foreground" />
                  <span>No notifications yet.</span>
                </div>
              ) : (
                allNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 text-left transition-colors hover:bg-muted/30 flex flex-col gap-2 ${
                      !n.is_read ? "bg-primary/5 font-medium border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        n.type === 'stock' ? 'text-destructive' :
                        n.type === 'payment' ? 'text-amber-600' : 'text-primary'
                      }`}>
                        {n.title}
                      </span>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-[10px] text-primary hover:bg-primary/10 font-semibold cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-md border border-primary/20 shrink-0"
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" /> Read
                        </button>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-normal break-words">
                      {n.message.replace(/Your 14-day free trial has been activated\.?/gi, "Welcome to MauzoChap POS!")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [lang, setLang] = useLang();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, roles, business, isSuperAdmin, isAdmin, isManager, loading, availableBranches, branchId, switchBranch } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-sm"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // SaaS Logic Bypass for super admins
  if (!isSuperAdmin && business && location.pathname !== "/setup-billing") {
    if (business.account_status === "pending") {
      return (
        <Blocker
          title="Payment Verification Pending"
          message="Your payment details have been received and are currently being reviewed by our administration team. Please check verification status."
          icon={Clock}
          action={
            <Button className="w-full" onClick={() => navigate({ to: "/setup-billing" })}>
              View Verification Status
            </Button>
          }
        />
      );
    }
    if (business.account_status === "suspended") {
      return (
        <Blocker
          title="Account Suspended"
          message="Your account has been suspended. Please contact support."
          icon={ShieldAlert}
        />
      );
    }
    if (business.account_status === "rejected") {
      return (
        <Blocker
          title="Account Rejected"
          message={`Your application to use MauzoChap was rejected. Reason: ${(business as any).rejection_reason || "Verification failed."}`}
          icon={ShieldAlert}
          action={
            <Button className="w-full" onClick={() => navigate({ to: "/setup-billing" })}>
              Resubmit Payment Details
            </Button>
          }
        />
      );
    }
    // Check expiry
    if (business.expiry_date && new Date(business.expiry_date) < new Date()) {
      return (
        <Blocker
          title="Subscription Expired"
          message="Your subscription has expired. Please renew your package to continue using MauzoChap."
          icon={CreditCard}
          action={
            <Button className="w-full" onClick={() => navigate({ to: "/setup-billing" })}>
              Renew / Upgrade Subscription
            </Button>
          }
        />
      );
    }
  }

  const nav = isSuperAdmin ? [
    { to: "/super-admin", icon: ShieldAlert, label: "Super Admin" },
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
  ] : [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { to: "/pos", icon: ShoppingCart, label: t("pos") },
    { to: "/products", icon: Boxes, label: t("products") },
    { to: "/inventory", icon: ClipboardList, label: t("inventory") },
    { to: "/sales", icon: Receipt, label: t("sales") },
    { to: "/invoices", icon: FileText, label: "Invoices" },
    { to: "/customers", icon: Users, label: t("customers") },
    { to: "/suppliers", icon: Truck, label: t("suppliers") },
    ...(isManager ? [
      { to: "/expenses", icon: Wallet, label: t("expenses") },
      { to: "/reports", icon: BarChart3, label: t("reports") },
    ] : []),
    ...(isAdmin ? [
      { to: "/users", icon: UserCog, label: t("users") },
      { to: "/locations", icon: MapPin, label: "Locations" },
    ] : []),
    { to: "/tools", icon: Sparkles, label: "Tools" },
    { to: "/settings", icon: Settings, label: t("settings") },
  ];

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const sidebarContent = (
    <>
      <div className="px-6 py-5 border-b border-sidebar-border flex flex-col gap-1 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2 -ml-2" onClick={() => setMobileMenuOpen(false)}>
          <img src="/logo.png" alt="MauzoChap" className="w-[220px] h-auto object-contain" />
        </Link>
        {business && !isSuperAdmin && (
          <div className="mt-2">
            {isAdmin && availableBranches && availableBranches.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-2 py-1 h-auto font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-sidebar-border/50 bg-sidebar-accent/20">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <div className="flex flex-col items-start truncate">
                        <span className="text-xs font-bold truncate w-full">{business.business_name}</span>
                        <span className="text-[10px] text-muted-foreground truncate w-full">
                          {availableBranches.find(b => b.id === branchId)?.name || 'Select Location'}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[220px]">
                  {availableBranches.map((b) => (
                    <DropdownMenuItem 
                      key={b.id} 
                      onClick={() => { switchBranch(b.id); setMobileMenuOpen(false); }}
                      className={b.id === branchId ? "bg-primary/10 font-bold" : ""}
                    >
                      {b.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex flex-col px-1">
                <span className="text-xs font-bold text-sidebar-foreground truncate">{business.business_name}</span>
                <span className="text-[10px] text-sidebar-foreground/60 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {availableBranches?.find(b => b.id === branchId)?.name || 'Default Location'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-3 bg-sidebar/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-sidebar-foreground/80 truncate font-medium max-w-[170px]">{user?.email}</div>
          {business && !isSuperAdmin && <NotificationCenter />}
        </div>
        <div className="flex flex-wrap gap-1">
          {roles.map((r) => (
            <span
              key={r}
              className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-primary/20"
            >
              {r}
            </span>
          ))}
        </div>
        <button
          onClick={() => setLang(lang === "en" ? "sw" : "en")}
          className="flex w-full items-center gap-2 rounded-md border border-sidebar-border px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors animate-pulse"
        >
          <Languages className="h-4 w-4" />
          {lang === "en" ? "English" : "Kiswahili"}
          <span className="ml-auto text-xs text-sidebar-foreground/50">↔</span>
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm h-screen sticky top-0 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-20 flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 border-b border-sidebar-border shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2 -ml-2 h-full py-2">
          <img src="/logo.png" alt="MauzoChap" className="w-[180px] h-full object-contain scale-[1.15] origin-left" />
        </Link>
        <div className="flex items-center gap-2">
          {business && !isSuperAdmin && <NotificationCenter />}
          <button
            onClick={() => setLang(lang === "en" ? "sw" : "en")}
            className="text-xs font-bold uppercase tracking-wider bg-sidebar-accent px-3 py-2 rounded-md"
          >
            {lang}
          </button>
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -mr-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-sidebar text-sidebar-foreground border-r-sidebar-border flex flex-col">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <main className="flex-1 lg:ml-0 pt-20 lg:pt-0 bg-muted/20">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 grid grid-cols-5 gap-1 border-t border-border bg-card p-2 z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {nav.slice(0, 5).map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 py-1 text-[10px] rounded-md transition-colors ${active ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate w-full text-center px-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="lg:hidden h-20" />
      </main>
    </div>
  );
}
