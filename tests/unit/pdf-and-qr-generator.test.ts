import { describe, it, expect } from 'vitest';
import { generateInvoicePdfDoc, buildOfficialWhatsAppSummary } from '@/lib/pdf-generator';
import { generateQrDataUrl } from '@/lib/qr-generator';

describe('PDF and QR Generator', () => {
  it('generates an offline QR code base64 Data URL without network errors', async () => {
    const dataUrl = await generateQrDataUrl('Invoice: INV-2026-001\nTotal: 25000', 100);
    expect(dataUrl).toContain('data:image/png;base64,');
  });

  it('builds an official corporate WhatsApp tax invoice summary without informal phrasing', () => {
    const summary = buildOfficialWhatsAppSummary({
      invoiceNumber: 'INV-2026-999',
      businessName: 'Mlimani Pharmacy',
      customerName: 'Juma Selemani',
      createdAt: '2026-11-06T10:00:00Z',
      total: 75000,
      paid: 50000,
      balance: 25000,
      paymentStatus: 'Partial',
    });

    expect(summary).toContain('*TAX INVOICE / RISITI: #INV-2026-999*');
    expect(summary).toContain('Mlimani Pharmacy');
    expect(summary).toContain('Juma Selemani');
    expect(summary).toContain('75,000');
    expect(summary).toContain('25,000');
    expect(summary).toContain('Nyaraka rasmi ya kodi (PDF) imeambatanishwa.');
    // Ensure no informal phrases
    expect(summary).not.toContain('Hello');
    expect(summary).not.toContain('Here is your invoice');
  });

  it('generates a jsPDF invoice document with tables and totals', async () => {
    const doc = await generateInvoicePdfDoc({
      invoice_number: 'INV-2026-101',
      created_at: '2026-11-06T12:00:00Z',
      business_name: 'Mlimani Pharmacy',
      business_phone: '+255714000111',
      business_email: 'info@mlimanipharmacy.co.tz',
      customer_name: 'Asha Bakari',
      payment_method: 'mobile_money',
      payment_status: 'Paid',
      subtotal: 50000,
      discount: 5000,
      tax: 8100,
      total_amount: 53100,
      amount_paid: 53100,
      balance: 0,
      items: [
        {
          name: 'Amoxicillin 500mg',
          quantity: 2.5,
          unit_price: 10000,
          subtotal: 25000,
        },
        {
          name: 'Paracetamol Syrup',
          quantity: 1.5,
          unit_price: 16666.67,
          subtotal: 25000,
        },
      ],
    });

    expect(doc).toBeDefined();
    const blob = doc.output('blob');
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe('application/pdf');
  });
});
