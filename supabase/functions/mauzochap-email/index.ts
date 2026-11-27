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
}

function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderMauzoChapCardHtml(payload: BrandedEmailPayload): string {
  const toneColors = {
    success: {
      title: "#5eead4",
      border: "#34d399",
      boxBg: "#192726",
      ctaBg: "#10b981",
      ctaText: "#052e16",
    },
    warning: {
      title: "#fcd34d",
      border: "#f59e0b",
      boxBg: "#272115",
      ctaBg: "#f59e0b",
      ctaText: "#1c1917",
    },
    danger: {
      title: "#fca5a5",
      border: "#ef4444",
      boxBg: "#2a181b",
      ctaBg: "#ef4444",
      ctaText: "#ffffff",
    },
    info: {
      title: "#5eead4",
      border: "#14b8a6",
      boxBg: "#17252a",
      ctaBg: "#14b8a6",
      ctaText: "#042f2e",
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

  const rowsHtml = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px; border-collapse: collapse;">
        ${rows
          .map(
            (r) => `
          <tr>
            <td style="padding: 12px 8px 12px 0; border-bottom: 1px solid #262d3a; color: #94a3b8; font-size: 14px; text-align: left; vertical-align: top;">
              ${escapeHtml(r.label)}
            </td>
            <td style="padding: 12px 0 12px 8px; border-bottom: 1px solid #262d3a; color: #f8fafc; font-size: 15px; font-weight: 700; text-align: right; vertical-align: top;">
              ${escapeHtml(r.value)}
            </td>
          </tr>`,
          )
          .join("")}
      </table>`
    : "";

  const ctaHtml =
    payload.ctaLabel && payload.ctaUrl
      ? `<div style="text-align: center; margin-top: 26px;">
          <a href="${escapeHtml(payload.ctaUrl)}" style="display: inline-block; background-color: ${palette.ctaBg}; color: ${palette.ctaText}; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 10px;">
            ${escapeHtml(payload.ctaLabel)}
          </a>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(payload.subject)}</title>
</head>
<body style="margin: 0; padding: 20px 12px; background-color: #0b0e14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #141820; border: 1px solid #262d3a; border-radius: 16px; padding: 28px 24px;">
          <tr>
            <td>
              <div style="text-align: center; margin-bottom: 6px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8;">
                MAUZOCHAP POS
              </div>
              <h1 style="margin: 0 0 24px 0; text-align: center; color: ${palette.title}; font-size: 24px; font-weight: 800; line-height: 1.3;">
                ${heading}
              </h1>
              <p style="margin: 0 0 16px 0; color: #f8fafc; font-size: 16px; font-weight: 600;">
                ${greeting}
              </p>
              <div style="background-color: ${palette.boxBg}; border-left: 4px solid ${palette.border}; border-radius: 8px; padding: 16px 18px; color: #f1f5f9; font-size: 15px; line-height: 1.6;">
                ${highlight}
              </div>
              ${rowsHtml}
              ${ctaHtml}
              <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #222834; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6;">
                MauzoChap POS • Mfumo Bora wa Mauzo na Stoo Tanzania<br/>
                Msaada / WhatsApp: +255 627 274 168 • <a href="https://www.mauzochap.co.tz" style="color: #5eead4; text-decoration: none;">www.mauzochap.co.tz</a>
              </div>
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
    const plainFallback = [
      payload.heading || payload.subject,
      "",
      payload.greetingName ? `Habari ${payload.greetingName},` : "Habari,",
      payload.highlightText || payload.body || "",
      "",
      ...(payload.rows || []).map((r) => `${r.label}: ${r.value}`),
      payload.ctaUrl
        ? `\n${payload.ctaLabel || "Fungua MauzoChap"}: ${payload.ctaUrl}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const info = await transporter.sendMail({
      from: `"MauzoChap" <${gmailUser}>`,
      to: payload.to,
      replyTo: gmailUser,
      subject: payload.subject,
      text: plainFallback,
      html,
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
