import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getBusinessLogo,
  saveBusinessLogo,
  removeBusinessLogo,
  validateLogoFile,
  BUSINESS_LOGO_EVENT,
} from '@/lib/business-logo';

describe('Business Logo Manager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('retrieves null when no logo is saved', () => {
    const logo = getBusinessLogo('biz-123');
    expect(logo).toBeNull();
  });

  it('saves logo to localStorage and dispatches a custom window event', () => {
    const listener = vi.fn();
    window.addEventListener(BUSINESS_LOGO_EVENT, listener);

    const testLogoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    saveBusinessLogo(testLogoData, 'biz-123');

    expect(getBusinessLogo('biz-123')).toBe(testLogoData);
    expect(listener).toHaveBeenCalled();

    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.businessId).toBe('biz-123');
    expect(event.detail.logo).toBe(testLogoData);

    window.removeEventListener(BUSINESS_LOGO_EVENT, listener);
  });

  it('removes logo from localStorage and dispatches event with null logo', () => {
    const listener = vi.fn();
    window.addEventListener(BUSINESS_LOGO_EVENT, listener);

    const testLogoData = 'data:image/png;base64,TESTLOGO';
    saveBusinessLogo(testLogoData, 'biz-456');
    expect(getBusinessLogo('biz-456')).toBe(testLogoData);

    removeBusinessLogo('biz-456');
    expect(getBusinessLogo('biz-456')).toBeNull();

    expect(listener).toHaveBeenCalledTimes(2);
    const removeEvent = listener.mock.calls[1][0] as CustomEvent;
    expect(removeEvent.detail.businessId).toBe('biz-456');
    expect(removeEvent.detail.logo).toBeNull();

    window.removeEventListener(BUSINESS_LOGO_EVENT, listener);
  });

  it('validates logo file formats (png, jpg, webp, svg)', () => {
    const validPng = new File(['dummy'], 'logo.png', { type: 'image/png' });
    const validJpg = new File(['dummy'], 'logo.jpg', { type: 'image/jpeg' });
    const validWebp = new File(['dummy'], 'logo.webp', { type: 'image/webp' });
    const validSvg = new File(['dummy'], 'logo.svg', { type: 'image/svg+xml' });
    const invalidPdf = new File(['dummy'], 'document.pdf', { type: 'application/pdf' });

    expect(validateLogoFile(validPng).valid).toBe(true);
    expect(validateLogoFile(validJpg).valid).toBe(true);
    expect(validateLogoFile(validWebp).valid).toBe(true);
    expect(validateLogoFile(validSvg).valid).toBe(true);

    const invalidResult = validateLogoFile(invalidPdf);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toContain('PNG');
  });

  it('rejects files exceeding max size limit (5MB)', () => {
    const oversized = new File(['a'.repeat(6 * 1024 * 1024)], 'giant.png', { type: 'image/png' });
    Object.defineProperty(oversized, 'size', { value: 6 * 1024 * 1024 });

    const result = validateLogoFile(oversized);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('5MB');
  });
});

