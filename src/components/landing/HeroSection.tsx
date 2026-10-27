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
            "mauzo ya uhakika kila siku.",
            "kwa urahisi na usalama.",
            "kudhibiti kila senti ya mauzo.",
            "popote ulipo Tanzania.",
            "bila makosa ya mahesabu.",
            "kwa amani kamili ya akili.",
          ]
        : [
            "profitable daily sales.",
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
    <section className="relative overflow-hidden pt-8 pb-10 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-white bg-grid-pattern border-b border-purple-100">
      {/* Left, Right & Vertical White Gradient Masks */}
      <div
        className="absolute inset-y-0 left-0 w-16 sm:w-48 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 right-0 w-16 sm:w-48 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-white to-transparent pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-10 sm:h-12 bg-gradient-to-b from-white to-transparent pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Subtle Violet Center Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[580px] h-[220px] sm:h-[320px] bg-gradient-to-tr from-violet-600/10 via-purple-500/10 to-indigo-600/10 blur-3xl rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-[94%] sm:w-[90%] max-w-6xl mx-auto px-1 sm:px-4 relative text-center space-y-5 sm:space-y-8">
        {/* Top Eyebrow Pill */}
        <div className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-purple-200 bg-white/95 text-violet-800 text-[10px] sm:text-xs font-mono font-bold tracking-wider shadow-xs">
          <span>BUILT FOR TANZANIA • 110+ ACTIVE SHOPS</span>
        </div>

        {/* Main Headline with Typewriter Typing Effect */}
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.12] sm:leading-[1.08] max-w-4xl mx-auto">
          <span>{h.headlinePrefix} </span>
          <br className="hidden sm:inline" />
          <span className="text-violet-600 font-serif italic relative inline-block">
            {displayText}
            <span className="inline-block w-[2px] sm:w-[3px] h-[0.9em] bg-violet-600 animate-pulse ml-1 align-baseline translate-y-1" />
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto px-2 sm:px-0">
          {h.subheadline}
        </p>

        {/* CTA Buttons */}
        <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/25 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{h.primaryCta}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-purple-200 hover:border-black bg-white hover:bg-purple-50/50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
          >
            <span>{h.secondaryCta}</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-1 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1.5 text-[11px] sm:text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isSwahili ? "Jaribu Demo Bure" : "Try Free Demo"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isSwahili ? "Bila Kadi ya Benki" : "No Card Needed"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{isSwahili ? "Kwenye Simu au PC" : "Phone & PC"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span>{isSwahili ? "SMS Saa 20:30 Usiku" : "Nightly 20:30 SMS"}</span>
          </span>
        </div>

        {/* 4 Feature Stat Cards */}
        <div className="pt-3 sm:pt-6 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-5xl mx-auto text-left">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
              110+
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 sm:mt-1 leading-tight">
              {isSwahili ? "Maduka kote Tanzania" : "Active stores in Tanzania"}
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono tracking-tight">
              &lt; 2s
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 sm:mt-1 leading-tight">
              {isSwahili ? "Kutoa risiti kaunta" : "Sub-second sales checkout"}
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-violet-600 font-mono tracking-tight">
              0 TZS
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 sm:mt-1 leading-tight">
              {isSwahili ? "Risiti za WhatsApp" : "WhatsApp digital receipts"}
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-md border border-purple-100 shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
              100%
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5 sm:mt-1 leading-tight">
              {isSwahili ? "Ulinzi dhidi ya wizi" : "Anti-theft shift audit"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
