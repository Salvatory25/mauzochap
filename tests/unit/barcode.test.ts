import { describe, it, expect } from 'vitest';
import { generateCode128 } from '@/lib/barcode';

describe('generateCode128 barcode utility', () => {
  it('returns empty content and zero width for empty input', () => {
    expect(generateCode128('')).toEqual({ svgContent: '', widths: 0 });
  });

  it('strips non-printable ASCII characters and returns empty when nothing printable remains', () => {
    expect(generateCode128('\n\r\t\x00\x1F\x7F')).toEqual({ svgContent: '', widths: 0 });
  });

  it('generates valid SVG rect elements and exact Code128 module width for single character', () => {
    // Code128 width formula: (N + 2) * 11 + 13 (Start B + N chars + Checksum + Stop)
    const result = generateCode128('A');
    expect(result.widths).toBe((1 + 2) * 11 + 13); // 46
    expect(result.svgContent).toContain('<rect x="0" y="0" width="2" height="80" fill="black" />');

    const rects = result.svgContent.match(/<rect /g) ?? [];
    // 6 elements * 3 symbols + 7 elements for stop = 25 alternating bar/space elements -> 13 bars
    expect(rects.length).toBe(13);
  });

  it('computes consistent widths across numeric, alphanumeric, and punctuation SKUs', () => {
    const samples = ['123456', 'SKU-001', 'TZ$99.50!', 'MauzoChap 2026'];
    for (const sample of samples) {
      const { svgContent, widths } = generateCode128(sample);
      expect(widths).toBe((sample.length + 2) * 11 + 13);
      expect(svgContent.startsWith('<rect x="0"')).toBe(true);
      expect(svgContent.endsWith('fill="black" />')).toBe(true);
    }
  });

  it('ignores non-ASCII characters embedded inside valid barcode strings', () => {
    const clean = generateCode128('PROD-42');
    const dirty = generateCode128('PROD-42\n\t™');
    expect(dirty).toEqual(clean);
  });

  it('produces distinct SVG patterns when character order changes (weighted checksum)', () => {
    const first = generateCode128('AB');
    const second = generateCode128('BA');
    expect(first.widths).toBe(second.widths);
    expect(first.svgContent).not.toBe(second.svgContent);
  });
});

