import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Calendar, Clock, ArrowRight, Tag, Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { landingTranslations } from "@/components/landing/landing-i18n";
import { HomepageHeader } from "@/components/landing/HomepageHeader";
import { HomepageFooter } from "@/components/landing/HomepageFooter";
import { RegisterModal } from "@/components/landing/RegisterModal";
import { BLOG_POSTS } from "@/data/blog-posts";
import { buildSeoHead, getBreadcrumbSchema } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () =>
    buildSeoHead({
      title: "Makala na Miongozo ya Biashara na Mauzo Tanzania | MauzoChap Blog",
      description:
        "Miongozo ya bure ya usimamizi wa maduka, udhibiti wa stoo, kuhesabu faida na hasara, mifumo ya POS, na kukuza biashara ya rejareja na jumla nchini Tanzania.",
      path: "/blog",
      keywords: [
        "blog ya biashara Tanzania",
        "jinsi ya kusimamia duka",
        "jinsi ya kurekodi mauzo",
        "miongozo ya biashara Tanzania",
        "retail business guides Tanzania",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Blog & Miongozo ya Biashara", path: "/blog" },
        ]),
      ],
    }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const [lang, setLang] = useLang();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Kiswahili" | "English">("All");

  const t = landingTranslations[lang] || landingTranslations.en;
  const toggleLang = () => setLang(lang === "en" ? "sw" : "en");

  const filteredPosts =
    selectedCategory === "All"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen w-full bg-white font-sans antialiased selection:bg-violet-600 selection:text-white">
      <HomepageHeader
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      <main className="w-full">
        {/* Blog Hero */}
        <section className="pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-purple-50/60 via-white to-white border-b border-purple-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-200 bg-white text-violet-700 text-xs font-mono font-bold tracking-wider uppercase shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-violet-600" />
              <span>{lang === "sw" ? "Miongozo ya Biashara" : "Educational Guides"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              {lang === "sw"
                ? "Mbinu na Miongozo ya Kukuza Biashara Yako"
                : "Practical Guides for Tanzanian Merchants"}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              {lang === "sw"
                ? "Makala na ushauri wa kitaalamu wa jinsi ya kusimamia mauzo, kudhibiti stoo, kuzuia upotevu, na kuongeza faida ya biashara yako."
                : "Battle-tested insights on retail management, stock control, employee theft prevention, and retail profitability."}
            </p>

            {/* Language filter pills */}
            <div className="pt-4 flex items-center justify-center gap-2">
              {(["All", "Kiswahili", "English"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-slate-950 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat === "All" ? (lang === "sw" ? "Makala Yote" : "All Articles") : cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article
                  key={post.slug}
                  className="rounded-2xl border border-slate-200 bg-white hover:border-violet-300 hover:shadow-xl hover:shadow-violet-600/5 transition-all flex flex-col overflow-hidden"
                >
                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                      <span className="px-2.5 py-1 rounded-md bg-purple-50 text-violet-700 font-bold">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    <Link to="/blog/$slug" params={{ slug: post.slug }} className="group">
                      <h2 className="text-xl font-bold text-slate-950 group-hover:text-violet-600 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h2>
                    </Link>

                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1">
                      {post.excerpt}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{post.date}</span>
                      </div>
                      <Link
                        to="/blog/$slug"
                        params={{ slug: post.slug }}
                        className="inline-flex items-center gap-1 font-bold text-violet-600 hover:text-violet-700 hover:underline"
                      >
                        <span>{lang === "sw" ? "Soma Zaidi" : "Read Article"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="py-16 bg-[#01184c] text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-black">
              {lang === "sw"
                ? "Uko Tayari Kurahisisha Mauzo ya Duka Lako?"
                : "Ready to Modernize Your Retail Store?"}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              {lang === "sw"
                ? "Anza leo na MauzoChap POS. Hakuna malipo ya kwanza, siku 14 za majaribio bure."
                : "Sign up today with MauzoChap POS. 14-day full free trial, no credit card required."}
            </p>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#01184c] font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {lang === "sw" ? "Anza Jaribio la Bure" : "Start Free Trial"}
            </button>
          </div>
        </section>
      </main>

      <HomepageFooter
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      <RegisterModal isOpen={registerModalOpen} onClose={() => setRegisterModalOpen(false)} t={t} />
    </div>
  );
}
