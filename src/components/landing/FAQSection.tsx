import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface FAQSectionProps {
  t: LandingTranslation;
}

export function FAQSection({ t }: FAQSectionProps) {
  const f = (t as any).faq || { eyebrow: "", headline: "", items: [] };
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      id="faq"
      className="py-20 sm:py-24 bg-slate-50/70 border-b border-slate-200/80 scroll-mt-12"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-100 bg-white text-indigo-700 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <span>{f.eyebrow}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            {f.headline}
          </h2>
        </div>

        {/* Accordion List */}
        <div className="rounded-2xl border border-slate-200/90 bg-white divide-y divide-slate-100 shadow-sm overflow-hidden">
          {f.items.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div key={idx} className="transition-colors">
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-slate-950 hover:bg-slate-50/80 transition-colors cursor-pointer text-sm sm:text-base focus:outline-none focus-visible:bg-slate-50"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-indigo-600 font-mono text-xs font-bold shrink-0">
                      0{idx + 1}
                    </span>
                    <span>{item.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-indigo-600" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-sm text-slate-600 leading-relaxed font-normal border-t border-slate-50 pt-2 animate-in fade-in-50 duration-150">
                    <p className="pl-6 border-l-2 border-indigo-200">{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
