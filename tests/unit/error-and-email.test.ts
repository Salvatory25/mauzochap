import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendEmail,
  sendPaymentApprovedEmail,
  sendOtpEmail,
  sendSubscriptionReminderEmail,
  buildMauzoChapCardHtml,
} from '@/lib/email';
import { reportAppError } from '@/lib/app-error-reporting';
import { consumeLastCapturedError } from '@/lib/error-capture';
import { renderErrorPage } from '@/lib/error-page';

const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (fn: string, opts: any) => mockInvoke(fn, opts),
    },
  },
}));

describe('email & error handling utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeLastCapturedError();
  });

  afterEach(() => {
    delete window.__appEvents;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('MauzoChap branded email service', () => {
    it('dispatches branded card payload to mauzochap-email Edge Function', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { success: true, messageId: '<msg-1@mauzochap>' },
        error: null,
      });

      const res = await sendPaymentApprovedEmail({
        to: 'owner@duka.co.tz',
        ownerName: 'Salvatory',
        businessName: 'Salvatory Mart',
        packageName: 'kilimanjaro',
        amount: 15500,
        paymentRef: '20261127-MRREBD',
        expiryDate: '27/12/2026',
      });

      expect(res.success).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith(
        'mauzochap-email',
        expect.objectContaining({
          body: expect.objectContaining({
            to: 'owner@duka.co.tz',
            heading: 'Malipo Yamefanikiwa',
            greetingName: 'Salvatory',
            rows: expect.arrayContaining([
              { label: 'Kumbukumbu', value: '20261127-MRREBD' },
              { label: 'Kiasi kilicholipwa', value: 'TZS 15,500' },
            ]),
          }),
        }),
      );
    });

    it('renders dark card HTML with greeting, callout box, and summary rows', () => {
      const html = buildMauzoChapCardHtml({
        to: 'owner@duka.co.tz',
        subject: 'Malipo yamefanikiwa - Kifurushi cha KILIMANJARO',
        heading: 'Malipo Yamefanikiwa',
        greetingName: 'Salvatory',
        highlightText: 'Habari Salvatory, malipo ya TZS 15,500 yamefanikiwa!',
        rows: [
          { label: 'Kumbukumbu', value: '20261127-MRREBD' },
          { label: 'Kiasi kilicholipwa', value: 'TZS 15,500' },
        ],
      });

      expect(html).toContain('MAUZOCHAP POS');
      expect(html).toContain('Malipo Yamefanikiwa');
      expect(html).toContain('Habari Salvatory,');
      expect(html).toContain('20261127-MRREBD');
      expect(html).toContain('TZS 15,500');
    });

    it('supports OTP and out-of-subscription reminder templates and rejects invalid addresses', async () => {
      mockInvoke.mockResolvedValue({ data: { success: true }, error: null });

      const invalid = await sendEmail({ to: 'not-an-email', subject: 'Test' });
      expect(invalid.success).toBe(false);

      await sendOtpEmail({ to: 'user@duka.co.tz', code: '482910' });
      expect(mockInvoke).toHaveBeenCalledWith(
        'mauzochap-email',
        expect.objectContaining({
          body: expect.objectContaining({
            purpose: 'otp_reset',
            otpCode: '482910',
          }),
        }),
      );

      await sendSubscriptionReminderEmail({
        to: 'user@duka.co.tz',
        ownerName: 'Juma',
        businessName: 'Juma Hardware',
        packageName: 'starter',
        expiryDate: '25/11/2026',
        daysRemaining: 0,
      });
      expect(mockInvoke).toHaveBeenLastCalledWith(
        'mauzochap-email',
        expect.objectContaining({
          body: expect.objectContaining({
            heading: 'Kifurushi Kimekwisha',
            tone: 'danger',
          }),
        }),
      );
    });
  });

  describe('reportAppError', () => {
    it('safely does nothing when window.__appEvents is undefined', () => {
      expect(() => reportAppError(new Error('Boom'))).not.toThrow();
    });

    it('forwards error, route context, and react_error_boundary metadata to captureException', () => {
      const captureException = vi.fn();
      window.__appEvents = { captureException };

      const err = new Error('Render crash');
      reportAppError(err, { componentStack: '<POS />' });

      expect(captureException).toHaveBeenCalledWith(
        err,
        expect.objectContaining({
          source: 'react_error_boundary',
          route: window.location.pathname,
          componentStack: '<POS />',
        }),
        {
          mechanism: 'react_error_boundary',
          handled: false,
          severity: 'error',
        },
      );
    });
  });

  describe('consumeLastCapturedError', () => {
    it('captures global error events and consumes them exactly once', () => {
      const boom = new Error('Uncaught failure');
      globalThis.dispatchEvent(new ErrorEvent('error', { error: boom }));

      expect(consumeLastCapturedError()).toBe(boom);
      expect(consumeLastCapturedError()).toBeUndefined();
    });

    it('captures unhandledrejection events', () => {
      const rejectionReason = new Error('Async rejection');
      const evt = new Event('unhandledrejection');
      Object.assign(evt, { reason: rejectionReason });
      globalThis.dispatchEvent(evt);

      expect(consumeLastCapturedError()).toBe(rejectionReason);
    });

    it('expires captured errors after the 5,000ms TTL window', () => {
      vi.useFakeTimers();
      const staleError = new Error('Stale error');
      globalThis.dispatchEvent(new ErrorEvent('error', { error: staleError }));

      vi.advanceTimersByTime(5001);
      expect(consumeLastCapturedError()).toBeUndefined();
    });
  });

  describe('renderErrorPage', () => {
    it('renders complete standalone fallback HTML with retry and home controls', () => {
      const html = renderErrorPage();
      expect(html).toContain('<!doctype html>');
      expect(html).toContain("This page didn't load");
      expect(html).toContain('location.reload()');
      expect(html).toContain('href="/"');
    });
  });
});
