/**
 * MauzoChap SEO & Structured Data Architecture
 * Standardizes metadata, canonical URLs, Open Graph, Twitter cards, and Schema.org JSON-LD
 * across public routes for Google and search crawlers.
 */

export const SITE_URL = "https://www.mauzochap.co.tz";
export const BRAND_NAME = "MauzoChap POS";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SeoConfig {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
  schema?: Record<string, any> | Array<Record<string, any>>;
  swAlternativePath?: string;
  enAlternativePath?: string;
}

/**
 * Normalizes an absolute canonical URL
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/") return SITE_URL;
  // Remove trailing slash for consistency
  return `${SITE_URL}${cleanPath.replace(/\/+$/, "")}`;
}

/**
 * Builds TanStack Router head definitions with complete technical SEO attributes
 */
export function buildSeoHead(config: SeoConfig) {
  const canonical = getCanonicalUrl(config.path);
  const ogImage = config.ogImage ? (config.ogImage.startsWith("http") ? config.ogImage : `${SITE_URL}${config.ogImage}`) : DEFAULT_OG_IMAGE;
  const ogType = config.ogType || "website";

  const meta: Array<Record<string, any>> = [
    { title: config.title },
    { name: "description", content: config.description },
    { name: "robots", content: config.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    // Open Graph
    { property: "og:type", content: ogType },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: "MauzoChap" },
    { property: "og:title", content: config.title },
    { property: "og:description", content: config.description },
    { property: "og:image", content: ogImage },
    { property: "og:locale", content: "sw_TZ" },
    { property: "og:locale:alternate", content: "en_US" },
    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:url", content: canonical },
    { name: "twitter:title", content: config.title },
    { name: "twitter:description", content: config.description },
    { name: "twitter:image", content: ogImage },
  ];

  if (config.keywords && config.keywords.length > 0) {
    meta.push({ name: "keywords", content: config.keywords.join(", ") });
  }

  if (config.publishedTime) {
    meta.push({ property: "article:published_time", content: config.publishedTime });
  }
  if (config.modifiedTime) {
    meta.push({ property: "article:modified_time", content: config.modifiedTime });
  }

  const links: Array<Record<string, any>> = [
    { rel: "canonical", href: canonical },
  ];

  // Reciprocal hreflang links
  if (config.swAlternativePath) {
    links.push({ rel: "alternate", hrefLang: "sw", href: getCanonicalUrl(config.swAlternativePath) });
  }
  if (config.enAlternativePath) {
    links.push({ rel: "alternate", hrefLang: "en", href: getCanonicalUrl(config.enAlternativePath) });
  }
  // Default fallback
  links.push({ rel: "alternate", hrefLang: "x-default", href: canonical });

  const scripts: Array<Record<string, any>> = [];

  if (config.schema) {
    const schemas = Array.isArray(config.schema) ? config.schema : [config.schema];
    schemas.forEach((s) => {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(s),
      });
    });
  }

  return { meta, links, scripts };
}

// ==========================================
// JSON-LD SCHEMA FACTORIES (Schema.org)
// ==========================================

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "MauzoChap",
    alternateName: ["MauzoChap POS", "MauzoChap Tanzania"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo-black.png`,
      caption: "MauzoChap POS Logo",
    },
    description: "Modern POS and retail inventory management software built specifically for Tanzanian businesses with nightly SMS sales reports.",
    telephone: "+255627274168",
    email: "support@mauzochap.co.tz",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dar es Salaam",
      addressRegion: "Dar es Salaam",
      addressCountry: "TZ",
    },
    sameAs: [
      "https://wa.me/255627274168",
    ],
  };
}

export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: "MauzoChap POS",
    operatingSystem: "Web Browser, Android, Windows, iOS",
    applicationCategory: "BusinessApplication",
    description: "All-in-one POS, stock management, credit tracking, receipt printing, and nightly SMS business reporting platform for Tanzanian retailers, pharmacies, and wholesale shops.",
    url: SITE_URL,
    image: `${SITE_URL}/images/hero-dashboard.jpg`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "TZS",
      lowPrice: "10500",
      highPrice: "25500",
      offerCount: "3",
      offers: [
        {
          "@type": "Offer",
          name: "Starter / Uhuru",
          price: "10500",
          priceCurrency: "TZS",
          description: "Essential POS and sales recording for 1 store branch.",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Kilimanjaro",
          price: "15500",
          priceCurrency: "TZS",
          description: "Multi-branch inventory, nightly SMS business summaries, and debt management.",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          name: "Serengeti",
          price: "25500",
          priceCurrency: "TZS",
          description: "Full ERP inventory, batch FEFO expiry tracking, supplier purchases, and unlimited users.",
          availability: "https://schema.org/InStock",
        },
      ],
    },
    featureList: [
      "Offline & Online POS checkout",
      "Nightly 20:30 PM automated SMS sales reports",
      "Customer credit book & debt tracking with SMS reminders",
      "Thermal 80mm & 58mm Bluetooth/USB receipt printing",
      "Barcode scanning via camera or laser scanner",
      "Batch expiry & FEFO inventory tracking for pharmacies",
      "Multi-branch stock transfer & consolidated reporting",
      "Role-based access: Admin, Manager, Cashier",
    ],
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "MauzoChap",
    description: "MauzoChap POS — Mfumo wa Mauzo na Usimamizi wa Stoo Tanzania",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
    inLanguage: ["sw-TZ", "en-TZ"],
  };
}

export function getBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

export function getFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function getArticleSchema(article: {
  title: string;
  description: string;
  path: string;
  publishedDate: string;
  modifiedDate?: string;
  authorName?: string;
  imageUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${getCanonicalUrl(article.path)}#article`,
    headline: article.title,
    description: article.description,
    mainEntityOfPage: getCanonicalUrl(article.path),
    url: getCanonicalUrl(article.path),
    image: article.imageUrl ? (article.imageUrl.startsWith("http") ? article.imageUrl : `${SITE_URL}${article.imageUrl}`) : DEFAULT_OG_IMAGE,
    datePublished: article.publishedDate,
    dateModified: article.modifiedDate || article.publishedDate,
    author: {
      "@type": "Person",
      name: article.authorName || "MauzoChap Editorial Team",
    },
    publisher: {
      "@type": "Organization",
      name: "MauzoChap",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-black.png`,
      },
    },
    inLanguage: "sw-TZ",
  };
}
