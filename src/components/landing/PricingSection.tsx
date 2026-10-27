import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface PricingSectionProps {
  t: LandingTranslation;
  onOpenRegisterModal?: () => void;
}

export function PricingSection({ t, onOpenRegisterModal }: PricingSectionProps) {
  const p = t.pricing;
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("kilimanjaro");

  return (
    <section
      id="pricing"
      className="py-10 sm:py-20 lg:py-24 bg-white border-b border-purple-100 scroll-mt-12 bg-grid-pattern relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-purple-200 bg-purple-50 text-violet-700 text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase">
            <span>{p.eyebrow}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            {p.headline}
          </h2>

          <p className="text-sm sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            {p.subtext}
          </p>

          {/* Monthly / Annually (Save 20%) Switcher */}
          <div className="pt-2 sm:pt-4 flex items-center justify-center">
            <div className="inline-flex items-center rounded-2xl border border-purple-200 p-1 bg-purple-50/70 text-xs font-mono font-bold shadow-2xs">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-black text-white font-black shadow-xs"
                    : "text-slate-600 hover:text-black"
                }`}
              >
                {p.monthly}
              </button>

              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-black text-white font-black shadow-xs"
                    : "text-slate-600 hover:text-black"
                }`}
              >
                <span>{p.annually}</span>
                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                  -10%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Plan Selector Tabs */}
        <div className="flex lg:hidden items-center justify-center p-1 rounded-2xl bg-purple-100/70 border border-purple-200/80 mb-6 max-w-sm mx-auto">
          {p.plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-mono font-bold transition-all text-center relative ${
                  isSelected
                    ? "bg-black text-white shadow-sm font-black"
                    : "text-slate-600 hover:text-black"
                }`}
              >
                <span>{plan.name}</span>
                {plan.featured && (
                  <span className="block text-[8px] font-mono text-amber-300 font-extrabold uppercase leading-none mt-0.5">Popular</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pricing Cards: 1 active card on mobile, 3-card grid on desktop */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3 items-stretch max-w-6xl mx-auto pt-1 sm:pt-2">
          {p.plans.map((plan) => {
            const isFeatured = plan.featured;
            const price = billingCycle === "yearly" ? plan.annualPrice : plan.monthlyPrice;
            const isVisibleOnMobile = selectedPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl sm:rounded-[32px] flex flex-col justify-between transition-all duration-200 p-6 sm:p-9 relative ${
                  !isVisibleOnMobile ? "hidden lg:flex" : "flex"
                } ${
                  isFeatured
                    ? "bg-violet-600 text-white shadow-2xl shadow-violet-600/30 lg:-translate-y-3 border-2 border-violet-500"
                    : "bg-white border border-purple-100 shadow-md shadow-purple-950/5 hover:border-violet-300 text-slate-900"
                }`}
              >
                {/* Popular Pill */}
                {isFeatured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-3.5 py-1 rounded-full text-[10px] font-mono uppercase font-black tracking-widest shadow-md">
                    <span>{plan.badge || "MOST POPULAR"}</span>
                  </div>
                )}

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-2xl font-black tracking-tight ${isFeatured ? "text-white" : "text-slate-950"}`}
                    >
                      {plan.name}
                    </h3>
                    {!isFeatured && plan.badge && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-700 bg-purple-50 px-2 py-0.5 rounded">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-xs mt-1.5 min-h-[32px] ${isFeatured ? "text-violet-100" : "text-slate-500"}`}
                  >
                    {plan.tagline}
                  </p>

                  {/* Price display */}
                  <div
                    className={`mt-5 pt-4 border-t font-mono ${isFeatured ? "border-violet-500/60" : "border-slate-100"}`}
                  >
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black">
                        TSh {price.toLocaleString()}
                      </span>
                      <span
                        className={`text-xs font-sans ${isFeatured ? "text-violet-200" : "text-slate-500"}`}
                      >
                        {p.perMonth}
                      </span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div
                        className={`text-[11px] font-mono font-semibold mt-0.5 ${isFeatured ? "text-emerald-300" : "text-emerald-700"}`}
                      >
                        {p.billedAnnually} ({p.saveBadge})
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <ul
                    className={`mt-6 space-y-3.5 text-xs font-sans ${isFeatured ? "text-violet-50" : "text-slate-700"}`}
                  >
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isFeatured ? "text-amber-300" : "text-emerald-600"
                          }`}
                        />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plan Action CTA */}
                <div className="pt-8">
                  <Link
                    to="/auth"
                    className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isFeatured
                        ? "bg-white text-black hover:bg-slate-100 shadow-xl shadow-black/10 active:scale-95"
                        : "bg-black hover:bg-neutral-900 text-white active:scale-95"
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div
                    className={`mt-2.5 text-center text-[10px] font-mono ${isFeatured ? "text-violet-200" : "text-slate-400"}`}
                  >
                    Bei nafuu kila mwezi • Hakuna makato ya siri
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Local Tanzanian Payment Badges */}
        <div className="mt-14 p-5 rounded-2xl bg-purple-50/50 border border-purple-100 max-w-3xl mx-auto text-center space-y-2">
          <div className="text-xs font-mono font-bold uppercase text-slate-950">
            Local Tanzanian Payment Integrations
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono font-semibold text-slate-600">
            <span className="px-3 py-1 rounded-xl bg-white border border-purple-100 text-slate-950 shadow-2xs">
              Vodacom M-Pesa
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-purple-100 text-slate-950 shadow-2xs">
              Tigo Pesa
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-purple-100 text-slate-950 shadow-2xs">
              Airtel Money
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-purple-100 text-slate-950 shadow-2xs">
              HaloPesa
            </span>
            <span className="px-3 py-1 rounded-xl bg-white border border-purple-100 text-slate-950 shadow-2xs">
              Visa / Mastercard
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
