/**
 * MauzoChap Branded Transactional Email Service
 * Dispatches real HTML card emails from "MauzoChap <mauzochap@gmail.com>"
 * via the `mauzochap-email` Supabase Edge Function.
 */
import { supabase } from "@/integrations/supabase/client";

export const SUPERADMIN_EMAIL = "salvatoryfilbert2@gmail.com";
export const MAUZOCHAP_APP_URL = "https://www.mauzochap.co.tz";

export interface EmailSummaryRow {
  label: string;
  value: string;
  mono?: boolean;
}

export interface EmailOptions {
  to: string;
  subject: string;
  body?: string;
  heading?: string;
  greetingName?: string;
  highlightText?: string;
  tone?: "success" | "warning" | "danger" | "info";
  rows?: EmailSummaryRow[];
  ctaLabel?: string;
  ctaUrl?: string;
  purpose?: string;
  otpCode?: string;
  copyCode?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
}

function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Generates the MauzoChap Dark-Blue branded card HTML template with 1-tap selectable code support
 */
export function buildMauzoChapCardHtml(options: EmailOptions): string {
  const toneColors = {
    success: { border: "#1e3a8a", boxBg: "#eff6ff", boxText: "#0f172a" },
    info: { border: "#2563eb", boxBg: "#eff6ff", boxText: "#0f172a" },
    warning: { border: "#d97706", boxBg: "#fffbeb", boxText: "#78350f" },
    danger: { border: "#dc2626", boxBg: "#fef2f2", boxText: "#7f1d1d" },
  };
  const palette = toneColors[options.tone || "success"];
  const heading = escapeHtml(options.heading || options.subject);
  const greeting = options.greetingName
    ? `Habari ${escapeHtml(options.greetingName)},`
    : "Habari,";
  const highlight = escapeHtml(options.highlightText || options.body || "").replace(/\n/g, "<br/>");
  const rows = options.rows || [];
  const activeCode = (options.otpCode || options.copyCode || "").trim();

  const codeHtml = activeCode
    ? `<div style="margin:20px 0 8px;text-align:center;"><div style="display:inline-block;background:#f8fafc;border:2px dashed #1e3a8a;border-radius:12px;padding:14px 28px;"><code style="font-family:monospace;font-size:30px;font-weight:800;letter-spacing:6px;color:#0f172a;user-select:all;-webkit-user-select:all;">${escapeHtml(activeCode)}</code></div></div>`
    : "";

  const rowsHtml = rows
    .map(
      (r) =>
        `<tr><td style="padding:11px 8px 11px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">${escapeHtml(r.label)}</td><td style="padding:11px 0 11px 8px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:15px;font-weight:700;text-align:right;">${escapeHtml(r.value)}</td></tr>`,
    )
    .join("");

  return `<div style="background:#f1f5f9;padding:20px 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #cbd5e1;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:24px 22px;text-align:center;border-bottom:3px solid #2563eb;"><div style="font-size:13px;font-weight:700;color:#93c5fd;">MauzoChap POS</div><h2 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:800;">${heading}</h2></div><div style="padding:26px 22px;"><p style="margin:0 0 14px;color:#0f172a;font-size:16px;font-weight:600;">${greeting}</p><div style="background:${palette.boxBg};border-left:4px solid ${palette.border};border-radius:8px;padding:14px 16px;color:${palette.boxText};font-size:15px;line-height:1.6;">${highlight}</div>${codeHtml}${rowsHtml ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-collapse:collapse;">${rowsHtml}</table>` : ""}</div></div></div>`;
}

/**
 * Send a branded MauzoChap email through the Supabase Edge Function `mauzochap-email`
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  if (!options?.to || !options.to.includes("@")) {
    return { success: false, error: "Barua pepe si sahihi (Invalid email address)" };
  }

  try {
    const fnInvoker = (supabase as any)?.functions?.invoke;
    if (typeof fnInvoker !== "function") {
      return { success: false, error: "Supabase functions client unavailable" };
    }

    const { data, error } = await (supabase as any).functions.invoke("mauzochap-email", {
      body: options,
    });

    if (error) {
      console.warn("MauzoChap email dispatch warning:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    if (data && data.success === false) {
      return {
        success: false,
        error: data.error || "Email dispatch rejected",
        code: data.code,
      };
    }

    return {
      success: true,
      messageId: data?.messageId,
    };
  } catch (err: any) {
    console.warn("MauzoChap email error:", err);
    return {
      success: false,
      error: err?.message || "Imeshindwa kutuma barua pepe",
    };
  }
}

/**
 * 1. Merchant Welcome Registration Email
 */
export async function sendWelcomeEmail({
  to,
  ownerName,
  businessName,
  phone,
  region,
  packageName = "Kilimanjaro",
}: {
  to: string;
  ownerName: string;
  businessName: string;
  phone?: string;
  region?: string;
  packageName?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    to,
    purpose: "welcome_registration",
    subject: `Karibu MauzoChap POS - ${businessName}`,
    heading: "Karibu MauzoChap POS",
    greetingName: ownerName,
    tone: "success",
    highlightText: `Habari ${ownerName}, hongera! Duka lako la ${businessName} limesajiliwa kikamilifu kwenye mfumo wa MauzoChap POS. Sasa unaweza kuuza, kukata risiti, kufuatilia stoo na kuona faida yako papo hapo.`,
    rows: [
      { label: "Jina la Duka", value: businessName },
      { label: "Mmiliki", value: ownerName },
      { label: "Barua Pepe", value: to },
      ...(phone ? [{ label: "Simu", value: phone }] : []),
      ...(region ? [{ label: "Mkoa", value: region }] : []),
      { label: "Kifurushi", value: packageName.toUpperCase() },
    ],
    ctaLabel: "Ingia Kwenye Duka Lako",
    ctaUrl: `${MAUZOCHAP_APP_URL}/setup-billing`,
  });
}

/**
 * Notify Super Admin by Email when a new business registers
 */
export async function notifySuperAdminNewRegistrationEmail({
  businessName,
  ownerName,
  email,
  phone,
  region,
  packageName = "Kilimanjaro",
}: {
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string;
  region?: string;
  packageName?: string;
}): Promise<EmailResponse> {
  return sendEmail({
    to: SUPERADMIN_EMAIL,
    purpose: "welcome_registration",
    subject: `Usajili Mpya wa Duka - ${businessName}`,
    heading: "Usajili Mpya wa Duka",
    greetingName: "Super Admin",
    tone: "info",
    highlightText: `Duka jipya la ${businessName} limesajiliwa kwenye MauzoChap POS na ${ownerName}.`,
    rows: [
      { label: "Duka", value: businessName },
      { label: "Mmiliki", value: ownerName },
      { label: "Email", value: email },
      { label: "Simu", value: phone || "—" },
      { label: "Mkoa", value: region || "Tanzania" },
      { label: "Kifurushi", value: packageName.toUpperCase() },
    ],
    ctaLabel: "Fungua Super Admin",
    ctaUrl: `${MAUZOCHAP_APP_URL}/super-admin`,
  });
}

/**
 * 2. Staff Welcome / Invite Email
 */
export async function sendStaffWelcomeEmail({
  to,
  fullName,
  businessName,
  role,
  phone,
}: {
  to: string;
  fullName: string;
  businessName: string;
  role: string;
  phone?: string;
}): Promise<EmailResponse> {
  const roleLabel =
    role === "admin"
      ? "Msimamizi (Admin)"
      : role === "manager"
        ? "Meneja (Manager)"
        : "Muuzaji (Cashier)";

  return sendEmail({
    to,
    purpose: "staff_welcome",
    subject: `Umeongezwa Kwenye ${businessName} - MauzoChap POS`,
    heading: "Akaunti ya Mfanyakazi",
    greetingName: fullName,
    tone: "info",
    highlightText: `Habari ${fullName}, umewekwa rasmi kama ${roleLabel} katika duka la ${businessName} kwenye mfumo wa MauzoChap POS. Tumia barua pepe yako kuingia na kuanza kazi.`,
    rows: [
      { label: "Duka", value: businessName },
      { label: "Jukumu (Role)", value: roleLabel },
      { label: "Email ya Kuingia", value: to },
      ...(phone ? [{ label: "Simu", value: phone }] : []),
    ],
    ctaLabel: "Ingia MauzoChap POS",
    ctaUrl: `${MAUZOCHAP_APP_URL}/auth`,
  });
}

/**
 * 3. 6-Digit Password Reset OTP Email (replaces plain Supabase password reset email)
 */
export async function sendOtpEmail({
  to,
  recipientName,
  code,
}: {
  to: string;
  recipientName?: string;
  code: string;
}): Promise<EmailResponse> {
  const autoFillUrl = `${MAUZOCHAP_APP_URL}/auth?mode=verify-otp&code=${encodeURIComponent(code)}&identifier=${encodeURIComponent(to)}&copy=1`;

  return sendEmail({
    to,
    purpose: "otp_reset",
    otpCode: code,
    // Instagram-style subject prefix so Gmail / iOS / Android natively surface "Copy <code>" button!
    subject: `${code} ndiyo nambari yako ya MauzoChap`,
    heading: "Nambari ya Siri (OTP)",
    greetingName: recipientName || undefined,
    tone: "info",
    highlightText: `Tumia nambari ya siri hapa chini kubadilisha nenosiri la akaunti yako ya MauzoChap POS. Usimpe mtu yeyote namba hii. Inatumika ndani ya dakika 10.`,
    rows: [
      { label: "Akaunti", value: to },
      { label: "Muda wa Kutumika", value: "Dakika 10" },
    ],
    ctaLabel: `Nakili & Weka Nambari (${code})`,
    ctaUrl: autoFillUrl,
  });
}

/**
 * 4. Subscription Payment Reference Submitted (Merchant Confirmation + Admin Alert)
 */
export async function sendPaymentSubmittedEmail({
  to,
  ownerName,
  businessName,
  packageName,
  amount,
  paymentRef,
}: {
  to: string;
  ownerName?: string | null;
  businessName: string;
  packageName: string;
  amount: number;
  paymentRef: string;
}): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject: `Malipo Yamepokelewa - ${packageName.toUpperCase()} (${paymentRef})`,
    heading: "Malipo Yamepokelewa",
    greetingName: ownerName || businessName,
    tone: "warning",
    highlightText: `Habari ${ownerName || businessName}, tumepokea kumbukumbu ya malipo yako ya TZS ${Number(amount).toLocaleString()} kwa kifurushi cha ${packageName.toUpperCase()}. Timu yetu inahakiki muamala wako na kifurushi chako kitawashwa punde tu!`,
    rows: [
      { label: "Kumbukumbu", value: paymentRef },
      { label: "Kiasi kilichotumwa", value: `TZS ${Number(amount).toLocaleString()}` },
      { label: "Kifurushi", value: packageName.toUpperCase() },
      { label: "Duka", value: businessName },
      { label: "Hali", value: "Inasubiri Uhakiki" },
    ],
    ctaLabel: "Angalia Hali ya Malipo",
    ctaUrl: `${MAUZOCHAP_APP_URL}/setup-billing`,
  });
}

export async function notifySuperAdminNewOrderEmail({
  businessName,
  ownerName,
  email,
  phone,
  packageName,
  amount,
  paymentRef,
}: {
  businessName: string;
  ownerName?: string | null;
  email?: string | null;
  phone?: string | null;
  packageName: string;
  amount: number;
  paymentRef: string;
}): Promise<EmailResponse> {
  return sendEmail({
    to: SUPERADMIN_EMAIL,
    subject: `Uhakiki wa Malipo: ${businessName} - TZS ${Number(amount).toLocaleString()}`,
    heading: "Malipo Mapya Yanasubiri Uhakiki",
    greetingName: "Salvatory",
    tone: "warning",
    highlightText: `Duka la ${businessName} limewasilisha malipo ya TZS ${Number(amount).toLocaleString()} kwa kifurushi cha ${packageName.toUpperCase()}. Tafadhali hakiki kumbukumbu ya muamala na uwashe kifurushi.`,
    rows: [
      { label: "Kumbukumbu", value: paymentRef },
      { label: "Kiasi", value: `TZS ${Number(amount).toLocaleString()}` },
      { label: "Kifurushi", value: packageName.toUpperCase() },
      { label: "Duka", value: businessName },
      { label: "Mmiliki", value: ownerName || "—" },
      { label: "Simu / Email", value: [phone, email].filter(Boolean).join(" • ") || "—" },
    ],
    ctaLabel: "Thibitisha Kwenye Super Admin",
    ctaUrl: `${MAUZOCHAP_APP_URL}/super-admin`,
  });
}

/**
 * 5. Subscription Payment Approved & Activated (Exact SwalaSMS receipt style!)
 */
export async function sendPaymentApprovedEmail({
  to,
  ownerName,
  businessName,
  packageName,
  amount,
  paymentRef,
  expiryDate,
}: {
  to: string;
  ownerName?: string | null;
  businessName: string;
  packageName: string;
  amount: number;
  paymentRef: string;
  expiryDate: string;
}): Promise<EmailResponse> {
  const pkgUpper = packageName.toUpperCase();
  const displayName = ownerName || businessName;
  const amountStr = `TZS ${Number(amount).toLocaleString()}`;

  return sendEmail({
    to,
    subject: `Malipo yamefanikiwa - Kifurushi cha ${pkgUpper}`,
    heading: "Malipo Yamefanikiwa",
    greetingName: displayName,
    tone: "success",
    highlightText: `Habari ${displayName}, malipo ya ${amountStr} yamefanikiwa, umepata kifurushi cha ${pkgUpper} (Siku 30) kwa duka la ${businessName}. Tarehe mpya ya kuisha: ${expiryDate}. Asante!`,
    rows: [
      { label: "Kumbukumbu", value: paymentRef },
      { label: "Kiasi kilicholipwa", value: amountStr },
      { label: "Kifurushi", value: `${pkgUpper} (Siku 30)` },
      { label: "Duka", value: businessName },
      { label: "Tarehe ya Kuisha", value: expiryDate },
    ],
    ctaLabel: "Fungua Duka Lako Sasa",
    ctaUrl: `${MAUZOCHAP_APP_URL}/dashboard`,
  });
}

/**
 * 6. Subscription Payment Rejected
 */
export async function sendPaymentRejectedEmail({
  to,
  ownerName,
  businessName,
  packageName,
  paymentRef,
  reason,
}: {
  to: string;
  ownerName?: string | null;
  businessName: string;
  packageName?: string;
  paymentRef?: string;
  reason: string;
}): Promise<EmailResponse> {
  const displayName = ownerName || businessName;
  return sendEmail({
    to,
    subject: `Taarifa ya Uhakiki wa Malipo - ${businessName}`,
    heading: "Uhakiki wa Malipo",
    greetingName: displayName,
    tone: "danger",
    highlightText: `Habari ${displayName}, hatukuweza kuthibitisha kumbukumbu ya malipo uliyotuma kwa duka la ${businessName}. Sababu: ${reason}. Tafadhali hakiki namba sahihi ya muamala na uitume tena.`,
    rows: [
      ...(paymentRef ? [{ label: "Kumbukumbu", value: paymentRef }] : []),
      ...(packageName ? [{ label: "Kifurushi", value: packageName.toUpperCase() }] : []),
      { label: "Duka", value: businessName },
      { label: "Sababu", value: reason },
    ],
    ctaLabel: "Wasilisha Kumbukumbu Sahihi",
    ctaUrl: `${MAUZOCHAP_APP_URL}/setup-billing`,
  });
}

/**
 * 7. Subscription Expiry / Out-of-Subscription Reminder Email
 */
export async function sendSubscriptionReminderEmail({
  to,
  ownerName,
  businessName,
  packageName,
  expiryDate,
  daysRemaining,
}: {
  to: string;
  ownerName?: string | null;
  businessName: string;
  packageName?: string | null;
  expiryDate?: string | null;
  daysRemaining: number;
}): Promise<EmailResponse> {
  const displayName = ownerName || businessName;
  const pkgUpper = (packageName || "Kilimanjaro").toUpperCase();
  const isExpired = daysRemaining <= 0;

  return sendEmail({
    to,
    subject: isExpired
      ? `Kifurushi Kimekwisha - ${businessName} (MauzoChap POS)`
      : `Kumbusho la Kifurushi: Siku ${daysRemaining} Zimebaki - ${businessName}`,
    heading: isExpired ? "Kifurushi Kimekwisha" : "Kumbusho la Kifurushi",
    greetingName: displayName,
    tone: isExpired ? "danger" : "warning",
    highlightText: isExpired
      ? `Habari ${displayName}, muda wa kifurushi chako cha ${pkgUpper} kwa duka la ${businessName} umemalizika. Lipia kifurushi chako sasa ili uendelee kuuza, kukata risiti na kusimamia stoo yako bila kikwazo.`
      : `Habari ${displayName}, zimebaki siku ${daysRemaining} pekee kabla ya kifurushi chako cha ${pkgUpper} kwa duka la ${businessName} kumalizika. Lipia mapema ili huduma ya duka lako isikatike.`,
    rows: [
      { label: "Duka", value: businessName },
      { label: "Kifurushi", value: pkgUpper },
      { label: "Tarehe ya Kuisha", value: expiryDate || "Imekwisha" },
      {
        label: "Hali ya Akaunti",
        value: isExpired ? "Kimekwisha Muda (Renew Now)" : `Siku ${daysRemaining} Zimebaki`,
      },
    ],
    ctaLabel: "Lipia Kifurushi Sasa",
    ctaUrl: `${MAUZOCHAP_APP_URL}/setup-billing`,
  });
}
