import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { formatTZS } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
  History,
  TrendingUp,
  ShieldAlert,
  Building2,
  Search,
  Phone,
  Copy,
  UserCheck,
  Check,
  Pencil,
  Plus,
  X,
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
import {
  enrichMerchantsWithPhones,
  computeSmsAudienceStats,
  type MerchantRecord,
} from "@/lib/merchant-phone-sync";

export const Route = createFileRoute("/_authenticated/sms")({
  component: SMSManagementPage,
});

function SMSManagementPage() {
  const { isSuperAdmin, business } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"merchants" | "single" | "bulk" | "daily" | "history">("merchants");

  // Merchants Search, Filter & Inline Phone Edit state
  const [merchantSearch, setMerchantSearch] = useState("");
  const [merchantFilter, setMerchantFilter] = useState<
    "all" | "approved" | "pending" | "with_phone" | "without_phone"
  >("all");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const [editingPhoneValue, setEditingPhoneValue] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [syncingPhones, setSyncingPhones] = useState(false);

  // Single SMS state
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingSingle, setSendingSingle] = useState(false);

  // Bulk SMS state
  const [bulkTarget, setBulkTarget] = useState<
    "merchants_all" | "merchants_approved" | "merchants_pending" | "store_customers"
  >("merchants_all");
  const [bulkMessage, setBulkMessage] = useState("");
  const [extraBulkPhones, setExtraBulkPhones] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);

  // Daily report SMS state
  const [dailyPhone, setDailyPhone] = useState(business?.phone || "");
  const [sendingDaily, setSendingDaily] = useState(false);

  // Track which merchant IDs we already auto-backfilled in this session
  const autoSyncedIds = useRef<Set<string>>(new Set());

  // 1. Query all registered businesses / merchants (prefers SECURITY DEFINER RPC that reads auth.users metadata, falls back to businesses table)
  const {
    data: businesses = [],
    isLoading: businessesLoading,
    refetch: refetchBusinesses,
  } = useQuery<MerchantRecord[]>({
    queryKey: ["super-admin-sms-businesses"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      try {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
          "super_admin_get_merchants_directory",
        );
        if (!rpcError && Array.isArray(rpcData)) {
          return rpcData as MerchantRecord[];
        }
      } catch {
        // Fallback to direct table select if migration RPC is not yet applied
      }

      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, business_name, owner_name, phone, email, package, account_status, expiry_date, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as MerchantRecord[];
    },
  });

  // 2. Query all profiles to enrich missing merchant phone numbers & owner names
  const { data: profiles = [], refetch: refetchProfiles } = useQuery({
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

  // 3. Query SMS Balance from SwalaSMS
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ["sms-balance"],
    enabled: isSuperAdmin,
    queryFn: getSMSBalance,
    refetchInterval: 30000,
  });

  // 4. Query SMS History from SwalaSMS (100 logs to also recover any historical signup phone numbers)
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["sms-history"],
    enabled: isSuperAdmin,
    queryFn: () => getSMSHistory(1, 100),
  });

  // 5. Query Store Customers list (POS retail customer directory across shops)
  const { data: allStoreCustomers = [], refetch: refetchStoreCustomers } = useQuery({
    queryKey: ["customers-sms"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .order("name");
      if (error) return [];
      return data || [];
    },
  });

  const storeCustomers = allStoreCustomers.filter((c) => !!(c.phone || "").trim());

  // 6. Query Today's Sales Metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todayMetrics } = useQuery({
    queryKey: ["today-sales-sms", business?.id, todayStr],
    enabled: isSuperAdmin && !!business?.id,
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

  // Enrich merchants with profile & SwalaSMS history phone numbers
  const enrichedMerchants = enrichMerchantsWithPhones(
    businesses,
    profiles,
    historyData?.messages || [],
  );

  const stats = computeSmsAudienceStats(enrichedMerchants, allStoreCustomers);

  // Automatically backfill recovered phones (from profiles or SwalaSMS history) into public.businesses
  useEffect(() => {
    if (!isSuperAdmin || enrichedMerchants.length === 0) return;

    const recoverable = enrichedMerchants.filter(
      (m) =>
        m.effectivePhone &&
        (m.phoneSource === "profile" || m.phoneSource === "sms_history") &&
        !autoSyncedIds.current.has(m.id),
    );

    if (recoverable.length === 0) return;

    recoverable.forEach((m) => autoSyncedIds.current.add(m.id));

    Promise.all(
      recoverable.map((m) =>
        supabase
          .from("businesses")
          .update({ phone: m.effectivePhone })
          .eq("id", m.id),
      ),
    ).then(() => {
      qc.invalidateQueries({ queryKey: ["super-admin-sms-businesses"] });
      qc.invalidateQueries({ queryKey: ["super-admin-businesses"] });
    });
  }, [isSuperAdmin, enrichedMerchants, qc]);

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

  // Filtered merchants based on search and status tabs
  const filteredMerchants = enrichedMerchants.filter((m) => {
    const q = merchantSearch.toLowerCase();
    const matchesSearch =
      (m.business_name || "").toLowerCase().includes(q) ||
      (m.owner_name || "").toLowerCase().includes(q) ||
      (m.effectivePhone || "").includes(merchantSearch) ||
      (m.email || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (merchantFilter === "approved") return m.account_status === "approved";
    if (merchantFilter === "pending") return m.account_status === "pending";
    if (merchantFilter === "with_phone") return !!m.effectivePhone;
    if (merchantFilter === "without_phone") return !m.effectivePhone;
    return true;
  });

  // Character counter helper
  const charCount = messageBody.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  // Manual Sync trigger for Super Admin
  const handleSyncPhones = async () => {
    setSyncingPhones(true);
    try {
      await Promise.all([
        refetchBusinesses(),
        refetchProfiles(),
        refetchHistory(),
        refetchStoreCustomers(),
      ]);
      toast.success("Orodha ya wateja na namba za simu imesawazishwa kikamilifu!");
    } catch (err: any) {
      toast.error(err?.message || "Imeshindwa kusawazisha namba za simu");
    } finally {
      setSyncingPhones(false);
    }
  };

  // Save inline phone number for a merchant directly into businesses (and linked profile)
  const handleSaveMerchantPhone = async (merchant: (typeof enrichedMerchants)[0]) => {
    const cleaned = editingPhoneValue.trim();
    if (!cleaned || formatPhoneNumberE164(cleaned).length < 10) {
      toast.error("Tafadhali weka namba sahihi ya simu (mfano: 0712345678)");
      return;
    }

    const formatted = formatPhoneNumberE164(cleaned);
    setSavingPhone(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ phone: formatted })
        .eq("id", merchant.id);

      if (error) throw error;

      // Best-effort sync to linked profile if present
      await supabase
        .from("profiles")
        .update({ phone: formatted })
        .eq("business_id", merchant.id);

      toast.success(`Namba ya simu ya ${merchant.business_name} (${formatted}) imehifadhiwa!`);
      setEditingMerchantId(null);
      setEditingPhoneValue("");
      await Promise.all([
        refetchBusinesses(),
        refetchProfiles(),
        qc.invalidateQueries({ queryKey: ["super-admin-businesses"] }),
      ]);
    } catch (err: any) {
      toast.error(err?.message || "Imeshindwa kuhifadhi namba ya simu");
    } finally {
      setSavingPhone(false);
    }
  };

  // Handle single customer selection from dropdown
  const handleSelectRecipient = (val: string) => {
    setSelectedRecipientId(val);
    if (!val) return;

    if (val.startsWith("merchant:")) {
      const bizId = val.replace("merchant:", "");
      const found = enrichedMerchants.find((m) => m.id === bizId);
      if (found) {
        setRecipientPhone(found.effectivePhone || "");
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
      setEditingMerchantId(m.id);
      setEditingPhoneValue("");
      toast.info(`Weka namba ya simu ya ${m.business_name} hapa kwanza, kisha tuma SMS.`);
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

  // Compute target phone list for Bulk SMS (audience + manual extra numbers, deduplicated)
  const getBulkAudienceMerchants = () => {
    if (bulkTarget === "merchants_all") return enrichedMerchants;
    if (bulkTarget === "merchants_approved")
      return enrichedMerchants.filter((m) => m.account_status === "approved");
    if (bulkTarget === "merchants_pending")
      return enrichedMerchants.filter((m) => m.account_status === "pending");
    return [];
  };

  const parseExtraPhones = (raw: string): string[] => {
    if (!raw.trim()) return [];
    return raw
      .split(/[,;\n]+/)
      .map((p) => formatPhoneNumberE164(p.trim()))
      .filter((p) => p.length >= 10);
  };

  const computeBulkTargetPhones = (): { phones: string[]; label: string } => {
    let basePhones: string[] = [];
    let label = "";

    if (bulkTarget === "merchants_all") {
      basePhones = enrichedMerchants.map((m) => m.effectivePhone).filter(Boolean);
      label = "Wamiliki Wote wa Biashara";
    } else if (bulkTarget === "merchants_approved") {
      basePhones = enrichedMerchants
        .filter((m) => m.account_status === "approved")
        .map((m) => m.effectivePhone)
        .filter(Boolean);
      label = "Wateja Walioidhinishwa";
    } else if (bulkTarget === "merchants_pending") {
      basePhones = enrichedMerchants
        .filter((m) => m.account_status === "pending")
        .map((m) => m.effectivePhone)
        .filter(Boolean);
      label = "Wateja Wanaosubiri Uhakiki";
    } else {
      basePhones = storeCustomers.map((c) => c.phone || "").filter(Boolean);
      label = "Wateja wa Madukani";
    }

    const combined = [
      ...basePhones.map((p) => formatPhoneNumberE164(p)),
      ...parseExtraPhones(extraBulkPhones),
    ].filter((p) => p.length >= 10);

    return {
      phones: Array.from(new Set(combined)),
      label,
    };
  };

  const { phones: selectedBulkPhones, label: selectedBulkLabel } = computeBulkTargetPhones();
  const currentAudienceMerchants = getBulkAudienceMerchants();
  const currentAudienceMissingPhones = currentAudienceMerchants.filter((m) => !m.effectivePhone);

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

    if (selectedBulkPhones.length === 0) {
      return toast.error(
        `Hakuna namba za simu kwenye kundi la "${selectedBulkLabel}". Tafadhali weka namba za wateja kwenye kichupo cha Wateja Waliosajiliwa au ongeza namba za ziada hapa chini.`,
      );
    }

    setSendingBulk(true);
    try {
      const recipients = selectedBulkPhones.map((phone) => ({
        to: phone,
      }));

      const res = await sendBulkSMS({
        recipients,
        message: bulkMessage,
        campaignName: `MauzoChap Broadcast - ${selectedBulkLabel}`,
      });

      if (res.success) {
        toast.success(
          `SMS za pamoja zimetumwa kwa mafanikio kwa wateja ${selectedBulkPhones.length} (${selectedBulkLabel})!`,
        );
        setBulkMessage("");
        setExtraBulkPhones("");
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
            Tazama wateja wote waliosajiliwa, hariri namba zao za simu, tuma SMS za kibinafsi au za pamoja, na pokea ripoti ya kila siku kwa Sender ID ya{" "}
            <strong className="text-foreground">"{SENDER_ID}"</strong>.
          </p>
        </div>

        {/* Live Balance Card */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4 shrink-0 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-muted-foreground font-mono">
              Salio la SMS (Balance)
            </div>
            <div className="text-2xl font-black text-foreground font-mono">
              {balanceLoading ? "..." : `${balanceData?.balance ?? 0} SMS`}
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
          <span>Wateja Waliosajiliwa ({stats.totalMerchants})</span>
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
              <div className="text-2xl font-black text-foreground font-mono">
                {stats.totalMerchants}
              </div>
              <p className="text-[11px] text-muted-foreground">Jumla ya akaunti za biashara</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase font-mono">Wenye Namba ya Simu</span>
                <Phone className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.merchantsWithPhone} / {stats.totalMerchants}
              </div>
              <p className="text-[11px] text-muted-foreground">Tayari kwa kupokea SMS</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase font-mono">Walioidhinishwa</span>
                <UserCheck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {stats.approvedTotal}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Wenye simu: {stats.approvedWithPhone}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase font-mono">Wanaosubiri Uhakiki</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {stats.pendingTotal}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Wenye simu: {stats.pendingWithPhone}
              </p>
            </div>
          </div>

          {stats.merchantsMissingPhone > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-foreground">
                    Wateja {stats.merchantsMissingPhone} kati ya {stats.totalMerchants} hawana namba ya simu bado
                  </div>
                  <p className="text-muted-foreground">
                    Bofya <strong>"+ Weka Namba"</strong> kwenye mstari wa mteja yeyote hapa chini ili kuhifadhi namba yake na kumtumia SMS moja kwa moja.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMerchantFilter("without_phone")}
                  className="text-xs font-bold border-amber-500/40"
                >
                  Onyesha Wasio na Namba ({stats.merchantsMissingPhone})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncPhones}
                  disabled={syncingPhones}
                  className="text-xs font-bold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncingPhones ? "animate-spin" : ""}`} />
                  Sawazisha
                </Button>
              </div>
            </div>
          )}

          {/* Search, Filter & Bulk Action Bar */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
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

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncPhones}
                  disabled={syncingPhones}
                  className="text-xs font-bold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncingPhones ? "animate-spin" : ""}`} />
                  <span>Sawazisha Namba</span>
                </Button>
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
                Wote ({stats.totalMerchants})
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
                Wenye Simu ({stats.merchantsWithPhone})
              </button>
              {stats.merchantsMissingPhone > 0 && (
                <button
                  type="button"
                  onClick={() => setMerchantFilter("without_phone")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    merchantFilter === "without_phone"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Bila Simu ({stats.merchantsMissingPhone})
                </button>
              )}
              <button
                type="button"
                onClick={() => setMerchantFilter("approved")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  merchantFilter === "approved"
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                Walioidhinishwa ({stats.approvedTotal})
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
                Wanaosubiri Uhakiki ({stats.pendingTotal})
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
                      const isEditing = editingMerchantId === m.id;

                      return (
                        <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                          {/* Business & Owner */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{m.business_name}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Mwenye Duka:{" "}
                              <strong className="text-foreground/80">{m.owner_name || "—"}</strong>
                            </div>
                          </td>

                          {/* Phone (with inline add / edit) */}
                          <td className="px-4 py-3.5">
                            {isEditing ? (
                              <div className="flex items-center gap-1 min-w-[200px]">
                                <Input
                                  type="tel"
                                  value={editingPhoneValue}
                                  onChange={(e) => setEditingPhoneValue(e.target.value)}
                                  placeholder="07XXXXXXXX"
                                  className="h-7 text-xs font-mono px-2"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSaveMerchantPhone(m);
                                    } else if (e.key === "Escape") {
                                      setEditingMerchantId(null);
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  disabled={savingPhone}
                                  onClick={() => handleSaveMerchantPhone(m)}
                                  className="h-7 w-7 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title="Hifadhi namba"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingMerchantId(null)}
                                  className="h-7 w-7 shrink-0"
                                  title="Ghairi"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : hasPhone ? (
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMerchantId(m.id);
                                    setEditingPhoneValue(m.effectivePhone);
                                  }}
                                  className="text-muted-foreground hover:text-primary p-0.5 rounded cursor-pointer"
                                  title="Hariri namba ya simu"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMerchantId(m.id);
                                  setEditingPhoneValue("");
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Weka Namba</span>
                              </button>
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
                              variant={hasPhone ? "outline" : "ghost"}
                              onClick={() => handleQuickSMS(m)}
                              className="text-xs font-bold h-8 px-3 rounded-lg border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                              <Send className="w-3 h-3 mr-1.5" />
                              <span>{hasPhone ? "Tuma SMS" : "Weka Simu & Tuma"}</span>
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
              {/* Customer Select Dropdown — lists ALL registered merchants so none are hidden */}
              <div className="space-y-1.5">
                <Label className="text-xs">Chagua Mteja Aliyesajiliwa (Hiari)</Label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => handleSelectRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">
                    -- Chagua mteja kutoka orodha ya biashara zilizosajiliwa ({enrichedMerchants.length}) --
                  </option>

                  <optgroup label="🏪 Wamiliki wa Biashara / Wateja wa MauzoChap">
                    {enrichedMerchants.map((m) => (
                      <option key={m.id} value={`merchant:${m.id}`}>
                        {m.business_name} • {m.owner_name || m.email}{" "}
                        {m.effectivePhone ? `(${m.effectivePhone})` : "(Weka namba hapa chini)"}
                      </option>
                    ))}
                  </optgroup>

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
                <div className="text-[11px] font-bold text-muted-foreground uppercase font-mono">
                  Ujumbe wa Haraka:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setMessageBody(
                        `Habari mteja wetu mpendwa wa MauzoChap, akaunti yako imethibitishwa kikamilifu! Unaweza kuanza kutumia mfumo kusimamia mauzo yako sasa.`,
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
                        `Habari, tunakukumbusha kuhusu kusasisha kifurushi chako cha MauzoChap ili kuendelea kutumia mfumo bila kukatizwa. Wasiliana nasi kwa usaidizi.`,
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
                        `Habari kutoka MauzoChap! Tumeongeza maboresho mapya kwenye mfumo wako. Ingia leo kujionea urahisi wa kusimamia stoo na mauzo yako.`,
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
                  <span className="font-bold text-xs text-slate-200">
                    Simu ya Mteja (Handset Preview)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  {SENDER_ID}
                </span>
              </div>

              <div className="bg-slate-800/80 rounded-2xl p-4 text-xs space-y-2 border border-slate-700/50">
                <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Kutoka: {SENDER_ID}</span>
                  <span>Sasa Hivi</span>
                </div>
                <div className="text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {messageBody ||
                    "Hakuna ujumbe ulioandikwa bado. Andika ujumbe wako kuona jinsi utakavyoonekana kwenye simu ya mteja."}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
                <div>• Inatumwa kupitia mtandao wa simu wa kawaida (SMS).</div>
                <div>• Mpokeaji haitaji internet wala WhatsApp kupokea.</div>
                <div>
                  • Jina la mtumaji linaonekana kama <strong>"{SENDER_ID}"</strong>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: Bulk SMS Broadcast                                            */}
      {/* ==================================================================== */}
      {activeTab === "bulk" && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Tangazo la Pamoja kwa Wateja Waliosajiliwa (Bulk SMS)</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tuma ujumbe mmoja wa SMS kwa wateja waliosajiliwa kwenye mfumo. Ujumbe utaingia moja kwa moja kwenye simu zao ukiwa na jina rasmi la{" "}
                  <strong>"{SENDER_ID}"</strong>.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSyncPhones}
                disabled={syncingPhones}
                className="text-xs font-bold shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncingPhones ? "animate-spin" : ""}`} />
                Sawazisha
              </Button>
            </div>

            <form onSubmit={handleSendBulk} className="space-y-4">
              {/* Target Audience Selector — shows BOTH total accounts and phone-ready counts */}
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
                      <div className="font-bold text-foreground">
                        Wamiliki Wote wa Biashara ({stats.totalMerchants})
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Wenye namba za simu:{" "}
                        <strong className="text-foreground">
                          {stats.merchantsWithPhone} kati ya {stats.totalMerchants}
                        </strong>
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
                      <div className="font-bold text-foreground">
                        Wateja Walioidhinishwa ({stats.approvedTotal})
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Wenye namba za simu:{" "}
                        <strong className="text-foreground">
                          {stats.approvedWithPhone} kati ya {stats.approvedTotal}
                        </strong>
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
                      <div className="font-bold text-foreground">
                        Wateja Wanaosubiri Uhakiki ({stats.pendingTotal})
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Wenye namba za simu:{" "}
                        <strong className="text-foreground">
                          {stats.pendingWithPhone} kati ya {stats.pendingTotal}
                        </strong>
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
                      <div className="font-bold text-foreground">
                        Wateja wa Madukani ({stats.storeCustomersTotal})
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Wenye namba za simu:{" "}
                        <strong className="text-foreground">{stats.storeCustomersWithPhone}</strong>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {bulkTarget !== "store_customers" && currentAudienceMissingPhones.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-amber-900 dark:text-amber-200">
                    <strong>Taarifa:</strong> Wateja{" "}
                    <strong>{currentAudienceMissingPhones.length}</strong> kwenye kundi hili bado hawana namba ya simu kwenye rekodi.
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMerchantFilter("without_phone");
                      setActiveTab("merchants");
                    }}
                    className="h-7 text-xs font-bold shrink-0 border-amber-500/40"
                  >
                    Weka Namba Zao Sasa
                  </Button>
                </div>
              )}

              {/* Optional Extra Phone Numbers */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Ongeza Namba za Simu za Ziada (Hiari — tenganisha kwa koma au mstari mpya)
                </Label>
                <Input
                  type="text"
                  placeholder="Mfano: 0712345678, 0655112233"
                  value={extraBulkPhones}
                  onChange={(e) => setExtraBulkPhones(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-foreground">Jumla Watakaotumiwa SMS:</span>{" "}
                  <span className="font-mono font-black text-primary text-sm">
                    {selectedBulkPhones.length}
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
                  <span>
                    {sendingBulk
                      ? "Inatuma kwa Wateja..."
                      : `Tuma Tangazo la SMS (${selectedBulkPhones.length})`}
                  </span>
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Registered Audience Directory Preview */}
          <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  Orodha ya Walengwa ({selectedBulkLabel})
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Hakiki wateja waliosajiliwa kwenye kundi ulilochagua
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                {bulkTarget === "store_customers"
                  ? allStoreCustomers.length
                  : currentAudienceMerchants.length}
              </span>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-border text-xs">
              {bulkTarget === "store_customers" ? (
                allStoreCustomers.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Hakuna wateja wa rejareja waliosajiliwa madukani bado. Tumia makundi ya Wamiliki wa Biashara kutuma SMS kwa wenye maduka.
                  </div>
                ) : (
                  allStoreCustomers.map((c) => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground truncate">{c.name}</span>
                      <span className="font-mono text-muted-foreground shrink-0">
                        {c.phone || "Bila namba"}
                      </span>
                    </div>
                  ))
                )
              ) : currentAudienceMerchants.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Hakuna biashara kwenye kundi hili kwa sasa.
                </div>
              ) : (
                currentAudienceMerchants.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate">{m.business_name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {m.owner_name || m.email}
                      </div>
                    </div>
                    {m.effectivePhone ? (
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {m.effectivePhone}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMerchantId(m.id);
                          setEditingPhoneValue("");
                          setMerchantFilter("without_phone");
                          setActiveTab("merchants");
                        }}
                        className="text-[11px] font-bold text-amber-600 hover:underline shrink-0 cursor-pointer"
                      >
                        + Weka Namba
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                  Jumla ya Mauzo
                </div>
                <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                  {formatTZS(todayMetrics?.totalSales || 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                  Idadi ya Risiti
                </div>
                <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                  {todayMetrics?.orderCount || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                  Pesa Taslimu (Cash)
                </div>
                <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                  {formatTZS(todayMetrics?.cashTotal || 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-center">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                  Mitandao (M-Pesa)
                </div>
                <div className="text-sm sm:text-base font-black text-foreground font-mono mt-0.5">
                  {formatTZS(todayMetrics?.mobileTotal || 0)}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Namba ya Simu ya Kupokea Ripoti (Mmiliki)
                </Label>
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

          <div className="md:col-span-5">
            <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-xs text-slate-300">
                  Mfano wa Ripoti ya SMS Saa 20:30
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  {SENDER_ID}
                </span>
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 text-xs font-mono border border-slate-800 space-y-2 leading-relaxed">
                <div className="text-[10px] text-slate-500">20:30 PM • SMS</div>
                <div className="text-emerald-400 font-bold">
                  MauzoChap Ripoti ya Leo {new Date().toLocaleDateString("en-GB")} (
                  {business?.business_name || "Silivia Cosmetics"}):
                </div>
                <div className="text-slate-200 space-y-1">
                  <div>• Jumla: TZS {(todayMetrics?.totalSales || 0).toLocaleString()}</div>
                  <div>• Risiti: {todayMetrics?.orderCount || 0}</div>
                  <div>• Cash: TZS {(todayMetrics?.cashTotal || 0).toLocaleString()}</div>
                  <div>• Mitandao: TZS {(todayMetrics?.mobileTotal || 0).toLocaleString()}</div>
                  {Number(todayMetrics?.lowStockCount || 0) > 0 && (
                    <div className="text-amber-300">
                      • Bidhaa Chini ya Stoo: {todayMetrics?.lowStockCount}
                    </div>
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
              <p className="text-xs text-muted-foreground">
                Hali halisi ya ujumbe unaotumwa kutoka kwenye mfumo wa SwalaSMS.
              </p>
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
