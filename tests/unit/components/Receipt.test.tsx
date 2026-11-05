import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Receipt } from '@/components/Receipt';
import { setLang } from '@/lib/i18n';

const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

vi.mock('@/lib/use-auth', () => ({
  useAuth: () => ({
    business: { business_name: 'Mlimani Pharmacy' },
    branchId: 'branch-main',
  }),
}));

vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

const baseSale = {
  id: 'sale-1',
  receipt_number: 'RC-2026-001',
  subtotal: 25000,
  discount: 2000,
  tax: 1000,
  total: 24000,
  payment_method: 'mobile_money',
  amount_paid: 20000,
  notes: null as string | null,
  created_at: '2026-11-05T08:30:00Z',
  items: [
    { id: 'item-1', name: 'Panadol Extra', qty: 2, price: 5000 },
    { id: 'item-2', name: 'Vitamin C Syrup', qty: 1, price: 15000 },
  ],
  branch_id: 'branch-main',
  cashier_id: 'cashier-1',
  status: 'completed',
};

describe('Receipt component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLang('en');

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { business_name: 'Mlimani Pharmacy' } }),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { name: 'Mwenge Branch', location: 'Mwenge, Dar es Salaam', business_id: 'biz-1' },
          }),
        };
      }
      return {};
    });
  });

  it('renders thermal receipt with line items, discount, tax, balance due, and branch header', async () => {
    const onClose = vi.fn();
    render(<Receipt sale={baseSale} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Mwenge, Dar es Salaam')).toBeInTheDocument();
    });

    expect(screen.getByText('Mlimani Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Receipt: RC-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Panadol Extra')).toBeInTheDocument();
    expect(screen.getByText('Vitamin C Syrup')).toBeInTheDocument();
    expect(screen.getByText('Discount')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('Balance Due')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toggles from Thermal (80mm) to A4 PDF view and displays TAX INVOICE when balance is unpaid', async () => {
    render(<Receipt sale={baseSale} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Mwenge, Dar es Salaam')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /A4 PDF/i }));

    await waitFor(() => {
      expect(screen.getByText('TAX INVOICE')).toBeInTheDocument();
    });
    expect(screen.getByText('#RC-2026-001')).toBeInTheDocument();
    expect(screen.getByText(/Paid via mobile money/i)).toBeInTheDocument();
  });

  it('renders PROFORMA INVOICE header when sale status is pending and displays Split Payment notes', async () => {
    const proformaSplitSale = {
      ...baseSale,
      status: 'pending',
      amount_paid: 24000,
      notes: 'Split Payment: Cash TZS 10,000 + M-Pesa TZS 14,000',
    };

    render(<Receipt sale={proformaSplitSale} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Mwenge, Dar es Salaam')).toBeInTheDocument();
    });

    expect(screen.getByText('PROFORMA INVOICE')).toBeInTheDocument();
    expect(screen.getByText('Proforma invoice generated.')).toBeInTheDocument();
    expect(
      screen.getByText('Split Payment: Cash TZS 10,000 + M-Pesa TZS 14,000'),
    ).toBeInTheDocument();
  });

  it('triggers window.print with receipt title and opens WhatsApp share link', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    document.title = 'Original App Title';

    render(<Receipt sale={baseSale} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Mwenge, Dar es Salaam')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Print/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(document.title).toBe('Original App Title');

    fireEvent.click(screen.getByRole('button', { name: /WhatsApp Text/i }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    const [shareUrl, target] = openSpy.mock.calls[0];
    expect(String(shareUrl)).toContain('https://wa.me/?text=');
    expect(decodeURIComponent(String(shareUrl))).toContain('RC-2026-001');
    expect(decodeURIComponent(String(shareUrl))).toContain('Panadol Extra');
    expect(target).toBe('_blank');

    printSpy.mockRestore();
    openSpy.mockRestore();
  });
});
