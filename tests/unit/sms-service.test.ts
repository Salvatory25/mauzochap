import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SENDER_ID,
  SUPERADMIN_PHONE,
  formatPhoneNumberE164,
  sendSMS,
  sendWelcomeSMS,
  sendStaffWelcomeSMS,
  notifySuperAdminNewRegistration,
  notifySuperAdminNewOrder,
  sendDailyReportSMS,
  sendOtpSMS,
  getSMSBalance,
  getSMSHistory,
  sendBulkSMS,
} from '@/lib/sms-service';

describe('sms-service utilities & API client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('formatPhoneNumberE164', () => {
    it('returns empty string for empty input', () => {
      expect(formatPhoneNumberE164('')).toBe('');
    });

    it('converts local 10-digit 07XX and 06XX Tanzanian numbers to +255', () => {
      expect(formatPhoneNumberE164('0712345678')).toBe('+255712345678');
      expect(formatPhoneNumberE164('0627274168')).toBe('+255627274168');
    });

    it('strips spaces, hyphens, parentheses, and dots before formatting', () => {
      expect(formatPhoneNumberE164('0712 345 678')).toBe('+255712345678');
      expect(formatPhoneNumberE164('(0627)-274.168')).toBe('+255627274168');
    });

    it('adds leading + to 12-digit 255XXXXXXXXX numbers', () => {
      expect(formatPhoneNumberE164('255754112233')).toBe('+255754112233');
    });

    it('prefixes +255 to 9-digit numbers starting with 7 or 6', () => {
      expect(formatPhoneNumberE164('712345678')).toBe('+255712345678');
      expect(formatPhoneNumberE164('655987654')).toBe('+255655987654');
    });

    it('preserves numbers already in E.164 format', () => {
      expect(formatPhoneNumberE164('+255712345678')).toBe('+255712345678');
      expect(formatPhoneNumberE164('+254711223344')).toBe('+254711223344');
    });

    it('returns cleaned value as-is for unrecognized short formats', () => {
      expect(formatPhoneNumberE164('12345')).toBe('12345');
    });
  });

  describe('sendSMS', () => {
    it('rejects empty or invalid short phone numbers without calling fetch', async () => {
      const emptyRes = await sendSMS({ recipient: '', body: 'Hello' });
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.message).toContain('Invalid phone number');

      const shortRes = await sendSMS({ recipient: '07123', body: 'Hello' });
      expect(shortRes.success).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sends formatted POST payload with Authorization and optional Idempotency-Key headers', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, request_uid: 'req_123' }),
      });

      const res = await sendSMS({
        recipient: '0712 345 678',
        body: 'Habari za leo',
        idempotencyKey: 'idem-001',
      });

      expect(res).toEqual({ success: true, request_uid: 'req_123' });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.swalasms.com/v1/sms/messages');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toMatch(/^Bearer /);
      expect(options.headers['Idempotency-Key']).toBe('idem-001');
      expect(JSON.parse(options.body)).toEqual({
        recipient: '+255712345678',
        sender_id: SENDER_ID,
        body: 'Habari za leo',
      });
    });

    it('handles network exceptions gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const res = await sendSMS({
        recipient: '+255712345678',
        body: 'Test',
      });

      expect(res).toEqual({
        success: false,
        message: 'Network timeout',
      });
    });
  });

  describe('transactional SMS templates', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        json: async () => ({ success: true }),
      });
    });

    it('sendWelcomeSMS personalizes greeting when ownerName is provided and falls back cleanly when omitted', async () => {
      await sendWelcomeSMS({
        phone: '0712345678',
        ownerName: 'Juma',
        businessName: 'Juma Mart',
      });
      let payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.body).toContain('Habari Juma, karibu MauzoChap POS!');
      expect(payload.body).toContain('Juma Mart');

      await sendWelcomeSMS({
        phone: '0712345678',
        ownerName: null,
        businessName: 'Kariakoo Shop',
      });
      payload = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(payload.body).toContain('Habari, karibu MauzoChap POS!');
    });

    it('sendStaffWelcomeSMS maps admin, manager, and cashier roles to Swahili titles', async () => {
      await sendStaffWelcomeSMS({
        phone: '0712345678',
        fullName: 'Asha Ali',
        businessName: 'Asha Pharmacy',
        role: 'admin',
        email: 'asha@shop.co.tz',
      });
      let payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.body).toContain('Msimamizi (Admin)');
      expect(payload.body).toContain('Tumia email: asha@shop.co.tz');

      await sendStaffWelcomeSMS({
        phone: '0712345678',
        fullName: 'Baraka',
        businessName: 'Asha Pharmacy',
        role: 'manager',
      });
      payload = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(payload.body).toContain('Meneja');
      expect(payload.body).not.toContain('Tumia email:');

      await sendStaffWelcomeSMS({
        phone: '0712345678',
        fullName: 'Neema',
        businessName: 'Asha Pharmacy',
        role: 'cashier',
      });
      payload = JSON.parse(mockFetch.mock.calls[2][1].body);
      expect(payload.body).toContain('Muuzaji (Cashier)');
    });

    it('notifySuperAdminNewRegistration & notifySuperAdminNewOrder alert SUPERADMIN_PHONE', async () => {
      await notifySuperAdminNewRegistration({
        businessName: 'Mwanza Hardware',
        ownerName: 'Kelvin',
        phone: '0755000111',
        region: 'Mwanza',
        packageName: 'serengeti',
      });
      const regPayload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(regPayload.recipient).toBe(SUPERADMIN_PHONE);
      expect(regPayload.body).toContain('Mwanza Hardware');
      expect(regPayload.body).toContain('SERENGETI');

      await notifySuperAdminNewOrder({
        businessName: 'Mwanza Hardware',
        packageName: 'kilimanjaro',
        amount: 15500,
        paymentRef: 'MPESA998877',
        phone: '0755000111',
      });
      const orderPayload = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(orderPayload.recipient).toBe(SUPERADMIN_PHONE);
      expect(orderPayload.body).toContain('KILIMANJARO');
      expect(orderPayload.body).toContain('15,500');
      expect(orderPayload.body).toContain('MPESA998877');
    });

    it('sendDailyReportSMS conditionally includes low stock line when lowStockCount > 0', async () => {
      await sendDailyReportSMS({
        phone: '0712345678',
        businessName: 'Dar Super',
        date: '05 Nov 2026',
        totalSales: 500000,
        orderCount: 24,
        cashTotal: 300000,
        mobileTotal: 200000,
        lowStockCount: 0,
      });
      const withoutLowStock = JSON.parse(mockFetch.mock.calls[0][1].body).body;
      expect(withoutLowStock).not.toContain('Bidhaa Chini ya Stoo');

      await sendDailyReportSMS({
        phone: '0712345678',
        businessName: 'Dar Super',
        date: '05 Nov 2026',
        totalSales: 500000,
        orderCount: 24,
        cashTotal: 300000,
        mobileTotal: 200000,
        lowStockCount: 4,
      });
      const withLowStock = JSON.parse(mockFetch.mock.calls[1][1].body).body;
      expect(withLowStock).toContain('Bidhaa Chini ya Stoo: 4');
    });

    it('sendOtpSMS includes verification code in Swahili security message', async () => {
      await sendOtpSMS({ phone: '0712345678', code: '482910' });
      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.body).toContain('482910');
      expect(payload.body).toContain('dakika 10');
    });
  });

  describe('balance, history, and bulk endpoints', () => {
    it('getSMSBalance parses balance response and handles failures safely', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, data: { balance: 1450, currency: 'TZS' } }),
      });
      expect(await getSMSBalance()).toEqual({
        success: true,
        balance: 1450,
        currency: 'TZS',
      });

      mockFetch.mockRejectedValueOnce(new Error('Offline'));
      expect(await getSMSBalance()).toEqual({
        success: false,
        balance: 0,
        currency: 'SMS',
      });
    });

    it('getSMSHistory fetches paginated messages and falls back safely on error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: [{ id: 'm1' }, { id: 'm2' }],
          meta: { total: 42 },
        }),
      });

      const res = await getSMSHistory(2, 15);
      expect(mockFetch.mock.calls[0][0]).toBe(
        'https://api.swalasms.com/v1/sms/messages?page=2&per_page=15',
      );
      expect(res).toEqual({
        success: true,
        messages: [{ id: 'm1' }, { id: 'm2' }],
        total: 42,
      });

      mockFetch.mockRejectedValueOnce(new Error('Failed'));
      expect(await getSMSHistory()).toEqual({
        success: false,
        messages: [],
        total: 0,
      });
    });

    it('sendBulkSMS normalizes all recipient phone numbers to E.164', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true, message: 'Queued' }),
      });

      const res = await sendBulkSMS({
        recipients: [
          { to: '0712345678', name: 'Amina' },
          { to: '0627274168' },
        ],
        message: 'Punguzo kubwa leo!',
        campaignName: 'Nov Promo',
      });

      expect(res.success).toBe(true);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.swalasms.com/v2/sms/send-bulk');
      expect(JSON.parse(opts.body)).toEqual({
        recipients: [
          { to: '+255712345678', name: 'Amina' },
          { to: '+255627274168' },
        ],
        message: 'Punguzo kubwa leo!',
        sender_id: SENDER_ID,
        campaign_name: 'Nov Promo',
      });
    });
  });
});

