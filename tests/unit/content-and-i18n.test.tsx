import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { dict, setLang, useLang, useT } from '@/lib/i18n';
import { BLOG_POSTS, getBlogPostBySlug } from '@/data/blog-posts';
import { LANDING_TRANSLATIONS } from '@/components/landing/landing-i18n';

describe('blog data, landing translations, and reactive i18n hooks', () => {
  beforeEach(() => {
    localStorage.clear();
    setLang('en');
  });

  describe('useLang & useT reactive hooks', () => {
    it('updates subscribed components and persists language selection in localStorage', () => {
      const { result: langHook } = renderHook(() => useLang());
      const { result: tHook } = renderHook(() => useT());

      expect(langHook.current[0]).toBe('en');
      expect(tHook.current('completeSale')).toBe('Complete Sale');

      act(() => {
        langHook.current[1]('sw');
      });

      expect(langHook.current[0]).toBe('sw');
      expect(localStorage.getItem('mauzochap_lang')).toBe('sw');
      expect(tHook.current('completeSale')).toBe('Kamilisha Mauzo');
    });

    it('ensures every dictionary key has non-empty English and Swahili translations', () => {
      for (const [key, entry] of Object.entries(dict)) {
        expect(entry.en, `Missing EN translation for ${key}`).toBeTruthy();
        expect(entry.sw, `Missing SW translation for ${key}`).toBeTruthy();
      }
    });
  });

  describe('BLOG_POSTS & getBlogPostBySlug', () => {
    it('maintains unique slugs and complete metadata across all blog articles', () => {
      expect(BLOG_POSTS.length).toBeGreaterThan(0);
      const slugs = BLOG_POSTS.map((p) => p.slug);
      expect(new Set(slugs).size).toBe(slugs.length);

      for (const post of BLOG_POSTS) {
        expect(post.title.length).toBeGreaterThan(5);
        expect(post.description.length).toBeGreaterThan(10);
        expect(post.content.trim().length).toBeGreaterThan(50);
        expect(['Kiswahili', 'English']).toContain(post.category);
      }
    });

    it('retrieves matching blog post by slug and returns undefined for unknown slugs', () => {
      const target = BLOG_POSTS[0];
      expect(getBlogPostBySlug(target.slug)).toEqual(target);
      expect(getBlogPostBySlug('non-existent-article-slug')).toBeUndefined();
    });
  });

  describe('LANDING_TRANSLATIONS (EN & SW parity)', () => {
    it('defines matching subscription plan IDs and discounted annual prices in both languages', () => {
      const enPlans = LANDING_TRANSLATIONS.en.pricing.plans;
      const swPlans = LANDING_TRANSLATIONS.sw.pricing.plans;

      expect(enPlans.map((p) => p.id)).toEqual(['starter', 'kilimanjaro', 'serengeti']);
      expect(swPlans.map((p) => p.id)).toEqual(['starter', 'kilimanjaro', 'serengeti']);

      for (let i = 0; i < enPlans.length; i++) {
        expect(enPlans[i].monthlyPrice).toBe(swPlans[i].monthlyPrice);
        expect(enPlans[i].annualPrice).toBe(swPlans[i].annualPrice);
        expect(enPlans[i].annualPrice).toBeLessThan(enPlans[i].monthlyPrice);
      }
    });

    it('provides Tanzanian regions and complete navigation labels in both locales', () => {
      expect(LANDING_TRANSLATIONS.en.modal.regions).toContain('Dar es Salaam');
      expect(LANDING_TRANSLATIONS.sw.modal.regions).toContain('Dar es Salaam');
      expect(LANDING_TRANSLATIONS.en.nav.pricing).toBeTruthy();
      expect(LANDING_TRANSLATIONS.sw.nav.pricing).toBeTruthy();
    });
  });
});

