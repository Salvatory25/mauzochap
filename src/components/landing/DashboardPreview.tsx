import { useState } from "react";
import { Sparkles, Maximize2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface DashboardPreviewProps {
  t: LandingTranslation;
}

export function DashboardPreview({ t }: DashboardPreviewProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const isSwahili =
    t.capabilities.eyebrow.toLowerCase().includes("uwezo") ||
    t.hero.headlinePrefix.toLowerCase().includes("biashara");

  return (
    <>
      <div className="relative mx-auto w-full max-w-2xl lg:max-w-none group">
        {/* Soft Lavender / Purple Ambient Backlight Glow */}
        <div
          className="absolute -inset-4 rounded-[40px] bg-gradient-to-r from-violet-600/30 via-indigo-500/20 to-purple-600/30 blur-3xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          aria-hidden="true"
        />

        {/* MacBook Pro + iPhone Paired Mockup Display Container */}
        <div className="relative rounded-[32px] bg-white/90 backdrop-blur-md border border-purple-200/90 p-3 sm:p-4 shadow-2xl shadow-purple-950/15 overflow-hidden">
          {/* Top Status Strip */}
          <div className="flex items-center justify-between pb-3 px-2 border-b border-purple-100/80">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-black.png"
                alt="MauzoChap POS Official Logo"
                className="w-7 h-7 rounded-lg object-contain shadow-sm"
                width={28}
                height={28}
              />
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-slate-950 tracking-tight flex items-center gap-1.5">
                  <span>Kariakoo Store POS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {isSwahili
                    ? "Kompyuta & Simu Zinasawazishwa • TZS"
                    : "MacBook & iPhone in Live Cloud Sync • TZS"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>100% LIVE SYNC</span>
              </span>

              <button
                onClick={() => setModalOpen(true)}
                className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-violet-700 transition-colors cursor-pointer"
                title="Expand preview"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* High-Resolution Paired Hardware Mockup (MacBook Pro + iPhone Beside It) */}
          <div
            className="relative rounded-2xl overflow-hidden bg-slate-950 cursor-pointer group/img mt-3 shadow-inner"
            onClick={() => setModalOpen(true)}
          >
            <img
              src="/images/hero-macbook-iphone.jpg"
              alt="MauzoChap SaaS Dashboard on Apple MacBook Pro with synchronized iPhone mobile app showing Tanzanian Shilling sales and revenue charts"
              className="w-full h-auto object-cover transform transition-transform duration-500 group-hover/img:scale-[1.015]"
              loading="eager"
              width={1600}
              height={900}
            />

            {/* Floating Top Left Pill */}
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700 text-white text-[11px] font-mono flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-violet-300">
                {isSwahili ? "Duka Moja • Vifaa Vyote" : "MacBook PC + iPhone Connected"}
              </span>
            </div>

            {/* Hover Expand Icon */}
            <div className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/75 backdrop-blur-md border border-slate-700 text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
              <Maximize2 className="w-4 h-4" />
            </div>

            {/* Floating Bottom WhatsApp Receipt Simulation */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-purple-200/90 text-slate-900 shadow-xl flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate">
                {isSwahili
                  ? "Risiti ya WhatsApp Imetumwa kwa Mteja • TZS 45,000"
                  : "WhatsApp Digital Receipt Sent to Client • TZS 45,000"}
              </div>
            </div>
          </div>

          {/* Bottom Indicators */}
          <div className="pt-3 px-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5 text-violet-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
              <span>
                {isSwahili ? "Mfumo wa Kisasa wa Tanzania" : "Built for Tanzanian Retail"}
              </span>
            </span>

            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isSwahili ? "Hakuna Kadi ya Benki" : "No Credit Card Required"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center animate-in fade-in duration-150"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative max-w-6xl w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-white font-bold">
                  {isSwahili
                    ? "Mwonekano Kamili: MacBook Pro & iPhone MauzoChap Dashboard"
                    : "Full Preview: MacBook Pro & iPhone MauzoChap POS Dashboard"}
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>
            <div className="p-2 bg-slate-950">
              <img
                src="/images/hero-macbook-iphone.jpg"
                alt="MauzoChap POS Full Preview on MacBook and iPhone"
                className="w-full h-auto object-contain max-h-[82vh] rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
