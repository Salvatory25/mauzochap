import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, MessageCircle, ShieldCheck } from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface FinalCTASectionProps {
  t: LandingTranslation;
}

export function FinalCTASection({ t }: FinalCTASectionProps) {
  const c = (t as any).cta || { headline: "", subheadline: "", primaryCta: "", whatsappCta: "" };

  return (
    <section className="py-20 sm:py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none -z-0"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-7 relative z-10">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-800 bg-slate-900/90 text-indigo-400 text-xs font-mono font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MauzoChap Tanzania</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
          {c.headline}
        </h2>

        {/* Supporting Text */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          {c.supporting}
        </p>

        {/* Dual CTAs */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <span>{c.primaryCta}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/demo"
            className="w-full sm:w-auto px-7 py-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{c.demoCta}</span>
          </Link>

          <a
            href="https://wa.me/255627274168?text=Habari%20MauzoChap!%20Ninataka%20kuanza%20kutumia%20mfumo%20wenu%20dukani%20kwangu."
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-6 py-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>{c.whatsappCta}</span>
          </a>
        </div>

        {/* Sub-note */}
        <div className="pt-2 text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
          <span>{c.noCardRequired}</span>
        </div>
      </div>
    </section>
  );
}
