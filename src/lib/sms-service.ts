/**
 * SwalaSMS API Integration Service for MauzoChap POS
 * Provider: SwalaSMS (https://api.swalasms.com)
 * Sender ID: MauzoChap (Approved & Live)
 */

const SWALASMS_API_KEY = "swl_live_SZvkG6VjaYRFKJlQHG6FCu8HJZDRCVVHYHWhqgf8VV6lhIeP";
const SWALASMS_BASE_URL = "https://api.swalasms.com";
export const SENDER_ID = "MauzoChap";

/**
 * Clean and format Tanzanian / International phone numbers into E.164 format (+255XXXXXXXXX)
 */
export function formatPhoneNumberE164(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "").trim();

  // If starts with 0 (e.g. 0712345678, 0627274168)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "+255" + cleaned.substring(1);
  }
  // If starts with 255 without +
  if (cleaned.startsWith("255") && cleaned.length === 12) {
    return "+" + cleaned;
  }
  // If already starts with +
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  // If starts with 7 or 6 and 9 digits
  if ((cleaned.startsWith("7") || cleaned.startsWith("6")) && cleaned.length === 9) {
    return "+255" + cleaned;
  }
  return cleaned;
}

export interface SendSMSOptions {
  recipient: string;
  body: string;
  senderId?: string;
  idempotencyKey?: string;
}

export interface SMSResponse {
  success: boolean;
  message?: string;
  request_uid?: string;
  data?: any;
  error_code?: string;
}

/**
 * Send a single SMS via SwalaSMS
 */
export async function sendSMS({
  recipient,
  body,
  senderId = SENDER_ID,
  idempotencyKey,
}: SendSMSOptions): Promise<SMSResponse> {
  const formattedRecipient = formatPhoneNumberE164(recipient);
  if (!formattedRecipient || formattedRecipient.length < 10) {
    return {
      success: false,
      message: "Namba ya simu si sahihi (Invalid phone number format)",
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${SWALASMS_API_KEY}`,
    "Content-Type": "application/json",
  };

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  try {
    const response = await fetch(`${SWALASMS_BASE_URL}/v1/sms/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        recipient: formattedRecipient,
        sender_id: senderId,
        body,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("SwalaSMS send error:", error);
    return {
      success: false,
      message: error?.message || "Imeshindwa kutuma ujumbe wa SMS",
    };
  }
}

/**
 * Send Swahili Welcome SMS upon new merchant registration
 */
export async function sendWelcomeSMS({
  phone,
  ownerName,
  businessName,
}: {
  phone: string;
  ownerName?: string | null;
  businessName: string;
}): Promise<SMSResponse> {
  const greeting = ownerName ? `Habari ${ownerName}, ` : "Habari, ";
  const body = `${greeting}karibu MauzoChap POS! Duka lako la ${businessName} limesajiliwa kikamilifu. Ingia https://www.mauzochap.co.tz kuanza kuuza, kukata risiti na kudhibiti stoo. Msaada: +255627274168.`;

  return sendSMS({
    recipient: phone,
    body,
    senderId: SENDER_ID,
  });
}

/**
 * Send Nightly 20:30 Sales Summary SMS to Business Owner
 */
export async function sendDailyReportSMS({
  phone,
  businessName,
  date,
  totalSales,
  orderCount,
  cashTotal,
  mobileTotal,
  lowStockCount = 0,
}: {
  phone: string;
  businessName: string;
  date: string;
  totalSales: number;
  orderCount: number;
  cashTotal: number;
  mobileTotal: number;
  lowStockCount?: number;
}): Promise<SMSResponse> {
  const body = `MauzoChap Ripoti ya Leo ${date} (${businessName}):\n• Jumla: TZS ${totalSales.toLocaleString()}\n• Risiti: ${orderCount}\n• Cash: TZS ${cashTotal.toLocaleString()}\n• Mitandao: TZS ${mobileTotal.toLocaleString()}${lowStockCount > 0 ? `\n• Bidhaa Chini ya Stoo: ${lowStockCount}` : ""}\nAsante kwa kutumia MauzoChap POS.`;

  return sendSMS({
    recipient: phone,
    body,
    senderId: SENDER_ID,
  });
}

/**
 * Send Password Reset / OTP SMS
 */
export async function sendOtpSMS({
  phone,
  code,
}: {
  phone: string;
  code: string;
}): Promise<SMSResponse> {
  const body = `Nambari yako ya siri ya uhakiki ya MauzoChap ni ${code}. Usitoe namba hii kwa mtu yeyote. Inatumika ndani ya dakika 10.`;

  return sendSMS({
    recipient: phone,
    body,
    senderId: SENDER_ID,
  });
}

/**
 * Check remaining SMS balance from SwalaSMS
 */
export async function getSMSBalance(): Promise<{
  success: boolean;
  balance: number;
  currency: string;
}> {
  try {
    const res = await fetch(`${SWALASMS_BASE_URL}/v1/balance`, {
      headers: {
        Authorization: `Bearer ${SWALASMS_API_KEY}`,
      },
    });
    const json = await res.json();
    if (json.success && json.data) {
      return {
        success: true,
        balance: json.data.balance || 0,
        currency: json.data.currency || "SMS",
      };
    }
    return { success: false, balance: 0, currency: "SMS" };
  } catch (e) {
    console.error("Failed to fetch SMS balance:", e);
    return { success: false, balance: 0, currency: "SMS" };
  }
}

/**
 * Fetch sent SMS history and delivery statuses from SwalaSMS
 */
export async function getSMSHistory(page = 1, perPage = 30): Promise<{
  success: boolean;
  messages: any[];
  total: number;
}> {
  try {
    const res = await fetch(
      `${SWALASMS_BASE_URL}/v1/sms/messages?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${SWALASMS_API_KEY}`,
        },
      }
    );
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return {
        success: true,
        messages: json.data,
        total: json.meta?.total || json.data.length,
      };
    }
    return { success: false, messages: [], total: 0 };
  } catch (e) {
    console.error("Failed to fetch SMS history:", e);
    return { success: false, messages: [], total: 0 };
  }
}

/**
 * Send bulk campaign to multiple customers
 */
export async function sendBulkSMS({
  recipients,
  message,
  campaignName = "MauzoChap Broadcast",
}: {
  recipients: Array<{ to: string; name?: string }>;
  message: string;
  campaignName?: string;
}): Promise<SMSResponse> {
  const formattedRecipients = recipients.map((r) => ({
    to: formatPhoneNumberE164(r.to),
    ...(r.name ? { name: r.name } : {}),
  }));

  try {
    const res = await fetch(`${SWALASMS_BASE_URL}/v2/sms/send-bulk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SWALASMS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipients: formattedRecipients,
        message,
        sender_id: SENDER_ID,
        campaign_name: campaignName,
      }),
    });
    return await res.json();
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to send bulk SMS",
    };
  }
}
