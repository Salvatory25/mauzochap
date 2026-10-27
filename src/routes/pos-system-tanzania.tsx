import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Store,
  Receipt,
  Smartphone,
  BarChart3,
  Users,
  MessageCircle,
  HelpCircle,
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

export const Route = createFileRoute("/pos-system-tanzania")({
  head: () =>
    buildSeoHead({
      title: "Best POS System in Tanzania | Mfumo Bora wa Mauzo na POS — MauzoChap",
      description:
        "The leading point of sale (POS) and inventory software in Tanzania. Fast barcode sales, credit book tracking, 80mm thermal receipt printing, and nightly 20:30 PM automated SMS sales reports.",
      path: "/pos-system-tanzania",
      keywords: [
        "POS system Tanzania",
        "best POS system Tanzania",
        "point of sale system Tanzania",
        "POS software Tanzania",
        "mfumo wa POS Tanzania",
        "mfumo bora wa mauzo",
        "sales management software Tanzania",
        "retail POS software Tanzania",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "POS System Tanzania", path: "/pos-system-tanzania" },
        ]),
        getSoftwareApplicationSchema(),
        getFaqSchema([
          {
            question: "Why is MauzoChap the best POS system in Tanzania?",
            answer:
              "MauzoChap is purpose-built for Tanzanian trade: it supports local mobile money payments (M-Pesa, Tigo Pesa, Airtel Money), sends daily 20:30 PM SMS profit and sales summaries directly to the store owner's phone, tracks customer credit notebooks, and works on standard computers, tablets, and smartphones without expensive specialized hardware.",
          },
          {
            question: "Can I use my existing thermal receipt printer and barcode scanner?",
            answer:
              "Yes. MauzoChap works seamlessly with standard USB and Bluetooth 80mm/58mm thermal receipt printers and standard handheld barcode scanners or your mobile camera.",
          },
          {
            question: "Does MauzoChap work when internet is slow or unstable?",
            answer:
              "Yes. MauzoChap is engineered as an offline-first Progressive Web App (PWA). Cashiers can continue recording checkouts even during temporary network drops, and sales automatically synchronize when connection resumes.",
          },
        ]),
      ],
    }),
  component: PosSystemTanzaniaPage,
});

