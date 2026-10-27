import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { landingTranslations } from "@/components/landing/landing-i18n";
import { HomepageHeader } from "@/components/landing/HomepageHeader";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { DailySmsSection } from "@/components/landing/DailySmsSection";
import { BusinessTypesSection } from "@/components/landing/BusinessTypesSection";
import { HomepageFooter } from "@/components/landing/HomepageFooter";
import { RegisterModal } from "@/components/landing/RegisterModal";
import {
  buildSeoHead,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/features")({
  head: () =>
    buildSeoHead({
      title: "Vipengele vya Mfumo wa Mauzo na Stoo (POS Features) — MauzoChap Tanzania",
      description:
        "Tazama vipengele vyote vya MauzoChap POS: Mauzo ya mtandaoni na bila intaneti (offline), ripoti ya SMS ya saa 2:30 usiku, daftari la madeni ya wateja, mashine za risiti, na barcode scanner.",
      path: "/features",
      keywords: [
        "vipengele vya POS",
        "POS system features Tanzania",
        "mfumo wa kurekodi mauzo",
        "mfumo wa kufuatilia stoo",
        "ripoti ya biashara kwa SMS",
        "mashine ya risiti za mauzo",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Vipengele vya Mfumo", path: "/features" },
        ]),
        getSoftwareApplicationSchema(),
      ],
    }),
  component: FeaturesPage,
});

function FeaturesPage() {
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
        <FeaturesSection t={t} onOpenRegisterModal={() => setRegisterModalOpen(true)} />
        <DailySmsSection t={t} />
        <BusinessTypesSection t={t} />
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
