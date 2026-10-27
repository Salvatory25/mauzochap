import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { landingTranslations } from "@/components/landing/landing-i18n";
import { HomepageHeader } from "@/components/landing/HomepageHeader";
import { HomepageFooter } from "@/components/landing/HomepageFooter";
import { RegisterModal } from "@/components/landing/RegisterModal";
import { buildSeoHead, getBreadcrumbSchema, getOrganizationSchema } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    buildSeoHead({
      title: "Wasiliana Nasi (Contact Us) — MauzoChap POS Tanzania",
      description:
        "Wasiliana na timu ya MauzoChap POS kwa simu, WhatsApp (+255 627 274 168), au barua pepe. Tunatoa huduma ya haraka kwa wafanyabiashara Dar es Salaam na mikoa yote ya Tanzania.",
      path: "/contact",
      keywords: [
        "wasiliana na MauzoChap",
        "contact MauzoChap Tanzania",
        "namba ya MauzoChap",
        "MauzoChap WhatsApp customer care",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Mawasiliano", path: "/contact" },
        ]),
        getOrganizationSchema(),
      ],
    }),
  component: ContactPage,
});

function ContactPage() {
  const [lang, setLang] = useLang();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const t = landingTranslations[lang] || landingTranslations.en;
  const toggleLang = () => setLang(lang === "en" ? "sw" : "en");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("retail");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      toast.error(lang === "sw" ? "Tafadhali jaza jina na namba ya simu" : "Please provide your name and phone number");
      return;
    }
    // Direct WhatsApp enquiry or message toast
    const encoded = encodeURIComponent(
      `Habari MauzoChap! Naitwa ${fullName}, nina biashara ya (${businessType}). Namba yangu ni ${phone}. Ujumbe: ${message || "Nahitaji maelezo zaidi kuhusu kuanza kutumia mfumo wa MauzoChap."}`
    );
    window.open(`https://wa.me/255627274168?text=${encoded}`, "_blank");
    setSubmitted(true);
    toast.success(lang === "sw" ? "Ujumbe umepokelewa! Tunawasiliana nawe sasa." : "Message received! Redirecting to WhatsApp...");
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans antialiased selection:bg-violet-600 selection:text-white">
      <HomepageHeader
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      <main className="w-full">
        {/* Header */}
        <section className="pt-12 pb-16 bg-gradient-to-b from-purple-50/60 via-white to-white border-b border-purple-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-200 bg-white text-violet-700 text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <MessageCircle className="w-3.5 h-3.5 text-violet-600" />
              <span>{lang === "sw" ? "Mawasiliano na Msaada" : "Customer Support"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              {lang === "sw" ? "Tuko Hapa Kukusaidia Kukuza Biashara Yako" : "We're Here to Help Your Business Grow"}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              {lang === "sw"
                ? "Una swali kuhusu vifurushi, mafunzo ya wafanyakazi, au unahitaji msaada wa kuanza? Wasiliana nasi wakati wowote."
                : "Questions about subscription plans, staff onboarding, or hardware compatibility? Reach out directly."}
            </p>
          </div>
        </section>

        {/* Content Details & Form */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Direct channels */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-slate-950">
                    {lang === "sw" ? "Njia za Mawasiliano ya Haraka" : "Direct Contact Channels"}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {lang === "sw"
                      ? "Njia ya haraka zaidi kupata majibu ni kupitia WhatsApp Concierge yetu au kupiga simu moja kwa moja."
                      : "For immediate response, WhatsApp Concierge is our fastest dedicated channel for active merchants."}
                  </p>
                </div>

                <div className="space-y-4">
                  <a
                    href="https://wa.me/255627274168"
                    target="_blank"
                    rel="noreferrer"
                    className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-4 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                        WhatsApp Concierge
                      </span>
                      <span className="block text-base font-black text-emerald-950 mt-0.5 group-hover:underline">
                        +255 627 274 168
                      </span>
                      <span className="block text-xs text-emerald-700 mt-1">
                        {lang === "sw" ? "Muda wa kawaida wa majibu: Dakika 2 - 5" : "Average response: 2 - 5 minutes"}
                      </span>
                    </div>
                  </a>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        {lang === "sw" ? "Simu ya Ofisi" : "Direct Telephone"}
                      </span>
                      <a href="tel:+255627274168" className="block text-base font-black text-slate-900 mt-0.5 hover:underline">
                        +255 627 274 168
                      </a>
                      <span className="block text-xs text-slate-500 mt-1">
                        {lang === "sw" ? "Jumatatu - Jumamosi, Saa 2:00 Asubuhi - 2:00 Usiku" : "Mon - Sat, 08:00 AM - 08:00 PM EAT"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        {lang === "sw" ? "Barua Pepe Rasmi" : "Official Email"}
                      </span>
                      <a href="mailto:support@mauzochap.co.tz" className="block text-base font-black text-slate-900 mt-0.5 hover:underline">
                        support@mauzochap.co.tz
                      </a>
                      <span className="block text-xs text-slate-500 mt-1">
                        {lang === "sw" ? "Kwa maulizo rasmi na ankara" : "Official inquiries & billing"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-md">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        {lang === "sw" ? "Makao Makuu" : "Headquarters"}
                      </span>
                      <span className="block text-base font-black text-slate-900 mt-0.5">
                        Dar es Salaam, Tanzania
                      </span>
                      <span className="block text-xs text-slate-500 mt-1">
                        {lang === "sw" ? "Tunahudumia wafanyabiashara kote Tanzania" : "Serving merchants nationwide"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Inquiry Form */}
              <div className="lg:col-span-7">
                <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      {lang === "sw" ? "Tuma Ujumbe wa Moja kwa Moja" : "Send an Inquiry"}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      {lang === "sw"
                        ? "Jaza fomu hii fupi na timu yetu ya wataalamu itawasiliana nawe mara moja."
                        : "Complete this quick form and our implementation team will connect with you immediately."}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {lang === "sw" ? "Jina Lako Kamili *" : "Your Full Name *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={lang === "sw" ? "Mfano: John Mwita" : "e.g., John Mwita"}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {lang === "sw" ? "Namba ya Simu / WhatsApp *" : "Phone / WhatsApp Number *"}
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="07XX XXX XXX"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {lang === "sw" ? "Aina ya Biashara" : "Business Industry"}
                        </label>
                        <select
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                        >
                          <option value="Duka la Rejareja">Retail Shop / Duka</option>
                          <option value="Supermarket / Minimart">Supermarket / Minimart</option>
                          <option value="Pharmacy / Duka la Dawa">Pharmacy / Duka la Dawa</option>
                          <option value="Hardware / Vifaa vya Ujenzi">Hardware & Electricals</option>
                          <option value="Wholesale / Jumla">Wholesale / Distribution</option>
                          <option value="Mgahawa / Bar">Restaurant / Bar / Lounge</option>
                          <option value="Boutique / Nguo">Boutique & Fashion</option>
                          <option value="Duka la Simu / Vifaa">Phones & Electronics</option>
                          <option value="Nyingine">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {lang === "sw" ? "Ujumbe au Swali Lako" : "Message / Specific Inquiry"}
                      </label>
                      <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          lang === "sw"
                            ? "Eleza kwa ufupi kile unachohitaji, mfano: 'Nina maduka mawili Kariakoo, nahitaji kuunganisha stoo moja...'"
                            : "Describe your operational requirements, branch count, or equipment questions..."
                        }
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{lang === "sw" ? "Tuma Ujumbe Sasa" : "Submit Inquiry"}</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
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
