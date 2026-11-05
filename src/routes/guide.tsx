import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { landingTranslations } from "@/components/landing/landing-i18n";
import { HomepageHeader } from "@/components/landing/HomepageHeader";
import { HomepageFooter } from "@/components/landing/HomepageFooter";
import { RegisterModal } from "@/components/landing/RegisterModal";
import { UserGuideContent } from "@/components/UserGuideContent";
import { buildSeoHead, getBreadcrumbSchema, getOrganizationSchema } from "@/lib/seo";

export const Route = createFileRoute("/guide")({
  head: () =>
    buildSeoHead({
      title: "Mwongozo wa Mtumiaji (How to Use Guide) | MauzoChap POS Tanzania",
      description:
        "Jifunze jinsi ya kutumia mfumo wa MauzoChap POS hatua kwa hatua: kusajili duka, kuingiza bidhaa na barcode, kuuza kaunta, kutoa risiti za WhatsApp/Thermal, kufuatilia madeni, na kupokea SMS ya kila siku.",
      path: "/guide",
      keywords: [
        "jinsi ya kutumia MauzoChap",
        "MauzoChap user guide",
        "mwongozo wa mfumo wa mauzo",
        "how to use POS system Tanzania",
        "MauzoChap manual PDF",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Mwongozo wa Mtumiaji", path: "/guide" },
        ]),
        getOrganizationSchema(),
      ],
    }),
  component: PublicGuidePage,
});

function PublicGuidePage() {
  const [lang, setLang] = useLang();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const t = landingTranslations[lang] || landingTranslations.en;
  const toggleLang = () => setLang(lang === "en" ? "sw" : "en");

  return (
    <div className="min-h-screen w-full bg-slate-50/50 font-sans antialiased selection:bg-violet-600 selection:text-white print:bg-white">
      <div className="print:hidden">
        <HomepageHeader
          t={t}
          lang={lang}
          onToggleLang={toggleLang}
          onOpenRegisterModal={() => setRegisterModalOpen(true)}
        />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 print:py-4 print:px-0">
        <UserGuideContent variant="public" />
      </main>

      <div className="print:hidden">
        <HomepageFooter
          t={t}
          lang={lang}
          onToggleLang={toggleLang}
          onOpenRegisterModal={() => setRegisterModalOpen(true)}
        />
      </div>

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        t={t}
      />
    </div>
  );
}

