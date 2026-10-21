import { Link } from "@tanstack/react-router";
import { Zap, Boxes, ShoppingCart, ArrowRight } from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface GettingStartedSectionProps {
  t: LandingTranslation;
  onOpenRegisterModal?: () => void;
}

export function GettingStartedSection({ t, onOpenRegisterModal }: GettingStartedSectionProps) {
  const isSwahili =
    t.capabilities.eyebrow.toLowerCase().includes("uwezo") ||
    t.hero.headlinePrefix.toLowerCase().includes("biashara");

  const steps = [
    {
      step: "01",
      icon: Zap,
      title: isSwahili ? "Fungua akaunti yako bure" : "Create your free account",
      desc: isSwahili
        ? "Jisajili kwa jina la duka lako na namba ya simu. Hakuna mkataba wala kadi ya benki inayohitajika."
        : "Register with your shop's name and phone number. There is no contract to sign or credit card required.",
    },
    {
      step: "02",
      icon: Boxes,
      title: isSwahili ? "Weka bidhaa & wahudumu" : "Add your products & team",
      desc: isSwahili
        ? "Weka unachouza, panga bei zako, na waalike wahudumu wa kaunta kwa ruhusa maalum unazotaka."
        : "Add what you sell, set your prices, and invite staff with exactly the permissions they need.",
    },
    {
      step: "03",
      icon: ShoppingCart,
      title: isSwahili ? "Anza kuuza & pumzika" : "Start selling & relax",
      desc: isSwahili
        ? "Uza kaunta au kwa simu ya mkononi, na angalia ripoti ya siku ikijisasisha live na kufika kwa SMS saa 20:30."
        : "Sell at the counter or from your phone, and watch reports update live with SMS summary at 20:30 PM.",
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-white border-b border-purple-100 scroll-mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Row with Title and Right CTA Link (Image 3 Style) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-6 border-b border-purple-100">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 text-violet-700 text-xs font-mono font-bold tracking-wider uppercase">
              <span className="w-6 h-[1.5px] bg-violet-600 inline-block" />
              <span>{isSwahili ? "JINSI YA KUANZA" : "GETTING STARTED"}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              {isSwahili ? (
                <>
                  ANZA KUUZA KWA{" "}
                  <span className="font-serif italic text-violet-600 font-normal">
                    HATUA TATU TU
                  </span>
                </>
              ) : (
                <>
                  SELLING IN{" "}
                  <span className="font-serif italic text-violet-600 font-normal">THREE STEPS</span>
                </>
              )}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              {isSwahili
                ? "Hakuna mafunzo magumu yanayohitajika — kama unajua kutumia WhatsApp, unaweza kuendesha duka lako na MauzoChap kwa dakika 2 tu."
                : "No training required — if you can use WhatsApp, you can run your shop on MauzoChap in under 2 minutes."}
            </p>
          </div>

          <div className="shrink-0">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-violet-700 hover:text-violet-900 border-b-2 border-violet-600 pb-1 uppercase transition-colors cursor-pointer"
            >
              <span>{isSwahili ? "FUNGUA AKAUNTI SASA" : "CREATE ACCOUNT"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3 Steps Horizontal Layout with Connecting Line */}
        <div className="relative">
          {/* Subtle Connecting Line on Desktop */}
          <div
            className="hidden md:block absolute top-7 left-12 right-12 h-[2px] bg-gradient-to-r from-purple-200 via-violet-300 to-purple-200 z-0"
            aria-hidden="true"
          />

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {steps.map((item, idx) => {
              const StepIcon = item.icon;

              return (
                <div key={idx} className="space-y-4 text-left group">
                  {/* Step Bubble Row */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full border-2 border-violet-600 bg-white flex items-center justify-center font-mono font-black text-sm text-violet-700 shadow-md shadow-violet-600/10 group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white transition-all duration-200">
                      {item.step}
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-violet-600">
                      <StepIcon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight group-hover:text-violet-700 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
