import { useState, useEffect } from "react";
import { Download, X, Share2, PlusSquare, Smartphone, Check } from "lucide-react";
import { useLang } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [lang] = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 2. Check if previously dismissed within the last 5 days
    const dismissedAt = localStorage.getItem("mauzochap_pwa_dismissed_at");
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 5) {
        return;
      }
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setIsIos(true);
      // Show prompt on iOS after a brief pleasant delay (3 seconds)
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 4. Listen for Chrome / Android / Desktop beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsVisible(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("mauzochap_pwa_dismissed_at", Date.now().toString());
  };

  if (!isVisible || installed) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-4 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-800 text-white shadow-2xl shadow-black/60 relative overflow-hidden space-y-3">
        {/* Subtle Top Gradient Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

        {/* Header row: Icon, text, close */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-white p-1 shrink-0 shadow-md flex items-center justify-center">
            <img
              src="/images/logo-black.png"
              alt="MauzoChap App"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 id="pwa-install-title" className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{lang === "sw" ? "Weka App ya MauzoChap" : "Install MauzoChap App"}</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold rounded">
                BURE
              </span>
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug font-normal">
              {lang === "sw"
                ? "Uza kwa haraka kaunta moja kwa moja kutoka kwenye screen ya simu yako bila browser."
                : "Fast counter sales and daily receipts directly from your home screen."}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Funga"
            className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* iOS Step Guide Modal Popup within Banner */}
        {showIosGuide ? (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "sw" ? "Jinsi ya Kuweka kwenye iPhone:" : "How to Install on iOS:"}</span>
            </div>
            <ol className="space-y-1.5 list-decimal list-inside text-slate-300">
              <li className="flex items-center gap-1.5">
                <span>1. Bonyeza kitufe cha</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 rounded font-bold text-white">
                  <Share2 className="w-3 h-3 text-blue-400" /> Share
                </span>
                <span>chini ya Safari.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>2. Shuka chini na uchague</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 rounded font-bold text-white">
                  <PlusSquare className="w-3 h-3 text-emerald-400" /> Add to Home Screen
                </span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
            >
              {lang === "sw" ? "Nimeelewa" : "Got it"}
            </button>
          </div>
        ) : (
          /* Actions Row */
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleInstallClick}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === "sw" ? "Weka Kwenye Simu" : "Install App"}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              {lang === "sw" ? "Baadaye" : "Later"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
