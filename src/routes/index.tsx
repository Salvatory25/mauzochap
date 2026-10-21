import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { useLang } from "@/lib/i18n";
import { landingTranslations } from "@/components/landing/landing-i18n";
import { HomepageHeader } from "@/components/landing/HomepageHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { DailySmsSection } from "@/components/landing/DailySmsSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { BusinessTypesSection } from "@/components/landing/BusinessTypesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { GettingStartedSection } from "@/components/landing/GettingStartedSection";
import { HomepageFooter } from "@/components/landing/HomepageFooter";
import { RegisterModal } from "@/components/landing/RegisterModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "MauzoChap — Modern POS & Business Management for Tanzania",
      },
      {
        name: "description",
        content:
          "Run your shop with confidence. MauzoChap is the modern POS platform for retail, pharmacies, restaurants, and wholesalers in Tanzania with nightly 20:30 PM SMS business reports.",
      },
      {
        property: "og:title",
        content: "MauzoChap — Modern POS & Business Management for Tanzania",
      },
      {
        property: "og:description",
        content:
          "Run your shop with confidence. MauzoChap is the modern POS platform for retail, pharmacies, restaurants, and wholesalers in Tanzania with nightly 20:30 PM SMS business reports.",
      },
      {
        property: "og:image",
        content: "/images/hero-dashboard.jpg",
      },
    ],
  }),
  component: LandingPage,
});

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [lang, setLang] = useLang();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // If already authenticated, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" />;
  }

  const t = landingTranslations[lang] || landingTranslations.en;
  const toggleLang = () => setLang(lang === "en" ? "sw" : "en");

  return (
    // Outer Frame: Soft ambient lavender (#f3f0ff)
    <div className="min-h-screen bg-[#f3f0ff] p-2.5 sm:p-4 lg:p-6 font-sans antialiased selection:bg-violet-600 selection:text-white">
      {/* Inner Clean White Canvas with large rounded corners (rounded-[32px]) */}
      <div className="max-w-[1440px] mx-auto rounded-[32px] bg-white shadow-2xl shadow-purple-950/10 border border-purple-100 overflow-hidden">
        {/* A. Navigation Header */}
        <HomepageHeader
          t={t}
          lang={lang}
          onToggleLang={toggleLang}
          onOpenRegisterModal={() => setRegisterModalOpen(true)}
        />

        <main>
          {/* B. Hero Section (Flowbite Style Split Hero) */}
          <HeroSection t={t} onOpenRegisterModal={() => setRegisterModalOpen(true)} />

          {/* C. Core Capabilities Grid (6 Features) */}
          <FeaturesSection t={t} onOpenRegisterModal={() => setRegisterModalOpen(true)} />

          {/* D. FEATURE SPOTLIGHT: Nightly 20:30 PM SMS Business Reports */}
          <DailySmsSection t={t} />

          {/* E. COMPARISON: Daftari la Karatasi vs MauzoChap POS */}
          <ComparisonSection t={t} onOpenRegisterModal={() => setRegisterModalOpen(true)} />

          {/* F. Supported Business Types (8 Grid) */}
          <BusinessTypesSection t={t} />

          {/* G. Pricing Section (Nexus Style Grid with Starter 10,500, Kilimanjaro 15,500, Serengeti 25,500) */}
          <PricingSection t={t} onOpenRegisterModal={() => setRegisterModalOpen(true)} />

          {/* H. Selling in Three Steps (Getting Started Process) */}
          <GettingStartedSection t={t} onOpenRegisterModal={() => setRegisterModalOpen(true)} />
        </main>

        {/* G. Dark Navy Footer (DukaPOS Style Layout for MauzoChap) */}
        <HomepageFooter
          t={t}
          lang={lang}
          onToggleLang={toggleLang}
          onOpenRegisterModal={() => setRegisterModalOpen(true)}
        />
      </div>

      {/* Interactive Registration Modal */}
      <RegisterModal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} t={t} />
    </div>
  );
}
