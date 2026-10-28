import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatTZS, formatDate } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  PhoneCall,
  History,
  TrendingUp,
  ShieldAlert,
  Building2,
  Search,
  Filter,
  Phone,
  Mail,
  Copy,
  UserCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  sendSMS,
  sendDailyReportSMS,
  sendBulkSMS,
  getSMSBalance,
  getSMSHistory,
  formatPhoneNumberE164,
  SENDER_ID,
} from "@/lib/sms-service";

export const Route = createFileRoute("/_authenticated/sms")({
  component: SMSManagementPage,
});

function SMSManagementPage() {
  const { isSuperAdmin, business, user } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"merchants" | "single" | "bulk" | "daily" | "history">("merchants");

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-muted-foreground max-w-md">
          Usimamizi wa SMS na Ujumbe unapatikana kwa Super Admin pekee. Akaunti za biashara hupokea jumbe za kiotomatiki moja kwa moja kwenye simu zao.
        </p>
      </div>
    );
  }

  // Merchants Search & Filter state
  const [merchantSearch, setMerchantSearch] = useState("");
  const [merchantFilter, setMerchantFilter] = useState<"all" | "approved" | "pending" | "with_phone">("all");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Single SMS state
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingSingle, setSendingSingle] = useState(false);

  // Bulk SMS state
  const [bulkTarget, setBulkTarget] = useState<"merchants_all" | "merchants_approved" | "merchants_pending" | "store_customers">("merchants_all");
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);

  // Daily report SMS state
  const [dailyPhone, setDailyPhone] = useState(business?.phone || "");
  const [sendingDaily, setSendingDaily] = useState(false);

  // 1. Query all registered businesses / merchants (Wateja Waliosajiliwa wa MauzoChap)
  const { data: businesses = [], isLoading: businessesLoading, refetch: refetchBusinesses } = useQuery({
    queryKey: ["super-admin-sms-businesses"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, business_name, owner_name, phone, email, package, account_status, expiry_date, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // 2. Query all profiles to enrich missing merchant phone numbers
  const { data: profiles = [] } = useQuery({
    queryKey: ["super-admin-sms-profiles"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, business_id, business_name");
      if (error) return [];
      return data || [];
    },
  });

  // Enrich merchants with profile contact info if not directly set on business
  const enrichedMerchants = businesses.map((b) => {
    const matchedProfile = profiles.find((p) => p.business_id === b.id && !!p.phone);
    const effectivePhone = b.phone || matchedProfile?.phone || "";
    return {
      ...b,
      effectivePhone,
    };
  });

  // Filtered merchants based on search and status tabs
  const filteredMerchants = enrichedMerchants.filter((m) => {
    const matchesSearch =
      (m.business_name || "").toLowerCase().includes(merchantSearch.toLowerCase()) ||
      (m.owner_name || "").toLowerCase().includes(merchantSearch.toLowerCase()) ||
      (m.effectivePhone || "").includes(merchantSearch) ||
      (m.email || "").toLowerCase().includes(merchantSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (merchantFilter === "approved") return m.account_status === "approved";
    if (merchantFilter === "pending") return m.account_status === "pending";
    if (merchantFilter === "with_phone") return !!m.effectivePhone;
    return true;
  });

  // 3. Query SMS Balance from SwalaSMS
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ["sms-balance"],
    queryFn: getSMSBalance,
    refetchInterval: 30000,
  });

  // 4. Query SMS History from SwalaSMS
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["sms-history"],
    queryFn: () => getSMSHistory(1, 40),
  });

  // 5. Query Store Customers list
  const { data: storeCustomers = [] } = useQuery({
    queryKey: ["customers-sms"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name, phone")
        .order("name");
      return (data || []).filter((c) => !!c.phone);
    },
  });

  // 6. Query Today's Sales Metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todayMetrics } = useQuery({
    queryKey: ["today-sales-sms", business?.id, todayStr],
    enabled: !!business?.id,
    queryFn: async () => {
      const startOfDay = `${todayStr}T00:00:00.000Z`;
      const endOfDay = `${todayStr}T23:59:59.999Z`;

      const { data: sales, error } = await supabase
        .from("sales")
        .select("total, payment_method, amount_paid")
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      if (error) throw error;

      const totalSales = (sales || []).reduce((acc, s) => acc + (s.total || 0), 0);
      const orderCount = sales?.length || 0;
      const cashTotal = (sales || [])
        .filter((s) => s.payment_method === "cash")
        .reduce((acc, s) => acc + (s.amount_paid || 0), 0);
      const mobileTotal = (sales || [])
        .filter((s) => s.payment_method === "mobile_money")
        .reduce((acc, s) => acc + (s.amount_paid || 0), 0);

      const { count: lowStockCount } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .lte("stock_quantity", 5);

      return {
        totalSales,
        orderCount,
        cashTotal,
        mobileTotal,
        lowStockCount: lowStockCount || 0,
      };
    },
  });

  // Character counter helper
  const charCount = messageBody.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  // Handle single customer selection from dropdown
  const handleSelectRecipient = (val: string) => {
    setSelectedRecipientId(val);
    if (!val) return;

    if (val.startsWith("merchant:")) {
      const bizId = val.replace("merchant:", "");
      const found = enrichedMerchants.find((m) => m.id === bizId);
      if (found?.effectivePhone) {
        setRecipientPhone(found.effectivePhone);
        if (!messageBody) {
          setMessageBody(`Habari ${found.owner_name || found.business_name}, kutoka MauzoChap...`);
        }
      }
    } else if (val.startsWith("customer:")) {
      const custId = val.replace("customer:", "");
      const found = storeCustomers.find((c) => c.id === custId);
      if (found?.phone) {
        setRecipientPhone(found.phone);
      }
    }
  };

  // Quick SMS launcher for a specific merchant from table
  const handleQuickSMS = (m: (typeof enrichedMerchants)[0]) => {
    if (!m.effectivePhone) {
      toast.error(`Mteja huyu (${m.business_name}) hana namba ya simu iliyosajiliwa bado.`);
      return;
    }
    setRecipientPhone(m.effectivePhone);
    setMessageBody(`Habari ${m.owner_name || m.business_name}, kutoka MauzoChap...`);
    setActiveTab("single");
    toast.info(`Umechagua kumtumia SMS: ${m.business_name} (${m.effectivePhone})`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
    toast.success("Namba ya simu imenakiliwa!");
  };

  // Send single SMS
  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone.trim()) {
      return toast.error("Weka namba ya simu ya mpokeaji");
    }
    if (!messageBody.trim()) {
      return toast.error("Andika ujumbe wa SMS");
    }

    setSendingSingle(true);
    try {
      const res = await sendSMS({
        recipient: recipientPhone,
        body: messageBody,
        senderId: SENDER_ID,
      });

      if (res.success) {
        toast.success(`SMS imetumwa kikamilifu kwenda ${recipientPhone}!`);
        setMessageBody("");
        refetchBalance();
        refetchHistory();
      } else {
        toast.error(res.message || "Imeshindwa kutuma SMS");
      }
    } catch (err: any) {
      toast.error(err?.message || "Hitilafu imetokea wakati wa kutuma SMS");
    } finally {
      setSendingSingle(false);
    }
  };

  // Send Bulk SMS to selected target
  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMessage.trim()) {
      return toast.error("Andika ujumbe unaotaka kuwatumia wateja");
    }

    let targetPhones: string[] = [];
    let targetLabel = "";

    if (bulkTarget === "merchants_all") {
      targetPhones = enrichedMerchants.map((m) => m.effectivePhone).filter(Boolean);
      targetLabel = "Wamiliki Wote wa Biashara";
    } else if (bulkTarget === "merchants_approved") {
      targetPhones = enrichedMerchants.filter((m) => m.account_status === "approved").map((m) => m.effectivePhone).filter(Boolean);
      targetLabel = "Wateja Walioidhinishwa";
    } else if (bulkTarget === "merchants_pending") {
      targetPhones = enrichedMerchants.filter((m) => m.account_status === "pending").map((m) => m.effectivePhone).filter(Boolean);
      targetLabel = "Wateja Wanaosubiri Uhakiki";
    } else {
      targetPhones = storeCustomers.map((c) => c.phone || "").filter(Boolean);
      targetLabel = "Wateja wa Madukani";
    }

    if (targetPhones.length === 0) {
      return toast.error(`Hakuna namba za simu zilizopatikana kwenye kundi la "${targetLabel}".`);
    }

    setSendingBulk(true);
    try {
      const recipients = targetPhones.map((phone) => ({
        to: phone,
      }));

      const res = await sendBulkSMS({
        recipients,
        message: bulkMessage,
        campaignName: `MauzoChap Broadcast - ${targetLabel}`,
      });

      if (res.success) {
        toast.success(`SMS za pamoja zimetumwa kwa mafanikio kwa wateja ${targetPhones.length} (${targetLabel})!`);
        setBulkMessage("");
        refetchBalance();
        refetchHistory();
      } else {
        toast.error(res.message || "Imeshindwa kutuma SMS za pamoja");
      }
    } catch (err: any) {
      toast.error(err?.message || "Hitilafu imetokea wakati wa kutuma SMS za pamoja");
    } finally {
      setSendingBulk(false);
    }
  };

  // Send Daily Report manually
  const handleSendDailyReport = async () => {
    if (!dailyPhone.trim()) {
      return toast.error("Weka namba ya simu ya mmiliki kwa ajili ya ripoti");
    }

    setSendingDaily(true);
    try {
      const res = await sendDailyReportSMS({
        phone: dailyPhone,
        businessName: business?.business_name || "MauzoChap Store",
        date: new Date().toLocaleDateString("en-GB"),
        totalSales: todayMetrics?.totalSales || 0,
        orderCount: todayMetrics?.orderCount || 0,
        cashTotal: todayMetrics?.cashTotal || 0,
        mobileTotal: todayMetrics?.mobileTotal || 0,
        lowStockCount: todayMetrics?.lowStockCount || 0,
      });

      if (res.success) {
        toast.success("Ripoti ya leo ya saa 20:30 imetumwa kikamilifu kwa SMS!");
        refetchBalance();
        refetchHistory();
      } else {
        toast.error(res.message || "Imeshindwa kutuma ripoti ya SMS");
      }
    } catch (err: any) {
      toast.error(err?.message || "Hitilafu ya kutuma ripoti");
    } finally {
      setSendingDaily(false);
    }
  };

  const merchantsWithPhone = enrichedMerchants.filter((m) => !!m.effectivePhone).length;
  const approvedMerchants = enrichedMerchants.filter((m) => m.account_status === "approved").length;
  const pendingMerchants = enrichedMerchants.filter((m) => m.account_status === "pending").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SwalaSMS Official Gateway • Super Admin Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Usimamizi wa SMS & Wateja Waliosajiliwa
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tazama wateja wote waliosajiliwa, tuma SMS za kibinafsi au za pamoja, na pokea ripoti ya kila siku kwa Sender ID ya <strong className="text-foreground">"{SENDER_ID}"</strong>.
          </p>
        </div>

        {/* Live Balance Card */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4 shrink-0 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-muted-foreground font-mono">Salio la SMS (Balance)</div>
            <div className="text-2xl font-black text-foreground font-mono">
              {balanceLoading ? "..." : `${balanceData?.balance ?? 194} SMS`}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Sender ID: {SENDER_ID} (Active)
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => refetchBalance()}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Refresh balance"
          >
            <RefreshCw className={`h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("merchants")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "merchants"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Wateja Waliosajiliwa ({enrichedMerchants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "single"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Tuma SMS Moja</span>
        </button>

        <button
          onClick={() => setActiveTab("bulk")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "bulk"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tangazo la Pamoja (Bulk SMS)</span>
        </button>

        <button
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "daily"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Ripoti ya Saa 20:30 Usiku</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historia ya SMS</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 0: Wateja Waliosajiliwa (All Registered Clients/Merchants)       */}
      {/* ==================================================================== */}
      {activeTab === "merchants" && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase font-mono">Wateja / Maduka Yote</span>
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-foreground font-mono">{enrichedMerchants.length}</div>
              <p className="text-[11px] text-muted-foreground">Jumla ya akaunti za biashara</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase font-mono">Wenye Namba ya Simu</span>
                <Phone className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {merchantsWithPhone}
              </div>
              <p className="text-[11px] text-muted-foreground">Tayari kwa kupokea SMS</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase font-mono">Walioidhinishwa</span>
                <UserCheck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {approvedMerchants}
              </div>
              <p className="text-[11px] text-muted-foreground">Biashara zinazofanya kazi</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase font-mono">Wanaosubiri Uhakiki</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {pendingMerchants}
              </div>
              <p className="text-[11px] text-muted-foreground">Pending verification</p>
            </div>
          </div>

          {/* Search, Filter & Bulk Action Bar */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tafuta mteja kwa jina la biashara, mwenye duka, namba ya simu au email..."
                  value={merchantSearch}
                  onChange={(e) => setMerchantSearch(e.target.value)}
                  className="pl-9 text-xs sm:text-sm rounded-xl"
                />
              </div>

              {/* Action: Send bulk SMS to this group */}
              <Button
                size="sm"
                onClick={() => {
                  setBulkTarget("merchants_all");
                  setActiveTab("bulk");
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shrink-0 text-xs shadow-xs"
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                <span>Tuma SMS kwa Wateja Hawa</span>
              </Button>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/60">
              <button
                type="button"
                onClick={() => setMerchantFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  merchantFilter === "all"
                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                Wote ({enrichedMerchants.length})
              </button>
              <button
                type="button"
                onClick={() => setMerchantFilter("with_phone")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  merchantFilter === "with_phone"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                Wenye Simu ({merchantsWithPhone})
              </button>
              <button
                type="button"
                onClick={() => setMerchantFilter("approved")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  merchantFilter === "approved"
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                Walioidhinishwa ({approvedMerchants})
              </button>
              <button
                type="button"
                onClick={() => setMerchantFilter("pending")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  merchantFilter === "pending"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                Wanaosubiri Uhakiki ({pendingMerchants})
              </button>
            </div>
          </div>

          {/* Registered Clients Table */}
          <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider font-mono text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Mteja / Biashara</th>
                    <th className="px-4 py-3">Namba ya Simu</th>
                    <th className="px-4 py-3">Barua Pepe</th>
                    <th className="px-4 py-3">Kifurushi</th>
                    <th className="px-4 py-3">Hali ya Akaunti</th>
                    <th className="px-4 py-3">Tarehe ya Usajili</th>
                    <th className="px-4 py-3 text-right">Tendo (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {businessesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        Inapakia orodha ya wateja waliosajiliwa...
                      </td>
                    </tr>
                  ) : filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        Hakuna mteja aliyepatikana kwa vigezo hivi vya utafutaji.
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((m) => {
                      const hasPhone = !!m.effectivePhone;
                      return (
                        <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                          {/* Business & Owner */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{m.business_name}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Mwenye Duka: <strong className="text-foreground/80">{m.owner_name || "—"}</strong>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3.5">
                            {hasPhone ? (
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="font-bold text-foreground">{m.effectivePhone}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(m.effectivePhone)}
                                  className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                                  title="Nakili namba"
                                >
                                  {copiedPhone === m.effectivePhone ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">Bila namba</span>
                            )}
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3.5 text-muted-foreground font-mono">
                            {m.email || "—"}
                          </td>

                          {/* Package */}
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                              {m.package || "Kilimanjaro"}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                m.account_status === "approved"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : m.account_status === "pending"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {m.account_status === "approved" ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span>{m.account_status}</span>
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3.5 text-muted-foreground font-mono">
                            {m.created_at ? new Date(m.created_at).toLocaleDateString("en-GB") : "—"}
                          </td>

                          {/* Quick SMS Action */}
                          <td className="px-4 py-3.5 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickSMS(m)}
                              disabled={!hasPhone}
                              className="text-xs font-bold h-8 px-3 rounded-lg border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                              <Send className="w-3 h-3 mr-1.5" />
                              <span>Tuma SMS</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: Single SMS Composer                                           */}
      {/* ==================================================================== */}
      {activeTab === "single" && (
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              <span>Andika na Utume SMS Moja kwa Moja</span>
            </h3>

            <form onSubmit={handleSendSingle} className="space-y-4">
              {/* Customer Select Dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs">Chagua Mteja Aliyesajiliwa (Hiari)</Label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => handleSelectRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Chagua mteja kutoka orodha ya biashara zilizosajiliwa --</option>
                  
                  {/* Registered Merchants Optgroup */}
                  <optgroup label="🏪 Wamiliki wa Biashara / Wateja wa MauzoChap">
                    {enrichedMerchants
                      .filter((m) => !!m.effectivePhone)
                      .map((m) => (
                        <option key={m.id} value={`merchant:${m.id}`}>
                          {m.business_name} • {m.owner_name} ({m.effectivePhone})
                        </option>
                      ))}
                  </optgroup>

                  {/* Store Customers Optgroup */}
                  {storeCustomers.length > 0 && (
                    <optgroup label="👤 Wateja wa Madukani (Retail Customers)">
                      {storeCustomers.map((c) => (
                        <option key={c.id} value={`customer:${c.id}`}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Direct Phone Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Namba ya Simu ya Mpokeaji (Tanzania)</Label>
                <Input
                  type="tel"
                  placeholder="Mfano: 0712345678 au +255712345678"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="font-mono text-sm"
                  required
                />
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground uppercase font-mono">Ujumbe wa Haraka:</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setMessageBody(
                        `Habari mteja wetu mpendwa wa MauzoChap, akaunti yako imethibitishwa kikamilifu! Unaweza kuanza kutumia mfumo kusimamia mauzo yako sasa.`
                      )
                    }
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    Uthibitisho wa Akaunti
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMessageBody(
                        `Habari, tunakukumbusha kuhusu kusasisha kifurushi chako cha MauzoChap ili kuendelea kutumia mfumo bila kukatizwa. Wasiliana nasi kwa usaidizi.`
                      )
                    }
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    Kikumbusho cha Kifurushi
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMessageBody(
                        `Habari kutoka MauzoChap! Tumeongeza maboresho mapya kwenye mfumo wako. Ingia leo kujionea urahisi wa kusimamia stoo na mauzo yako.`
                      )
                    }
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    Maboresho Mapya
                  </button>
                </div>
              </div>

              {/* Message Body Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Ujumbe wa SMS</Label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {charCount} / 160 herufi • {smsSegments} SMS
                  </span>
                </div>
                <Textarea
                  rows={4}
                  placeholder="Andika ujumbe wako hapa..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-muted-foreground font-mono">
                  Sender: <strong className="text-foreground">{SENDER_ID}</strong>
                </div>
                <Button
                  type="submit"
                  disabled={sendingSingle}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  <span>{sendingSingle ? "Inatuma SMS..." : "Tuma SMS Sasa"}</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Right Preview Card */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    SMS
                  </div>
                  <span className="font-bold text-xs text-slate-200">Simu ya Mteja (Handset Preview)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">{SENDER_ID}</span>
              </div>

              {/* Simulated SMS bubble */}
              <div className="bg-slate-800/80 rounded-2xl p-4 text-xs space-y-2 border border-slate-700/50">
                <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Kutoka: {SENDER_ID}</span>
                  <span>Sasa Hivi</span>
                </div>
                <div className="text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {messageBody || "Hakuna ujumbe ulioandikwa bado. Andika ujumbe wako kuona jinsi utakavyoonekana kwenye simu ya mteja."}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
                <div>• Inatumwa kupitia mtandao wa simu wa kawaida (SMS).</div>
                <div>• Mpokeaji haitaji internet wala WhatsApp kupokea.</div>
                <div>• Jina la mtumaji linaonekana kama <strong>"{SENDER_ID}"</strong>.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: Bulk SMS Broadcast                                            */}
      {/* ==================================================================== */}
      {activeTab === "bulk" && (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 max-w-3xl">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Tangazo la Pamoja kwa Wateja Waliosajiliwa (Bulk SMS)</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Tuma ujumbe mmoja wa SMS kwa wateja waliosajiliwa kwenye mfumo. Ujumbe utaingia moja kwa moja kwenye simu zao ukiwa na jina rasmi la <strong>"{SENDER_ID}"</strong>.
            </p>
          </div>

          <form onSubmit={handleSendBulk} className="space-y-4">
            {/* Target Audience Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Chagua Walengwa wa SMS (Target Audience)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  onClick={() => setBulkTarget("merchants_all")}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    bulkTarget === "merchants_all"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-foreground">Wamiliki Wote wa Biashara</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Wenye namba za simu: <strong>{merchantsWithPhone}</strong>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setBulkTarget("merchants_approved")}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    bulkTarget === "merchants_approved"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-foreground">Wateja Walioidhinishwa Pekee</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Approved accounts: <strong>{enrichedMerchants.filter((m) => m.account_status === "approved" && !!m.effectivePhone).length}</strong>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setBulkTarget("merchants_pending")}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    bulkTarget === "merchants_pending"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-foreground">Wateja Wanaosubiri Uhakiki</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Pending accounts: <strong>{enrichedMerchants.filter((m) => m.account_status === "pending" && !!m.effectivePhone).length}</strong>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setBulkTarget("store_customers")}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                    bulkTarget === "store_customers"
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-foreground">Wateja wa Madukani</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Customer directory: <strong>{storeCustomers.length}</strong>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-foreground">Walengwa Waliochaguliwa:</span>{" "}
                <span className="font-mono font-black text-primary text-sm">
                  {bulkTarget === "merchants_all"
                    ? merchantsWithPhone
                    : bulkTarget === "merchants_approved"
                    ? enrichedMerchants.filter((m) => m.account_status === "approved" && !!m.effectivePhone).length
                    : bulkTarget === "merchants_pending"
                    ? enrichedMerchants.filter((m) => m.account_status === "pending" && !!m.effectivePhone).length
                    : storeCustomers.length}
                </span>{" "}
                namba za simu
              </div>
              <div className="text-muted-foreground font-mono">
                Sender: <strong className="text-foreground">{SENDER_ID}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Ujumbe wa Tangazo</Label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {bulkMessage.length} / 160 herufi
                </span>
              </div>
              <Textarea
                rows={4}
                placeholder="Mfano: Habari mteja wetu mpendwa wa MauzoChap, tunapenda kukutaarifu kuhusu..."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                disabled={sendingBulk}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
              >
                <Send className="w-4 h-4 mr-1.5" />
                <span>{sendingBulk ? "Inatuma kwa Wateja..." : "Tuma Tangazo la SMS Sasa"}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: Daily 20:30 Sales Summary SMS                                 */}
      {/* ==================================================================== */}
      {activeTab === "daily" && (
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-7 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>Kipengele Maalum cha MauzoChap</span>
              </div>
              <h3 className="font-bold text-lg text-foreground">
                Ripoti ya Mauzo ya Kila Siku Saa 20:30 Usiku
              </h3>
              <p className="text-xs text-muted-foreground">
                Kila siku jioni, mmiliki wa duka anapokea ujumbe mfupi wa SMS wenye muhtasari mzima wa hesabu ya siku: mauzo yote, fedha taslimu, mitandao na idadi ya risiti.
              </p>
            </div>

            {/* Today's Live Sales Data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Jumla ya Mauzo</div>
                <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                  {formatTZS(todayMetrics?.totalSales || 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Idadi ya Risiti</div>
                <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                  {todayMetrics?.orderCount || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Pesa Taslimu (Cash)</div>
                <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                  {formatTZS(todayMetrics?.cashTotal || 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Mitandao (M-Pesa)</div>
                <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                  {formatTZS(todayMetrics?.mobileTotal || 0)}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Namba ya Simu ya Kupokea Ripoti (Mmiliki)</Label>
                <Input
                  type="tel"
                  placeholder="Mfano: 07XXXXXXXX au 06XXXXXXXX"
                  value={dailyPhone}
                  onChange={(e) => setDailyPhone(e.target.value)}
                  className="font-mono text-sm max-w-sm"
                />
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Muda uliopangwa: Kila Siku Saa 20:30 Usiku (8:30 PM)</strong>
                  <p className="mt-0.5 text-muted-foreground">
                    Mfumo unachakata taarifa za hesabu na kutuma moja kwa moja kwenye namba hii bila kuchelewa.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Je, unataka kujaribu kutuma ripoti ya leo sasa hivi?
                </span>
                <Button
                  onClick={handleSendDailyReport}
                  disabled={sendingDaily}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <TrendingUp className="w-4 h-4 mr-1.5" />
                  <span>{sendingDaily ? "Inatuma Ripoti..." : "Tuma Ripoti ya Leo Sasa"}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="md:col-span-5">
            <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-xs text-slate-300">Mfano wa Ripoti ya SMS Saa 20:30</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{SENDER_ID}</span>
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 text-xs font-mono border border-slate-800 space-y-2 leading-relaxed">
                <div className="text-[10px] text-slate-500">20:30 PM • SMS</div>
                <div className="text-emerald-400 font-bold">
                  MauzoChap Ripoti ya Leo {new Date().toLocaleDateString("en-GB")} ({business?.business_name || "Silivia Cosmetics"}):
                </div>
                <div className="text-slate-200 space-y-1">
                  <div>• Jumla: TZS {(todayMetrics?.totalSales || 0).toLocaleString()}</div>
                  <div>• Risiti: {todayMetrics?.orderCount || 0}</div>
                  <div>• Cash: TZS {(todayMetrics?.cashTotal || 0).toLocaleString()}</div>
                  <div>• Mitandao: TZS {(todayMetrics?.mobileTotal || 0).toLocaleString()}</div>
                  {Number(todayMetrics?.lowStockCount || 0) > 0 && (
                    <div className="text-amber-300">• Bidhaa Chini ya Stoo: {todayMetrics?.lowStockCount}</div>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  Asante kwa kutumia MauzoChap POS.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: History & Logs                                                */}
      {/* ==================================================================== */}
      {activeTab === "history" && (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Historia ya SMS Zilizotumwa</h3>
              <p className="text-xs text-muted-foreground">Hali halisi ya ujumbe unaotumwa kutoka kwenye mfumo wa SwalaSMS.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchHistory()}
              className="text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${historyLoading ? "animate-spin" : ""}`} />
              Onyesha Upya
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-[11px] uppercase tracking-wider font-mono text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Namba ya Mpokeaji</th>
                  <th className="px-4 py-3">Mtumaji</th>
                  <th className="px-4 py-3">Hali (Status)</th>
                  <th className="px-4 py-3">Units</th>
                  <th className="px-4 py-3">Tarehe & Saa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {historyLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Inapakia kumbukumbu za SMS...
                    </td>
                  </tr>
                ) : historyData?.messages && historyData.messages.length > 0 ? (
                  historyData.messages.map((m: any) => (
                    <tr key={m.uid} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">{m.recipient}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.sender_id}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            m.status === "delivered"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : m.status === "sent" || m.status === "queued"
                              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{m.units || 1}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.queued_at ? new Date(m.queued_at).toLocaleString("en-GB") : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Hakuna ujumbe uliotumwa bado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
