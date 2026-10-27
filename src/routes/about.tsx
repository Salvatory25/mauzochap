import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Heart, Sparkles, MapPin, Users, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { landingTranslations } from "@/components/landing/landing-i18n";
import { HomepageHeader } from "@/components/landing/HomepageHeader";
import { HomepageFooter } from "@/components/landing/HomepageFooter";
import { RegisterModal } from "@/components/landing/RegisterModal";
import { buildSeoHead, getBreadcrumbSchema, getOrganizationSchema } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    buildSeoHead({
      title: "Kuhusu MauzoChap (About Us) | Mfumo wa Mauzo na Biashara Tanzania",
      description:
        "Fahamu historia na maono ya MauzoChap POS. Mfumo wa kidigitali wa kusimamia mauzo na stoo uliobuniwa mahsusi kuinua na kurahisisha shughuli za wafanyabiashara nchini Tanzania.",
      path: "/about",
      keywords: [
        "kuhusu MauzoChap",
        "about MauzoChap POS",
        "kampuni ya mifumo ya biashara Tanzania",
        "retail software Dar es Salaam",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Kuhusu Sisi", path: "/about" },
        ]),
        getOrganizationSchema(),
      ],
    }),
  component: AboutPage,
});

function AboutPage() {
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
        <section className="pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-purple-50/60 via-white to-white border-b border-purple-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-200 bg-white text-violet-700 text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>{lang === "sw" ? "Maono Yetu" : "Our Mission"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              {lang === "sw"
                ? "Kurahisisha Biashara na Kuondoa Mianya ya Upotevu Tanzania"
                : "Empowering Every Retail Business in Tanzania with Modern Technology"}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {lang === "sw"
                ? "MauzoChap imejengwa kutoka uzoefu wa moja kwa moja wa wafanyabiashara wa Kitanzania. Lengo letu ni kuhakikisha kila mwenye duka anaweza kujua faida yake ya kweli kila siku."
                : "MauzoChap was engineered from firsthand experience with the operational reality of Tanzanian commerce. We believe every merchant deserves real-time clarity, theft prevention, and seamless daily management."}
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {lang === "sw" ? "Imetengenezwa Tanzania" : "Built in Tanzania"}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === "sw"
                    ? "Inakidhi kikamilifu mazingira ya biashara za Dar es Salaam, Arusha, Mwanza, Dodoma na mikoa yote."
                    : "Tailored to local payment methods, currencies (TZS), and mobile network realities across Tanzania."}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {lang === "sw" ? "Usalama wa Data 100%" : "100% Data Security"}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === "sw"
                    ? "Hesabu za biashara yako zimehifadhiwa kwa usalama wa hali ya juu na faragha isiyoingiliwa."
                    : "Enterprise-grade encryption and tenant isolation to safeguard your store data and cash flow."}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {lang === "sw" ? "Msaada wa Moja kwa Moja" : "Dedicated Support"}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === "sw"
                    ? "Timu yetu iko tayari kukusaidia kupitia simu au WhatsApp muda wowote unahitaji mwongozo."
                    : "Instant local customer assistance via WhatsApp concierge and direct telephone support."}
                </p>
              </div>
            </div>

            <div className="p-8 sm:p-12 rounded-3xl bg-[#01184c] text-white text-center space-y-6">
              <h2 className="text-2xl sm:text-3xl font-black">
                {lang === "sw" ? "Ungependa Kuijaribu MauzoChap?" : "Experience MauzoChap Today"}
              </h2>
              <p className="text-slate-300 text-sm max-w-xl mx-auto">
                {lang === "sw"
                  ? "Jiunge na wafanyabiashara zaidi ya mamia nchini kote wanaoendesha maduka yao bila hofu."
                  : "Join hundreds of forward-thinking merchants running smarter, leak-free retail operations."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#01184c] font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  {lang === "sw" ? "Anza Jaribio la Bure" : "Start Free Trial"}
                </button>
                <Link
                  to="/contact"
                  className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  {lang === "sw" ? "Wasiliana Nasi" : "Contact Us"}
                </Link>
              </div>
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
