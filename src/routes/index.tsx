import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { Store, BarChart3, Boxes, Users, Receipt, ShieldCheck, Sun, Moon, Languages, MessageCircle, CheckCircle2, Star, Quote, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLang, useT } from "@/lib/i18n";

const TESTIMONIALS = [
  {
    name: "Juma Rashid",
    role: "Store Manager",
    business: "Kariakoo Supermarket",
    city: "Dar es Salaam",
    quote: "Tangu tuanze kutumia MauzoChap dukani kwetu Kariakoo, tumeweza kudhibiti mauzo na stoki yetu kwa 100%. Hakuna tena upotevu wa bidhaa!",
    rating: 5,
    avatar: "JR",
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
  },
  {
    name: "Grace Mwasongwe",
    role: "Head Pharmacist",
    business: "Afya Care Pharmacy",
    city: "Arusha",
    quote: "MauzoChap imetusaidia sana kufuatilia tarehe za kuisha kwa dawa (expiry dates) na kutoa risiti za haraka kwa wateja. Ni mfumo bora sana!",
    rating: 5,
    avatar: "GM",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
  },
  {
    name: "Josephat Kilonzo",
    role: "Managing Director",
    business: "Kilonzo Hardware & Electricals",
    city: "Mwanza",
    quote: "Ripoti za kila siku za faida na madeni ya wateja zimenisaidia kukuza biashara kwa haraka. Mfumo huu ni suluhisho la kweli kwetu.",
    rating: 5,
    avatar: "JK",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20"
  },
  {
    name: "Amina Bakari",
    role: "Boutique Owner",
    business: "Glamour Fashion Hub",
    city: "Dodoma",
    quote: "I love how fast checkout is and how easy it is to manage inventory across our stores. MauzoChap is worth every shilling!",
    rating: 5,
    avatar: "AB",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20"
  },
  {
    name: "David Mollel",
    role: "Wholesale Director",
    business: "Kilimanjaro Traders",
    city: "Moshi",
    quote: "Kusimamia wafanyakazi na kuona mauzo ya kila siku nikiwa safarini kupitia simu ni kitu bora zaidi. MauzoChap imerahisisha kila kitu.",
    rating: 5,
    avatar: "DM",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20"
  },
  {
    name: "Neema Mwita",
    role: "Operations Lead",
    business: "SmartTech Electronics",
    city: "Mbeya",
    quote: "Customer debt tracking and barcode scanning are lightning fast. Highly recommended for modern shops in Tanzania!",
    rating: 5,
    avatar: "NM",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20"
  }
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MauzoChap — Modern POS for Tanzanian Businesses" },
      {
        name: "description",
        content:
          "Manage sales, inventory, customers, expenses and reports — built for shops, pharmacies and restaurants.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const [lang, setLang] = useLang();
  const t = useT();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background relative">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">
              M
            </div>
            <span className="text-lg font-semibold tracking-tight">MauzoChap</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === "en" ? "sw" : "en")}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
              title="Change Language"
            >
              <Languages className="h-4 w-4" />
              <span className="uppercase">{lang}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-60"
            style={{ background: "var(--gradient-subtle)" }}
          />
          <div className="mx-auto w-full px-6 py-20 lg:py-28 md:px-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-success" /> {t("builtForTanzania")}
                </span>
                <h1 className="mt-6 text-6xl font-bold tracking-tight lg:text-7xl">
                  {t("runShopConfidence")}{" "}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    {t("confidence")}
                  </span>
                  .
                </h1>
                <p className="mt-6 max-w-2xl text-xl text-muted-foreground leading-relaxed">
                  {t("landingDescription")}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/auth"
                    className="rounded-lg px-6 py-4 text-base font-medium text-primary-foreground shadow-[var(--shadow-elevated)]"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {t("getStartedFree")}
                  </Link>
                  <a
                    href="#features"
                    className="rounded-lg border border-border bg-card px-6 py-4 text-base font-medium hover:bg-accent"
                  >
                    {t("seeFeatures")}
                  </a>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-elevated)]">
                <div className="rounded-xl bg-sidebar p-6 text-sidebar-foreground">
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-sidebar-foreground/60">
                    <span>Today</span>
                    <span>Live</span>
                  </div>
                  <div className="mt-2 text-4xl font-bold">TZS 1,284,500</div>
                  <div className="mt-1 text-sm text-sidebar-foreground/60">+18% vs yesterday</div>
                  <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                    {[
                      { l: "Orders", v: "47" },
                      { l: "Avg ticket", v: "27,330" },
                      { l: "Low stock", v: "3" },
                    ].map((x) => (
                      <div key={x.l} className="rounded-lg bg-sidebar-accent/60 p-3">
                        <div className="text-xs text-sidebar-foreground/60">{x.l}</div>
                        <div className="mt-1 font-semibold">{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full px-6 py-20 md:px-12">
          <h2 className="text-3xl font-bold">{t("featuresTitle")}</h2>
          <p className="mt-2 text-muted-foreground">
            {t("featuresDesc")}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Store,
                title: t("posTitle"),
                desc: t("posDesc"),
              },
              {
                icon: Boxes,
                title: t("invTitle"),
                desc: t("invDesc"),
              },
              {
                icon: Users,
                title: t("custTitle"),
                desc: t("custDesc"),
              },
              {
                icon: Receipt,
                title: t("recTitle"),
                desc: t("recDesc"),
              },
              {
                icon: BarChart3,
                title: t("repTitle"),
                desc: t("repDesc"),
              },
              {
                icon: ShieldCheck,
                title: t("roleTitle"),
                desc: t("roleDesc"),
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
              >
                <div
                  className="grid h-10 w-10 place-items-center rounded-lg text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto w-full px-6 py-20 md:px-12 border-t border-border/60 bg-muted/10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground mt-2">
              Choose the perfect plan for your business. Start free and upgrade anytime.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {/* Starter Plan Card */}
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between shadow-[var(--shadow-soft)] hover:shadow-md transition-all hover:scale-[1.01]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Starter
                  </span>
                </div>
                <h3 className="text-2xl font-bold">STARTER</h3>
                <p className="text-sm text-muted-foreground mt-1">Get started with basic features</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">TSh 8,500</span>
                  <span className="text-muted-foreground">/ Month</span>
                </div>
                
                <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>1 Location</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>1 User</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>100 Products</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Basic Reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Receipts</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/auth"
                className="mt-8 block w-full rounded-lg bg-muted text-center py-3 text-sm font-semibold hover:bg-muted/80 transition-colors"
              >
                Choose Starter
              </Link>
            </div>

            {/* Kilimanjaro Plan Card */}
            <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col justify-between shadow-[var(--shadow-elevated)] relative hover:scale-[1.02] transition-all">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Popular
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Growth
                  </span>
                </div>
                <h3 className="text-2xl font-bold">KILIMANJARO</h3>
                <p className="text-sm text-muted-foreground mt-1">Perfect for single location shops</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">TSh 10,500</span>
                  <span className="text-muted-foreground">/ Month</span>
                </div>
                
                <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>1 Location</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>3 Users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Receipts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Multiple Branches</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/auth"
                className="mt-8 block w-full rounded-lg text-center py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all active:scale-[0.98]"
                style={{ background: "var(--gradient-primary)" }}
              >
                Choose Kilimanjaro
              </Link>
            </div>

            {/* Serengeti Plan Card */}
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col justify-between shadow-[var(--shadow-soft)] hover:shadow-md transition-all hover:scale-[1.01]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Enterprise
                  </span>
                </div>
                <h3 className="text-2xl font-bold">SERENGETI</h3>
                <p className="text-sm text-muted-foreground mt-1">For multi-branch & large retailers</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">TSh 20,500</span>
                  <span className="text-muted-foreground">/ Month</span>
                </div>
                
                <ul className="mt-8 space-y-4 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Locations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Products</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Receipts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>Unlimited Branches</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/auth"
                className="mt-8 block w-full rounded-lg bg-muted text-center py-3 text-sm font-semibold hover:bg-muted/80 transition-colors"
              >
                Choose Serengeti
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section (Infinite Marquee Right-to-Left) */}
        <section id="testimonials" className="py-20 border-t border-border/60 overflow-hidden bg-card/40 relative">
          <div className="text-center max-w-2xl mx-auto mb-14 px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider mb-3">
              <Building2 className="w-3.5 h-3.5" /> {lang === "sw" ? "Ushuhuda wa Wafanyabiashara" : "Customer Stories"}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {lang === "sw" ? "Biashara 500+ Nchini Tanzania Zinatumia MauzoChap" : "Trusted by 500+ Tanzanian Businesses"}
            </h2>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              {lang === "sw" 
                ? "Tazama jinsi wamiliki wa maduka, maduka ya dawa, na maduka makubwa kutoka Dar es Salaam, Arusha, Mwanza na Dodoma wanavyorahisisha kazi zao kila siku." 
                : "See how store owners, pharmacies, and merchants across Dar es Salaam, Arusha, Mwanza & Dodoma transform their daily operations with MauzoChap POS."}
            </p>
          </div>

          {/* Marquee Wrapper with Side Gradients */}
          <div className="relative w-full overflow-hidden">
            {/* Left Edge Gradient */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10" />
            {/* Right Edge Gradient */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10" />

            <div className="animate-marquee flex items-center gap-6 py-4">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((item, idx) => (
                <div
                  key={idx}
                  className="w-[320px] sm:w-[380px] shrink-0 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Star Rating */}
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${item.color}`}>
                        ✓ Verified Business
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-foreground/90 italic leading-relaxed">
                      "{item.quote}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${item.color}`}>
                      {item.avatar}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-foreground truncate">{item.name}</h4>
                      <p className="text-[11px] text-muted-foreground truncate">{item.business} • <span className="font-semibold text-foreground/80">{item.city}</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto w-full px-6 text-sm text-muted-foreground md:px-12 flex flex-col md:flex-row items-center justify-between">
          <span>© {new Date().getFullYear()} {t("footerText")}</span>
        </div>
      </footer>

      {/* Floating WhatsApp Widget */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5">
        {/* Floating Tooltip Pill */}
        <a
          href="https://wa.me/255627274168?text=Habari%20MauzoChap!%20Ningependa%20kupata%20maelezo%20zaidi%20kuhusu%20mfumo%20wenu%20wa%20POS%20na%20jinsi%20ya%20kuanza."
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 bg-card/90 backdrop-blur-md border border-[#25D366]/40 text-foreground px-3.5 py-2 rounded-full shadow-lg text-xs font-semibold hover:border-[#25D366] transition-all hover:scale-105"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25D366]"></span>
          </span>
          <span>{lang === "sw" ? "Wasiliana Nasi, WhatsApp" : "Contact Us, WhatsApp"}</span>
        </a>

        {/* Animated Floating WhatsApp Icon Button */}
        <a
          href="https://wa.me/255627274168?text=Habari%20MauzoChap!%20Ningependa%20kupata%20maelezo%20zaidi%20kuhusu%20mfumo%20wenu%20wa%20POS%20na%20jinsi%20ya%20kuanza."
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 animate-bounce"
          title="Chat with us on WhatsApp"
        >
          {/* Pulsing aura ring */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />
          
          {/* WhatsApp icon */}
          <MessageCircle className="h-7 w-7 relative z-10" />

          {/* Online green indicator badge */}
          <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white" />
        </a>
      </div>
    </div>
  );
}
