import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-cron-token",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export interface SummaryRow {
  label: string;
  value: string;
  mono?: boolean;
}

export interface BrandedEmailPayload {
  to: string;
  subject: string;
  heading?: string;
  greetingName?: string;
  highlightText?: string;
  tone?: "success" | "warning" | "danger" | "info";
  rows?: SummaryRow[];
  ctaLabel?: string;
  ctaUrl?: string;
  body?: string;
  purpose?: string;
  otpCode?: string;
  copyCode?: string;
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
 * MauzoChap Dark-Blue Branded Card Email Template
 * - Deep Navy / Royal Blue brand header (#0f172a -> #1e3a8a)
 * - Instagram-style 1-tap selectable OTP box + Copy & Auto-Fill CTA button
 * - Clean HTML-to-text ratio & adaptive dark/light support to stay out of Spam
 */
export function renderMauzoChapCardHtml(payload: BrandedEmailPayload): string {
  const toneColors = {
    success: {
      accent: "#1e3a8a",
      boxBg: "#eff6ff",
      boxBorder: "#1e3a8a",
      boxText: "#0f172a",
      ctaBg: "#1e3a8a",
      ctaText: "#ffffff",
      badgeText: "#93c5fd",
    },
    info: {
      accent: "#1e3a8a",
      boxBg: "#eff6ff",
      boxBorder: "#2563eb",
      boxText: "#0f172a",
      ctaBg: "#1e3a8a",
      ctaText: "#ffffff",
      badgeText: "#93c5fd",
    },
    warning: {
      accent: "#1e3a8a",
      boxBg: "#fffbeb",
      boxBorder: "#d97706",
      boxText: "#78350f",
      ctaBg: "#1e3a8a",
      ctaText: "#ffffff",
      badgeText: "#fcd34d",
    },
    danger: {
      accent: "#1e3a8a",
      boxBg: "#fef2f2",
      boxBorder: "#dc2626",
      boxText: "#7f1d1d",
      ctaBg: "#1e3a8a",
      ctaText: "#ffffff",
      badgeText: "#fca5a5",
    },
  };

  const palette = toneColors[payload.tone || "success"];
  const heading = escapeHtml(payload.heading || payload.subject || "Taarifa ya MauzoChap");
  const greeting = payload.greetingName
    ? `Habari ${escapeHtml(payload.greetingName)},`
    : "Habari,";
  const highlight = escapeHtml(payload.highlightText || payload.body || "").replace(
    /\n/g,
    "<br/>",
  );
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const activeCode = (payload.otpCode || payload.copyCode || "").trim();

  // Instagram-style 1-tap selectable code card
  const codeCardHtml = activeCode
    ? `<div style="margin: 22px 0 8px 0; text-align: center;">
        <div style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 8px;">
          Gusa namba hapa chini kunakili (Tap code to select &amp; copy):
        </div>
        <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #1e3a8a; border-radius: 12px; padding: 14px 28px;">
          <code style="font-family: 'Courier New', Courier, monospace; font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #0f172a; -webkit-user-select: all; user-select: all; cursor: pointer;">${escapeHtml(activeCode)}</code>
        </div>
      </div>`
    : "";

  const rowsHtml = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 18px; border-collapse: collapse;">
        ${rows
          .map((r) => {
            const isCodeLike =
              r.mono ||
              r.label.toLowerCase().includes("kumbukumbu") ||
              r.label.toLowerCase().includes("otp") ||
              r.label.toLowerCase().includes("ref");
            return `
          <tr>
            <td style="padding: 11px 8px 11px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; text-align: left; vertical-align: top;">
              ${escapeHtml(r.label)}
            </td>
            <td style="padding: 11px 0 11px 8px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px; font-weight: 700; text-align: right; vertical-align: top; ${isCodeLike ? "font-family: 'Courier New', Courier, monospace; -webkit-user-select: all; user-select: all;" : ""}">
              ${escapeHtml(r.value)}
            </td>
          </tr>`;
          })
          .join("")}
      </table>`
    : "";

  const ctaHtml =
    payload.ctaLabel && payload.ctaUrl
      ? `<div style="margin-top: 24px; text-align: center;">
          <a href="${escapeHtml(payload.ctaUrl)}" style="display: inline-block; background-color: ${palette.ctaBg}; color: ${palette.ctaText}; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 26px; border-radius: 10px; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);">
            ${escapeHtml(payload.ctaLabel)}
          </a>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(payload.subject)}</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background-color: #0f172a; background-image: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px 22px; text-align: center; border-bottom: 3px solid #2563eb;">
              <div style="font-size: 13px; font-weight: 700; color: ${palette.badgeText}; letter-spacing: 0.8px; margin-bottom: 6px;">
                MauzoChap POS
              </div>
              <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; line-height: 1.3;">
                ${heading}
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 26px 22px;">
              <p style="margin: 0 0 14px 0; color: #0f172a; font-size: 16px; font-weight: 600;">
                ${greeting}
              </p>
              <div style="background-color: ${palette.boxBg}; border-left: 4px solid ${palette.boxBorder}; border-radius: 8px; padding: 14px 16px; color: ${palette.boxText}; font-size: 15px; line-height: 1.6;">
                ${highlight}
              </div>
              ${codeCardHtml}
              ${rowsHtml}
              ${ctaHtml}
              <p style="margin: 26px 0 0 0; padding-top: 14px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
                MauzoChap POS Tanzania • Msaada: +255 627 274 168<br/>
                <a href="https://www.mauzochap.co.tz" style="color: #1e3a8a; text-decoration: none; font-weight: 600;">www.mauzochap.co.tz</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function resolveGmailPassword(adminClient: any): Promise<string> {
  const envPass = (Deno.env.get("GMAIL_APP_PASSWORD") || "").replace(/\s+/g, "");
  if (envPass) return envPass;

  if (adminClient) {
    const { data } = await adminClient
      .from("internal_service_tokens")
      .select("token")
      .eq("service_name", "gmail_app_password")
      .maybeSingle();
    if (data?.token) {
      return String(data.token).replace(/\s+/g, "");
    }
  }
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const gmailUser = Deno.env.get("GMAIL_USER") || "mauzochap@gmail.com";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const adminClient = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;
  const gmailPass = await resolveGmailPassword(adminClient);

  if (req.method === "GET") {
    let smtpReachable = false;
    let smtpBanner = "";
    try {
      const conn = await Deno.connectTls({ hostname: "smtp.gmail.com", port: 465 });
      const buf = new Uint8Array(128);
      const n = await conn.read(buf);
      smtpBanner = n ? new TextDecoder().decode(buf.subarray(0, n)).trim() : "connected";
      smtpReachable = true;
      conn.close();
    } catch (e: any) {
      smtpBanner = e?.message || "unreachable";
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sender: `MauzoChap <${gmailUser}>`,
        secretConfigured: gmailPass.length > 0,
        smtpPort465Reachable: smtpReachable,
        smtpBanner: smtpBanner.slice(0, 80),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const payload = (await req.json()) as BrandedEmailPayload;
    if (!payload?.to || !payload?.subject) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing 'to' or 'subject'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    const internalCronToken = req.headers.get("x-internal-cron-token") || "";

    let authorized = false;

    if (serviceKey && authHeader === `Bearer ${serviceKey}`) {
      authorized = true;
    }

    if (!authorized && internalCronToken && adminClient) {
      const { data: tokenRow } = await adminClient
        .from("internal_service_tokens")
        .select("token")
        .eq("service_name", "pg_cron_email_dispatcher")
        .maybeSingle();
      if (tokenRow?.token && tokenRow.token === internalCronToken) {
        authorized = true;
      }
    }

    if (!authorized && authHeader.startsWith("Bearer ") && supabaseUrl && anonKey) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token && token !== anonKey) {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData } = await userClient.auth.getUser();
        if (userData?.user) {
          authorized = true;
        }
      }
    }

    if (!authorized && adminClient) {
      const cleanEmail = String(payload.to).trim().toLowerCase();
      if (payload.purpose === "otp_reset" && payload.otpCode) {
        const { data: otpMatch } = await adminClient
          .from("otp_verifications")
          .select("id")
          .ilike("email", cleanEmail)
          .eq("otp_code", String(payload.otpCode).trim())
          .eq("verified", false)
          .gt("expires_at", new Date().toISOString())
          .limit(1);
        if (otpMatch && otpMatch.length > 0) {
          authorized = true;
        }
      } else if (
        cleanEmail === "salvatoryfilbert2@gmail.com" ||
        cleanEmail === "mauzochap@gmail.com"
      ) {
        authorized = true;
      } else if (payload.purpose === "welcome_registration" || payload.purpose === "staff_welcome") {
        const { data: bizMatch } = await adminClient
          .from("businesses")
          .select("id")
          .ilike("email", cleanEmail)
          .limit(1);
        if (bizMatch && bizMatch.length > 0) {
          authorized = true;
        } else {
          const { data: usersList } = await adminClient.auth.admin.listUsers({
            page: 1,
            perPage: 200,
          });
          if (usersList?.users?.some((u) => u.email?.toLowerCase() === cleanEmail)) {
            authorized = true;
          }
        }
      }
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized email dispatch request." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!gmailPass) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "MISSING_GMAIL_APP_PASSWORD",
          error:
            "GMAIL_APP_PASSWORD secret is not yet configured in Supabase Edge Functions.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const html = renderMauzoChapCardHtml(payload);
    const activeCode = (payload.otpCode || payload.copyCode || "").trim();
    const plainFallback = [
      payload.heading || payload.subject,
      "",
      payload.greetingName ? `Habari ${payload.greetingName},` : "Habari,",
      "",
      payload.highlightText || payload.body || "",
      ...(activeCode ? ["", `Nambari yako (Code): ${activeCode}`] : []),
      "",
      ...(payload.rows || []).map((r) => `${r.label}: ${r.value}`),
      payload.ctaUrl
        ? `\n${payload.ctaLabel || "Fungua MauzoChap"}: ${payload.ctaUrl}`
        : "",
      "",
      "MauzoChap POS Tanzania • +255 627 274 168",
    ]
      .filter((line) => line !== undefined)
      .join("\n");

    const info = await transporter.sendMail({
      from: `"MauzoChap" <${gmailUser}>`,
      to: payload.to,
      replyTo: gmailUser,
      subject: payload.subject,
      text: plainFallback,
      html,
      headers: {
        "X-Entity-Ref-ID": crypto.randomUUID(),
        "X-Auto-Response-Suppress": "OOF, AutoReply",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId,
        sender: `MauzoChap <${gmailUser}>`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("mauzochap-email error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Failed to send email.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
