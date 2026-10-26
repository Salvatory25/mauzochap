import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  Zap,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface ComparisonSectionProps {
  t: LandingTranslation;
  onOpenRegisterModal?: () => void;
}

interface MatrixRow {
  category: string;
  daftari: string;
  mauzochap: string;
}

export function ComparisonSection({ t, onOpenRegisterModal }: ComparisonSectionProps) {
  const [showAllMobile, setShowAllMobile] = useState(false);

  const isSwahili =
    t.capabilities.eyebrow.toLowerCase().includes("uwezo") ||
    t.hero.headlinePrefix.toLowerCase().includes("biashara");

  const matrixRows: MatrixRow[] = isSwahili
    ? [
        {
          category: "Mauzo ya siku",
          daftari: "Unapiga hesabu kurasa kwa kurasa jioni kwa kikokotoo",
          mauzochap: "Yanaonekana kwenye kioo papo hapo kwa kila mauzo & SMS saa 20:30",
        },
        {
          category: "Stoo iliyobaki",
          daftari: "Lazima uhesabu bidhaa rafu kwa rafu mwenyewe",
          mauzochap: "Inasasishwa kiotomatiki kwa kila muamala na tahadhari ya bidhaa chini",
        },
        {
          category: "Madeni ya wateja",
          daftari: "Majina yamesambaa kwenye kurasa 50 za zamani (wateja wanabisha)",
          mauzochap: "Kila mteja anajulikana, deni lake na risiti ya WhatsApp kwa ushahidi",
        },
        {
          category: "Faida halisi",
          daftari: "Kukisia tu mwisho wa mwezi (mara nyingi unakula mtaji bila kujua)",
          mauzochap: "Inakokotolewa kwa bei ya kununulia vs kuuzia, kila bidhaa, kila siku",
        },
        {
          category: "Wahudumu wa kaunta",
          daftari: "Ni vigumu kujua nani kauza nini au nani kachukua chenji",
          mauzochap: "Kila mauzo yanasajiliwa na jina la mhudumu, droo inafungwa bila wizi",
        },
        {
          category: "Tawi la pili au la tatu",
          daftari: "Daftari lingine, safari nyingine, hofu ya kuibiwa",
          mauzochap: "Akaunti moja, unaona matawi yote live pembeni kwa pembeni kwenye simu",
        },
        {
          category: "Bidhaa kuisha muda (Expiry)",
          daftari: "Unagundua dawa au vyakula vimeoza baada ya mteja kulalamika",
          mauzochap: "Tahadhari ya miezi 3 hadi 6 kabla (Expiry Radar) ili uzitoe kwa ofa",
        },
      ]
    : [
        {
          category: "Today's sales",
          daftari: "Added up page by page after closing with a pocket calculator",
          mauzochap: "Live on screen with every single sale & nightly 20:30 PM SMS",
        },
        {
          category: "Stock left",
          daftari: "Count the shelves manually to find out what is missing",
          mauzochap: "Updated automatically by every sale and supplier delivery",
        },
        {
          category: "Who owes you",
          daftari: "Customer names spread across messy old pages (easy to dispute)",
          mauzochap: "Each customer, their balance, and instant WhatsApp proof receipts",
        },
        {
          category: "Net profit",
          daftari: "A wild guess at the end of the month (quietly eating capital)",
          mauzochap: "Exact profit calculated per product, per cashier, per day",
        },
        {
          category: "Staff accountability",
          daftari: "Hard to tell who sold what or who skimmed loose change",
          mauzochap: "Every sale carries the cashier's name; blind-drawer shift audit",
        },
        {
          category: "Second branch",
          daftari: "Another book, another bus trip, constant anxiety",
          mauzochap: "Same login, every branch monitored live side by side on your phone",
        },
        {
          category: "Expiring items",
          daftari: "Silent expiry on shelves until customers complain or TMDA inspects",
          mauzochap: "3 to 6-month advance expiry radar to discount or return before loss",
        },
      ];

  return (
    <section
      id="comparison"
      className="py-10 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-purple-50/30 to-white border-b border-purple-100 scroll-mt-12"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full border border-purple-200 bg-purple-50 text-violet-700 text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase">
            <span>{isSwahili ? "KWA NINI UACHANE NA DAFTARI?" : "WHY SWITCH"}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            {isSwahili ? (
              <>
                BADO UNAENDESHA DUKA KWA{" "}
                <span className="font-serif italic text-violet-600 font-normal">DAFTARI?</span>
              </>
            ) : (
              <>
                STILL RUNNING THE SHOP FROM A{" "}
                <span className="font-serif italic text-violet-600 font-normal">DAFTARI?</span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            {isSwahili
              ? "Daftari la karatasi linakumbuka tu kile unachoandika. MauzoChap inafanya mahesabu yote kiotomatiki wakati unauza."
              : "A notebook remembers what you write in it. MauzoChap works the numbers out automatically as you sell."}
          </p>
        </div>

        {/* Clean Comparative Matrix Table */}
        <div className="rounded-2xl sm:rounded-[32px] border border-purple-200/90 bg-white shadow-xl shadow-purple-950/5 overflow-hidden">
          {/* Table Header Row */}
          <div className="grid grid-cols-12 bg-purple-50/70 border-b border-purple-100 px-4 sm:px-6 py-3.5 sm:py-4 text-xs font-mono font-bold uppercase tracking-wider">
            <div className="col-span-12 sm:col-span-3 text-slate-500">
              {isSwahili ? "KIPENGELE" : "FEATURE"}
            </div>
            <div className="hidden sm:flex col-span-4 text-slate-600 items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>DAFTARI OR EXCEL</span>
            </div>
            <div className="hidden sm:flex col-span-5 text-violet-700 items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-black text-violet-800">MAUZOCHAP POS</span>
            </div>
          </div>

          {/* Matrix Rows */}
          <div className="divide-y divide-purple-100/70">
            {matrixRows.map((row, idx) => {
              const isHiddenOnMobile = !showAllMobile && idx >= 4;

              return (
                <div
                  key={idx}
                  className={`grid grid-cols-12 px-4 sm:px-6 py-4 sm:py-5 hover:bg-purple-50/30 transition-colors items-center gap-2.5 sm:gap-0 ${
                    isHiddenOnMobile ? "hidden sm:grid" : "grid"
                  }`}
                >
                  {/* Category Column */}
                  <div className="col-span-12 sm:col-span-3 font-bold text-xs sm:text-sm text-slate-950">
                    {row.category}
                  </div>

                  {/* Daftari / Excel Column */}
                  <div className="col-span-12 sm:col-span-4 sm:pr-4">
                    <div className="text-xs sm:text-sm text-slate-500 italic font-serif leading-relaxed bg-red-50/50 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none flex items-start gap-1.5 sm:block">
                      <span className="sm:hidden text-red-500 font-sans font-bold text-[10px] shrink-0 uppercase">Daftari:</span>
                      <span>{row.daftari}</span>
                    </div>
                  </div>

                  {/* MauzoChap Column */}
                  <div className="col-span-12 sm:col-span-5">
                    <div className="flex items-start gap-2 bg-purple-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none border border-purple-100 sm:border-0">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-600 stroke-[2.5]" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-950 leading-relaxed">
                        {row.mauzochap}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Expand / Collapse Button */}
          <div className="p-3 bg-purple-50/50 border-t border-purple-100 flex sm:hidden justify-center">
            <button
              onClick={() => setShowAllMobile(!showAllMobile)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-purple-200 text-violet-700 font-bold text-xs shadow-xs active:bg-purple-50"
            >
              <span>
                {showAllMobile
                  ? isSwahili
                    ? "Funga vigezo vingine"
                    : "Show fewer rows"
                  : isSwahili
                    ? `Ona vigezo vingine vyote (${matrixRows.length})`
                    : `Show all comparisons (${matrixRows.length})`}
              </span>
              {showAllMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Financial ROI / Math Summary Card */}
        <div className="mt-6 sm:mt-12 rounded-2xl sm:rounded-[28px] border border-violet-200 bg-gradient-to-r from-purple-100/70 via-white to-purple-100/70 p-4 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2 text-left max-w-2xl">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-violet-600 text-white text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase">
                <span>{isSwahili ? "HESABU RAHISI YA FAIDA" : "THE SIMPLE PROFIT MATH"}</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                {isSwahili
                  ? "Daftari linakugharimu ~TZS 320,000/mwezi. MauzoChap ni TZS 10,500 tu."
                  : "The notebook costs ~TZS 320,000/mo in losses. MauzoChap is just TZS 10,500."}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {isSwahili
                  ? "Chini ya TZS 350 kwa siku (nusu ya bei ya soda), unaziba mianya yote ya wizi wa chenji, unakusanya madeni yote kwa WhatsApp na unalala kwa amani kila usiku."
                  : "Under TZS 350 per day (cheaper than half a bottle of soda), you plug all cash leakages, collect customer debts 2x faster, and rest peacefully every night."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 pt-1 sm:pt-0">
              <Link
                to="/auth"
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSwahili ? "Acha Daftari Leo" : "Switch from Daftari"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/demo"
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-violet-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <span>{isSwahili ? "Angalia Demo" : "Try Interactive Demo"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
