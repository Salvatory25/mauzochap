import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatTZS, formatDate } from "@/lib/i18n";
import { generateQrDataUrl } from "@/lib/qr-generator";

export interface InvoicePdfData {
  invoice_number: string;
  created_at: string;
  business_name?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  business_location?: string | null;
  logo?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  cashier_name?: string | null;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  notes?: string | null;
  items: Array<{
    name: string;
    sku?: string | null;
    unit?: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

/**
 * Generate a high-quality A4 Tax Invoice / Receipt PDF
 */
export async function generateInvoicePdfDoc(data: InvoicePdfData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const businessName = (data.business_name || "MauzoChap Store").toUpperCase();
  const isProforma = data.payment_method === "credit" && data.payment_status === "Unpaid";
  const docTitle = isProforma ? "PROFORMA INVOICE" : (data.balance > 0 ? "TAX INVOICE" : "INVOICE RECEIPT");

  // Top Dark Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, "F");

  // Logo or Fallback initials
  let textStartX = 14;
  if (data.logo && data.logo.startsWith("data:image/")) {
    try {
      doc.addImage(data.logo, "PNG", 14, 8, 24, 24);
      textStartX = 42;
    } catch {
      textStartX = 14;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(businessName, textStartX, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  const contactLine = [data.business_location, data.business_phone, data.business_email]
    .filter(Boolean)
    .join(" · ");
  doc.text(contactLine || "Official Electronic Tax Document", textStartX, 27);

  // Document Title & Number
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(docTitle, pageWidth - 14, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text(`#${data.invoice_number}`, pageWidth - 14, 26, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Date: ${formatDate(data.created_at)}`, pageWidth - 14, 32, { align: "right" });

  // Details Grid
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO / MTEJA:", 14, 50);
  doc.text("INVOICE SUMMARY:", pageWidth - 14, 50, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const customerName = data.customer_name || "Walk-in Customer / Mteja wa Kawaida";
  doc.text(customerName, 14, 56);
  let custY = 61;
  if (data.customer_phone) {
    doc.text(`Simu: ${data.customer_phone}`, 14, custY);
    custY += 5;
  }
  if (data.customer_email) {
    doc.text(`Barua pepe: ${data.customer_email}`, 14, custY);
    custY += 5;
  }
  if (data.customer_address) {
    doc.text(`Mahali: ${data.customer_address}`, 14, custY);
  }

  doc.text(`Cashier: ${data.cashier_name || "Official Cashier"}`, pageWidth - 14, 56, { align: "right" });
  doc.text(`Njia ya Malipo: ${data.payment_method.replace("_", " ").toUpperCase()}`, pageWidth - 14, 61, { align: "right" });
  doc.text(`Hali ya Malipo: ${data.payment_status}`, pageWidth - 14, 66, { align: "right" });

  // Table of Items
  const tableData = data.items.map((item, index) => [
    `${index + 1}. ${item.name}${item.sku ? ` (${item.sku})` : ""}`,
    `${item.quantity} ${item.unit || "pcs"}`,
    formatTZS(item.unit_price),
    formatTZS(item.subtotal),
  ]);

  autoTable(doc, {
    startY: 74,
    head: [["Bidhaa / Item Description", "Kiasi (Qty)", "Bei (Unit Price)", "Jumla (Total)"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 30, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 120;

  // Totals Breakdown
  const totalsStartX = pageWidth - 90;
  const totalsValX = pageWidth - 14;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  let currentY = finalY + 10;
  doc.text("Subtotal:", totalsStartX, currentY);
  doc.text(formatTZS(data.subtotal), totalsValX, currentY, { align: "right" });

  if (data.discount > 0) {
    currentY += 6;
    doc.text("Discount (-):", totalsStartX, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatTZS(data.discount)}`, totalsValX, currentY, { align: "right" });
    doc.setTextColor(71, 85, 105);
  }

  if (data.tax > 0) {
    currentY += 6;
    doc.text("Tax / VAT (18%):", totalsStartX, currentY);
    doc.text(formatTZS(data.tax), totalsValX, currentY, { align: "right" });
  }

  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Amount:", totalsStartX, currentY);
  doc.text(formatTZS(data.total_amount), totalsValX, currentY, { align: "right" });

  currentY += 6;
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text("Amount Paid:", totalsStartX, currentY);
  doc.text(formatTZS(data.amount_paid), totalsValX, currentY, { align: "right" });

  if (data.balance > 0) {
    currentY += 6;
    doc.setTextColor(220, 38, 38); // red-600
    doc.text("Balance Due:", totalsStartX, currentY);
    doc.text(formatTZS(data.balance), totalsValX, currentY, { align: "right" });
  }

  // Offline Generated QR Code Verification Block
  const qrVerificationText = `MauzoChap Official Invoice\nDoc: ${data.invoice_number}\nDate: ${formatDate(data.created_at)}\nTotal: ${formatTZS(data.total_amount)}\nBalance: ${formatTZS(data.balance)}\nBusiness: ${data.business_name || ""}`;
  const qrDataUrl = await generateQrDataUrl(qrVerificationText, 140);

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", 14, finalY + 8, 28, 28);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Scan to verify authentic electronic invoice", 14, finalY + 40);
    } catch (e) {
      console.warn("Notice adding QR to PDF:", e);
    }
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Thank you for your business! Asante kwa kutuunga mkono.", pageWidth / 2, pageHeight - 12, { align: "center" });
  doc.text("Powered by MauzoChap POS & Invoicing System (mauzochap.co.tz)", pageWidth / 2, pageHeight - 7, { align: "center" });

  return doc;
}

/**
 * Generate a professional, corporate WhatsApp text summary (no informal or casual phrasing)
 */
export function buildOfficialWhatsAppSummary(data: {
  invoiceNumber: string;
  businessName: string;
  customerName?: string | null;
  createdAt: string;
  total: number;
  paid: number;
  balance: number;
  paymentStatus: string;
  items?: Array<{ name: string; qty: number; price: number }>;
}): string {
  const itemsSection =
    data.items && data.items.length > 0
      ? `\n*Muhtasari wa Bidhaa / Items:*\n` +
        data.items
          .map((i) => `• ${i.name} (${i.qty} x ${formatTZS(i.price)} = ${formatTZS(i.qty * i.price)})`)
          .join("\n") +
        `\n---------------------------------`
      : "";

  return (
    `*TAX INVOICE / RISITI: #${data.invoiceNumber}*\n` +
    `🏢 *Biashara:* ${data.businessName}\n` +
    `👤 *Mteja:* ${data.customerName || "Walk-in Customer"}\n` +
    `📅 *Tarehe:* ${formatDate(data.createdAt)}\n` +
    `---------------------------------` +
    itemsSection +
    `\n💰 *Jumla Kuu (Total):* ${formatTZS(data.total)}\n` +
    `💵 *Kiasi Kilicholipwa (Paid):* ${formatTZS(data.paid)}\n` +
    (data.balance > 0
      ? `⚠️ *Baki Inayodaiwa (Balance Due):* ${formatTZS(data.balance)}\n`
      : `✅ *Baki:* TZS 0 (Imelipwa Kamili)\n`) +
    `📌 *Hali ya Malipo:* ${data.paymentStatus}\n` +
    `---------------------------------\n` +
    `Nyaraka rasmi ya kodi (PDF) imeambatanishwa.\n` +
    `Asante kwa biashara yako!`
  );
}
