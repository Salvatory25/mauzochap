import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  TrendingUp,
  Receipt,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Clock,
  Sparkles,
  BarChart3,
  CreditCard,
  BellRing,
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

export const Route = createFileRoute("/mauzo")({
  head: () =>
    buildSeoHead({
      title: "Mauzo — Mfumo Bora wa Mauzo Tanzania | MauzoChap POS",
      description:
        "Mauzo ya duka lako kwa urahisi zaidi: Rekodi mauzo kwa sekunde 2, toa risiti za WhatsApp na thermal printer, fuatilia madeni na upate ripoti ya mauzo kila siku saa 2:30 usiku kwa SMS.",
      path: "/mauzo",
      keywords: [
        "mauzo",
        "mauzochap",
        "mauzo chap",
        "mfumo wa mauzo",
        "programu ya mauzo",
        "app ya mauzo",
        "rekodi ya mauzo",
        "ripoti ya mauzo",
        "mauzo ya duka",
        "mauzo ya kila siku",
        "mfumo wa kurekodi mauzo",
        "kutoa risiti za mauzo",
        "mauzo ya mkopo",
        "POS system Tanzania",
      ],
      schema: [
        getSoftwareApplicationSchema(),
        getBreadcrumbSchema([
          { name: "Mwanzo", path: "/" },
          { name: "Mauzo", path: "/mauzo" },
        ]),
        getFaqSchema([
          {
            question: "MauzoChap inasaidiaje kurekodi mauzo ya duka?",
            answer:
              "MauzoChap inakuwezesha kuuza kwa haraka kaunta chini ya sekunde 2 kwa kutumia simu, kompyuta au scanner ya barcode. Kila mauzo yanapofanyika stoo inapungua kiotomatiki na risiti inatolewa papo hapo.",
          },
          {
            question: "Je, nawezaje kupata taarifa za mauzo nikiwa mbali na duka?",
            answer:
              "MauzoChap inakutumia ujumbe mfupi wa SMS kila siku ifikapo saa 2:30 usiku ukiwa na jumla ya mauzo, faida halisi, madeni yaliyokusanywa na tahadhari za stoo bila kuhitaji bando la internet.",
          },
          {
            question: "Je, mfumo unarekodi mauzo ya mkopo (madeni)?",
            answer:
              "Ndiyo, unaweza kurekodi mauzo ya mkopo kwa kumtaja mteja na tarehe ya kulipa. Mteja anapolipa, mfumo unakata deni kiotomatiki na unaweza kumtumia mteja risiti kwa WhatsApp.",
          },
        ]),
      ],
    }),
  component: MauzoLandingPage,
});

