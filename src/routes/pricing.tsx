import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { landingTranslations } from "@/components/landing/landing-i18n";
import { HomepageHeader } from "@/components/landing/HomepageHeader";
import { PricingSection } from "@/components/landing/PricingSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { HomepageFooter } from "@/components/landing/HomepageFooter";
import { RegisterModal } from "@/components/landing/RegisterModal";
import {
  buildSeoHead,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
  getFaqSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/pricing")({
  head: () =>
    buildSeoHead({
      title: "Bei ya Mfumo wa Mauzo (POS) Tanzania | Gharama za MauzoChap",
      description:
        "Bei nafuu na wazi za mfumo wa mauzo na stoo (POS) Tanzania. Kuanzia TZS 10,500/mwezi (Starter), TZS 15,500 (Kilimanjaro), hadi TZS 25,500 (Serengeti). Pata siku 14 za majaribio bure.",
      path: "/pricing",
      keywords: [
        "bei ya mfumo wa mauzo Tanzania",
        "gharama za POS Tanzania",
        "POS software price Tanzania",
        "mfumo wa mauzo wa bei nafuu",
        "programu ya biashara ya kulipia kwa mwezi",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Bei & Vifurushi", path: "/pricing" },
        ]),
        getSoftwareApplicationSchema(),
        getFaqSchema([
          {
            question: "Je, ninaweza kuanza kutumia MauzoChap bila kulipa kwanza?",
            answer:
              "Ndiyo, unapewa siku 14 za majaribio bure (free trial) uone jinsi mfumo unavyorahisisha mauzo na usimamizi wa stoo kabla ya kuchagua kifurushi cha kulipia.",
          },
          {
            question: "Malipo ya mwezi yanafanyika vipi?",
            answer:
              "Unaweza kulipia kupitia M-Pesa, Tigo Pesa, Airtel Money, HaloPesa, au akaunti ya Benki moja kwa moja ndani ya mfumo.",
          },
          {
            question: "Je, kuna gharama za ziada za kuweka mfumo (setup fees)?",
            answer:
              "Hakuna gharama zozote za siri za ufungaji. Unalipia ada ya kifurushi ulichochagua pekee.",
          },
        ]),
      ],
    }),
  component: PricingPage,
});

function PricingPage() {
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

      <main className="w-full pt-6">
        <PricingSection t={t} onOpenRegisterModal={() => setRegisterModalOpen(true)} />
        <ComparisonSection t={t} onOpenRegisterModal={() => setRegisterModalOpen(true)} />
        <FAQSection t={t} />
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
