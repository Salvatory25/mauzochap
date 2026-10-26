import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
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

      {/* Floating App-Like Bottom Action Bar on Mobile */}
      <div className="sm:hidden fixed bottom-3 inset-x-3 z-30 rounded-2xl bg-[#01184c]/95 backdrop-blur-md border border-white/15 p-2.5 shadow-2xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2 pl-1 min-w-0">
          <img src="/images/logo-black.png" alt="MauzoChap" className="w-7 h-7 object-contain bg-white rounded-lg p-0.5 shrink-0 shadow-sm" />
          <div className="truncate text-left">
            <span className="block font-black text-xs leading-none">MauzoChap</span>
            <span className="block text-[10px] font-mono text-emerald-300 leading-none mt-0.5">{lang === "sw" ? "Jaribu Demo Bure" : "Try Free Demo"}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/demo"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] uppercase tracking-wider transition-colors"
          >
            Demo
          </Link>
          <Link
            to="/auth"
            className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] uppercase tracking-wider shadow-md shadow-violet-600/30 transition-colors"
          >
            {lang === "sw" ? "Anza Sasa" : "Get Started"}
          </Link>
        </div>
      </div>
    </div>
  );
}
