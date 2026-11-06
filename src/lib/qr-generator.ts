import QRCode from "qrcode";

/**
 * Generate a local, high-contrast QR code as a base64 Data URL.
 * Runs 100% offline with zero network latency, zero CORS taint, and instant reliability.
 */
export async function generateQrDataUrl(text: string, width = 160): Promise<string> {
  if (!text) return "";
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.warn("Offline QR generation error:", err);
    return "";
  }
}

