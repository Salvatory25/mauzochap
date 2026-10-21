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
    <div className="min-h-screen w-full bg-white font-sans antialiased selection:bg-violet-600 selection:text-white">
      {/* A. Navigation Header */}
      <HomepageHeader
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      <main className="w-full">
        {/* B. Hero Section */}
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

      {/* Footer */}
      <HomepageFooter
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      {/* Interactive Registration Modal */}
      <RegisterModal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} t={t} />
    </div>
  );
}
