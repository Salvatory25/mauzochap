import { Star, MapPin, Building, Quote } from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface TestimonialsSectionProps {
  t: LandingTranslation;
}

export function TestimonialsSection({ t }: TestimonialsSectionProps) {
  const ts = (t as any).testimonials || { eyebrow: "", headline: "", subtext: "", stories: [] };

  return (
    <section
      id="stories"
      className="py-20 sm:py-24 bg-slate-50/70 border-b border-slate-200/80 scroll-mt-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-100 bg-white text-indigo-700 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <span>{ts.eyebrow}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            {ts.headline}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            {ts.supporting}
          </p>
        </div>

        {/* 6 Deduplicated Testimonial Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ts.stories.map((story, idx) => {
            const initials = story.name
              .split(" ")
              .map((n) => n[0])
              .join("");

            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 bg-white p-7 flex flex-col justify-between space-y-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className="space-y-4">
                  {/* Top rating & Metric badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="flex items-center gap-1 text-amber-500"
                      aria-label="5 out of 5 stars"
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      {story.stat}
                    </span>
                  </div>

                  {/* Quote Body */}
                  <div className="relative">
                    <p className="text-slate-700 text-sm leading-relaxed font-normal italic">
                      "{story.quote}"
                    </p>
                  </div>
                </div>

                {/* Author Info */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-slate-950 truncate">
                      {story.name}
                    </div>
                    <div className="text-xs text-slate-600 truncate flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{story.business}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span>{story.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
