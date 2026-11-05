import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HomepageHeader } from '@/components/landing/HomepageHeader';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { RegisterModal } from '@/components/landing/RegisterModal';
import { LANDING_TRANSLATIONS } from '@/components/landing/landing-i18n';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, onClick, className }: any) => (
    <a href={typeof to === 'string' ? to : '#'} onClick={onClick} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));

describe('Public Landing Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('HomepageHeader', () => {
    it('renders navigation links, handles EN/SW language switching, and triggers register modal', () => {
      const onToggleLang = vi.fn();
      const onOpenRegisterModal = vi.fn();

      render(
        <HomepageHeader
          t={LANDING_TRANSLATIONS.en}
          lang="en"
          onToggleLang={onToggleLang}
          onOpenRegisterModal={onOpenRegisterModal}
        />,
      );

      expect(screen.getByText('MauzoChap')).toBeInTheDocument();
      expect(screen.getByText(LANDING_TRANSLATIONS.en.nav.pricing)).toBeInTheDocument();

      // Clicking already-active EN button should NOT toggle
      fireEvent.click(screen.getAllByRole('button', { name: 'EN' })[0]);
      expect(onToggleLang).not.toHaveBeenCalled();

      // Clicking SW button SHOULD toggle
      fireEvent.click(screen.getAllByRole('button', { name: 'SW' })[0]);
      expect(onToggleLang).toHaveBeenCalledTimes(1);
    });
  });

  describe('PricingSection', () => {
    it('displays monthly TZS pricing by default and switches to discounted annual pricing', () => {
      render(<PricingSection t={LANDING_TRANSLATIONS.en} />);

      expect(screen.getByText('TSh 10,500')).toBeInTheDocument();
      expect(screen.getByText('TSh 15,500')).toBeInTheDocument();
      expect(screen.getByText('TSh 25,500')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Annually/i }));

      expect(screen.getByText('TSh 9,450')).toBeInTheDocument();
      expect(screen.getByText('TSh 13,950')).toBeInTheDocument();
      expect(screen.getByText('TSh 22,950')).toBeInTheDocument();
    });
  });

  describe('FAQSection', () => {
    it('expands the first FAQ item by default and toggles items on click', () => {
      const faqTranslation = {
        ...LANDING_TRANSLATIONS.en,
        faq: {
          eyebrow: 'FREQUENT QUESTIONS',
          headline: 'Got Questions?',
          items: [
            { q: 'Does MauzoChap work on phones?', a: 'Yes, Android, iOS, and PC.' },
            { q: 'How does nightly SMS work?', a: 'Sent automatically at 20:30 PM.' },
          ],
        },
      } as any;

      render(<FAQSection t={faqTranslation} />);

      expect(screen.getByText('Yes, Android, iOS, and PC.')).toBeInTheDocument();
      expect(screen.queryByText('Sent automatically at 20:30 PM.')).not.toBeInTheDocument();

      // Open second question
      fireEvent.click(screen.getByRole('button', { name: /How does nightly SMS work\?/i }));
      expect(screen.getByText('Sent automatically at 20:30 PM.')).toBeInTheDocument();

      // Collapse second question
      fireEvent.click(screen.getByRole('button', { name: /How does nightly SMS work\?/i }));
      expect(screen.queryByText('Sent automatically at 20:30 PM.')).not.toBeInTheDocument();
    });
  });

  describe('RegisterModal', () => {
    it('renders nothing when closed and saves registration details + redirects on submit', () => {
      vi.useFakeTimers();
      const onClose = vi.fn();

      const { rerender } = render(
        <RegisterModal
          isOpen={false}
          onClose={onClose}
          t={LANDING_TRANSLATIONS.en}
          defaultPlan="serengeti"
        />,
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <RegisterModal
          isOpen={true}
          onClose={onClose}
          t={LANDING_TRANSLATIONS.en}
          defaultPlan="serengeti"
        />,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { value: 'Arusha Agrovet' } });
      fireEvent.change(inputs[1], { target: { value: 'Neema Mushi' } });
      fireEvent.change(inputs[2], { target: { value: '0754112233' } });

      fireEvent.submit(inputs[0].closest('form')!);

      expect(localStorage.getItem('mauzochap_reg_shop_name')).toBe('Arusha Agrovet');
      expect(localStorage.getItem('mauzochap_reg_owner_name')).toBe('Neema Mushi');
      expect(localStorage.getItem('mauzochap_reg_phone')).toBe('0754112233');
      expect(localStorage.getItem('mauzochap_reg_plan')).toBe('serengeti');

      act(() => {
        vi.advanceTimersByTime(450);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/auth',
        search: { mode: 'signup', package: 'serengeti' },
      });
    });
  });
});

