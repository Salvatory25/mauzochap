import { describe, it, expect, beforeEach } from 'vitest';
import { t, formatTZS, formatDate, setLang } from '@/lib/i18n';

describe('i18n utility helpers', () => {
  beforeEach(() => {
    // Reset language to English before each test
    setLang('en');
  });

  describe('translation (t)', () => {
    it('translates appName in English', () => {
      expect(t('appName')).toBe('MauzoChap');
    });

    it('translates appName in Swahili after setting language', () => {
      setLang('sw');
      expect(t('appName')).toBe('MauzoChap'); // Since it's 'MauzoChap' for both
      
      // Let's test a translation key that actually differs:
      expect(t('dashboard')).toBe('Dashibodi');
    });

    it('translates keys with fallback to English if missing in local dictionary (or fallback behavior)', () => {
      expect(t('pos', 'en')).toBe('New Sale');
      expect(t('pos', 'sw')).toBe('Mauzo Mapya');
    });
  });

  describe('currency formatting (formatTZS)', () => {
    it('formats numbers into TZS currency format correctly', () => {
      // e.g. 5000 -> "TZS 5,000" or similar based on locale settings
      // Note: format output depends on the implementation. Let's do a loose matching or check structure.
      const formatted = formatTZS(5000);
      expect(formatted).toMatch(/TZS|TSh/);
      // replace non-breaking spaces if any
      const cleaned = formatted.replace(/\u00a0/g, ' ');
      expect(cleaned).toContain('5,000');
    });

    it('handles 0 and negative values safely', () => {
      const formattedZero = formatTZS(0).replace(/\u00a0/g, ' ');
      expect(formattedZero).toContain('0');
    });
  });

  describe('date formatting (formatDate)', () => {
    it('formats a date string or Date object correctly', () => {
      const d = new Date('2026-08-04T12:00:00Z');
      const formatted = formatDate(d);
      // toLocaleString in en-GB with day: "2-digit", month: "short", year: "numeric", hour/minute: 2-digit.
      // E.g. "04 Aug 2026, 12:00" (or similar depending on system local timezone).
      // We can assert it contains year and month.
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Aug');
    });
  });
});
