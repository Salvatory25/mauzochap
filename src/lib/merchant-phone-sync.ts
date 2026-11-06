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
  phoneSource: "business" | "profile" | "registry" | "sms_history" | "none";
}

function normalizeBizKey(name?: string | null): string {
  return (name || "").trim().toLowerCase();
}

/**
 * Registry of known verified merchant accounts created during system setup and registration.
 * Guarantees that registered business owners always have their registered phone number available.
 */
export interface KnownMerchantEntry {
  email?: string;
  businessName?: string;
  ownerName?: string;
  phone: string;
}

export const KNOWN_MERCHANT_REGISTRY: KnownMerchantEntry[] = [
  {
    businessName: "Machesha Electronics",
    ownerName: "Machesha Salvatory",
    email: "macheshasalvatory@gmail.com",
    phone: "+255627274168",
  },
  {
    businessName: "MauzoChap Central Admin",
    ownerName: "Salvatory Filbert",
    email: "salvatoryfilbert2@gmail.com",
    phone: "+255627274168",
  },
  {
    businessName: "yompria",
    ownerName: "faisal",
    email: "dengwafaisal@gmail.com",
    phone: "+255679913271",
  },
  {
    businessName: "Kapele Web Services",
    ownerName: "Developer Kapele",
    email: "developerkapele7@gmail.com",
    phone: "+255748406824",
  },
  {
    businessName: "Silivia Cosmetics",
    ownerName: "SILIVIA MASENGE",
    email: "siliviamasenge2@gmail.com",
    phone: "+255623136890",
  },
  {
    businessName: "MacTech Digital Store",
    ownerName: "MacTech Digital",
    email: "salvatoryfilberth@gmail.com",
    phone: "+255789115651",
  },
  {
    businessName: "Salvie Fashion & Design",
    ownerName: "Salvie Designer",
    email: "salvatoryfilbett@gmail.com",
    phone: "+255627274168",
  },
  {
    businessName: "Mimi Hapa General Supplies",
    ownerName: "mimi hapa",
    email: "mimihapa@gmail.com",
    phone: "+255623136890",
  },
  {
    businessName: "Dev Machesha Tech Lab 1",
    ownerName: "Dev Machesha",
    email: "salvatoryfilber2@gmail.com",
    phone: "+255627274168",
  },
  {
    businessName: "Dev Machesha Tech Lab 2",
    ownerName: "Dev Machesha",
    email: "salvatoryfilbert25@gmail.com",
    phone: "+255627274168",
  },
  {
    businessName: "Dev Machesha Tech Lab 3",
    ownerName: "Dev Machesha",
    email: "salvatoryfilbet@gmail.com",
    phone: "+255627274168",
  },
  {
    businessName: "Dev Machesha Tech Lab 4",
    ownerName: "Dev Machesha",
    email: "salvatoryfilber@gmail.com",
    phone: "+255627274168",
  },
];

const REGISTRY_STORAGE_KEY = "mauzochap_registered_merchant_phones";

/**
 * Stores registered merchant phone numbers persistently across browser sessions
 */
export function rememberMerchantPhone({
  email,
  businessName,
  businessId,
  ownerName,
  phone,
}: {
  email?: string | null;
  businessName?: string | null;
  businessId?: string | null;
  ownerName?: string | null;
  phone: string;
}) {
  if (typeof window === "undefined" || !phone) return;
  const formatted = formatPhoneNumberE164(phone);
  if (formatted.length < 10) return;

  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    const registry: Record<string, string> = raw ? JSON.parse(raw) : {};

    if (email) registry[`email:${email.trim().toLowerCase()}`] = formatted;
    if (businessName) registry[`biz:${normalizeBizKey(businessName)}`] = formatted;
    if (businessId) registry[`id:${businessId}`] = formatted;
    if (ownerName) registry[`owner:${normalizeBizKey(ownerName)}`] = formatted;

    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Ignore storage issues in restricted environments
  }
}

/**
 * Looks up persistent registration phone from client storage
 */
export function lookupStoredMerchantPhone({
  email,
  businessName,
  businessId,
  ownerName,
}: {
  email?: string | null;
  businessName?: string | null;
  businessId?: string | null;
  ownerName?: string | null;
}): string {
  if (typeof window === "undefined") return "";

  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) return "";
    const registry: Record<string, string> = JSON.parse(raw);

    if (businessId && registry[`id:${businessId}`]) return registry[`id:${businessId}`];
    if (email && registry[`email:${email.trim().toLowerCase()}`])
      return registry[`email:${email.trim().toLowerCase()}`];
    if (businessName && registry[`biz:${normalizeBizKey(businessName)}`])
      return registry[`biz:${normalizeBizKey(businessName)}`];
    if (ownerName && registry[`owner:${normalizeBizKey(ownerName)}`])
      return registry[`owner:${normalizeBizKey(ownerName)}`];
  } catch {
    // Ignore
  }

  return "";
}

/**
 * Looks up registered merchant phone from known registry
 */
export function lookupKnownRegistryPhone({
  email,
  businessName,
  ownerName,
}: {
  email?: string | null;
  businessName?: string | null;
  ownerName?: string | null;
}): string {
  const normEmail = (email || "").trim().toLowerCase();
  const normBiz = normalizeBizKey(businessName);
  const normOwner = normalizeBizKey(ownerName);

  for (const entry of KNOWN_MERCHANT_REGISTRY) {
    if (normEmail && entry.email && entry.email.toLowerCase() === normEmail) {
      return formatPhoneNumberE164(entry.phone);
    }
    if (normBiz && entry.businessName && normalizeBizKey(entry.businessName) === normBiz) {
      return formatPhoneNumberE164(entry.phone);
    }
    if (normOwner && entry.ownerName && normalizeBizKey(entry.ownerName) === normOwner) {
      return formatPhoneNumberE164(entry.phone);
    }
  }

  return "";
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
 * 3) Stored persistent registration registry (client session cache)
 * 4) Known merchant registry (system verified accounts)
 * 5) SwalaSMS sent message history (registration alerts & welcome SMS)
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

    // 1. Direct phone on businesses table
    if (directPhone) {
      return {
        ...b,
        owner_name: resolvedOwnerName,
        effectivePhone: directPhone,
        phoneSource: "business",
      };
    }

    // 2. Profile phone
    const profilePhone = (matchedProfile?.phone || "").trim();
    if (profilePhone) {
      return {
        ...b,
        owner_name: resolvedOwnerName,
        effectivePhone: profilePhone,
        phoneSource: "profile",
      };
    }

    // 3. Stored registration registry
    const storedPhone = lookupStoredMerchantPhone({
      email: b.email,
      businessName: b.business_name,
      businessId: b.id,
      ownerName: resolvedOwnerName,
    });
    if (storedPhone) {
      return {
        ...b,
        owner_name: resolvedOwnerName,
        effectivePhone: storedPhone,
        phoneSource: "registry",
      };
    }

    // 4. Known registered merchants registry
    const knownPhone = lookupKnownRegistryPhone({
      email: b.email,
      businessName: b.business_name,
      ownerName: resolvedOwnerName,
    });
    if (knownPhone) {
      return {
        ...b,
        owner_name: resolvedOwnerName,
        effectivePhone: knownPhone,
        phoneSource: "registry",
      };
    }

    // 5. SMS history logs
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

