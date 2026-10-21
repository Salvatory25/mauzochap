import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Lock,
  Clock,
} from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface HeroSectionProps {
  t: LandingTranslation;
  onOpenRegisterModal?: () => void;
}

export function HeroSection({ t }: HeroSectionProps) {
  const h = t.hero;

  const isSwahili =
    t.capabilities.eyebrow.toLowerCase().includes("uwezo") ||
    h.headlinePrefix.toLowerCase().includes("biashara");

  // Rotating punchy copywriting phrases without emojis
  const phrases = useMemo(
    () =>
      isSwahili
        ? [
            "kwa urahisi na usalama.",
            "popote ulipo Tanzania.",
            "bila makosa ya mahesabu.",
            "kwa amani kamili ya akili.",
          ]
        : [
            "with effortless speed.",
            "from anywhere in Tanzania.",
            "with zero calculation errors.",
            "with 100% peace of mind.",
          ],
    [isSwahili],
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    const typingSpeed = isDeleting ? 30 : 60;
    const pauseTime = isDeleting ? 40 : 2400;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentPhrase.length) {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(currentPhrase.slice(0, displayText.length - 1));
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex, phrases]);

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-18 sm:pb-24 lg:pt-20 lg:pb-28 bg-white bg-grid-pattern border-b border-purple-100">
      {/* Left, Right & Vertical White Gradient Masks to softly fade grid pattern into clean white borders */}
      <div
        className="absolute inset-y-0 left-0 w-24 sm:w-48 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 right-0 w-24 sm:w-48 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Subtle Violet Center Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[320px] bg-gradient-to-tr from-violet-600/10 via-purple-500/10 to-indigo-600/10 blur-3xl rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative text-center space-y-8">
        {/* Top Eyebrow Pill: Built for Tanzania • 55+ Active Stores (No Emojis) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-200 bg-white/95 text-violet-800 text-xs font-mono font-bold tracking-wider shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>BUILT FOR TANZANIA • 55+ ACTIVE SHOPS</span>
        </div>

        {/* Main Headline with Typewriter Typing Effect */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.08] max-w-4xl mx-auto">
          <span>{h.headlinePrefix} </span>
          <br className="hidden sm:inline" />
          <span className="text-violet-600 font-serif italic relative inline-block">
            {displayText}
            <span className="inline-block w-[3px] h-[0.9em] bg-violet-600 animate-pulse ml-1 align-baseline translate-y-1" />
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
          {h.subheadline}
        </p>

        {/* CTA Buttons: Get Started navigates directly to /auth (Meeting the real login/register page) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-violet-600/25 hover:shadow-violet-600/35 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{h.primaryCta}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl border border-purple-200 hover:border-slate-800 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>{h.secondaryCta}</span>
          </Link>
        </div>

        {/* Trust Badges: Clean professional typography, zero emojis */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isSwahili ? "Siku 5 za Majaribio Bure" : "Free 5-Day Trial"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>{isSwahili ? "Hakuna Kadi ya Benki" : "No Credit Card Needed"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>{isSwahili ? "Inafanya Kazi Kwenye Simu au PC" : "Works on Phone & PC"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-violet-600" />
            <span>{isSwahili ? "Ripoti ya SMS Kila Jioni Saa 20:30" : "Nightly 20:30 PM SMS"}</span>
          </span>
        </div>

        {/* 4 Feature Stat Cards (55+ Stores, < 2s Checkout, 0 TZS WhatsApp Receipts, 100% Anti-Theft) */}
        <div className="pt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs">
            <div className="text-2xl font-black text-slate-950 font-mono tracking-tight">
              55+
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              {isSwahili ? "Maduka kote Tanzania" : "Active stores across Tanzania"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs">
            <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
              &lt; 2s
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              {isSwahili ? "Muda wa kutoa risiti" : "Sub-second sales checkout"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs">
            <div className="text-2xl font-black text-violet-600 font-mono tracking-tight">
              0 TZS
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              {isSwahili ? "Gharama ya risiti za WhatsApp" : "Paper cost with WhatsApp"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs">
            <div className="text-2xl font-black text-slate-950 font-mono tracking-tight">
              100%
            </div>
            <div className="text-xs text-slate-600 font-medium mt-1">
              {isSwahili ? "Ulinzi dhidi ya wizi" : "Anti-theft blind shift audit"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
