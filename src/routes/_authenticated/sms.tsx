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
  const [activeTab, setActiveTab] = useState<"single" | "daily" | "bulk" | "history">("single");

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

  // Single SMS state
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingSingle, setSendingSingle] = useState(false);

  // Bulk SMS state
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);

  // Daily report SMS state
  const [dailyPhone, setDailyPhone] = useState(business?.phone || "");
  const [sendingDaily, setSendingDaily] = useState(false);

  // Query SMS Balance from SwalaSMS
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ["sms-balance"],
    queryFn: getSMSBalance,
    refetchInterval: 30000,
  });

  // Query SMS History from SwalaSMS
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["sms-history"],
    queryFn: () => getSMSHistory(1, 40),
  });

  // Query Customers list for quick selection
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-sms"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name, phone")
        .order("name");
      return (data || []).filter((c) => !!c.phone);
    },
  });

  // Query Today's Sales for the 20:30 Daily Report
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

      // Low stock query
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

  // Handle single customer selection
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found?.phone) {
      setRecipientPhone(found.phone);
    }
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

  // Send Bulk SMS to all registered customers
  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMessage.trim()) {
      return toast.error("Andika ujumbe unaotaka kuwatumia wateja");
    }
    if (customers.length === 0) {
      return toast.error("Hakuna wateja wenye namba za simu waliosajiliwa bado");
    }

    setSendingBulk(true);
    try {
      const recipients = customers.map((c) => ({
        to: c.phone || "",
        name: c.name,
      }));

      const res = await sendBulkSMS({
        recipients,
        message: bulkMessage,
        campaignName: `${business?.business_name || "MauzoChap"} Broadcast`,
      });

      if (res.success) {
        toast.success(`Ujumbe umeanza kutumwa kwa wateja ${customers.length}!`);
        setBulkMessage("");
        refetchBalance();
        refetchHistory();
      } else {
        toast.error(res.message || "Imeshindwa kutuma ujumbe wa wengi");
      }
    } catch (err: any) {
      toast.error(err?.message || "Hitilafu ya mtandao wakati wa kutuma");
    } finally {
      setSendingBulk(false);
    }
  };

  // Send 20:30 Daily Report SMS
  const handleSendDailyReport = async () => {
    const phoneToSend = dailyPhone || business?.phone;
    if (!phoneToSend) {
      return toast.error("Weka namba ya simu ya mmiliki");
    }

    setSendingDaily(true);
    try {
      const res = await sendDailyReportSMS({
        phone: phoneToSend,
        businessName: business?.business_name || "Duka Lako",
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
            <span>SwalaSMS Official Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Usimamizi wa SMS & Ripoti za Kila Siku
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tuma SMS za wateja, pokea ripoti ya kila siku saa 20:30, na tangaza bidhaa kwa Sender ID rasmi ya <strong className="text-foreground">"{SENDER_ID}"</strong>.
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
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "single"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Tuma SMS kwa Mteja</span>
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
          onClick={() => setActiveTab("bulk")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "bulk"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tangazo kwa Wateja Wote ({customers.length})</span>
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
          <span>Historia ya SMS zilizotumwa</span>
        </button>
      </div>

      {/* TAB 1: Single SMS */}
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
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Chagua mteja kutoka orodha yako --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
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
                        `Habari mteja wetu, asante kwa kufanya ununuzi katika duka letu la ${business?.business_name || "MauzoChap"}. Karibu tena!`
                      )
                    }
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    Shukrani ya Ununuzi
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMessageBody(
                        `Habari mteja wetu, tunakukumbusha kuhusu salio la deni lako katika duka letu la ${business?.business_name || "MauzoChap"}. Tafadhali fika kulipia. Asante.`
                      )
                    }
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    Kikumbusho cha Deni
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMessageBody(
                        `Habari! Mzigo mpya wa bidhaa umewasili katika duka letu la ${business?.business_name || "MauzoChap"}. Karibu ujipatie bidhaa bora kwa bei nafuu.`
                      )
                    }
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    Mzigo Mpya Umewasili
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

      {/* TAB 2: Daily 20:30 Sales Summary SMS */}
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

      {/* TAB 3: Bulk Customer Broadcast */}
      {activeTab === "bulk" && (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 max-w-3xl">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Tangazo la Pamoja kwa Wateja Wote Waliosajiliwa ({customers.length})</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Tuma ujumbe mmoja wa SMS kwa wateja wote waliohifadhiwa kwenye daftari lako la wateja. Ujumbe utaingia moja kwa moja kwenye simu zao ukiwa na jina lako la <strong>"{SENDER_ID}"</strong>.
            </p>
          </div>

          <form onSubmit={handleSendBulk} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-foreground">Jumla ya Wateja Wenye Namba:</span>{" "}
                <span className="font-mono font-black text-primary text-sm">{customers.length}</span>
              </div>
              <div className="text-muted-foreground font-mono">
                Makadirio: ~{customers.length} SMS Credits
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
                placeholder="Mfano: Habari mteja wetu mpendwa, leo tuna ofa maalum ya punguzo la bei kwa bidhaa zote dukani kwetu MauzoChap. Karibu tukuudumie!"
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                disabled={sendingBulk || customers.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
              >
                <Send className="w-4 h-4 mr-1.5" />
                <span>{sendingBulk ? "Inatuma kwa Wateja..." : `Tuma kwa Wateja Wote (${customers.length})`}</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: History & Logs */}
      {activeTab === "history" && (
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground">Historia ya SMS Zilizotumwa</h3>
              <p className="text-xs text-muted-foreground">Hali halisi ya ujumbe unaotumwa kutoka kwenye mfumo.</p>
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
