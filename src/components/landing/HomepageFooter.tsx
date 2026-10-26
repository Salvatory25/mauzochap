import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone, MapPin, ArrowRight } from "lucide-react";
import { Lang } from "@/lib/i18n";
import { LandingTranslation } from "./landing-i18n";

interface HomepageFooterProps {
  t: LandingTranslation;
  lang: Lang;
  onToggleLang: () => void;
  onOpenRegisterModal: () => void;
}

export function HomepageFooter({
  t,
  lang,
  onToggleLang,
  onOpenRegisterModal,
}: HomepageFooterProps) {
  const f = t.footer;

  return (
    <footer className="bg-[#01184c] text-slate-300 py-16 sm:py-20 text-xs font-sans border-t border-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top 3-Column Layout (DukaPOS Style for MauzoChap) */}
        <div className="grid gap-12 lg:grid-cols-12 pb-14 border-b border-white/10">
          {/* Column 1: Brand & Coverage */}
          <div className="lg:col-span-6 space-y-5">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/images/logo-black.png"
                alt="MauzoChap"
                className="w-10 h-10 object-contain bg-white rounded-xl p-1 shadow-md"
                width={40}
                height={40}
              />
              <span className="font-black text-2xl text-white tracking-tight">MauzoChap</span>
            </Link>

            <p className="text-slate-300 max-w-md text-xs sm:text-sm leading-relaxed">
              {f.brandBio}
            </p>

            <div className="text-[11px] font-mono text-slate-300 bg-white/5 border border-white/10 p-3.5 rounded-2xl max-w-md">
              <p className="italic leading-relaxed">{f.coverageText}</p>
            </div>

            <div className="pt-1">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-[#01184c] font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-white/10 cursor-pointer active:scale-95"
              >
                <span>{f.ctaButton}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Column 2: Product Links */}
          <div className="lg:col-span-3 space-y-3">
            <div className="font-bold text-white uppercase tracking-wider text-xs font-mono">
              {f.productColTitle}
            </div>
            <ul className="space-y-2.5 text-slate-400 font-medium text-xs">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  {t.nav.features}
                </a>
              </li>
              <li>
                <a
                  href="#daily-sms"
                  className="hover:text-violet-400 text-violet-300 font-bold transition-colors"
                >
                  Nightly 20:30 PM SMS
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  {t.nav.pricing}
                </a>
              </li>
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  {t.nav.forBusiness}
                </a>
              </li>
              <li>
                <Link to="/demo" className="hover:text-white transition-colors">
                  {t.nav.seeDemo}
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  {t.nav.signIn}
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors text-left cursor-pointer">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Your Business */}
          <div className="lg:col-span-3 space-y-3">
            <div className="font-bold text-white uppercase tracking-wider text-xs font-mono">
              {f.businessColTitle}
            </div>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  Shops and Maduka
                </a>
              </li>
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  Supermarkets & Retail
                </a>
              </li>
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  Pharmacies & Duka la Dawa
                </a>
              </li>
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  Hardware & Electricals
                </a>
              </li>
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  Wholesale & Distribution
                </a>
              </li>
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  Restaurants & Bars
                </a>
              </li>
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  Boutiques & Fashion
                </a>
              </li>
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  Phones & Electronics
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div>{f.copyright}</div>

          <div className="flex items-center gap-4">
            {/* Interactive Language Switch Button [ EN | SW ] */}
            <div className="inline-flex items-center rounded-lg border border-white/20 bg-[#022166] p-0.5 text-xs font-mono">
              <button
                onClick={() => lang !== "en" && onToggleLang()}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  lang === "en"
                    ? "bg-violet-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                EN
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={() => lang !== "sw" && onToggleLang()}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  lang === "sw"
                    ? "bg-violet-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                SW
              </button>
            </div>

            <span>•</span>

            <span className="text-slate-400 font-bold">{f.builtInTz}</span>

            <span>•</span>

            <a
              href="https://wa.me/255627274168"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Concierge</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
