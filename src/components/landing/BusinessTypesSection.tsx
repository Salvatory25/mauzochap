import {
  Store,
  ShoppingCart,
  Pill,
  Wrench,
  Building2,
  UtensilsCrossed,
  Shirt,
  Smartphone,
  LucideIcon,
  Sparkles,
} from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface BusinessTypesSectionProps {
  t: LandingTranslation;
}

export function BusinessTypesSection({ t }: BusinessTypesSectionProps) {
  const bt = t.businessTypes;

  const iconMap: Record<string, LucideIcon> = {
    shops: Store,
    supermarket: ShoppingCart,
    pharmacy: Pill,
    hardware: Wrench,
    wholesale: Building2,
    restaurants: UtensilsCrossed,
    fashion: Shirt,
    electronics: Smartphone,
  };

  return (
    <section
      id="for-business"
      className="py-20 sm:py-24 bg-purple-50/30 border-b border-purple-100 scroll-mt-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-200 bg-white text-violet-700 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>{bt.eyebrow}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            {bt.headline}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            {bt.subtext}
          </p>
        </div>

        {/* 8 Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {bt.types.map((type) => {
            const Icon = iconMap[type.id] || Store;

            return (
              <div
                key={type.id}
                className="rounded-2xl border border-purple-100 bg-white p-5 sm:p-6 space-y-3 shadow-xs hover:border-violet-400 hover:shadow-lg hover:shadow-purple-950/5 transition-all duration-200 flex flex-col justify-between group cursor-default"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-100/60 border border-purple-200/50 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-200">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight leading-snug">
                    {type.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {type.subtitle}
                  </p>
                </div>

                <div className="pt-2 text-[10px] font-mono font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Pre-configured</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
