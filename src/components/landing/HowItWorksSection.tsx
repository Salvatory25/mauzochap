import { Link } from "@tanstack/react-router";
import { UserCheck, PackagePlus, LineChart, ArrowRight, CheckCircle2 } from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface HowItWorksSectionProps {
  t: LandingTranslation;
}

export function HowItWorksSection({ t }: HowItWorksSectionProps) {
  const hw = (t as any).howItWorks || { eyebrow: "", headline: "", subtext: "", steps: [] };

  const stepIcons = [UserCheck, PackagePlus, LineChart];

  return (
    <section
      id="how-it-works"
      className="py-20 sm:py-24 bg-slate-50/70 border-b border-slate-200/80 scroll-mt-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-100 bg-white text-indigo-700 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <span>{hw.eyebrow}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            {hw.headline}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            {hw.supporting}
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid gap-8 md:grid-cols-3 relative">
          {hw.steps.map((step, idx) => {
            const Icon = stepIcons[idx] || UserCheck;

            return (
              <div
                key={step.number}
                className="relative rounded-2xl border border-slate-200/90 bg-white p-7 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm hover:border-indigo-400 hover:shadow-lg transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-black text-indigo-600/30">
                      {step.number}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-950 tracking-tight">{step.title}</h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-mono font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready in minutes</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA bar */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <h4 className="text-lg font-black text-slate-950">
              Need assistance getting your inventory imported?
            </h4>
            <p className="text-sm text-slate-600 mt-1">
              Our team in Dar es Salaam can import your Excel price list and set up your staff
              accounts for free.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://wa.me/255627274168?text=Habari%20MauzoChap!%20Ninahitaji%20msaada%20wa%20kujiunga%20na%20kuweka%20bidhaa%20zangu."
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              WhatsApp Support
            </a>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
