import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  ArrowRight,
  Share2,
  CheckCircle2,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { landingTranslations } from "@/components/landing/landing-i18n";
import { HomepageHeader } from "@/components/landing/HomepageHeader";
import { HomepageFooter } from "@/components/landing/HomepageFooter";
import { RegisterModal } from "@/components/landing/RegisterModal";
import { getBlogPostBySlug, BLOG_POSTS } from "@/data/blog-posts";
import {
  buildSeoHead,
  getBreadcrumbSchema,
  getArticleSchema,
} from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = getBlogPostBySlug(params.slug);
    if (!post) {
      return buildSeoHead({
        title: "Makala Haijapatikana — MauzoChap Blog",
        description: "Ukurasa wa makala haukupatikana.",
        path: `/blog/${params.slug}`,
        noindex: true,
      });
    }

    return buildSeoHead({
      title: `${post.title} — MauzoChap Tanzania`,
      description: post.description,
      path: `/blog/${post.slug}`,
      keywords: post.tags,
      ogType: "article",
      publishedTime: post.date,
      modifiedTime: post.modifiedDate || post.date,
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]),
        getArticleSchema({
          title: post.title,
          description: post.description,
          path: `/blog/${post.slug}`,
          publishedDate: post.date,
          modifiedDate: post.modifiedDate,
          authorName: post.author,
        }),
      ],
    });
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = getBlogPostBySlug(slug);

  const [lang, setLang] = useLang();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const t = landingTranslations[lang] || landingTranslations.en;
  const toggleLang = () => setLang(lang === "en" ? "sw" : "en");

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-black text-slate-900">Makala Haijapatikana (404)</h1>
          <p className="text-slate-600 text-sm">
            Samahani, ukurasa wa makala unayotafuta haupo au umehamishwa.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rudi kwenye Blog</span>
          </Link>
        </div>
      </div>
    );
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.description,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(lang === "sw" ? "Kiunganishi kimenakiliwa!" : "Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen w-full bg-white font-sans antialiased selection:bg-violet-600 selection:text-white">
      <HomepageHeader
        t={t}
        lang={lang}
        onToggleLang={toggleLang}
        onOpenRegisterModal={() => setRegisterModalOpen(true)}
      />

      <main className="w-full">
        {/* Article Header */}
        <section className="pt-10 pb-12 lg:pt-16 lg:pb-16 bg-gradient-to-b from-purple-50/50 via-white to-white border-b border-purple-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="space-y-6">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === "sw" ? "Rudi kwenye Makala Zote" : "Back to Blog"}</span>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-md bg-purple-100 text-violet-800 text-xs font-bold">
                  {post.category}
                </span>
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                {post.title}
              </h1>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{lang === "sw" ? "Sambaza" : "Share"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Article Body */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Content Column */}
              <div className="lg:col-span-8 space-y-8 text-slate-800 leading-relaxed text-base sm:text-lg font-normal">
                {/* Excerpt quote */}
                <div className="p-5 rounded-2xl bg-purple-50/70 border-l-4 border-violet-600 text-slate-700 text-sm sm:text-base italic font-serif leading-relaxed">
                  "{post.excerpt}"
                </div>

                {/* Body Content formatting */}
                <div className="space-y-6 prose prose-slate max-w-none">
                  {post.content.split("\n\n").map((paragraph, index) => {
                    const text = paragraph.trim();
                    if (!text) return null;

                    if (text.startsWith("## ")) {
                      return (
                        <h2
                          key={index}
                          className="text-2xl sm:text-3xl font-black text-slate-950 pt-6 border-t border-slate-100"
                        >
                          {text.replace("## ", "")}
                        </h2>
                      );
                    }
                    if (text.startsWith("### ")) {
                      return (
                        <h3 key={index} className="text-xl font-bold text-slate-900 pt-3">
                          {text.replace("### ", "")}
                        </h3>
                      );
                    }
                    if (text.startsWith("> ")) {
                      return (
                        <blockquote
                          key={index}
                          className="p-4 rounded-xl bg-slate-50 border-l-4 border-indigo-500 text-slate-700 font-mono text-xs sm:text-sm my-3"
                        >
                          {text.replace("> ", "")}
                        </blockquote>
                      );
                    }
                    if (text.startsWith("- ")) {
                      const items = text.split("\n- ").map((item) => item.replace("- ", "").trim());
                      return (
                        <ul key={index} className="space-y-2 list-disc pl-5 text-sm sm:text-base">
                          {items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      );
                    }

                    return (
                      <p key={index} className="text-sm sm:text-base leading-relaxed text-slate-700">
                        {text}
                      </p>
                    );
                  })}
                </div>

                {/* Contextual CTA Box inside Article */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white space-y-4 my-8 shadow-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-mono font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{lang === "sw" ? "Jaribu Bure Bila Malipo" : "14-Day Free Trial"}</span>
                  </div>
                  <h3 className="text-2xl font-black">
                    {lang === "sw"
                      ? "Acha Daftari na Mianya ya Upotevu Leo!"
                      : "Upgrade to Modern Cloud & Offline POS Today"}
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {lang === "sw"
                      ? "Unganisha duka lako na MauzoChap POS. Pata ripoti ya mauzo kila siku saa 2:30 usiku kwa SMS na dhibiti stoo kwa urahisi."
                      : "Experience effortless stock control, employee theft prevention, and nightly automated SMS sales summaries."}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => setRegisterModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-white text-violet-700 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer shadow-md"
                    >
                      {lang === "sw" ? "Jisajili Bure Sasa" : "Sign Up Free"}
                    </button>
                    <Link
                      to="/demo"
                      className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      {lang === "sw" ? "Tazama Demo" : "Try Demo"}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-4 space-y-8">
                {/* Quick Info Box */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider font-mono">
                    {lang === "sw" ? "Kuhusu MauzoChap" : "About MauzoChap"}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === "sw"
                      ? "MauzoChap ni mfumo wa kisasa wa mauzo (POS) na usimamizi wa stoo uliojengwa mahsusi kwa maduka ya rejareja, maduka ya dawa, na biashara za Kitanzania."
                      : "MauzoChap is the dedicated point-of-sale and stock management operating system for merchants across Tanzania."}
                  </p>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:underline"
                  >
                    <span>{lang === "sw" ? "Tazama Bei & Vifurushi" : "Explore Pricing Plans"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Related Articles */}
                {relatedPosts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider font-mono">
                      {lang === "sw" ? "Makala Zinazohusiana" : "Related Guides"}
                    </h4>
                    <div className="space-y-3">
                      {relatedPosts.map((rel) => (
                        <Link
                          key={rel.slug}
                          to="/blog/$slug"
                          params={{ slug: rel.slug }}
                          className="block p-4 rounded-xl border border-slate-200 bg-white hover:border-violet-300 hover:shadow-md transition-all group"
                        >
                          <span className="text-[10px] font-mono font-bold text-violet-600 uppercase">
                            {rel.category}
                          </span>
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-2 mt-1">
                            {rel.title}
                          </h5>
                          <span className="text-[11px] text-slate-500 mt-2 block">
                            {rel.readTime}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
