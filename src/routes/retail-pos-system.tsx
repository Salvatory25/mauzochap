import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShoppingBag,
  Receipt,
  Users,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
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

export const Route = createFileRoute("/retail-pos-system")({
  head: () =>
    buildSeoHead({
      title: "Retail POS Software Tanzania | Mfumo wa Mauzo kwa Maduka ya Rejareja — MauzoChap",
      description:
        "Mfumo maalum wa mauzo na stoo (retail POS) kwa maduka ya rejareja nchini Tanzania. Fuatilia mauzo ya kila siku, daftari la mikopo ya wateja, risiti za printa, na ripoti ya SMS ya saa 2:30 usiku.",
      path: "/retail-pos-system",
      keywords: [
        "retail POS software Tanzania",
        "mfumo wa mauzo kwa duka",
        "small business POS Tanzania",
        "mfumo wa biashara ndogo",
        "retail shop management software",
        "POS ya duka la rejareja",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Retail POS System", path: "/retail-pos-system" },
        ]),
        getSoftwareApplicationSchema(),
        getFaqSchema([
          {
            question: "Je, mfumo huu unafaa hata kama nina duka dogo la rejareja?",
            answer:
              "Ndiyo. Kifurushi cha Starter (Uhuru) kimeundwa mahsusi kwa maduka madogo na ya kati kuanzia TZS 10,500 tu kwa mwezi ili uweze kusimamia mauzo na stoo kwa ufanisi.",
          },
          {
            question: "Je, ninaweza kurekodi madeni ya wateja wa mtaani wanaonunua kwa mkopo?",
            answer:
              "Ndiyo kabisa! MauzoChap inakuwezesha kuweka jina na namba ya mteja, kurekodi bidhaa alizochukua kwa mkopo, na kupunguza deni kila anapolipa kidogo kidogo.",
          },
        ]),
      ],
    }),
  component: RetailPosPage,
});

function RetailPosPage() {
  const [lang, setLang] = useLang();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const t = landingTranslations[lang] || landingTranslations.en;
  const toggleLang = () => setLang(lang === "en" ? "sw" : "en");

  return (
    <div className="min-h-screen w-full bg-white font-sans antialiased selection:bg-violet-600 selection:text-white">
      <HomepageHeader
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      <main className="w-full">
        <section className="pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-emerald-50/60 via-white to-white border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-200 bg-white text-emerald-700 text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "sw" ? "Retail POS Tanzania" : "Retail Point of Sale"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
              {lang === "sw" ? (
                <>
                  Mfumo Rahisi wa Mauzo kwa{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                    Maduka ya Rejareja
                  </span>
                </>
              ) : (
                <>
                  Modern Retail POS Software for{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                    Small Businesses in Tanzania
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
              {lang === "sw"
                ? "Hakuna tena kupoteza muda na daftari la karatasi au kukosa hesabu za mauzo. MauzoChap inakupa udhibiti kamili wa duka lako kuanzia asubuhi hadi kufunga."
                : "Fast checkouts, automated customer debt logs, thermal receipts, and nightly SMS summaries built for retail shopkeepers."}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <span>{lang === "sw" ? "Jaribu Siku 14 Bure" : "Start Free Trial"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://wa.me/255627274168"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm tracking-wide shadow-lg transition-all"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp: +255 627 274 168</span>
              </a>

              <Link
                to="/shops"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm tracking-wide transition-all"
              >
                <span>{lang === "sw" ? "Vipengele vya Maduka" : "Shop Features"}</span>
              </Link>
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
