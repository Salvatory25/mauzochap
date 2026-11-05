import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import { sendEmail } from '@/lib/email';
import { reportAppError } from '@/lib/app-error-reporting';
import { consumeLastCapturedError } from '@/lib/error-capture';
import { renderErrorPage } from '@/lib/error-page';

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

describe('email & error handling utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeLastCapturedError(); // Clear any residual state
  });

  afterEach(() => {
    delete window.__appEvents;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('sendEmail', () => {
    it('logs formatted email output and triggers sonner info toast', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      sendEmail({
        to: 'owner@duka.co.tz',
        subject: 'Invoice #104',
        body: 'Thank you for your business.',
      });

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0][0]).toContain('owner@duka.co.tz');
      expect(toast.info).toHaveBeenCalledWith(
        'Mock email sent to owner@duka.co.tz: Invoice #104',
        { duration: 5000 },
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

