import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ClipboardList,
  Receipt as ReceiptIcon,
  FileText,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Languages,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  MessageCircle,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  Check,
  Building2,
  Clock,
  ShieldCheck,
  Store
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatTZS, formatDate } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "MauzoChap Dashboard Demo — Mfumo Halisi wa Mauzo na Stoo" },
      {
        name: "description",
        content: "Dashibodi halisi ya majaribio ya MauzoChap POS, usimamizi wa stoo, mauzo na risiti za WhatsApp.",
      },
    ],
  }),
  component: DemoPage,
});

type DemoProduct = {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  lowStockThreshold: number;
  barcode: string;
  expiryDate: string;
};

type CartItem = DemoProduct & { qty: number };

type DemoSale = {
  id: string;
  receiptNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "mobile_money" | "credit";
  amountPaid: number;
  change: number;
  customerName: string;
  createdAt: string;
  profit: number;
};

type DemoCustomer = {
  id: string;
  name: string;
  phone: string;
  balance: number;
  totalSpent: number;
};

type DemoInvoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: "Paid" | "Partial" | "Unpaid";
};

type DemoExpense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
};

const INITIAL_PRODUCTS: DemoProduct[] = [
  { id: "p1", name: "Panadol Extra (Pack 24s)", category: "Dawa & Afya", costPrice: 2200, sellPrice: 3000, stock: 24, lowStockThreshold: 10, barcode: "6001001", expiryDate: "2026-11-20" },
  { id: "p2", name: "Azam Energy Drink 350ml", category: "Vinywaji", costPrice: 650, sellPrice: 1000, stock: 48, lowStockThreshold: 15, barcode: "6001002", expiryDate: "2026-08-15" },
  { id: "p3", name: "Mo Safi Cooking Oil 1L", category: "Vyakula", costPrice: 4200, sellPrice: 5500, stock: 15, lowStockThreshold: 8, barcode: "6001003", expiryDate: "2027-01-10" },
  { id: "p4", name: "Sukari Kilombero 1kg", category: "Vyakula", costPrice: 2600, sellPrice: 3200, stock: 4, lowStockThreshold: 10, barcode: "6001004", expiryDate: "2026-12-01" }, // Low stock
  { id: "p5", name: "Sabuni ya Ushindi 1kg", category: "Vipodozi & Sabuni", costPrice: 1800, sellPrice: 2500, stock: 20, lowStockThreshold: 5, barcode: "6001005", expiryDate: "2028-05-10" },
  { id: "p6", name: "Colgate Herbal 100ml", category: "Vipodozi & Sabuni", costPrice: 1900, sellPrice: 2800, stock: 12, lowStockThreshold: 5, barcode: "6001006", expiryDate: "2027-04-18" },
  { id: "p7", name: "Amoxil 500mg Capsules", category: "Dawa & Afya", costPrice: 3500, sellPrice: 5000, stock: 3, lowStockThreshold: 8, barcode: "6001007", expiryDate: "2026-07-25" }, // Low stock
  { id: "p8", name: "Maziwa ya Asas 500ml", category: "Vinywaji", costPrice: 1100, sellPrice: 1500, stock: 18, lowStockThreshold: 10, barcode: "6001008", expiryDate: "2026-05-30" },
  { id: "p9", name: "Unga wa Sembe Azam 5kg", category: "Vyakula", costPrice: 8500, sellPrice: 11000, stock: 9, lowStockThreshold: 5, barcode: "6001009", expiryDate: "2026-10-15" },
];

const INITIAL_CUSTOMERS: DemoCustomer[] = [
  { id: "c1", name: "Mama Salma (Kariakoo)", phone: "0712345678", balance: 45000, totalSpent: 380000 },
  { id: "c2", name: "Mzee Josephat (Fundi)", phone: "0754123456", balance: 20000, totalSpent: 195000 },
  { id: "c3", name: "Grace Mushi (Salon)", phone: "0789654321", balance: 0, totalSpent: 520000 },
  { id: "c4", name: "Ally Mnyama (Bodaboda)", phone: "0655123987", balance: 12000, totalSpent: 84000 },
];

const INITIAL_INVOICES: DemoInvoice[] = [
  { id: "inv-1", invoiceNumber: "INV-2026-001", customerName: "Mama Salma (Kariakoo)", date: "2026-10-15", dueDate: "2026-10-25", totalAmount: 145000, amountPaid: 100000, balance: 45000, status: "Partial" },
  { id: "inv-2", invoiceNumber: "INV-2026-002", customerName: "Grace Mushi (Salon)", date: "2026-10-16", dueDate: "2026-10-23", totalAmount: 85000, amountPaid: 85000, balance: 0, status: "Paid" },
  { id: "inv-3", invoiceNumber: "INV-2026-003", customerName: "Mzee Josephat (Fundi)", date: "2026-10-17", dueDate: "2026-10-24", totalAmount: 60000, amountPaid: 40000, balance: 20000, status: "Partial" },
  { id: "inv-4", invoiceNumber: "INV-2026-004", customerName: "Ally Mnyama (Bodaboda)", date: "2026-10-18", dueDate: "2026-10-28", totalAmount: 120000, amountPaid: 0, balance: 120000, status: "Unpaid" },
];

const INITIAL_EXPENSES: DemoExpense[] = [
  { id: "e1", category: "Kodi", description: "Kodi ya duka mwezi huu", amount: 250000, date: "2026-10-01" },
  { id: "e2", category: "Umeme", description: "Luku ya mita ya duka", amount: 35000, date: "2026-10-10" },
  { id: "e3", category: "Usafiri", description: "Usafiri wa kuleta mzigo kutoka Kariakoo", amount: 18000, date: "2026-10-14" },
  { id: "e4", category: "Mifuko & Vifungashio", description: "Mifuko ya kubebea bidhaa", amount: 15000, date: "2026-10-16" },
];

