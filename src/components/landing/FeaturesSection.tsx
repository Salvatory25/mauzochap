import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Zap,
  Boxes,
  Users,
  Receipt,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Sparkles,
  LucideIcon,
  AlertTriangle,
  Layers,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Lock,
  RotateCw,
  CheckCircle2,
} from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface FeaturesSectionProps {
  t: LandingTranslation;
  onOpenRegisterModal?: () => void;
}

type ActionTabId = "inventory" | "reports";

interface TabHighlight {
  icon: LucideIcon;
  title: string;
  desc: string;
  tag: string;
}

interface ActionTabConfig {
  id: ActionTabId;
  tabLabel: string;
  tabBadge: string;
  tabSummary: string;
  tabIcon: LucideIcon;
  image: string;
  imageAlt: string;
  urlBar: string;
  badge: string;
  headline: string;
  subheadline: string;
  highlights: TabHighlight[];
  statusNote: string;
}

export function FeaturesSection({ t, onOpenRegisterModal }: FeaturesSectionProps) {
  const c = t.capabilities;
  const [activeTab, setActiveTab] = useState<ActionTabId>("inventory");

  const isSwahili =
    c.eyebrow.toLowerCase().includes("uwezo") ||
    c.headline.toLowerCase().includes("biashara") ||
    c.headline.toLowerCase().includes("rahisi");

  const iconMap: Record<string, LucideIcon> = {
    pos: Zap,
    inventory: Boxes,
    customers: Users,
    receipts: Receipt,
    reports: BarChart3,
    roles: ShieldCheck,
  };

  const tabs: ActionTabConfig[] = [
    {
      id: "inventory",
      tabLabel: isSwahili
        ? "Stoo ya Kisasa & Tahadhari ya Expiry"
        : "Smart Inventory & Expiry Radar",
      tabBadge: isSwahili ? "TAARIFA MAPEMA" : "PROACTIVE ALERTS",
      tabSummary: isSwahili
        ? "Batch namba, sheria za FEFO & miezi 3-6 kabla ya kuisha"
        : "Batches, FEFO rules & 3-6 month advance warnings",
      tabIcon: Boxes,
      image: "/images/loss-prevention-audit.jpg",
      imageAlt:
        "MauzoChap Loss Prevention & Expiry Radar: Monitored inventory batches with TMDA compliance, proactive expiry alerts, and cashier shift audits",
      urlBar: "mauzochap.co.tz/app/loss-prevention",
      badge: isSwahili ? "KUZUIA HASARA & UKAGUZI WA STOO" : "LOSS PREVENTION & AUDITS",
      headline: isSwahili
        ? "Usiwahi Kupata Hasara kwa Bidhaa Kuisha Muda au Kupotea"
        : "Never Lose Money to Expired Goods or Stock Leakages",
      subheadline: isSwahili
        ? "Fuatilia mizania ya stoo kwa wakati halisi na tahadhari za siku 30, 60 na 90 kabla bidhaa hazijaisha muda. Udhibiti wa batch namba unakidhi viwango vya TMDA na kulinda maduka ya dawa na rejareja."
        : "Real-time stock balance tracking with automated 30, 60, and 90-day expiry radar. Batch and lot number controls ensure TMDA compliance and safeguard pharmacies and retail stores against dead stock.",
      highlights: [
        {
          icon: AlertTriangle,
          title: isSwahili ? "Tahadhari ya Miezi 3-6 Kabla" : "3 to 6-Month Expiry Radar",
          desc: isSwahili
            ? "Pata tahadhari mapema ili uweze kuuza kwa punguzo au kurudisha kwa msambazaji kabla ya hasara."
            : "Color-coded advance alerts let you discount or return near-expiry goods before losing money.",
          tag: isSwahili ? "Hasara Sifuri" : "Zero Waste",
        },
        {
          icon: Boxes,
          title: isSwahili ? "Batch & Lot Namba (FEFO)" : "Batch & Lot Tracking (FEFO)",
          desc: isSwahili
            ? "Inakidhi viwango vyote vya TMDA kwa kurekodi tarehe za utengenezaji na kutoa bidhaa za kwanza kuisha."
            : "Full regulatory compliance with batch logging, manufacture dates, and first-expiry dispensing.",
          tag: isSwahili ? "Tayari kwa TMDA" : "TMDA Ready",
        },
        {
          icon: Layers,
          title: isSwahili ? "Tahadhari ya Bidhaa Chini" : "Automated Reorder Thresholds",
          desc: isSwahili
            ? "Pata taarifa bidhaa inapofikia kiwango cha chini ili uagize mapema Kariakoo bila kukwama."
            : "Instant alerts when Kariakoo or supplier products hit low-stock limits so you never run out.",
          tag: isSwahili ? "Stoo Haiishi" : "Always In Stock",
        },
      ],
      statusNote: isSwahili
        ? "Muda wa Bidhaa Unafuatiliwa • Bidhaa 3 Ziko Chini ya Kiwango"
        : "Loss Prevention Active • 4 Items Monitored",
    },
    {
      id: "reports",
      tabLabel: isSwahili
        ? "Ripoti za Faida & SMS ya Saa 20:30"
        : "Executive Analytics & Nightly SMS",
      tabBadge: isSwahili ? "SAA 20:30 KILA SIKU" : "20:30 PM DAILY",
      tabSummary: isSwahili
        ? "Faida halisi, usimamizi wa kaunta & ripoti ya simu"
        : "True net profit margins, cashier shifts & SMS reports",
      tabIcon: BarChart3,
      image: "/images/hero-macbook-iphone.jpg",
      imageAlt:
        "MauzoChap Executive POS Dashboard on MacBook and iPhone with net profit analytics, shift reconciliation, and daily sales summary",
      urlBar: "mauzochap.co.tz/app/reports/analytics",
      badge: isSwahili ? "AMANI YA AKILI KWA MMILIKI" : "OWNER VISIBILITY & PEACE OF MIND",
      headline: isSwahili
        ? "Jua Faida Yako Halisi Kila Siku — Popote Ulipo"
        : "Know Your True Take-Home Profit Every Single Night",
      subheadline: isSwahili
        ? "Angalia mauzo ghafi, gharama za manunuzi na faida halisi kutoka kwa wahudumu wote na matawi yote. Saa 20:30 usiku kila siku, ripoti inafika kwenye simu yako kwa njia ya SMS kiotomatiki."
        : "Real-time gross revenue, purchase cost deductions, and net profit margins across all cashiers and branches. At 20:30 PM every night, an executive report arrives on your phone via SMS automatically.",
      highlights: [
        {
          icon: TrendingUp,
          title: isSwahili ? "Hesabu ya Faida Halisi" : "Automated Net Profit Calculation",
          desc: isSwahili
            ? "MauzoChap inalinganisha bei ya kununulia na kuuzia ili uone faida halisi mfukoni, si mauzo ghafi."
            : "Real-time cost price vs. selling price tracking reveals true take-home profit, not just cash inflow.",
          tag: isSwahili ? "Faida Halisi" : "Real Profit",
        },
        {
          icon: ShieldCheck,
          title: isSwahili
            ? "Ukaguzi wa Kaunta (Blind Shift)"
            : "Cashier Blind Shift Reconciliations",
          desc: isSwahili
            ? "Mhudumu anafunga hesabu bila kuona jumla ya mfumo, ikiondoa wizi na udanganyifu wa fedha."
            : "Staff balance cash without seeing system totals, completely shutting down register skimming.",
          tag: isSwahili ? "Zuia Wizi" : "Anti-Theft",
        },
        {
          icon: BarChart3,
          title: isSwahili ? "Ripoti ya SMS Saa 20:30 Usiku" : "Nightly 20:30 PM SMS Report",
          desc: isSwahili
            ? "Muhtasari wa biashara unakufikia kwenye simu hata kama kompyuta ya duka imezimwa na huna bando."
            : "Executive business performance delivered to your phone even if your shop laptop is off.",
          tag: isSwahili ? "SMS ya Saa 20:30" : "Nightly at 20:30",
        },
      ],
      statusNote: isSwahili
        ? "SMS ya Saa 20:30 Imethibitishwa • Faida ya Leo Imefungwa"
        : "Nightly SMS Dispatched • Daily Profit Reconciled",
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <section
      id="features"
      className="py-10 sm:py-20 lg:py-24 bg-white border-b border-purple-100 scroll-mt-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full border border-purple-200 bg-purple-50 text-violet-700 text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase">
            <span>{c.eyebrow}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            {c.headline}
          </h2>

          <p className="text-sm sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            {c.subheadline}
          </p>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="flex sm:hidden items-center justify-between text-[11px] font-mono text-violet-700 font-bold px-1 mb-2">
          <span>{isSwahili ? "UWEZO WA MFUMO (6)" : "CORE CAPABILITIES (6)"}</span>
          <span className="flex items-center gap-1 text-slate-400">
            <span>{isSwahili ? "Telezesha" : "Swipe"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 6 Capabilities Rounded Cards Grid: Swipeable carousel on mobile, 3-col grid on desktop */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar gap-3.5 sm:gap-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid-cols-2 lg:grid-cols-3 pb-3 sm:pb-0">
          {c.items.map((item) => {
            const Icon = iconMap[item.id] || Zap;

            return (
              <div
                key={item.id}
                className="w-[82vw] max-w-[310px] sm:w-auto shrink-0 snap-center rounded-2xl sm:rounded-[28px] border border-purple-100 bg-white p-5 sm:p-8 flex flex-col justify-between space-y-4 sm:space-y-5 shadow-xs hover:border-violet-300 hover:shadow-xl hover:shadow-purple-950/5 transition-all duration-200 group"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-100/70 border border-purple-200/60 flex items-center justify-center text-violet-600 group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white transition-all duration-200">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">{item.title}</h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-purple-50 text-[10px] sm:text-[11px] font-mono font-bold text-violet-600 uppercase tracking-wider">
                  <span>Ready for Tanzanian Commerce</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* =========================================================================
            SOFTWARE IN ACTION: World-Class Interactive Product Showcase
           ========================================================================= */}
        <div className="mt-10 sm:mt-20 rounded-2xl sm:rounded-[32px] border border-purple-200 bg-gradient-to-b from-purple-50/70 via-white to-purple-50/30 p-4 sm:p-10 lg:p-12 shadow-xl shadow-purple-950/5 overflow-hidden">
          {/* Eyebrow & Headline */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2 sm:space-y-3">
            <div className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-800 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest">
              <span>SOFTWARE IN ACTION</span>
            </div>
            <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
              {isSwahili
                ? "Mfumo Unavyofanya Kazi kwa Vitendo"
                : "Designed for Speed. Engineered for Tanzanian Retail."}
            </h3>
            <p className="text-xs sm:text-base text-slate-600 font-normal max-w-2xl mx-auto">
              {isSwahili
                ? "Gundua jinsi maduka zaidi ya 110+ nchini Tanzania yanavyouza kwa haraka, kutoa risiti za WhatsApp na kulinda stoo zao kila siku."
                : "High-resolution interactive previews of your counter sales, WhatsApp receipts, batch expiry radar, and automated nightly reconciliation."}
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-2xl mx-auto mb-6 sm:mb-8">
            {tabs.map((tab) => {
              const TabIcon = tab.tabIcon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-1.5 sm:space-y-2.5 ${
                    isActive
                      ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/25 sm:scale-[1.02]"
                      : "bg-white hover:bg-purple-50/70 border-purple-200/80 text-slate-700 shadow-2xs hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? "bg-white/20 text-white" : "bg-purple-100 text-violet-700"
                        }`}
                      >
                        <TabIcon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wider font-mono">
                        {tab.id.toUpperCase()}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-purple-100 text-violet-700 border border-purple-200/60"
                      }`}
                    >
                      {tab.tabBadge}
                    </span>
                  </div>

                  <div>
                    <h4
                      className={`text-sm sm:text-base font-black tracking-tight ${
                        isActive ? "text-white" : "text-slate-950"
                      }`}
                    >
                      {tab.tabLabel}
                    </h4>
                    <p
                      className={`text-xs mt-1 leading-relaxed font-normal ${
                        isActive ? "text-purple-100" : "text-slate-500"
                      }`}
                    >
                      {tab.tabSummary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Tab Showcase Container */}
          <div className="rounded-[28px] border border-purple-200/90 bg-white p-5 sm:p-8 lg:p-10 shadow-lg shadow-purple-950/5">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Visual Showcase: macOS/SaaS Window Frame (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="rounded-2xl border border-blue-900/40 bg-[#01184c] shadow-2xl overflow-hidden group">
                  {/* Window Chrome Header Bar with Official MauzoChap Logo */}
                  <div className="px-4 py-3 bg-[#01184c] text-white flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block" />
                        <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
                        <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
                      </div>
                      <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/20">
                        <img
                          src="/images/logo-black.png"
                          alt="MauzoChap"
                          className="w-6 h-6 rounded-md object-contain bg-white p-0.5 shadow-xs"
                          width={24}
                          height={24}
                        />
                        <span className="text-xs font-black text-white tracking-tight">MauzoChap POS</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 ml-2 px-3 py-1 rounded-md bg-white/10 border border-white/10 text-[11px] font-mono text-blue-100">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>https://{currentTab.urlBar}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">
                        LIVE TZS
                      </span>
                      <RotateCw className="w-3 h-3 text-slate-400 hidden sm:block ml-1" />
                    </div>
                  </div>

                  {/* High-Resolution Screenshot Image */}
                  <div className="relative overflow-hidden bg-[#01184c]">
                    <img
                      key={currentTab.id}
                      src={currentTab.image}
                      alt={currentTab.imageAlt}
                      className="w-full h-auto object-cover transform group-hover:scale-[1.015] transition-transform duration-500 ease-out"
                      loading="lazy"
                      width={1600}
                      height={1000}
                    />

                    {/* Subtle Gradient Overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#01184c]/80 to-transparent pointer-events-none" />
                  </div>

                  {/* Window Bottom Status Strip */}
                  <div className="px-4 py-2.5 bg-[#01184c] text-slate-300 flex items-center justify-between text-xs font-mono border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-white font-semibold">{currentTab.statusNote}</span>
                    </div>
                    <span className="text-[11px] text-violet-300 font-bold hidden sm:inline">
                      TZS 0 PAPER COST
                    </span>
                  </div>
                </div>
              </div>

              {/* Feature Highlights & Value Story (5 cols) */}
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="space-y-3">
                  <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-mono font-bold tracking-wider uppercase">
                    <span>{currentTab.badge}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-snug">
                    {currentTab.headline}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {currentTab.subheadline}
                  </p>
                </div>

                {/* 3 Highlight Cards */}
                <div className="space-y-3">
                  {currentTab.highlights.map((h, idx) => {
                    const HIcon = h.icon;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 rounded-2xl bg-purple-50/60 border border-purple-100/90 flex items-start gap-3.5 hover:border-violet-300 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-violet-600/20">
                          <HIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs sm:text-sm font-black text-slate-950 tracking-tight">
                              {h.title}
                            </h5>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 shrink-0">
                              {h.tag}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-normal">
                            {h.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action CTA & Guarantees */}
                <div className="pt-2 space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Link
                      to="/demo"
                      className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <span>{isSwahili ? "Jaribu Demo ya Mfumo" : "Try Interactive Demo"}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <Link
                      to="/auth"
                      className="px-5 py-3 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-violet-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{isSwahili ? "Anza Bure Sasa" : "Get Started Free"}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isSwahili ? "Bila kadi ya benki" : "No credit card"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isSwahili ? "Simu au Kompyuta" : "Phone or PC"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isSwahili ? "Tayari Tanzania" : "Tanzania Ready"}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
