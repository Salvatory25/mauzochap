import { formatPhoneNumberE164, SUPERADMIN_PHONE } from "./sms-service";

export interface MerchantRecord {
  id: string;
  business_name: string;
  owner_name?: string | null;
  phone?: string | null;
  email?: string | null;
  package?: string | null;
  account_status: string;
  expiry_date?: string | null;
  created_at?: string | null;
}

export interface ProfilePhoneRecord {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  business_id?: string | null;
  business_name?: string | null;
}

export interface SmsLogRecord {
  recipient?: string;
  body?: string;
  message?: string;
  text?: string;
  content?: string;
}

export interface EnrichedMerchant extends MerchantRecord {
  effectivePhone: string;
  phoneSource: "business" | "profile" | "sms_history" | "none";
}

function normalizeBizKey(name?: string | null): string {
  return (name || "").trim().toLowerCase();
}

/**
 * Extracts business-name -> phone mappings from previously sent SwalaSMS logs
 * (e.g., Super Admin registration/order alerts and merchant welcome messages).
 */
export function extractPhonesFromSmsHistory(messages: SmsLogRecord[]): Map<string, string> {
  const map = new Map<string, string>();
  const normSuperAdmin = formatPhoneNumberE164(SUPERADMIN_PHONE);

  for (const msg of messages || []) {
    const rawText = msg.body || msg.message || msg.text || msg.content || "";
    if (!rawText) continue;

    // 1. Super Admin registration / payment alert:
    // "• Duka: <BusinessName>" ... "• Simu: <Phone>"
    const dukaMatch = rawText.match(/Duka:\s*([^\n•]+)/i);
    const simuMatch = rawText.match(/Simu:\s*([+\d][\d\s\-().]{7,18})/i);
    if (dukaMatch?.[1] && simuMatch?.[1]) {
      const key = normalizeBizKey(dukaMatch[1]);
      const formatted = formatPhoneNumberE164(simuMatch[1]);
      if (key && formatted.length >= 10 && !map.has(key)) {
        map.set(key, formatted);
      }
    }

    // 2. Merchant Welcome SMS:
    // "...Duka lako la <BusinessName> limesajiliwa kikamilifu..."
    const welcomeMatch = rawText.match(/Duka lako la\s+(.+?)\s+limesajiliwa/i);
    if (welcomeMatch?.[1] && msg.recipient) {
      const key = normalizeBizKey(welcomeMatch[1]);
      const formatted = formatPhoneNumberE164(msg.recipient);
      if (key && formatted.length >= 10 && formatted !== normSuperAdmin && !map.has(key)) {
        map.set(key, formatted);
      }
    }
  }

  return map;
}

/**
 * Enriches registered businesses with phone numbers from:
 * 1) businesses.phone
 * 2) profiles.phone (matched by business_id or case-insensitive business_name)
 * 3) SwalaSMS sent message history (registration alerts & welcome SMS)
 */
export function enrichMerchantsWithPhones(
  businesses: MerchantRecord[],
  profiles: ProfilePhoneRecord[] = [],
  smsMessages: SmsLogRecord[] = [],
): EnrichedMerchant[] {
  const smsPhoneMap = extractPhonesFromSmsHistory(smsMessages);

  return (businesses || []).map((b) => {
    const bizNameKey = normalizeBizKey(b.business_name);

    const directPhone = (b.phone || "").trim();
    const matchedById = profiles.find((p) => p.business_id === b.id && !!(p.phone || "").trim());
    const matchedByName =
      !matchedById && bizNameKey
        ? profiles.find(
            (p) => normalizeBizKey(p.business_name) === bizNameKey && !!(p.phone || "").trim(),
          )
        : undefined;
    const matchedProfile = matchedById || matchedByName;

    const anyNamedProfile = profiles.find(
      (p) =>
        (p.business_id === b.id || (bizNameKey && normalizeBizKey(p.business_name) === bizNameKey)) &&
        !!(p.full_name || "").trim(),
    );

    const resolvedOwnerName =
      b.owner_name && b.owner_name !== "Owner"
        ? b.owner_name
        : anyNamedProfile?.full_name || b.owner_name || "";

    if (directPhone) {
      return {
        ...b,
        owner_name: resolvedOwnerName,
        effectivePhone: directPhone,
        phoneSource: "business",
      };
    }

    const profilePhone = (matchedProfile?.phone || "").trim();
    if (profilePhone) {
      return {
        ...b,
        owner_name: resolvedOwnerName,
        effectivePhone: profilePhone,
        phoneSource: "profile",
      };
    }

    const smsPhone = bizNameKey ? smsPhoneMap.get(bizNameKey) || "" : "";
    if (smsPhone) {
      return {
        ...b,
        owner_name: resolvedOwnerName,
        effectivePhone: smsPhone,
        phoneSource: "sms_history",
      };
    }

    return {
      ...b,
      owner_name: resolvedOwnerName,
      effectivePhone: "",
      phoneSource: "none",
    };
  });
}

export interface SmsAudienceStats {
  totalMerchants: number;
  merchantsWithPhone: number;
  merchantsMissingPhone: number;
  approvedTotal: number;
  approvedWithPhone: number;
  pendingTotal: number;
  pendingWithPhone: number;
  storeCustomersTotal: number;
  storeCustomersWithPhone: number;
}

export function computeSmsAudienceStats(
  enrichedMerchants: EnrichedMerchant[],
  storeCustomers: Array<{ phone?: string | null }> = [],
): SmsAudienceStats {
  const totalMerchants = enrichedMerchants.length;
  const merchantsWithPhone = enrichedMerchants.filter((m) => !!m.effectivePhone).length;
  const merchantsMissingPhone = totalMerchants - merchantsWithPhone;

  const approvedList = enrichedMerchants.filter((m) => m.account_status === "approved");
  const pendingList = enrichedMerchants.filter((m) => m.account_status === "pending");

  const storeCustomersTotal = storeCustomers.length;
  const storeCustomersWithPhone = storeCustomers.filter((c) => !!(c.phone || "").trim()).length;

  return {
    totalMerchants,
    merchantsWithPhone,
    merchantsMissingPhone,
    approvedTotal: approvedList.length,
    approvedWithPhone: approvedList.filter((m) => !!m.effectivePhone).length,
    pendingTotal: pendingList.length,
    pendingWithPhone: pendingList.filter((m) => !!m.effectivePhone).length,
    storeCustomersTotal,
    storeCustomersWithPhone,
  };
}