const BRANCHES = [
  { id: "b1", name: "Duka Kuu la Kariakoo (Main)" },
  { id: "b2", name: "Tawi la Mwenge" },
  { id: "b3", name: "Tawi la Arusha Mjini" },
];

function DemoPage() {
  const navigate = useNavigate();

  // Active view: matches real AppShell navigation
  const [activeView, setActiveView] = useState<
    "dashboard" | "pos" | "products" | "inventory" | "sales" | "invoices" | "customers" | "expenses" | "reports" | "settings"
  >("dashboard");

  // Business profile
  const [businessName, setBusinessName] = useState<string>("Duka Langu la Mfano");
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].name);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<"sw" | "en">("sw");
  const [isDark, setIsDark] = useState(false);

  // Core demo data state
  const [products, setProducts] = useState<DemoProduct[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<DemoCustomer[]>(INITIAL_CUSTOMERS);
  const [invoices, setInvoices] = useState<DemoInvoice[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<DemoExpense[]>(INITIAL_EXPENSES);

  // Past seed sales for realistic history
  const [sales, setSales] = useState<DemoSale[]>([
    {
      id: "sale-seed-1",
      receiptNumber: "MC-842910",
      items: [{ ...INITIAL_PRODUCTS[1], qty: 3 }, { ...INITIAL_PRODUCTS[3], qty: 2 }],
      subtotal: 9400,
      discount: 400,
      total: 9000,
      paymentMethod: "cash",
      amountPaid: 10000,
      change: 1000,
      customerName: "Mteja wa Kawaida",
      createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
      profit: 2950,
    },
    {
      id: "sale-seed-2",
      receiptNumber: "MC-842909",
      items: [{ ...INITIAL_PRODUCTS[2], qty: 1 }],
      subtotal: 5500,
      discount: 0,
      total: 5500,
      paymentMethod: "mobile_money",
      amountPaid: 5500,
      change: 0,
      customerName: "Grace Mushi (Salon)",
      createdAt: new Date(Date.now() - 110 * 60000).toISOString(),
      profit: 1300,
    },
    {
      id: "sale-seed-3",
      receiptNumber: "MC-842908",
      items: [{ ...INITIAL_PRODUCTS[0], qty: 2 }, { ...INITIAL_PRODUCTS[5], qty: 1 }],
      subtotal: 8800,
      discount: 0,
      total: 8800,
      paymentMethod: "credit",
      amountPaid: 0,
      change: 0,
      customerName: "Mama Salma (Kariakoo)",
      createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
      profit: 2500,
    },
  ]);

  // POS State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [completedSale, setCompletedSale] = useState<DemoSale | null>(null);

  // New product dialog state
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Vyakula");
  const [newProdCost, setNewProdCost] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [isAddProdOpen, setIsAddProdOpen] = useState(false);

  // Initialize theme and stored demo settings
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    try {
      const stored = localStorage.getItem("mauzochap_demo_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.businessName) setBusinessName(parsed.businessName);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  // Filtered products for POS
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      const matchesCat =
        selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, search, selectedCategory]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.sellPrice * item.qty, 0);
  }, [cart]);

  const discountAmount = Number(discount) || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const numAmountPaid = amountPaid === "" ? finalTotal : Number(amountPaid);
  const change = Math.max(0, numAmountPaid - finalTotal);

  // Cart actions
  const addToCart = (product: DemoProduct) => {
    if (product.stock <= 0) {
      toast.error(`Bidhaa ${product.name} haina stoki ya kutosha.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.warning(`Umeongeza idadi yote iliyopo stoo (${product.stock}).`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    const product = products.find((p) => p.id === id);
    if (product && newQty > product.stock) {
      toast.warning(`Stoo ina jumla ya ${product.stock} tu.`);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Complete Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      toast.error("Kikapu kiko tupu!");
      return;
    }

    if (paymentMethod === "credit" && !selectedCustomerId) {
      toast.error("Tafadhali chagua mteja ili kurekodi deni hili!");
      return;
    }

    const saleCost = cart.reduce((acc, item) => acc + item.costPrice * item.qty, 0);
    const saleProfit = finalTotal - saleCost;
    const receiptNo = `MC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newSale: DemoSale = {
      id: `sale-${Date.now()}`,
      receiptNumber: receiptNo,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      total: finalTotal,
      paymentMethod,
      amountPaid: paymentMethod === "credit" ? 0 : numAmountPaid,
      change: paymentMethod === "credit" ? 0 : change,
      customerName:
        customers.find((c) => c.id === selectedCustomerId)?.name || "Mteja wa Kawaida (Walk-in)",
      createdAt: new Date().toISOString(),
      profit: saleProfit,
    };

    // Deduct stock from products
    setProducts((prev) =>
      prev.map((prod) => {
        const cartItem = cart.find((ci) => ci.id === prod.id);
        if (cartItem) {
          return { ...prod, stock: Math.max(0, prod.stock - cartItem.qty) };
        }
        return prod;
      })
    );

    // If credit sale, update customer debt balance
    if (paymentMethod === "credit" && selectedCustomerId) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomerId
            ? { ...c, balance: c.balance + finalTotal, totalSpent: c.totalSpent + finalTotal }
            : c
        )
      );
    }

    setSales((prev) => [newSale, ...prev]);
    setCompletedSale(newSale);
    setCart([]);
    setDiscount("");
    setAmountPaid("");
    setSelectedCustomerId("");

    toast.success(`Mauzo yamekamilika! Risiti #${receiptNo}`);
  };

  // Add new product
  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) {
      toast.error("Weka jina na bei ya kuuza");
      return;
    }

    const newProd: DemoProduct = {
      id: `prod-${Date.now()}`,
      name: newProdName,
      category: newProdCategory,
      costPrice: Number(newProdCost) || 0,
      sellPrice: Number(newProdPrice) || 0,
      stock: Number(newProdStock) || 10,
      lowStockThreshold: 5,
      barcode: `${Math.floor(6001000 + Math.random() * 9000)}`,
      expiryDate: "2027-12-31",
    };

    setProducts((prev) => [newProd, ...prev]);
    setNewProdName("");
    setNewProdCost("");
    setNewProdPrice("");
    setNewProdStock("");
    setIsAddProdOpen(false);
    toast.success(`Bidhaa "${newProd.name}" imeongezwa kwenye stoo ya demo!`);
  };

  // Receive Customer Debt Payment
  const handleReceiveDebtPayment = (customer: DemoCustomer) => {
    const payStr = prompt(`Weka kiasi kilicholipwa na ${customer.name} (Deni la sasa: TZS ${customer.balance.toLocaleString()}):`, `${customer.balance}`);
    if (!payStr) return;
    const payNum = Number(payStr);
    if (isNaN(payNum) || payNum <= 0) {
      toast.error("Kiasi si sahihi");
      return;
    }

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customer.id
          ? { ...c, balance: Math.max(0, c.balance - payNum) }
          : c
      )
    );
    toast.success(`Malipo ya TZS ${payNum.toLocaleString()} yamepokelewa kutoka kwa ${customer.name}!`);
  };

  // Send WhatsApp Reminder
  const handleSendReminder = (customer: DemoCustomer) => {
    const msg = encodeURIComponent(
      `Habari ${customer.name},\n\nHuu ni ukumbusho wa kirafiki kutoka kwa *${businessName}*.\nSalio lako la deni linalosubiriwa ni *${formatTZS(customer.balance)}*.\n\nTafadhali fanya malipo kwa urahisi au wasiliana nasi. Asante sana kwa kuwa mteja wetu wa thamani!`
    );
    window.open(`https://wa.me/255${customer.phone.replace(/^0/, "")}?text=${msg}`, "_blank");
  };

  // Dynamic Dashboard Calculations
  const totalSalesFromSession = sales.reduce((acc, s) => acc + s.total, 0);
  const totalAllTime = 14850000 + totalSalesFromSession;
  const totalToday = 520000 + totalSalesFromSession;
  const totalWeek = 3450000 + totalSalesFromSession;
  const totalMonth = 8920000 + totalSalesFromSession;
  const totalPendingDebts = customers.reduce((acc, c) => acc + c.balance, 0);

  // Invoices summary
  const totalInvoicesCount = invoices.length;
  const paidInvoicesCount = invoices.filter((i) => i.status === "Paid").length;
  const unpaidInvoicesCount = invoices.filter((i) => i.status === "Unpaid").length;
  const outstandingInvoicesBalance = invoices.reduce((sum, i) => sum + i.balance, 0);

  // 7-day chart data
  const chartData = [
    { name: "Mon", total: 420000 },
    { name: "Tue", total: 580000 },
    { name: "Wed", total: 390000 },
    { name: "Thu", total: 610000 },
    { name: "Fri", total: 850000 },
    { name: "Sat", total: 950000 },
    { name: "Sun", total: 520000 + totalSalesFromSession },
  ];

  // Low stock products
  const lowStockList = products
    .filter((p) => p.stock <= p.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock);

  // Top products
  const topProducts = [
    { name: "Azam Energy Drink 350ml", quantity: 64, revenue: 64000 },
    { name: "Panadol Extra (Pack)", quantity: 38, revenue: 114000 },
    { name: "Mo Safi Cooking Oil 1L", quantity: 22, revenue: 121000 },
    { name: "Sukari Kilombero 1kg", quantity: 45, revenue: 144000 },
    { name: "Sabuni ya Ushindi 1kg", quantity: 28, revenue: 70000 },
  ];

  // Navigation Items matching real AppShell
  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: lang === "sw" ? "Dashibodi" : "Dashboard" },
    { id: "pos", icon: ShoppingCart, label: lang === "sw" ? "Kaunta ya POS" : "New Sale (POS)" },
    { id: "products", icon: Boxes, label: lang === "sw" ? "Bidhaa" : "Products" },
    { id: "inventory", icon: ClipboardList, label: lang === "sw" ? "Stoo & Hesabu" : "Inventory" },
    { id: "sales", icon: ReceiptIcon, label: lang === "sw" ? "Mauzo" : "Sales History" },
    { id: "invoices", icon: FileText, label: lang === "sw" ? "Ankara (Invoices)" : "Invoices" },
    { id: "customers", icon: Users, label: lang === "sw" ? "Wateja & Madeni" : "Customers" },
    { id: "expenses", icon: Wallet, label: lang === "sw" ? "Matumizi" : "Expenses" },
    { id: "reports", icon: BarChart3, label: lang === "sw" ? "Ripoti za Faida" : "Reports" },
    { id: "settings", icon: Settings, label: lang === "sw" ? "Mipangilio" : "Settings" },
  ];

  // Common Sidebar Component
  const sidebarContent = (
    <div className="flex flex-col h-full text-sidebar-foreground">
      {/* Brand Header — Transparent logo, NO white bounding box, NO "TZ" badge */}
      <div className="px-6 py-5 border-b border-sidebar-border flex flex-col gap-2 shrink-0">
        <button
          onClick={() => { setActiveView("dashboard"); setMobileMenuOpen(false); }}
          className="flex items-center gap-3 text-left group"
        >
          <img
            src="/images/logo.png"
            alt="MauzoChap"
            className="w-9 h-9 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-bold text-xl leading-tight tracking-tight text-sidebar-foreground">
            MauzoChap
          </span>
        </button>

        {/* Branch Selector Dropdown */}
        <div className="relative mt-2">
          <button
            onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/30 text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-left"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold truncate">{businessName}</span>
                <span className="text-[10px] text-muted-foreground truncate">{selectedBranch}</span>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
          </button>

          {isBranchMenuOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card text-card-foreground border border-border rounded-xl shadow-xl overflow-hidden py-1 text-xs">
              <div className="px-3 py-1 font-bold text-[10px] uppercase text-muted-foreground border-b border-border">
                Chagua Tawi / Branch
              </div>
              {BRANCHES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBranch(b.name);
                    setIsBranchMenuOpen(false);
                    toast.success(`Umebadilisha tawi: ${b.name}`);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-muted transition-colors ${
                    selectedBranch === b.name ? "bg-primary/10 text-primary font-bold" : ""
                  }`}
                >
                  <span>{b.name}</span>
                  {selectedBranch === b.name && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as any);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
              <span className="truncate">{item.label}</span>
              {item.id === "pos" && cart.length > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
              {item.id === "inventory" && lowStockList.length > 0 && (
                <span className="ml-auto bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {lowStockList.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile & Controls */}
      <div className="border-t border-sidebar-border p-4 space-y-3 bg-sidebar/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-sidebar-foreground/80 truncate font-medium max-w-[170px]">
            demo@mauzochap.com
          </div>
          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-primary/20">
            ADMIN
          </span>
        </div>

        {/* Theme & Language Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-1.5 rounded-md border border-sidebar-border px-2.5 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Theme Toggle"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-primary" />}
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>

          <button
            onClick={() => setLang(lang === "en" ? "sw" : "en")}
            className="flex items-center justify-center gap-1.5 rounded-md border border-sidebar-border px-2.5 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors uppercase font-bold"
            title="Language"
          >
            <Languages className="w-3.5 h-3.5 text-primary" />
            <span>{lang}</span>
          </button>
        </div>

        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-bold shadow hover:opacity-95 transition-all"
        >
          <span>Sajili Duka Halisi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* TOP DEMO SANDBOX BANNER */}
      {/* ========================================================================= */}
      <div className="bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-between gap-3 shadow-sm z-50">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            ⚡ <strong>Hali ya Demo (Live Interactive Sandbox)</strong> — Unaona mfumo halisi wa MauzoChap jinsi utakavyokuwa kwenye duka lako.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="px-3 py-1 rounded-lg bg-white text-primary font-bold hover:bg-white/90 transition-all flex items-center gap-1 shadow-sm text-xs"
          >
            <span>Sajili Duka Lako Sasa</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <Link to="/" className="text-white/80 hover:text-white underline text-[11px]">
            Rudi Mwanzo
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL ACCOUNTSHELL SHELL STRUCTURE */}
      {/* ========================================================================= */}
      <div className="flex flex-1 min-h-[calc(100vh-36px)]">
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-sm h-screen sticky top-0 overflow-hidden">
          {sidebarContent}
        </aside>

        {/* Mobile Top Bar */}
        <div className="lg:hidden fixed top-9 inset-x-0 z-40 h-16 flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 border-b border-sidebar-border shadow-sm">
          <button
            onClick={() => setActiveView("dashboard")}
            className="flex items-center gap-2.5"
          >
            <img src="/images/logo.png" alt="MauzoChap" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg leading-tight tracking-tight text-sidebar-foreground">
              MauzoChap
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
              title="Theme Toggle"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-md"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-out Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-24 z-50 bg-black/50 backdrop-blur-sm flex">
            <div className="w-[280px] bg-sidebar border-r border-sidebar-border h-full overflow-y-auto">
              {sidebarContent}
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Application Area (Dynamic based on activeView) */}
        <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 bg-muted/20 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

            {/* =================================================================== */}
            {/* 1. DASHBOARD VIEW — IDENTICAL TO REAL _authenticated/dashboard.tsx */}
            {/* =================================================================== */}
            {activeView === "dashboard" && (
              <div className="space-y-6 pb-12">
                {/* Dashboard Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                      {lang === "sw" ? "Dashibodi" : "Dashboard"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {lang === "sw"
                        ? "Muhtasari wa mauzo, stoo na mwenendo wa biashara yako leo"
                        : "Sales overview, inventory, and real-time retail performance"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveView("pos")}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow hover:opacity-95 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{lang === "sw" ? "+ Mauzo Mapya (POS)" : "+ New Sale"}</span>
                    </button>
                    <button
                      onClick={() => setIsAddProdOpen(true)}
                      className="px-3 py-2 rounded-xl border border-border bg-card text-foreground font-semibold text-xs hover:bg-muted flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary" />
                      <span>{lang === "sw" ? "Ongeza Bidhaa" : "Add Product"}</span>
                    </button>
                  </div>
                </div>

                {/* Primary KPIs (4 Metric Cards matching real dashboard) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1: Total Sales All Time */}
                  <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {lang === "sw" ? "Jumla ya Mauzo Yote" : "Total Sales All Time"}
                      </span>
                      <div
                        className="grid h-8 w-8 place-items-center rounded-md text-primary-foreground"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                      {formatTZS(totalAllTime)}
                    </div>
                  </div>

                  {/* Card 2: Today's Sales */}
                  <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {lang === "sw" ? "Mauzo ya Leo" : "Today's Sales"}
                      </span>
                      <div className="grid h-8 w-8 place-items-center rounded-md text-primary bg-primary/10">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                      {formatTZS(totalToday)}
                    </div>
                  </div>

                  {/* Card 3: Week Sales */}
                  <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {lang === "sw" ? "Mauzo ya Wiki Hii" : "Week's Sales"}
                      </span>
                      <div className="grid h-8 w-8 place-items-center rounded-md text-primary bg-primary/10">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                      {formatTZS(totalWeek)}
                    </div>
                  </div>

                  {/* Card 4: Month Sales */}
                  <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {lang === "sw" ? "Mauzo ya Mwezi Huu" : "Month's Sales"}
                      </span>
                      <div className="grid h-8 w-8 place-items-center rounded-md text-primary bg-primary/10">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                      {formatTZS(totalMonth)}
                    </div>
                  </div>
                </div>

                {/* Secondary KPIs (3 Cards matching real dashboard) */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {lang === "sw" ? "Madeni Yanayosubiriwa" : "Pending Debts"}
                      </div>
                      <div className="text-xl font-bold text-amber-500">{formatTZS(totalPendingDebts)}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-muted rounded-full text-muted-foreground">
                      <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {lang === "sw" ? "Jumla ya Bidhaa" : "Total Products"}
                      </div>
                      <div className="text-xl font-bold text-foreground">{products.length} Bidhaa</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
                    <div className="p-3 bg-muted rounded-full text-muted-foreground">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {lang === "sw" ? "Wateja Waliosajiliwa" : "Customers"}
                      </div>
                      <div className="text-xl font-bold text-foreground">{customers.length} Wateja</div>
                    </div>
                  </div>
                </div>

                {/* Invoices Statistics (4 Cards matching real dashboard) */}
                <div className="space-y-3">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    {lang === "sw" ? "Muhtasari wa Ankara (Invoices)" : "Invoice Summary"}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
                      <div className="p-3 bg-muted rounded-full text-muted-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {lang === "sw" ? "Jumla ya Ankara" : "Total Invoices"}
                        </div>
                        <div className="text-xl font-bold text-foreground">{totalInvoicesCount}</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
                      <div className="p-3 rounded-full text-emerald-500 bg-emerald-500/10">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {lang === "sw" ? "Ankara Zilizolipwa" : "Paid Invoices"}
                        </div>
                        <div className="text-xl font-bold text-foreground">{paidInvoicesCount}</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
                      <div className="p-3 rounded-full text-destructive bg-destructive/10">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {lang === "sw" ? "Ankara Zisizolipwa" : "Unpaid Invoices"}
                        </div>
                        <div className="text-xl font-bold text-foreground">{unpaidInvoicesCount}</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 shadow-sm">
                      <div className="p-3 rounded-full text-amber-500 bg-amber-500/10">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {lang === "sw" ? "Salio Lililosalia" : "Outstanding Balance"}
                        </div>
                        <div className="text-xl font-bold text-foreground">{formatTZS(outstandingInvoicesBalance)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7-Day Chart & Low Stock Alerts Row */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Sales Summary Chart (Recharts) */}
                  <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm flex flex-col">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <h2 className="font-semibold text-foreground">
                        {lang === "sw" ? "Mwenendo wa Mauzo ya Siku 7 (TZS)" : "7-Day Sales Trend"}
                      </h2>
                      <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> +18.5%
                      </span>
                    </div>
                    <div className="p-5 flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickFormatter={(val) => `${val / 1000}k`} />
                          <Tooltip
                            cursor={{ fill: "var(--muted)" }}
                            contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)" }}
                            formatter={(value: any) => [formatTZS(Number(value)), "Mauzo"]}
                          />
                          <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Low Stock Alert List */}
                  <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-amber-500/5 text-amber-500">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <h2 className="font-semibold text-sm">
                          {lang === "sw" ? "Bidhaa Zinazokaribia Kuisha" : "Low Stock Alerts"}
                        </h2>
                      </div>
                      <span className="text-xs font-bold bg-amber-500/20 px-2 py-0.5 rounded-full">
                        {lowStockList.length}
                      </span>
                    </div>
                    <div className="divide-y divide-border overflow-y-auto max-h-[300px]">
                      {lowStockList.length > 0 ? (
                        lowStockList.map((p) => (
                          <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-muted/20">
                            <div>
                              <span className="font-medium truncate block">{p.name}</span>
                              <span className="text-[10px] text-muted-foreground">Kiwango cha chini: {p.lowStockThreshold}</span>
                            </div>
                            <span className="rounded-full bg-amber-500/15 text-amber-500 px-2 py-0.5 text-xs font-bold whitespace-nowrap">
                              {p.stock} {lang === "sw" ? "zimebaki" : "left"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                          {lang === "sw" ? "Stoo iko sawa kabisa." : "All products are well stocked."}
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-border mt-auto">
                      <button
                        onClick={() => setActiveView("inventory")}
                        className="w-full py-2 rounded-lg bg-muted text-foreground text-xs font-bold hover:bg-muted/80 text-center transition-colors"
                      >
                        {lang === "sw" ? "Tazama Stoo Yote &rarr;" : "View Full Inventory &rarr;"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Sales & Top Selling Products Row */}
                <div className="grid gap-6 lg:grid-cols-2 mt-6">
                  {/* Recent Transactions */}
                  <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col h-[400px]">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <h2 className="font-semibold text-foreground">
                        {lang === "sw" ? "Mauzo ya Hivi Karibuni" : "Recent Sales"}
                      </h2>
                      <button
                        onClick={() => setActiveView("pos")}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        + {lang === "sw" ? "Mauzo Mapya" : "New Sale"}
                      </button>
                    </div>
                    <div className="divide-y divide-border overflow-y-auto flex-1">
                      {sales.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs sm:text-sm text-foreground">{s.receiptNumber}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {formatDate(s.createdAt)} · <span className="uppercase font-semibold">{s.paymentMethod}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="font-bold text-sm text-foreground text-right">
                              {formatTZS(s.total)}
                            </div>
                            <button
                              onClick={() => setCompletedSale(s)}
                              className="px-2 py-1 rounded-md text-[11px] font-bold border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                            >
                              {lang === "sw" ? "Risiti" : "Receipt"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Selling Products This Month */}
                  <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col h-[400px]">
                    <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-primary/5">
                      <h2 className="font-semibold text-primary">
                        {lang === "sw" ? "Bidhaa Zinazoongoza Mwezi Huu" : "Top Selling Products"}
                      </h2>
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
                        <Activity className="h-3 w-3" />
                      </div>
                    </div>
                    <div className="divide-y divide-border overflow-y-auto flex-1 p-2">
                      {topProducts.map((p, i) => (
                        <div
                          key={p.name}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                              {i + 1}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-foreground">{p.name}</div>
                              <div className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">{p.quantity}</span> {lang === "sw" ? "zilizouzwa" : "sold"}
                              </div>
                            </div>
                          </div>
                          <div className="font-semibold text-sm text-right text-foreground">
                            {formatTZS(p.revenue)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 2. KAUNTA YA POS (POINT OF SALE) */}
            {/* =================================================================== */}
            {activeView === "pos" && (
              <div className="space-y-6 pb-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Kaunta ya POS (Mauzo ya Haraka)</h1>
                    <p className="text-sm text-muted-foreground">Chagua au tafuta bidhaa kisha kamilisha malipo kwa sekunde chache.</p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12 items-start">
                  {/* Left Column: Product Search & Grid */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Tafuta jina la bidhaa au namba ya barcode..."
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                        />
                        {search && (
                          <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none"
                      >
                        <option value="all">Kategoria Zote</option>
                        <option value="Vyakula">Vyakula</option>
                        <option value="Vinywaji">Vinywaji</option>
                        <option value="Dawa & Afya">Dawa & Afya</option>
                        <option value="Vipodozi & Sabuni">Vipodozi & Sabuni</option>
                      </select>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredProducts.map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => addToCart(prod)}
                          className="p-3.5 rounded-2xl border border-border bg-card text-left transition-all hover:border-primary/50 hover:shadow-md active:scale-95 flex flex-col justify-between group h-36"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider truncate">
                                {prod.category}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  prod.stock <= prod.lowStockThreshold
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {prod.stock} stoo
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-foreground mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                              {prod.name}
                            </h4>
                          </div>

                          <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-border/50">
                            <span className="text-xs font-black text-foreground">
                              {formatTZS(prod.sellPrice)}
                            </span>
                            <span className="text-[11px] text-primary font-bold group-hover:underline">
                              + Ongeza
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Checkout Cart Box */}
                  <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4 sticky top-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                        <h3 className="font-bold text-sm text-foreground">Kikapu cha Mauzo</h3>
                      </div>
                      {cart.length > 0 && (
                        <button
                          onClick={() => setCart([])}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Futa
                        </button>
                      )}
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-border/60">
                      {cart.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          Kikapu kiko tupu. Bonyeza bidhaa kuongeza kwenye mauzo.
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                            <div className="flex-1 pr-2 truncate">
                              <span className="font-bold text-foreground block truncate">{item.name}</span>
                              <span className="text-muted-foreground text-[11px]">
                                {formatTZS(item.sellPrice)} x {item.qty} = <strong className="text-foreground">{formatTZS(item.sellPrice * item.qty)}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => updateCartQty(item.id, item.qty - 1)}
                                className="w-6 h-6 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-bold">{item.qty}</span>
                              <button
                                onClick={() => updateCartQty(item.id, item.qty + 1)}
                                className="w-6 h-6 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Customer & Payment Method Selector */}
                    <div className="space-y-3 pt-3 border-t border-border text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                          Mteja (Hiari au kwa Mauzo ya Deni):
                        </label>
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => setSelectedCustomerId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                        >
                          <option value="">Mteja wa Kawaida (Walk-in Customer)</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.balance > 0 ? `(Anadaiwa ${formatTZS(c.balance)})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                          Njia ya Malipo:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("cash")}
                            className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold transition-all ${
                              paymentMethod === "cash"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Taslimu (Cash)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("mobile_money")}
                            className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold transition-all ${
                              paymentMethod === "mobile_money"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Lipa Namba
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("credit")}
                            className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold transition-all ${
                              paymentMethod === "credit"
                                ? "border-amber-500 bg-amber-500/10 text-amber-500"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            Mkopo (Deni)
                          </button>
                        </div>
                      </div>

                      {/* Calculations */}
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Jumla Ndogo:</span>
                          <span>{formatTZS(subtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-500 font-bold">
                            <span>Punguzo:</span>
                            <span>-{formatTZS(discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-black text-foreground pt-1 border-t border-border">
                          <span>JUMLA KUU:</span>
                          <span className="text-primary">{formatTZS(finalTotal)}</span>
                        </div>
                      </div>

                      {/* Submit Sale Button */}
                      <button
                        onClick={handleCompleteSale}
                        disabled={cart.length === 0}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Kamilisha Mauzo ({formatTZS(finalTotal)})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 3. STOO NA BIDHAA (INVENTORY & PRODUCTS) */}
            {/* =================================================================== */}
            {(activeView === "products" || activeView === "inventory") && (
              <div className="space-y-6 pb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      Usimamizi wa Stoo & Bidhaa
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Fuatilia viwango vya stoo, bei ya kununua na kuuza, faida kwa kila kitengo, na tarehe za kuisha.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddProdOpen(true)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow hover:opacity-95 flex items-center gap-1.5 w-fit"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ongeza Bidhaa Mpya</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                          <th className="p-3.5">Jina la Bidhaa</th>
                          <th className="p-3.5">Kategoria</th>
                          <th className="p-3.5">Bei ya Kununua</th>
                          <th className="p-3.5">Bei ya Kuuza</th>
                          <th className="p-3.5">Faida / Unit</th>
                          <th className="p-3.5">Stoo Iliyopo</th>
                          <th className="p-3.5">Tarehe ya Kuisha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {products.map((p) => {
                          const unitProfit = p.sellPrice - p.costPrice;
                          const isLow = p.stock <= p.lowStockThreshold;
                          return (
                            <tr key={p.id} className="hover:bg-muted/20">
                              <td className="p-3.5 font-bold text-foreground">{p.name}</td>
                              <td className="p-3.5 text-muted-foreground">{p.category}</td>
                              <td className="p-3.5 text-muted-foreground">{formatTZS(p.costPrice)}</td>
                              <td className="p-3.5 font-bold text-foreground">{formatTZS(p.sellPrice)}</td>
                              <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                +{formatTZS(unitProfit)}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    isLow
                                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  }`}
                                >
                                  {p.stock} units {isLow ? "(Chini)" : ""}
                                </span>
                              </td>
                              <td className="p-3.5 text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{p.expiryDate}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 4. HISTORIA YA MAUZO (SALES HISTORY) */}
            {/* =================================================================== */}
            {activeView === "sales" && (
              <div className="space-y-6 pb-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Historia ya Mauzo & Risiti</h1>
                    <p className="text-sm text-muted-foreground">Kila mauzo yaliyofanyika yana rekodi kamili na risiti inayoweza kuchapishwa au kutumwa WhatsApp.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sales.map((sale) => (
                    <div key={sale.id} className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="font-bold text-sm text-foreground">{sale.receiptNumber}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDate(sale.createdAt)}</span>
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="text-muted-foreground">Mteja: <span className="font-bold text-foreground">{sale.customerName}</span></div>
                        <div className="text-muted-foreground">Njia ya Malipo: <span className="capitalize font-bold text-foreground">{sale.paymentMethod}</span></div>
                        <div className="text-muted-foreground">Bidhaa: <span className="font-bold text-foreground">{sale.items.length} aina</span></div>
                        <div className="text-base font-black text-primary pt-1">{formatTZS(sale.total)}</div>
                      </div>
                      <button
                        onClick={() => setCompletedSale(sale)}
                        className="w-full py-2.5 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Fungua Risiti ya Thermal</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 5. ANKARA / INVOICES */}
            {/* =================================================================== */}
            {activeView === "invoices" && (
              <div className="space-y-6 pb-12">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Usimamizi wa Ankara (Invoices)</h1>
                  <p className="text-sm text-muted-foreground">Tengeneza, fuatilia na tuma ankara za kidigitali kwa wateja wa jumla na madeni.</p>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                          <th className="p-3.5">Ankara #</th>
                          <th className="p-3.5">Mteja</th>
                          <th className="p-3.5">Tarehe</th>
                          <th className="p-3.5">Mwisho wa Kulipa</th>
                          <th className="p-3.5">Kiasi Kamili</th>
                          <th className="p-3.5">Kiasi Kilicholipwa</th>
                          <th className="p-3.5">Salio</th>
                          <th className="p-3.5">Hali</th>
                          <th className="p-3.5 text-right">Kitendo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-muted/20">
                            <td className="p-3.5 font-bold text-foreground">{inv.invoiceNumber}</td>
                            <td className="p-3.5">{inv.customerName}</td>
                            <td className="p-3.5 text-muted-foreground">{inv.date}</td>
                            <td className="p-3.5 text-muted-foreground">{inv.dueDate}</td>
                            <td className="p-3.5 font-bold">{formatTZS(inv.totalAmount)}</td>
                            <td className="p-3.5 text-emerald-600 font-medium">{formatTZS(inv.amountPaid)}</td>
                            <td className="p-3.5 font-bold text-amber-500">{formatTZS(inv.balance)}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === "Paid"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : inv.status === "Partial"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  const text = encodeURIComponent(
                                    `Habari ${inv.customerName},\n\nHii ni ankara #${inv.invoiceNumber} kutoka kwa *${businessName}*.\nJumla: *${formatTZS(inv.totalAmount)}*\nImelipwa: *${formatTZS(inv.amountPaid)}*\nSalio: *${formatTZS(inv.balance)}*\nMwisho wa kulipa: ${inv.dueDate}.\n\nAsante!`
                                  );
                                  window.open(`https://wa.me/?text=${text}`, "_blank");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold text-[11px]"
                              >
                                Tuma WhatsApp
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 6. WATEJA NA MADENI (CUSTOMERS & DEBTS) */}
            {/* =================================================================== */}
            {activeView === "customers" && (
              <div className="space-y-6 pb-12">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Wateja & Usimamizi wa Madeni</h1>
                  <p className="text-sm text-muted-foreground">Fuatilia historia ya manunuzi ya wateja, madeni yaliyosalia na pokea malipo.</p>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                          <th className="p-3.5">Jina la Mteja</th>
                          <th className="p-3.5">Namba ya Simu</th>
                          <th className="p-3.5">Jumla ya Mauzo Yake</th>
                          <th className="p-3.5">Deni Linalodaiwa</th>
                          <th className="p-3.5 text-right">Vitendo vya Haraka</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {customers.map((c) => (
                          <tr key={c.id} className="hover:bg-muted/20">
                            <td className="p-3.5 font-bold text-foreground">{c.name}</td>
                            <td className="p-3.5 text-muted-foreground">{c.phone}</td>
                            <td className="p-3.5 font-medium">{formatTZS(c.totalSpent)}</td>
                            <td className="p-3.5">
                              {c.balance > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-black text-xs">
                                  {formatTZS(c.balance)}
                                </span>
                              ) : (
                                <span className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Hana Deni
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              {c.balance > 0 && (
                                <>
                                  <button
                                    onClick={() => handleReceiveDebtPayment(c)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px] hover:bg-emerald-600"
                                  >
                                    Pokea Malipo
                                  </button>
                                  <button
                                    onClick={() => handleSendReminder(c)}
                                    className="px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] hover:bg-emerald-500/10"
                                  >
                                    Tuma WhatsApp
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 7. MATUMIZI YA DUKA (EXPENSES) */}
            {/* =================================================================== */}
            {activeView === "expenses" && (
              <div className="space-y-6 pb-12">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Rekodi za Matumizi (Expenses)</h1>
                    <p className="text-sm text-muted-foreground">Kodi, bili za umeme, mishahara na gharama ndogondogo za kila siku.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {expenses.map((e) => (
                    <div key={e.id} className="p-4 rounded-2xl border border-border bg-card space-y-2 shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{e.category}</span>
                      <h4 className="font-bold text-sm text-foreground">{e.description}</h4>
                      <div className="text-lg font-black text-destructive">{formatTZS(e.amount)}</div>
                      <div className="text-[10px] text-muted-foreground">{e.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 8. RIPOTI ZA FAIDA (REPORTS) */}
            {/* =================================================================== */}
            {activeView === "reports" && (
              <div className="space-y-6 pb-12">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Ripoti za Faida & Hasara</h1>
                  <p className="text-sm text-muted-foreground">Tathmini mwenendo wa faida halisi baada ya kutoa gharama za kununua bidhaa.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
                    <span className="text-xs text-muted-foreground font-semibold">Jumla ya Mauzo Ghafi</span>
                    <div className="text-2xl font-black text-foreground">{formatTZS(totalMonth)}</div>
                  </div>
                  <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
                    <span className="text-xs text-muted-foreground font-semibold">Gharama za Bidhaa (COGS)</span>
                    <div className="text-2xl font-black text-muted-foreground">{formatTZS(Math.round(totalMonth * 0.72))}</div>
                  </div>
                  <div className="p-5 rounded-2xl border border-border bg-card space-y-1 bg-primary/5 border-primary/20">
                    <span className="text-xs text-primary font-bold">Faida Halisi (Net Profit)</span>
                    <div className="text-2xl font-black text-primary">{formatTZS(Math.round(totalMonth * 0.28))}</div>
                    <span className="text-[10px] text-emerald-500 font-bold">Margin: ~28.0%</span>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* 9. MIPANGILIO YA DUKA (SETTINGS) */}
            {/* =================================================================== */}
            {activeView === "settings" && (
              <div className="space-y-6 pb-12 max-w-2xl">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Mipangilio ya Mfumo</h1>
                  <p className="text-sm text-muted-foreground">Taarifa za duka, machapisho ya risiti na namba za mawasiliano.</p>
                </div>

                <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Jina la Biashara:</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Namba ya Simu ya Risiti:</label>
                    <input
                      type="text"
                      defaultValue="+255 627 274 168"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Maneno ya Mwisho wa Risiti (Footer):</label>
                    <input
                      type="text"
                      defaultValue="Asante kwa kufanya biashara nasi! Karibu tena."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground"
                    />
                  </div>

                  <button
                    onClick={() => toast.success("Mipangilio imehifadhiwa kwa duka hili la demo!")}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow hover:opacity-95"
                  >
                    Hifadhi Mipangilio
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* REALISTIC THERMAL RECEIPT MODAL */}
      {/* ========================================================================= */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setCompletedSale(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Thermal Paper Simulator */}
            <div className="bg-white text-zinc-900 font-mono text-[11px] p-5 rounded-lg shadow-inner border border-zinc-200 space-y-3">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm tracking-tight uppercase">{businessName}</h4>
                <p className="text-[10px] text-zinc-600">MauzoChap POS • Tanzania</p>
                <p className="text-[10px] text-zinc-600">Simu: +255 627 274 168</p>
                <div className="border-b border-dashed border-zinc-400 my-2" />
                <div className="flex justify-between text-[10px] text-zinc-700">
                  <span>Risiti: {completedSale.receiptNumber}</span>
                  <span>{formatDate(completedSale.createdAt)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-700">
                  <span>Mteja: {completedSale.customerName}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-zinc-400 my-2" />

              {/* Items Table */}
              <div className="space-y-1.5">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span className="truncate pr-2">{item.name} x {item.qty}</span>
                    <span className="font-bold shrink-0">{formatTZS(item.sellPrice * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-zinc-400 my-2" />

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Jumla Ndogo:</span>
                  <span>{formatTZS(completedSale.subtotal)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Punguzo:</span>
                    <span>-{formatTZS(completedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs border-t border-zinc-400 pt-1">
                  <span>JUMLA KUU:</span>
                  <span>{formatTZS(completedSale.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-600">
                  <span>Njia ya Malipo:</span>
                  <span className="capitalize">{completedSale.paymentMethod}</span>
                </div>
                {completedSale.paymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between text-[10px] text-zinc-600">
                      <span>Pesa Iliyotolewa:</span>
                      <span>{formatTZS(completedSale.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-600 font-bold">
                      <span>Chenji:</span>
                      <span>{formatTZS(completedSale.change)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="border-b border-dashed border-zinc-400 my-2" />

              <div className="text-center text-[10px] text-zinc-500">
                <p>Asante kwa Kufanya Biashara Nasi!</p>
                <p className="text-[9px]">Imetengenezwa na MauzoChap POS</p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl border border-border hover:bg-muted flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Chapisha (Print)</span>
              </button>

              <button
                onClick={() => {
                  const receiptText = encodeURIComponent(
                    `*RISITI YA MAUZO — ${businessName}*\nRisiti #: ${completedSale.receiptNumber}\nTarehe: ${formatDate(completedSale.createdAt)}\n\n${completedSale.items.map((i) => `• ${i.name} (${i.qty}x) = ${formatTZS(i.sellPrice * i.qty)}`).join("\n")}\n\n*JUMLA: ${formatTZS(completedSale.total)}*\nAsante kwa kufanya biashara nasi!`
                  );
                  window.open(`https://wa.me/?text=${receiptText}`, "_blank");
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Tuma WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD NEW PRODUCT MODAL */}
      {/* ========================================================================= */}
      {isAddProdOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Ongeza Bidhaa Mpya ya Jaribio</h3>
              <button
                onClick={() => setIsAddProdOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">Jina la Bidhaa:</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Mf: Chai ya Kilimanjaro 100g"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Kategoria:</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  >
                    <option value="Vyakula">Vyakula</option>
                    <option value="Vinywaji">Vinywaji</option>
                    <option value="Dawa & Afya">Dawa & Afya</option>
                    <option value="Vipodozi & Sabuni">Vipodozi & Sabuni</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Idadi ya Stoo:</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Bei ya Kununua (Cost):</label>
                  <input
                    type="number"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    placeholder="TZS 1500"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">Bei ya Kuuza (Sell):</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="TZS 2000"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProdOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted font-semibold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-95 shadow"
                >
                  Ongeza Bidhaa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
