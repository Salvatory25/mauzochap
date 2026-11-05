import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserGuideContent, USER_GUIDE_SECTIONS } from '@/components/UserGuideContent';
import { setLang } from '@/lib/i18n';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...rest }: any) => (
    <a href={typeof to === 'string' ? to : '#'} {...rest}>
      {children}
    </a>
  ),
}));

describe('UserGuideContent (Customer How-To-Use Guide)', () => {
  beforeEach(() => {
    setLang('sw');
  });

  it('renders all 8 bilingual guide chapters in Kiswahili and switches cleanly to English', () => {
    render(<UserGuideContent variant="public" />);

    expect(USER_GUIDE_SECTIONS.length).toBe(8);
    expect(
      screen.getByText('Jinsi ya Kutumia Mfumo wa MauzoChap Hatua kwa Hatua'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Usajili wa Akaunti & Kuanzisha Kifurushi'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ripoti za Biashara & SMS ya Kila Siku Saa 20:30 Usiku'),
    ).toBeInTheDocument();

    // Switch to English via button
    fireEvent.click(screen.getByRole('button', { name: /Switch to English/i }));

    expect(
      screen.getByText('How to Use MauzoChap POS — Easy Step-by-Step Guide'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Account Registration & Activating Your Plan'),
    ).toBeInTheDocument();
  });

  it('filters chapters via search input and resets when no topics match', () => {
    setLang('en');
    render(<UserGuideContent variant="public" />);

    const searchInput = screen.getByRole('textbox', { name: /Search user guide/i });
    fireEvent.change(searchInput, { target: { value: '20:30 PM' } });

    expect(
      screen.getByText('Real-Time Business Reports & Nightly 20:30 PM SMS Summary'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Tracking Daily Shop Expenses & Supplier Purchases'),
    ).not.toBeInTheDocument();

    // Unmatched search query displays reset button
    fireEvent.change(searchInput, { target: { value: 'nonexistent-xyz-topic' } });
    expect(screen.getByText(/No guide topics matched/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reset Filters/i }));
    expect(
      screen.getByText('Tracking Daily Shop Expenses & Supplier Purchases'),
    ).toBeInTheDocument();
  });

  it('shows direct in-app navigation links when variant="app" and triggers window.print for PDF download', () => {
    vi.useFakeTimers();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    setLang('sw');
    render(<UserGuideContent variant="app" />);

    const posShortcut = screen.getByRole('link', { name: /Fungua Mauzo Mapya \(POS\)/i });
    expect(posShortcut).toHaveAttribute('href', '/pos');

    // Collapse all then click Print — should re-expand all chapters and call window.print
    fireEvent.click(screen.getByRole('button', { name: /Funga Zote/i }));
    expect(screen.queryByText(/Weka Bidhaa Kwenye Kikapu/i)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Chapisha \/ Pakua Mwongozo \(PDF\)/i }),
    );
    vi.advanceTimersByTime(100);

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Weka Bidhaa Kwenye Kikapu/i)).toBeInTheDocument();

    printSpy.mockRestore();
    vi.useRealTimers();
  });
});

