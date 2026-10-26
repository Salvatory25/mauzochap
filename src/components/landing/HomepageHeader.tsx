import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Lang } from "@/lib/i18n";
import { LandingTranslation } from "./landing-i18n";

interface HomepageHeaderProps {
  t: LandingTranslation;
  lang: Lang;
  onToggleLang: () => void;
  onOpenRegisterModal: () => void;
}

export function HomepageHeader({
  t,
  lang,
  onToggleLang,
  onOpenRegisterModal,
}: HomepageHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-purple-100 py-3"
          : "bg-white/90 backdrop-blur-sm border-b border-purple-50 py-4"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand: MauzoChap with official logo icon */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 rounded-lg"
        >
          <img
            src="/images/logo-black.png"
            alt="MauzoChap"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
            width={40}
            height={40}
          />
          <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
            MauzoChap
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600"
          aria-label="Main Navigation"
        >
          <a
            href="#features"
            className="hover:text-violet-600 transition-colors focus:outline-none focus-visible:text-violet-600"
          >
            {t.nav.features}
          </a>
          <a
            href="#for-business"
            className="hover:text-violet-600 transition-colors focus:outline-none focus-visible:text-violet-600"
          >
            {t.nav.forBusiness}
          </a>
          <a
            href="#pricing"
            className="hover:text-violet-600 transition-colors focus:outline-none focus-visible:text-violet-600"
          >
            {t.nav.pricing}
          </a>
          <a
            href="#daily-sms"
            className="hover:text-violet-600 transition-colors focus:outline-none focus-visible:text-violet-600 text-violet-700 font-extrabold"
          >
            <span>{t.nav.dailySms}</span>
          </a>
        </nav>

        {/* Right Action Cluster */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Interactive EN / SW Language Toggle Pill: [ EN | SW ] */}
          <div className="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50/80 p-0.5 text-xs font-mono font-bold">
            <button
              onClick={() => lang !== "en" && onToggleLang()}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${lang === "en"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              EN
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => lang !== "sw" && onToggleLang()}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${lang === "sw"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              SW
            </button>
          </div>

          {/* Sign in Button */}
          <Link
            to="/auth"
            className="text-xs font-bold text-slate-700 hover:text-violet-600 px-3 py-2 transition-colors"
          >
            {t.nav.signIn}
          </Link>

          {/* Get Started Primary Violet Button */}
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-bold shadow-md shadow-violet-600/25 transition-all cursor-pointer hover:shadow-violet-600/35 active:scale-95"
          >
            <span>{t.nav.getStarted}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {/* Mobile EN/SW pill */}
          <div className="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50 p-0.5 text-[11px] font-mono font-bold">
            <button
              onClick={() => lang !== "en" && onToggleLang()}
              className={`px-1.5 py-0.5 rounded ${lang === "en" ? "bg-violet-600 text-white" : "text-slate-600"}`}
            >
              EN
            </button>
            <button
              onClick={() => lang !== "sw" && onToggleLang()}
              className={`px-1.5 py-0.5 rounded ${lang === "sw" ? "bg-violet-600 text-white" : "text-slate-600"}`}
            >
              SW
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-purple-50 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-purple-100 px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700 pt-1">
            <a
              href="#features"
              onClick={closeMenu}
              className="py-2 px-3 rounded-lg hover:bg-purple-50 hover:text-violet-600"
            >
              {t.nav.features}
            </a>
            <a
              href="#for-business"
              onClick={closeMenu}
              className="py-2 px-3 rounded-lg hover:bg-purple-50 hover:text-violet-600"
            >
              {t.nav.forBusiness}
            </a>
            <a
              href="#pricing"
              onClick={closeMenu}
              className="py-2 px-3 rounded-lg hover:bg-purple-50 hover:text-violet-600"
            >
              {t.nav.pricing}
            </a>
            <a
              href="#daily-sms"
              onClick={closeMenu}
              className="py-2 px-3 rounded-lg hover:bg-purple-50 hover:text-violet-600 text-violet-700 font-bold"
            >
              {t.nav.dailySms}
            </a>
          </nav>

          <div className="pt-3 border-t border-purple-100 flex flex-col gap-2.5">
            <Link
              to="/auth"
              onClick={closeMenu}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-center text-slate-800 text-xs font-bold"
            >
              {t.nav.signIn}
            </Link>

            <Link
              to="/auth"
              onClick={closeMenu}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-center text-xs font-bold shadow-md shadow-violet-600/20"
            >
              {t.nav.getStarted}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
