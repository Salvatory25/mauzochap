import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractPhonesFromSmsHistory,
  enrichMerchantsWithPhones,
  computeSmsAudienceStats,
  rememberMerchantPhone,
  lookupStoredMerchantPhone,
  lookupKnownRegistryPhone,
  KNOWN_MERCHANT_REGISTRY,
  type MerchantRecord,
  type ProfilePhoneRecord,
  type SmsLogRecord,
} from '@/lib/merchant-phone-sync';
import { SUPERADMIN_PHONE } from '@/lib/sms-service';

describe('merchant-phone-sync (Super Admin SMS & Registered Customers)', () => {
  describe('extractPhonesFromSmsHistory', () => {
    it('extracts business phones from Super Admin registration & order alert SMS logs', () => {
      const logs: SmsLogRecord[] = [
        {
          recipient: SUPERADMIN_PHONE,
          body: 'MAUZOCHAP ADMIN: Usajili Mpya!\n• Duka: Kariakoo Mart\n• Mmiliki: Asha\n• Simu: 0754 111 222\n• Kifurushi: KILIMANJARO',
        },
        {
          recipient: SUPERADMIN_PHONE,
          message:
            'MAUZOCHAP MALIPO: Ombi la Kifurushi!\n• Duka: Arusha Agrovet\n• Simu: +255688333444\n• Ref: MPESA998',
        },
      ];

      const map = extractPhonesFromSmsHistory(logs);
      expect(map.get('kariakoo mart')).toBe('+255754111222');
      expect(map.get('arusha agrovet')).toBe('+255688333444');
    });

    it('extracts merchant recipient phone from Welcome SMS while ignoring Super Admin phone', () => {
      const logs: SmsLogRecord[] = [
        {
          recipient: '0713999888',
          text: 'Hongera Juma! Duka lako la Mwanza Hardware limesajiliwa kikamilifu kwenye MauzoChap POS.',
        },
        {
          recipient: SUPERADMIN_PHONE,
          text: 'Hongera Admin! Duka lako la Admin Test Shop limesajiliwa kikamilifu kwenye MauzoChap POS.',
        },
      ];

      const map = extractPhonesFromSmsHistory(logs);
      expect(map.get('mwanza hardware')).toBe('+255713999888');
      expect(map.has('admin test shop')).toBe(false);
    });
  });

  describe('enrichMerchantsWithPhones', () => {
    const businesses: MerchantRecord[] = [
      {
        id: 'biz-1',
        business_name: 'Direct Phone Shop',
        owner_name: 'Neema',
        phone: '+255711000111',
        account_status: 'approved',
      },
      {
        id: 'biz-2',
        business_name: 'Profile ID Shop',
        owner_name: 'Owner',
        phone: null,
        account_status: 'approved',
      },
      {
        id: 'biz-3',
        business_name: 'Profile Name Shop',
        owner_name: null,
        phone: '',
        account_status: 'pending',
      },
      {
        id: 'biz-4',
        business_name: 'History Recovered Shop',
        owner_name: 'Baraka',
        phone: null,
        account_status: 'pending',
      },
      {
        id: 'biz-5',
        business_name: 'No Phone Yet Shop',
        owner_name: 'Halima',
        phone: null,
        account_status: 'approved',
      },
    ];

    const profiles: ProfilePhoneRecord[] = [
      {
        id: 'prof-2',
        business_id: 'biz-2',
        full_name: 'Kelvin Mushi',
        phone: '+255755222333',
      },
      {
        id: 'prof-3',
        business_id: null,
        business_name: '  profile name shop ',
        full_name: 'Zainab Ali',
        phone: '+255766444555',
      },
    ];

    const smsHistory: SmsLogRecord[] = [
      {
        recipient: SUPERADMIN_PHONE,
        body: 'Usajili Mpya!\n• Duka: History Recovered Shop\n• Simu: 0784777888',
      },
    ];

    it('resolves phone numbers in priority order (business -> profile ID -> profile name -> SMS history -> none)', () => {
      const enriched = enrichMerchantsWithPhones(businesses, profiles, smsHistory);

      expect(enriched[0].effectivePhone).toBe('+255711000111');
      expect(enriched[0].phoneSource).toBe('business');

      expect(enriched[1].effectivePhone).toBe('+255755222333');
      expect(enriched[1].phoneSource).toBe('profile');
      expect(enriched[1].owner_name).toBe('Kelvin Mushi');

      expect(enriched[2].effectivePhone).toBe('+255766444555');
      expect(enriched[2].phoneSource).toBe('profile');
      expect(enriched[2].owner_name).toBe('Zainab Ali');

      expect(enriched[3].effectivePhone).toBe('+255784777888');
      expect(enriched[3].phoneSource).toBe('sms_history');

      expect(enriched[4].effectivePhone).toBe('');
      expect(enriched[4].phoneSource).toBe('none');
    });
  });

  describe('known registry & persistent client storage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('resolves real registered merchant phones by email or business name via KNOWN_MERCHANT_REGISTRY', () => {
      const liveSystemMerchants: MerchantRecord[] = [
        {
          id: 'biz-machesha',
          business_name: 'Machesha Electronics',
          owner_name: 'Machesha Salvatory',
          email: 'macheshasalvatory@gmail.com',
          phone: null, // Empty in businesses table
          account_status: 'approved',
        },
        {
          id: 'biz-yompria',
          business_name: 'yompria',
          owner_name: 'faisal',
          email: 'dengwafaisal@gmail.com',
          phone: '', // Empty in businesses table
          account_status: 'approved',
        },
        {
          id: 'biz-kapele',
          business_name: 'Kapele Web Services',
          owner_name: 'Developer Kapele',
          email: 'developerkapele7@gmail.com',
          phone: null,
          account_status: 'approved',
        },
        {
          id: 'biz-silivia',
          business_name: 'Silivia Cosmetics',
          owner_name: 'SILIVIA MASENGE',
          email: 'siliviamasenge2@gmail.com',
          phone: null,
          account_status: 'approved',
        },
      ];

      // Even without profiles or SMS logs, they are all immediately resolved
      const enriched = enrichMerchantsWithPhones(liveSystemMerchants, [], []);

      expect(enriched[0].effectivePhone).toBe('+255627274168');
      expect(enriched[0].phoneSource).toBe('registry');

      expect(enriched[1].effectivePhone).toBe('+255679913271');
      expect(enriched[1].phoneSource).toBe('registry');

      expect(enriched[2].effectivePhone).toBe('+255748406824');
      expect(enriched[2].phoneSource).toBe('registry');

      expect(enriched[3].effectivePhone).toBe('+255623136890');
      expect(enriched[3].phoneSource).toBe('registry');

      const stats = computeSmsAudienceStats(enriched, []);
      expect(stats.totalMerchants).toBe(4);
      expect(stats.merchantsWithPhone).toBe(4);
      expect(stats.merchantsMissingPhone).toBe(0);
    });

    it('remembers and resolves newly registered customer phones across browser sessions', () => {
      rememberMerchantPhone({
        email: 'newcustomer@gmail.com',
        businessName: 'Kilimanjaro Fresh Coffee',
        ownerName: 'Amani Joseph',
        phone: '0714 555 666',
      });

      const foundByEmail = lookupStoredMerchantPhone({ email: 'newcustomer@gmail.com' });
      expect(foundByEmail).toBe('+255714555666');

      const foundByBiz = lookupStoredMerchantPhone({ businessName: 'kilimanjaro fresh coffee' });
      expect(foundByBiz).toBe('+255714555666');

      const newBiz: MerchantRecord[] = [
        {
          id: 'biz-new',
          business_name: 'Kilimanjaro Fresh Coffee',
          email: 'newcustomer@gmail.com',
          phone: null,
          account_status: 'pending',
        },
      ];

      const enriched = enrichMerchantsWithPhones(newBiz, [], []);
      expect(enriched[0].effectivePhone).toBe('+255714555666');
      expect(enriched[0].phoneSource).toBe('registry');
    });
  });

  describe('computeSmsAudienceStats', () => {
    it('never reports 0 total accounts when 11 businesses are registered without phones, and counts phone-ready recipients accurately', () => {
      const elevenBusinessesNoPhones: MerchantRecord[] = Array.from({ length: 11 }, (_, idx) => ({
        id: `biz-${idx + 1}`,
        business_name: `Duka ${idx + 1}`,
        phone: null,
        account_status: idx < 7 ? 'approved' : 'pending',
      }));

      const unenriched = enrichMerchantsWithPhones(elevenBusinessesNoPhones, [], []);
      const statsBeforePhones = computeSmsAudienceStats(unenriched, [
        { phone: '+255712000001' },
        { phone: null },
      ]);

      expect(statsBeforePhones.totalMerchants).toBe(11);
      expect(statsBeforePhones.approvedTotal).toBe(7);
      expect(statsBeforePhones.pendingTotal).toBe(4);
      expect(statsBeforePhones.merchantsMissingPhone).toBe(11);
      expect(statsBeforePhones.merchantsWithPhone).toBe(0);
      expect(statsBeforePhones.storeCustomersTotal).toBe(2);
      expect(statsBeforePhones.storeCustomersWithPhone).toBe(1);

      // Now simulate 9 of the 11 phones synced via profiles/RPC
      const profilesWithPhones: ProfilePhoneRecord[] = Array.from({ length: 9 }, (_, idx) => ({
        id: `prof-${idx + 1}`,
        business_id: `biz-${idx + 1}`,
        phone: `+25575400000${idx}`,
      }));

      const enrichedAfterSync = enrichMerchantsWithPhones(
        elevenBusinessesNoPhones,
        profilesWithPhones,
        [],
      );
      const statsAfterSync = computeSmsAudienceStats(enrichedAfterSync, []);

      expect(statsAfterSync.totalMerchants).toBe(11);
      expect(statsAfterSync.merchantsWithPhone).toBe(9);
      expect(statsAfterSync.merchantsMissingPhone).toBe(2);
      expect(statsAfterSync.approvedWithPhone).toBe(7);
      expect(statsAfterSync.pendingWithPhone).toBe(2);
    });
  });
});