function MauzoLandingPage() {
  const [lang, setLang] = useLang();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const t = landingTranslations[lang] || landingTranslations.en;
  const toggleLang = () => setLang(lang === "en" ? "sw" : "en");

  const pillars = [
    {
      icon: Clock,
      title: "Uuzaji wa Sekunde 2 Kaunta",
      desc: "Uza haraka bila wateja kupanga foleni. Tafuta bidhaa kwa jina au soma barcode kwa kamera ya simu.",
    },
    {
      icon: Receipt,
      title: "Risiti za WhatsApp & Thermal",
      desc: "Toa risiti zilizochapishwa kwa printa za Bluetooth/USB au tuma risiti za PDF moja kwa moja WhatsApp ya mteja bure.",
    },
    {
      icon: BellRing,
      title: "Ripoti ya Mauzo kwa SMS kila Siku",
      desc: "Kila siku saa 2:30 usiku, unapokea muhtasari kamili wa mauzo, faida, na miamala yote kwenye simu yako ya kawaida.",
    },
    {
      icon: CreditCard,
      title: "Mauzo ya Mkopo & Madeni ya Wateja",
      desc: "Usisahau tena deni la mteja. Rekodi mauzo ya mkopo na fuatilia madeni yote bila kutumia daftari la karatasi.",
    },
    {
      icon: BarChart3,
      title: "Hesabu ya Faida Halisi ya Mauzo",
      desc: "Jua mara moja faida halisi unayotengeneza kila siku, wiki, na mwezi baada ya kutoa gharama za ununuzi.",
    },
    {
      icon: ShieldCheck,
      title: "Udhibiti wa Wafanyakazi Kaunta",
      desc: "Kila muuzaji anakuwa na akaunti yake. Jua nani ameuza nini na uzuie mianya ya upotevu au wizi wa fedha za mauzo.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white font-sans antialiased selection:bg-emerald-600 selection:text-white">
      <HomepageHeader
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      <main className="w-full">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 bg-gradient-to-b from-emerald-50/50 via-white to-white border-b border-emerald-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>MFUMO BORA WA MAUZO TANZANIA</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.1]">
              Mauzo ya Duka Lako kwa{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Urahisi, Kasi na Usalama
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
              Je, unatafuta mfumo wa kuaminika wa kusimamia mauzo ya duka lako? MauzoChap inakupa uwezo wa kurekodi kila senti ya mauzo, kutoa risiti za kidijitali, na kupata ripoti za mauzo kila usiku popote ulipo Tanzania.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <span>Anza Bure Siku 14</span>
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
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-mono font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Bila Malipo ya Awali
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Inafanya Kazi kwa Simu na Kompyuta
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Msaada wa Moja kwa Moja Dar es Salaam
              </span>
            </div>
          </div>
        </section>

        {/* Pillars of Mauzo */}
        <section className="py-20 bg-slate-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-700 uppercase">
                UWEZO WA MFUMO WA MAUZO
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950">
                Kila Kitu Unachohitaji Kusimamia Mauzo ya Biashara Yako
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Ondoa daftari la karatasi, ziba mianya ya wizi wa chenji, na jua thamani kamili ya mauzo ya kila siku.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison: Daftari la Karatasi vs Mfumo wa Mauzo wa MauzoChap */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 space-y-2">
              <span className="text-xs font-mono font-bold text-violet-700 uppercase">
                TOFAUTI HALISI YA BIASHARA
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950">
                Kwanini Ubadilike Kutoka Daftari Kwenda MauzoChap?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-2xl bg-red-50/50 border border-red-200 space-y-4">
                <h3 className="text-lg font-black text-red-900">Daftari la Karatasi la Mauzo</h3>
                <ul className="space-y-3 text-xs sm:text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    Muda mwingi unatumika kujumlisha mauzo jioni
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    Rahisi kuraruka, kulowa maji au kupotea
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    Mianya ya muuzaji kufuta au kutorekodi mauzo
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    Huwezi kujua mauzo yaliyofanyika ukiwa mbali na duka
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                <h3 className="text-lg font-black text-emerald-950">MauzoChap POS (Kidigitali)</h3>
                <ul className="space-y-3 text-xs sm:text-sm text-emerald-900">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Kila muamala unarekodiwa chini ya sekunde 2
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Data zote zimehifadhiwa salama kwenye wingu (cloud)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Kila mauzo yana stakabadhi na hayafutiki kirahisi
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    SMS ya muhtasari inakufikia kila usiku popote ulipo
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Nightly SMS Highlight */}
        <section className="py-20 bg-slate-950 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-emerald-400 text-xs font-mono font-bold">
              <span>RIPOTI YA KILA SIKU</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black">
              Taarifa Kamili ya Mauzo Kila Siku Saa 2:30 Usiku
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Hata kama hauna intaneti au uko safarini, MauzoChap inatuma taarifa ya mauzo ya siku nzima, faida uliyopata, na miamala yote moja kwa moja kwenye namba yako ya simu.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl cursor-pointer"
              >
                Jaribu Mauzo Bure Leo
              </button>
              <Link
                to="/pricing"
                className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm tracking-wider transition-all"
              >
                Tazama Vifurushi vya Bei
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
