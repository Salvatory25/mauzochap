import { describe, it, expect } from 'vitest';
import {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  getCanonicalUrl,
  buildSeoHead,
  getOrganizationSchema,
  getSoftwareApplicationSchema,
  getWebSiteSchema,
  getBreadcrumbSchema,
  getFaqSchema,
  getArticleSchema,
} from '@/lib/seo';

describe('SEO & Structured Data utilities', () => {
  describe('getCanonicalUrl', () => {
    it('returns root SITE_URL without trailing slash for "/"', () => {
      expect(getCanonicalUrl('/')).toBe(SITE_URL);
    });

    it('normalizes missing leading slashes and strips trailing slashes', () => {
      expect(getCanonicalUrl('pricing')).toBe(`${SITE_URL}/pricing`);
      expect(getCanonicalUrl('/features/')).toBe(`${SITE_URL}/features`);
      expect(getCanonicalUrl('/blog/post-slug///')).toBe(`${SITE_URL}/blog/post-slug`);
    });
  });

  describe('buildSeoHead', () => {
    it('builds default indexable meta, canonical link, and x-default hreflang', () => {
      const head = buildSeoHead({
        title: 'MauzoChap Pricing',
        description: 'Affordable POS plans in Tanzania.',
        path: '/pricing',
      });

      expect(head.meta).toContainEqual({ title: 'MauzoChap Pricing' });
      expect(head.meta).toContainEqual({
        name: 'description',
        content: 'Affordable POS plans in Tanzania.',
      });
      expect(head.meta).toContainEqual({
        name: 'robots',
        content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      });
      expect(head.meta).toContainEqual({ property: 'og:image', content: DEFAULT_OG_IMAGE });
      expect(head.meta).toContainEqual({ property: 'og:type', content: 'website' });

      expect(head.links).toContainEqual({ rel: 'canonical', href: `${SITE_URL}/pricing` });
      expect(head.links).toContainEqual({
        rel: 'alternate',
        hrefLang: 'x-default',
        href: `${SITE_URL}/pricing`,
      });
      expect(head.scripts).toEqual([]);
    });

    it('supports noindex, keywords, article timestamps, custom ogImage, hreflang alternates, and multiple JSON-LD schemas', () => {
      const head = buildSeoHead({
        title: 'Blog Article',
        description: 'Retail tips',
        path: '/blog/retail-tips',
        noindex: true,
        keywords: ['pos', 'tanzania'],
        ogType: 'article',
        ogImage: '/images/blog-cover.png',
        publishedTime: '2026-10-15',
        modifiedTime: '2026-10-20',
        swAlternativePath: '/mauzo',
        enAlternativePath: '/pos-system-tanzania',
        schema: [{ '@type': 'Thing', name: 'A' }, { '@type': 'Thing', name: 'B' }],
      });

      expect(head.meta).toContainEqual({ name: 'robots', content: 'noindex, nofollow' });
      expect(head.meta).toContainEqual({ name: 'keywords', content: 'pos, tanzania' });
      expect(head.meta).toContainEqual({
        property: 'og:image',
        content: `${SITE_URL}/images/blog-cover.png`,
      });
      expect(head.meta).toContainEqual({ property: 'article:published_time', content: '2026-10-15' });
      expect(head.meta).toContainEqual({ property: 'article:modified_time', content: '2026-10-20' });

      expect(head.links).toContainEqual({
        rel: 'alternate',
        hrefLang: 'sw',
        href: `${SITE_URL}/mauzo`,
      });
      expect(head.links).toContainEqual({
        rel: 'alternate',
        hrefLang: 'en',
        href: `${SITE_URL}/pos-system-tanzania`,
      });

      expect(head.scripts).toHaveLength(2);
      expect(JSON.parse(head.scripts[0].children)).toEqual({ '@type': 'Thing', name: 'A' });
    });
  });

  describe('Schema.org JSON-LD factories', () => {
    it('generates Organization, SoftwareApplication, and WebSite schemas with Tanzanian metadata', () => {
      const org = getOrganizationSchema();
      expect(org['@type']).toBe('Organization');
      expect(org.address.addressCountry).toBe('TZ');

      const app = getSoftwareApplicationSchema();
      expect(app['@type']).toBe('SoftwareApplication');
      expect(app.offers.priceCurrency).toBe('TZS');
      expect(app.offers.offers).toHaveLength(3);

      const site = getWebSiteSchema();
      expect(site['@type']).toBe('WebSite');
      expect(site.inLanguage).toContain('sw-TZ');
    });

    it('generates 1-indexed BreadcrumbList and FAQPage schemas', () => {
      const breadcrumbs = getBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
      ]);
      expect(breadcrumbs.itemListElement).toEqual([
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      ]);

      const faq = getFaqSchema([{ question: 'Bei gani?', answer: 'Kuanzia TZS 10,500.' }]);
      expect(faq['@type']).toBe('FAQPage');
      expect(faq.mainEntity[0].acceptedAnswer.text).toBe('Kuanzia TZS 10,500.');
    });

    it('generates Article schema with default and custom author/image/modifiedDate', () => {
      const article = getArticleSchema({
        title: 'Stoo Bora',
        description: 'Usimamizi wa stoo',
        path: '/blog/stoo-bora',
        publishedDate: '2026-10-18',
      });

      expect(article['@type']).toBe('Article');
      expect(article.dateModified).toBe('2026-10-18');
      expect(article.author.name).toBe('MauzoChap Editorial Team');
      expect(article.image).toBe(DEFAULT_OG_IMAGE);
    });
  });
});

