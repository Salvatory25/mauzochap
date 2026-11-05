import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { setLang } from '@/lib/i18n';

describe('PwaInstallPrompt component', () => {
  const originalUserAgent = window.navigator.userAgent;

  beforeEach(() => {
    localStorage.clear();
    setLang('en');

    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0',
      configurable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    vi.useRealTimers();
  });

  it('stays hidden until beforeinstallprompt is fired, then prompts installation on click', async () => {
    render(<PwaInstallPrompt />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const installEvent = new Event('beforeinstallprompt');
    Object.assign(installEvent, {
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    });

    act(() => {
      window.dispatchEvent(installEvent);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Install MauzoChap App')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Install App/i }));

    await waitFor(() => {
      expect(promptMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('persists dismissal timestamp in localStorage and suppresses banner within 5-day cooldown', () => {
    const { unmount } = render(<PwaInstallPrompt />);

    const installEvent = new Event('beforeinstallprompt');
    Object.assign(installEvent, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
    });

    act(() => {
      window.dispatchEvent(installEvent);
    });

    fireEvent.click(screen.getByRole('button', { name: /Later/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem('mauzochap_pwa_dismissed_at')).toBeTruthy();

    unmount();

    // Remount immediately (within 5 days) -> event listener should not even activate banner
    render(<PwaInstallPrompt />);
    act(() => {
      window.dispatchEvent(installEvent);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('never displays when already running in standalone PWA mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    render(<PwaInstallPrompt />);
    act(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows localized Swahili iOS Safari installation instructions after 3s delay', () => {
    vi.useFakeTimers();
    setLang('sw');
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });

    render(<PwaInstallPrompt />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Weka App ya MauzoChap')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Weka Kwenye Simu/i }));

    expect(screen.getByText('Jinsi ya Kuweka kwenye iPhone:')).toBeInTheDocument();
    expect(screen.getByText(/Add to Home Screen/i)).toBeInTheDocument();
  });
});

