import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Boxes,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Barcode,
  CheckCircle2,
  Calendar,
  Building,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { landingTranslations } from "@/components/landing/landing-i18n";
import { HomepageHeader } from "@/components/landing/HomepageHeader";
import { HomepageFooter } from "@/components/landing/HomepageFooter";
import { RegisterModal } from "@/components/landing/RegisterModal";
import {
  buildSeoHead,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
  getFaqSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/inventory-management-system")({
  head: () =>
    buildSeoHead({
      title: "Inventory & Stock Management Software in Tanzania | Mfumo wa Stoo — MauzoChap",
      description:
        "Mfumo madhubuti wa usimamizi wa stoo na bidhaa Tanzania. Fuatilia bidhaa zinazoingia na kutoka, arifa za bidhaa zinazoisha, tarehe za kuisha (expiry tracking/FEFO), na uhamisho wa stoo kati ya matawi.",
      path: "/inventory-management-system",
      keywords: [
        "inventory management software Tanzania",
        "mfumo wa kusimamia stoo",
        "stock management system Tanzania",
        "programu ya kufuatilia bidhaa",
        "mfumo wa bidhaa zinazoingia na kutoka",
        "expiry tracking software Tanzania",
        "stock audit software",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Inventory Management System", path: "/inventory-management-system" },
        ]),
        getSoftwareApplicationSchema(),
        getFaqSchema([
          {
            question: "Jinsi gani MauzoChap inazuia upotevu na wizi wa bidhaa stoo?",
            answer:
              "Kila mauzo yanayofanyika yanakata kiasi cha bidhaa moja kwa moja kwenye stoo ya tawi husika. Mfumo unarekodi historia nzima ya miamala (stock movements) na kutoa ripoti ya ukaguzi wa bidhaa zilizopo dhidi ya hesabu ya mfumo.",
          },
          {
            question: "Je, mfumo unasaidia bidhaa zenye tarehe ya mwisho wa matumizi (expiry dates)?",
            answer:
              "Ndiyo. MauzoChap ina moduli maalum ya Batch & Expiry tracking inayofuata kanuni ya FEFO (First-Expired, First-Out) kwa ajili ya maduka ya dawa (pharmacies), vipodozi, na vyakula.",
          },
          {
            question: "Je, ninaweza kuhamisha bidhaa kutoka tawi moja kwenda jingine?",
            answer:
              "Ndiyo. Moduli ya Stock Transfer inaruhusu kutuma bidhaa kutoka ghala kuu (HQ) kwenda matawi mengine na tawi linalopokea linathibitisha kupokea kabla ya kuongezwa kwenye stoo yao.",
          },
        ]),
      ],
    }),
  component: InventoryPage,
});

function InventoryPage() {
  const [lang, setLang] = useLang();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const t = landingTranslations[lang] || landingTranslations.en;
  const toggleLang = () => setLang(lang === "en" ? "sw" : "en");

  const pillars = [
    {
      title: "Real-Time Stock Audits & Low-Stock Alerts",
      titleSw: "Ukaguzi wa Stoo na Arifa za Bidhaa Zinazoisha",
      desc: "Instant live balance on every item. Get automatic low-stock notifications so you reorder before shelves run dry.",
      descSw: "Hesabu ya moja kwa moja ya kila bidhaa. Pata tahadhari ya mapema bidhaa inapofikia kiwango cha chini ili uagize kwa wakati.",
      icon: AlertTriangle,
    },
    {
      title: "Batch & Expiry Date (FEFO) Compliance",
      titleSw: "Udhibiti wa Tarehe za Kuisha (Expiry Dates & Batches)",
      desc: "Assign batch numbers and expiry dates to stock. Automatically sell closest-to-expiry items first to protect margins.",
      descSw: "Weka namba za batch na tarehe za kuisha. Mfumo unauza bidhaa inayokaribia kuisha kwanza (FEFO) kuzuia hasara ya bidhaa kuharibika.",
      icon: Calendar,
    },
    {
      title: "Multi-Branch Stock Transfers",
      titleSw: "Uhamisho wa Bidhaa Kati ya Matawi (Stock Transfer)",
      desc: "Transfer stock seamlessly between your central warehouse and retail branches with dispatch and receipt confirmations.",
      descSw: "Hamisha bidhaa kwa usalama kati ya ghala kuu na matawi yako. Kila tawi linathibitisha idadi iliyopokelewa kabla ya kubadili hesabu.",
      icon: Building,
    },
    {
      title: "Supplier Purchase Orders & Cost Averaging",
      titleSw: "Manunuzi kutoka kwa Wasambazaji na Gharama Halisi",
      desc: "Record supplier purchases, track supplier credit balances, and automatically recalculate unit cost to protect your true gross profit.",
      descSw: "Rekodi manunuzi ya mzigo mpya, madeni ya wasambazaji, na gharama za kila bidhaa ili mfumo ukuonyeshe faida yako bila makosa.",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white font-sans antialiased selection:bg-violet-600 selection:text-white">
      <HomepageHeader
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      <main className="w-full">
        {/* Hero */}
        <section className="pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-indigo-50/60 via-white to-white border-b border-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 bg-white text-indigo-700 text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
                <Boxes className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === "sw" ? "Usimamizi wa Stoo Tanzania" : "Inventory Software Tanzania"}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
                {lang === "sw" ? (
                  <>
                    Dhibiti Stoo Yako na Zuia Upotevu kwa{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                      MauzoChap Inventory
                    </span>
                  </>
                ) : (
                  <>
                    End Stock Discrepancies with Intelligent{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                      Inventory Control
                    </span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
                {lang === "sw"
                  ? "Acha kupoteza pesa kwa bidhaa kuisha bila taarifa, bidhaa kuisha muda wake (expire), au wizi usiojulikana. Fuatilia kila kopo, boksi, na mfuko kwa uhakika wa 100%."
                  : "Eliminate stockouts, manage vendor purchase orders, track expiry dates, and conduct fast branch reconciliations on your phone or PC."}
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  <span>{lang === "sw" ? "Anza Majaribio Bure" : "Start Free Trial"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm tracking-wide transition-all"
                >
                  <span>{lang === "sw" ? "Tazama Demo ya Stoo" : "Try Interactive Demo"}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div
                    key={i}
                    className="p-8 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-xl transition-all space-y-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-950">
                      {lang === "sw" ? p.titleSw : p.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {lang === "sw" ? p.descSw : p.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 bg-slate-950 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black">
              {lang === "sw"
                ? "Weka Stoo Yako Katika Mfumo wa Kisasa"
                : "Take Complete Control of Your Retail Inventory"}
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              {lang === "sw"
                ? "Jaribu MauzoChap leo bila malipo ya awali na uone mabadiliko ndani ya siku chache."
                : "Sign up in 60 seconds and experience automated stock audits."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-xl cursor-pointer"
              >
                {lang === "sw" ? "Anza Bure Sasa" : "Get Started Now"}
              </button>
              <a
                href="https://wa.me/255627274168"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-xl"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{lang === "sw" ? "Wasiliana WhatsApp: +255 627 274 168" : "Chat WhatsApp: +255 627 274 168"}</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <HomepageFooter
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      <RegisterModal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} t={t} />
    </div>
  );
}
