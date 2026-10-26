import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server, UserCheck, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MauzoChap POS" },
      {
        name: "description",
        content: "MauzoChap POS Privacy Policy, customer data protection, encryption, and store privacy guarantees in Tanzania.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const lastUpdated = "October 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/images/logo-black.png" alt="MauzoChap" className="w-8 h-8 object-contain" />
            <span className="font-black text-xl text-slate-950 tracking-tight">MauzoChap</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rudi Nyumbani / Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-slate-950 text-white py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-mono font-bold tracking-wider uppercase border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sera ya Faragha na Ulinzi wa Taarifa • Privacy Guarantee</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Privacy Policy & Data Security
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Your store data, prices, inventory numbers, and customer contacts belong strictly to you. Last updated: {lastUpdated}.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Core Guarantee Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-950 space-y-2">
          <div className="flex items-center gap-2 font-black text-sm sm:text-base text-emerald-900">
            <EyeOff className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>UHAKIKA WA FARAGHA: Hatuuzi wala Kushare Taarifa Zako na Mshindani Yeyote</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed">
            MauzoChap inalinda taarifa za biashara yako kwa viwango vya juu vya usalama wa kimataifa (SSL/TLS Encryption & Row-Level Security). Bei zako za ununuzi, faida yako, majina na madeni ya wateja wako, na bidhaa zako zinazouzika zaidi ni siri yako binafsi na hazitawahi kuuzwa au kutolewa kwa mtu wa tatu.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-violet-600 shrink-0" />
            <span>1. Taarifa Tunazokusanya / Information We Collect</span>
          </h2>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
            <p>
              • <strong>Taarifa za Akaunti:</strong> Jina la mfanyabiashara, namba ya simu ya WhatsApp, barua pepe (email), eneo la duka (mkoa na wilaya), na jina la biashara.
            </p>
            <p>
              • <strong>Taarifa za Uendeshaji wa Duka:</strong> Orodha ya bidhaa, bei za kununulia na kuuzia, hesabu ya stoo, risiti za mauzo, kumbukumbu za matumizi (expenses), na kumbukumbu za madeni ya wateja.
            </p>
            <p>
              • <strong>Taarifa za Malipo ya Kifurushi:</strong> Kumbukumbu ya muamala (payment reference), kiasi kilicholipwa na njia ya malipo kwa madhumuni ya uthibitishaji. Hatuhifadhi PIN za simu au kadi za benki.
            </p>
          </div>
        </section>

        {/* Section 2: How Data is Used */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-violet-600 shrink-0" />
            <span>2. Matumizi ya Taarifa Zako / How We Use Your Information</span>
          </h2>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
            <p>• Kuwezesha uuzaji kaunta (POS checkout) na kutoa risiti za kidijitali za WhatsApp papo hapo.</p>
            <p>• Kutuma ripoti ya usiku ya SMS saa 20:30 PM kwenye simu ya mmiliki wa biashara.</p>
            <p>• Kutoa takwimu na ripoti za faida, mauzo, na tahadhari ya bidhaa zilizokaribia kuisha stoo.</p>
            <p>• Kuthibitisha vifurushi vya usajili na kutoa msaada wa kiufundi (WhatsApp support concierge).</p>
          </div>
        </section>

        {/* Section 3: Data Security & Row Level Isolation */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <Lock className="w-5 h-5 text-violet-600 shrink-0" />
            <span>3. Ulinzi na Kutenganishwa kwa Data (Row-Level Security)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Data ya kila duka inalindwa kwa mfumo wa <em>PostgreSQL Row-Level Security (RLS)</em>. Hii inahakikisha duka moja haliwezi kuona wala kufikia taarifa za duka jingine hata kama watumiaji wanatumia mfumo kwa wakati mmoja. Nenosiri zote zinahifadhiwa zikiwa zimesimbwa kwa cryptographic hash (Bcrypt).
          </p>
        </section>

        {/* Section 4: Data Retention & Deletion */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>4. Hifadhi na Kufuta Taarifa (Retention & Deletion)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Taarifa zako zinabaki kwenye mfumo muda wote unapoendelea kutumia MauzoChap. Iwapo utaamua kusitisha matumizi ya mfumo, una haki ya kupakua nakala ya mauzo yako (CSV/Excel) na kuomba kufutwa kabisa kwa taarifa zako kwenye seva zetu kwa kuandika barua pepe kwenda <strong className="text-slate-900">privacy@mauzochap.com</strong>.
          </p>
        </section>

        {/* Contact info */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>Swali au shaka kuhusu faragha yako? Wasiliana nasi: privacy@mauzochap.com au WhatsApp: <a href="https://wa.me/255627274168" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">+255 627 274 168</a></div>
          <Link
            to="/terms"
            className="text-violet-600 hover:text-violet-800 font-bold underline"
          >
            Soma Masharti ya Huduma (Terms of Service) →
          </Link>
        </div>
      </main>
    </div>
  );
}