function PosSystemTanzaniaPage() {
  const [lang, setLang] = useLang();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const t = landingTranslations[lang] || landingTranslations.en;
  const toggleLang = () => setLang(lang === "en" ? "sw" : "en");

  const benefits = [
    {
      title: "Automated 20:30 PM SMS Summary",
      titleSw: "Ripoti ya Mauzo Kila Siku Saa 2:30 Usiku kwa SMS",
      desc: "Receive total daily revenue, gross profit, cash in drawer, and outstanding customer credits on your phone, even if you are away from your shop.",
      descSw: "Pata muhtasari wa mauzo yote ya siku, faida iliyopatikana, pesa taslimu zilizopo, na madeni mapya moja kwa moja kwenye simu yako bila intaneti.",
      icon: Smartphone,
    },
    {
      title: "Customer Debt Notebook (Daftari la Madeni)",
      titleSw: "Usimamizi wa Madeni na Mikopo ya Wateja",
      desc: "Replace lost paper notebooks. Record customer balances, set credit limits, receive debt payments in installments, and send SMS debt reminders.",
      descSw: "Acha daftari za karatasi zinazochafuka au kupotea. Rekodi madeni ya wateja, pokea malipo kidogo kidogo, na tuma vikumbusho kwa SMS.",
      icon: Users,
    },
    {
      title: "Thermal Receipts & WhatsApp Invoicing",
      titleSw: "Risiti za Printa ya Thermal na Ankara za WhatsApp",
      desc: "Print instant professional receipts via 80mm or 58mm thermal printers, or send digital PDF receipts directly to customers via WhatsApp.",
      descSw: "Toa risiti za kisasa kwa printa za thermal (58mm/80mm) au tuma risiti na ankara za PDF moja kwa moja kwenye WhatsApp ya mteja.",
      icon: Receipt,
    },
    {
      title: "Stock Control & Theft Prevention",
      titleSw: "Udhibiti wa Stoo na Kuzuia Wizi Dukani",
      desc: "Every sale automatically deducts product inventory in real time. Low stock notifications alert you before essential items run out.",
      descSw: "Kila bidhaa inapouzwa inakatwa kwenye stoo moja kwa moja. Mfumo unakupa taarifa mapema kabla bidhaa muhimu hazijaisha.",
      icon: Store,
    },
    {
      title: "Role-Based Security for Employees",
      titleSw: "Ulinzi wa Majukumu kwa Wafanyakazi (Cashier/Admin)",
      desc: "Prevent unauthorized price edits or receipt deletions. Cashiers only process sales, while owners and managers view confidential profit reports.",
      descSw: "Wafanyakazi wauze bila kubadili bei au kufuta miamala kiholela. Mmiliki pekee ndiye anayeona faida halisi na ripoti za hesabu.",
      icon: ShieldCheck,
    },
    {
      title: "Real-Time Profit & Expense Analytics",
      titleSw: "Hesabu Kamili ya Faida na Matumizi ya Kila Siku",
      desc: "Understand your actual gross margin by tracking item cost vs selling price, daily shop rent, electricity, and miscellaneous business expenses.",
      descSw: "Jua faida yako halisi kila siku kwa kulinganisha gharama ya ununuzi dhidi ya bei ya kuuzia, ukitoa gharama za pango, umeme na uendeshaji.",
      icon: BarChart3,
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
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-purple-50/60 via-white to-white border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-200 bg-white text-violet-700 text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
                <Zap className="w-3.5 h-3.5 text-violet-600" />
                <span>{lang === "sw" ? "#1 Mfumo wa POS Tanzania" : "#1 POS System in Tanzania"}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
                {lang === "sw" ? (
                  <>
                    Mfumo Bora wa Mauzo na POS kwa{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                      Wafanyabiashara Tanzania
                    </span>
                  </>
                ) : (
                  <>
                    The Leading POS & Inventory Software for{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                      Tanzanian Businesses
                    </span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
                {lang === "sw"
                  ? "Rahisisha mauzo ya duka lako, dhibiti upotevu wa bidhaa stoo, rekodi madeni ya wateja bila karatasi, na pokea ripoti ya faida kwa SMS kila usiku popote ulipo."
                  : "Empower your retail store, pharmacy, or wholesale shop with lightning-fast checkouts, accurate stock balances, customer credit notebooks, and automated 20:30 PM nightly SMS sales reports."}
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-violet-600/25 transition-all cursor-pointer"
                >
                  <span>{lang === "sw" ? "Anza Jaribio la Siku 14 Bure" : "Start 14-Day Free Trial"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm tracking-wide transition-all"
                >
                  <span>{lang === "sw" ? "Tazama Demo ya Mfumo" : "Explore Live Interactive Demo"}</span>
                </Link>
              </div>

              {/* Trust signals */}
              <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === "sw" ? "Hakuna Kadi ya Benki Inayohitajika" : "No Credit Card Required"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === "sw" ? "M-Pesa, Tigo Pesa, Airtel Money" : "Local Mobile Money Supported"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{lang === "sw" ? "Ripoti za SMS Saa 2:30 Usiku" : "Nightly 20:30 PM SMS Reports"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Value Props Grid */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
                {lang === "sw"
                  ? "Kwanini Maduka Zaidi ya 500+ Yanachagua MauzoChap?"
                  : "Why Retailers in Tanzania Trust MauzoChap"}
              </h2>
              <p className="text-slate-600 text-base sm:text-lg">
                {lang === "sw"
                  ? "Imeundwa mahsusi kukidhi mazingira halisi ya biashara nchini Tanzania kuanzia Kariakoo hadi mikoani."
                  : "Designed specifically to overcome real operational hurdles faced by merchants across Tanzania."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div
                    key={i}
                    className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-violet-200 hover:shadow-xl hover:shadow-violet-600/5 transition-all space-y-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-950">
                      {lang === "sw" ? b.titleSw : b.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {lang === "sw" ? b.descSw : b.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Industry Match Links */}
        <section className="py-16 bg-slate-50 border-y border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                {lang === "sw" ? "Mfumo wa POS kwa Kila Aina ya Biashara" : "Tailored POS for Every Industry"}
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                {lang === "sw"
                  ? "Chagua aina ya biashara yako kuona jinsi MauzoChap inavyofanya kazi kwako."
                  : "Explore specialized features built for your specific trade sector in Tanzania."}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Retail Shops & Maduka", path: "/shops" },
                { name: "Supermarkets & Minimarts", path: "/supermarkets" },
                { name: "Pharmacies & Duka la Dawa", path: "/pharmacies" },
                { name: "Hardware & Electricals", path: "/hardware" },
                { name: "Wholesale & Distribution", path: "/wholesale" },
                { name: "Restaurants & Bars", path: "/restaurants" },
                { name: "Boutiques & Fashion", path: "/fashion" },
                { name: "Phones & Electronics", path: "/electronics" },
              ].map((ind, i) => (
                <Link
                  key={i}
                  to={ind.path}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all text-center font-bold text-xs sm:text-sm text-slate-800 hover:text-violet-600"
                >
                  {ind.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 bg-[#01184c] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              {lang === "sw"
                ? "Anza Kusimamia Biashara Yako Kidigitali Leo"
                : "Ready to Supercharge Your Business with MauzoChap?"}
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
              {lang === "sw"
                ? "Jiunge na wafanyabiashara wengine kote Tanzania wanaopata amani ya moyo na ripoti kamili za biashara zao."
                : "Join hundreds of forward-thinking merchants across Tanzania enjoying daily clarity and growth."}
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-[#01184c] font-black text-sm uppercase tracking-wider transition-all shadow-xl cursor-pointer"
              >
                {lang === "sw" ? "Anza Bure Siku 14" : "Start Free 14-Day Trial"}
              </button>
              <a
                href="https://wa.me/255627274168"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide transition-all shadow-xl"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{lang === "sw" ? "Wasiliana nasi WhatsApp" : "Chat on WhatsApp"}</span>
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
