import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Check,
  CheckCheck,
  BarChart3,
  Users,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Radio,
} from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface DailySmsSectionProps {
  t: LandingTranslation;
}

export function DailySmsSection({ t }: DailySmsSectionProps) {
  const s = t.dailySms;
  const [sentCount, setSentCount] = useState(0);

  const isSwahili =
    t.capabilities.eyebrow.toLowerCase().includes("uwezo") ||
    s.headline.toLowerCase().includes("kila siku") ||
    s.headline.toLowerCase().includes("usiku");

  const handleTestSms = () => {
    setSentCount((prev) => prev + 1);
    toast.success(isSwahili ? "SMS ya Majaribio Imetumwa!" : "Sample SMS Dispatched!", {
      description: isSwahili
        ? "Kutoka MAUZOCHAP: Mauzo TZS 1,284,500 • Faida TZS 385,000 • Miamala 47."
        : "From MAUZOCHAP: Revenue TZS 1,284,500 • Net Profit TZS 385,000 • 47 orders.",
      duration: 5000,
    });
  };

  const featureCards = [
    {
      icon: BarChart3,
      title: isSwahili ? "Mauzo na Idadi ya Risiti" : "Sales, and how many receipts",
      desc: isSwahili
        ? "Jumla ya mauzo yote ya siku na idadi ya wateja walionunua."
        : "Total daily revenue and count of completed transactions.",
    },
    {
      icon: Users,
      title: isSwahili ? "Madeni na Mikopo ya Wateja" : "Credit given and debts collected",
      desc: isSwahili
        ? "Fedha za madeni zilizolipwa na mikopo mipya iliyotolewa leo."
        : "Cash collected from debtors and new credit issued today.",
    },
    {
      icon: AlertTriangle,
      title: isSwahili ? "Tahadhari ya Bidhaa na Expiry" : "Low stock and expiry alerts",
      desc: isSwahili
        ? "Bidhaa zilizobaki chini na dawa zinazokaribia kuisha muda."
        : "Items dropping below safety limits and near-expiry stock.",
    },
    {
      icon: TrendingUp,
      title: isSwahili ? "Faida Halisi ya Siku" : "Verified net profit margin",
      desc: isSwahili
        ? "Faida halisi mfukoni baada ya kutoa gharama zote za manunuzi."
        : "True take-home profit calculated automatically from purchase costs.",
    },
  ];

  return (
    <section
      id="daily-sms"
      className="py-10 sm:py-20 lg:py-24 bg-[#01184c] text-white relative overflow-hidden border-b border-blue-950 scroll-mt-12"
    >
      {/* Ambient Blue/Violet Glows */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-1/4 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-violet-600/15 blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-14 items-center">
          {/* Left Column: Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[420px] lg:max-w-[530px] group">
              {/* Backlight Blue/Violet Glow */}
              <div
                className="absolute -inset-3 sm:-inset-4 rounded-full bg-gradient-to-r from-blue-600/25 via-violet-500/20 to-indigo-600/25 blur-2xl sm:blur-3xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                aria-hidden="true"
              />

              {/* Floating Top Notification Badge */}
              <div className="absolute -top-2.5 right-2 sm:right-8 z-10 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-blue-200 text-black shadow-xl text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
                <CheckCheck className="w-3 h-3 text-emerald-600" />
                <span className="text-black font-extrabold">Delivered 20:30 PM</span>
              </div>

              {/* Phone Image */}
              <img
                src="/images/iphone-sms-transparent.png"
                alt="MauzoChap Nightly 20:30 PM SMS Report on iPhone (Transparent, No Background)"
                className="w-full h-auto object-contain filter drop-shadow-[0_20px_40px_rgba(1,24,76,0.6)] transform group-hover:scale-[1.015] group-hover:-translate-y-1 transition-all duration-500"
                loading="lazy"
                width={900}
                height={1200}
              />

              {/* Sub-Phone Verified Sender & Offline SMS Delivery Badge */}
              <div className="mt-2.5 mx-auto px-3 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 text-[11px] sm:text-xs font-mono flex items-center justify-center gap-2 sm:gap-3 max-w-sm">
                <span>
                  Sender ID: <strong className="text-blue-300">MAUZOCHAP</strong>
                </span>
                <span className="border-l border-white/20 pl-2 sm:pl-3 text-emerald-400 font-bold">
                  Bila Bando
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Copy & 4 Glassmorphism Cards */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-8 text-left">
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-blue-400/30 bg-blue-950/60 text-blue-300 text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase">
                <span>
                  {isSwahili ? "KILA JIONI SAA 20:30 USIKU" : "EVERY EVENING AT 20:30 PM"}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {isSwahili
                  ? "Ripoti Kamili ya Siku Kwenye Simu Yako, Kila Jioni."
                  : "The Day's Totals on Your Phone, Every Evening."}
              </h2>

              <p className="text-sm sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
                {isSwahili
                  ? "Duka linapofungwa jioni, mmiliki anapokea ujumbe mmoja wa SMS wenye namba zote za siku. Unajua biashara iliendaje moja kwa moja kwenye simu yako hata kama huna bando la intaneti."
                  : "When the shop closes, the owner receives one standard SMS with the day in numbers. You know exactly how the store performed without opening the computer or needing internet bundles."}
              </p>
            </div>

            {/* 4 Glassmorphism Cards in 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 pt-1">
              {featureCards.map((card, idx) => {
                const CardIcon = card.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-blue-400/50 hover:bg-white/[0.08] transition-all duration-200 space-y-2 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{card.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {card.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Action Row */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={handleTestSms}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isSwahili ? "Tuma SMS ya Majaribio" : "Send Sample Test SMS"}</span>
              </button>

              {sentCount > 0 && (
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>SMS test simulated ({sentCount})</span>
                </span>
              )}

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SMS inafika simu yoyote ya kitochi au smartphone</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
