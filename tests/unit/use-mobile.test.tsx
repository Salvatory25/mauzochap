import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile hook', () => {
  let changeListeners: Array<() => void> = [];
  const removeEventListenerMock = vi.fn();

  beforeEach(() => {
    changeListeners = [];
    removeEventListenerMock.mockReset();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: window.innerWidth < 768,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_event: string, cb: () => void) => {
          changeListeners.push(cb);
        }),
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('returns false on desktop viewport (>= 768px)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true on mobile viewport (< 768px)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('reacts to viewport width changes and cleans up media query listener on unmount', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
      changeListeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);

    unmount();
    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

