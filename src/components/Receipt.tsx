import { Button } from "@/components/ui/button";
import { useT, formatTZS, formatDate } from "@/lib/i18n";
import { useState, useEffect, useRef } from "react";
import { Printer, X, MessageCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import html2canvas from "html2canvas";
import { toast } from "sonner";

type SaleData = {
  id: string;
  receipt_number: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  payment_method: string;
  amount_paid: number;
  notes: string | null;
  created_at: string;
  items: { id: string; name: string; qty: number; price: number }[];
  branch_id?: string | null;
  business_id?: string | null;
  cashier_id?: string | null;
  status?: string;
};

// SVG Jagged edge component for realistic paper thermal receipt on screen
function JaggedEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <div className={`w-[302px] overflow-hidden h-2.5 flex no-print select-none ${position === "top" ? "-mb-0.5" : "-mt-0.5"}`}>
      <svg className="w-full h-full text-white fill-current drop-shadow-[0_-1px_1px_rgba(0,0,0,0.03)]" viewBox="0 0 100 10" preserveAspectRatio="none">
        {position === "top" ? (
          <polygon points="0,10 2.5,0 5,10 7.5,0 10,10 12.5,0 15,10 17.5,0 20,10 22.5,0 25,10 27.5,0 30,10 32.5,0 35,10 37.5,0 40,10 42.5,0 45,10 47.5,0 50,10 52.5,0 55,10 57.5,0 60,10 62.5,0 65,10 67.5,0 70,10 72.5,0 75,10 77.5,0 80,10 82.5,0 85,10 87.5,0 90,10 92.5,0 95,10 97.5,0 100,10" fill="white" />
        ) : (
          <polygon points="0,0 2.5,10 5,0 7.5,10 10,0 12.5,10 15,0 17.5,10 20,0 22.5,10 25,0 27.5,10 30,0 32.5,10 35,0 37.5,10 40,0 42.5,10 45,0 47.5,10 50,0 52.5,10 55,0 57.5,10 60,0 62.5,10 65,0 67.5,10 70,0 72.5,10 75,0 77.5,10 80,0 82.5,10 85,0 87.5,10 90,0 92.5,10 95,0 97.5,10 100,0" fill="white" />
        )}
      </svg>
    </div>
  );
}

export function Receipt({ sale, onClose }: { sale: SaleData; onClose: () => void }) {
  const t = useT();
  const [format, setFormat] = useState<"thermal" | "a4">("thermal");
  const { business, branchId: userBranchId } = useAuth();
  const [businessName, setBusinessName] = useState<string>("Silivia Cosmetics");
  const [locationName, setLocationName] = useState<string>("Tanzania");

  useEffect(() => {
    async function loadReceiptHeader() {
      let resolvedBizName = "";

      // 1. Fetch business name from profiles first (where the user updates it in Settings)
      const targetCashierId = sale.cashier_id;
      if (targetCashierId) {
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("business_name")
            .eq("id", targetCashierId)
            .single();
          if (profileData?.business_name) {
            resolvedBizName = profileData.business_name;
            setBusinessName(profileData.business_name);
          }
        } catch (e) {
          console.error("Failed to load business_name from cashier profile:", e);
        }
      }

      // 2. Fetch branch name & location
      const targetBranchId = sale.branch_id || userBranchId;
      if (targetBranchId) {
        try {
          const { data: branchData } = await supabase
            .from("branches")
            .select("name, location, business_id")
            .eq("id", targetBranchId)
            .single();

          if (branchData) {
            if (branchData.location) {
              setLocationName(branchData.location);
            } else if (branchData.name) {
              setLocationName(branchData.name);
            }
            
            // Fallback for business name if profile didn't have one
            if (!resolvedBizName) {
              if (branchData.business_id) {
                const { data: bizData } = await supabase
                  .from("businesses")
                  .select("business_name")
                  .eq("id", branchData.business_id)
                  .single();
                if (bizData?.business_name) {
                  setBusinessName(bizData.business_name);
                }
              }
            }
          }
        } catch (e) {
          console.error("Failed to load receipt branch info:", e);
        }
      }
    }

    if (business?.business_name) {
      setBusinessName(business.business_name);
    }
    loadReceiptHeader();
  }, [sale.branch_id, sale.cashier_id, userBranchId, business]);

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${businessName} - Receipt ${sale.receipt_number}`;
    window.print();
    document.title = originalTitle;
  };

  const handleShareWhatsApp = () => {
    const isProforma = sale.status === "pending";
    const docTitle = isProforma ? "PROFORMA INVOICE" : "RISITI YA MALIPO";
    const receiptText = `*${businessName.toUpperCase()}*\n` +
      `📍 ${locationName}\n` +
      `--------------------------------\n` +
      `📄 *${docTitle}:* #${sale.receipt_number}\n` +
      `📅 Tarehe: ${formatDate(sale.created_at)}\n` +
      `💳 Njia ya Malipo: ${sale.payment_method.replace("_", " ").toUpperCase()}\n` +
      `--------------------------------\n` +
      sale.items.map(i => `• ${i.name}\n   ${i.qty} x ${formatTZS(i.price)} = ${formatTZS(i.qty * i.price)}`).join('\n') +
      `\n--------------------------------\n` +
      `*JUMLA KUU / TOTAL: ${formatTZS(sale.total)}*\n` +
      (sale.amount_paid ? `Kiasi Kilicholipwa: ${formatTZS(sale.amount_paid)}\n` : '') +
      `--------------------------------\n` +
      `Asante kwa kutuunga mkono! Karibu tena.\n` +
      `_Imezalishwa na MauzoChap POS (mauzochap.co.tz)_`;

    const url = `https://wa.me/?text=${encodeURIComponent(receiptText)}`;
    window.open(url, "_blank");
  };

  const receiptRef = useRef<HTMLDivElement>(null);
  const [sharingImage, setSharingImage] = useState(false);

  const handleShareWhatsAppImage = async () => {
    if (!receiptRef.current) return;
    setSharingImage(true);
    try {
      const element = (receiptRef.current.querySelector(".print-area") as HTMLElement) || receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const isProforma = sale.status === "pending";
      const docTitle = isProforma ? "PROFORMA INVOICE" : "RISITI YA MALIPO";
      const captionText = `*${businessName.toUpperCase()}*\n` +
        `📍 ${locationName}\n` +
        `📄 *${docTitle}:* #${sale.receipt_number}\n` +
        `💰 *JUMLA: ${formatTZS(sale.total)}*\n` +
        `📅 Tarehe: ${formatDate(sale.created_at)}\n` +
        `Asante kwa kutuunga mkono! Karibu tena.\n` +
        `_Imezalishwa na MauzoChap POS (mauzochap.co.tz)_`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Imeshindikana kutengeneza picha ya risiti.");
          setSharingImage(false);
          return;
        }

        const fileName = `Risiti-${sale.receipt_number}.png`;
        const file = new File([blob], fileName, { type: "image/png" });

        // Native Web Share API (mobile phones & tablets - directly shares the image to WhatsApp!)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${businessName} - Risiti #${sale.receipt_number}`,
              text: captionText,
            });
            toast.success("Risiti ya picha imeshirikishwa kikamilifu WhatsApp!");
            setSharingImage(false);
            return;
          } catch (shareErr) {
            console.log("Web share cancelled or unsupported, using desktop download fallback:", shareErr);
          }
        }

        // Desktop PC fallback: Auto-download the high-res PNG image and launch WhatsApp Web
        const imageURL = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = imageURL;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        toast.success("Picha ya risiti imepakuliwa! Fungua WhatsApp na umtumie mteja.");
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(captionText)}`;
        window.open(whatsappUrl, "_blank");
        setSharingImage(false);
      }, "image/png");
    } catch (err) {
      console.error("Failed to generate receipt image:", err);
      toast.error("Hitilafu wakati wa kutengeneza picha ya risiti.");
      setSharingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold">
            {sale.status === "pending" ? "Proforma" : t("receipt")} {sale.receipt_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {sale.status === "pending" ? "Proforma invoice generated." : "Sale completed successfully."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="rounded-lg border border-border p-1 bg-card flex">
            <button
              onClick={() => setFormat("thermal")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                format === "thermal" ? "bg-primary text-primary-foreground" : "hover:text-foreground/80"
              }`}
            >
              {t("thermal")}
            </button>
            <button
              onClick={() => setFormat("a4")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                format === "a4" ? "bg-primary text-primary-foreground" : "hover:text-foreground/80"
              }`}
            >
              {t("a4")}
            </button>
          </div>
          <Button onClick={handlePrint} variant="outline" className="border-border">
            <Printer className="h-4 w-4 mr-2" /> {t("print")}
          </Button>
          <Button 
            onClick={handleShareWhatsAppImage} 
            disabled={sharingImage}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            title="Tuma picha ya risiti moja kwa moja WhatsApp"
          >
            {sharingImage ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Inatengeneza...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-1.5" /> Picha WhatsApp
              </>
            )}
          </Button>
          <Button 
            onClick={handleShareWhatsApp} 
            variant="outline" 
            className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 font-medium"
            title="Tuma maandishi ya risiti WhatsApp"
          >
            <MessageCircle className="h-4 w-4 mr-1.5 text-emerald-600" /> WhatsApp Text
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Close
          </Button>
        </div>
      </div>

      <div ref={receiptRef} className="flex justify-center p-2 bg-muted/20 rounded-2xl border border-border/40">
        {format === "thermal" ? (
          <ThermalReceipt sale={sale} businessName={businessName} locationName={locationName} />
        ) : (
          <A4Receipt sale={sale} businessName={businessName} locationName={locationName} />
        )}
      </div>
    </div>
  );
}

function ThermalReceipt({
  sale,
  businessName,
  locationName,
}: {
  sale: SaleData;
  businessName: string;
  locationName: string;
}) {
  const isSplit = sale.notes?.startsWith("Split Payment:");
  const isProforma = sale.status === "pending";
  const docTitle = isProforma ? "PROFORMA INVOICE" : "RECEIPT";
  
  return (
    <div
      className="print-area bg-white text-black font-mono text-xs p-4 shadow-[var(--shadow-elevated)] rounded"
      style={{ width: "302px" }}
    >
      <div className="text-center">
        <div className="font-bold text-base uppercase">{businessName}</div>
        <div className="text-[10px] uppercase">{locationName}</div>
        <div className="text-[10px] mt-1 font-bold">{docTitle}</div>
        <div className="text-[10px]">--------------------------------</div>
      </div>
      <div className="my-2 text-[11px]">
        <div>Receipt: {sale.receipt_number}</div>
        <div>{formatDate(sale.created_at)}</div>
        {!isSplit && <div className="capitalize">Payment: {sale.payment_method.replace("_", " ")}</div>}
      </div>
      <div className="text-[10px]">--------------------------------</div>
      {sale.items.map((i) => (
        <div key={i.id} className="flex justify-between text-[11px] my-0.5">
          <div className="flex-1 truncate">
            {i.name}
            <div className="text-[10px] text-gray-600">
              {" "}
              {i.qty} x {formatTZS(i.price)}
            </div>
          </div>
          <div className="font-semibold">{formatTZS(i.qty * i.price)}</div>
        </div>
      ))}
      <div className="text-[10px]">--------------------------------</div>
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatTZS(sale.subtotal)}</span>
      </div>
      {sale.discount > 0 && (
        <div className="flex justify-between">
          <span>Discount</span>
          <span>-{formatTZS(sale.discount)}</span>
        </div>
      )}
      {sale.tax > 0 && (
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{formatTZS(sale.tax)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-sm mt-1 border-t border-dashed border-gray-400 pt-1">
        <span>TOTAL</span>
        <span>{formatTZS(sale.total)}</span>
      </div>
      <div className="flex justify-between mt-1">
        <span>Paid</span>
        <span>{formatTZS(sale.amount_paid)}</span>
      </div>
      
      {sale.amount_paid < sale.total && (
        <div className="flex justify-between mt-1">
          <span>Balance Due</span>
          <span>{formatTZS(sale.total - sale.amount_paid)}</span>
        </div>
      )}
      
      {isSplit && (
        <div className="mt-2 text-[10px] bg-gray-100 p-1.5 rounded">
          {sale.notes}
        </div>
      )}
      
      <div className="text-center mt-4 text-[10px]">
        Thank you! Asante!
        <br />
        Powered by MauzoChap
      </div>
    </div>
  );
}

function A4Receipt({
  sale,
  businessName,
  locationName,
}: {
  sale: SaleData;
  businessName: string;
  locationName: string;
}) {
  const isSplit = sale.notes?.startsWith("Split Payment:");
  const isProforma = sale.status === "pending";
  const docTitle = isProforma ? "PROFORMA INVOICE" : (sale.amount_paid < sale.total || sale.payment_method === 'credit' ? "TAX INVOICE" : "INVOICE RECEIPT");

  return (
    <div
      className="print-area bg-white text-black p-12 shadow-[0_16px_40px_rgba(0,0,0,0.04)] border border-gray-100 rounded-xl print:border-none print:shadow-none print:p-0 flex flex-col justify-between"
      style={{ width: "210mm", minHeight: "297mm" }}
    >
      <div>
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 capitalize">
              {businessName}
            </h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary print:hidden"></span>
              {locationName}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-primary uppercase tracking-wider print:text-black">
              {docTitle}
            </div>
            <div className="text-2xl font-bold text-gray-800 mt-0.5">
              #{sale.receipt_number}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {formatDate(sale.created_at)}
            </div>
          </div>
        </div>

        {/* Dynamic Theme Divider */}
        <div className="h-1 bg-gradient-to-r from-primary to-primary-glow print:bg-black w-full my-6 rounded-full" />

        {/* Invoice details */}
        <div className="grid grid-cols-2 gap-8 my-6 text-sm">
          <div>
            <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Billed To</span>
            <div className="font-semibold text-gray-800 mt-1">Walk-in Customer</div>
            <div className="text-gray-500 text-xs">MauzoChap Store Transaction</div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Payment Status</span>
            <div className="mt-1">
              <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider print:border print:border-black print:text-black">
                Paid
              </span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <table className="w-full mt-10 text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left bg-muted/20 print:bg-gray-50">
              <th className="py-3 px-4 font-semibold text-gray-600 rounded-l-lg">Item Name</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600">Qty</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600">Price</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-600 rounded-r-lg">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sale.items.map((i) => (
              <tr key={i.id} className="hover:bg-muted/5 transition-colors">
                <td className="py-4 px-4 text-gray-800 font-medium">{i.name}</td>
                <td className="py-4 px-4 text-right text-gray-700">{i.qty}</td>
                <td className="py-4 px-4 text-right text-gray-700">
                  {formatTZS(i.price)}
                </td>
                <td className="py-4 px-4 text-right font-semibold text-gray-900">
                  {formatTZS(i.qty * i.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="mt-12 flex justify-between items-start gap-12">
        <div className="flex-1 max-w-sm text-xs text-gray-400 leading-relaxed print:hidden">
          <p className="font-semibold text-gray-500 uppercase tracking-wider mb-1">Receipt Notes</p>
          This document serves as an official proof of payment. For any questions regarding this receipt, please contact the vendor directly.
        </div>
        <div className="w-80 text-sm space-y-3 bg-muted/10 print:bg-transparent p-6 rounded-xl border border-gray-100 print:border-none print:p-0">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-900">
              {formatTZS(sale.subtotal)}
            </span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-destructive font-medium">
              <span>Discount</span>
              <span>-{formatTZS(sale.discount)}</span>
            </div>
          )}
          {sale.tax > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span className="font-semibold text-gray-900">
                {formatTZS(sale.tax)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200 text-gray-950">
            <span>Total</span>
            <span className="text-primary print:text-black">
              {formatTZS(sale.total)}
            </span>
          </div>

          {isSplit ? (
            <div className="pt-3 border-t border-gray-100 mt-2 space-y-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Split Payments
              </div>
              <div className="text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-100 leading-normal print:bg-transparent">
                {sale.notes}
              </div>
              <div className="flex justify-between font-bold text-gray-900 mt-2">
                <span>Total Paid</span>
                <span>{formatTZS(sale.amount_paid)}</span>
              </div>
              {sale.amount_paid < sale.total && (
                <div className="flex justify-between font-bold text-destructive">
                  <span>Balance Due</span>
                  <span>{formatTZS(sale.total - sale.amount_paid)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-3 border-t border-gray-100 mt-2 space-y-2.5">
              <div className="flex justify-between text-gray-600">
                <span className="capitalize">
                  Paid via {sale.payment_method.replace("_", " ")}
                </span>
                <span className="font-bold text-gray-900">
                  {formatTZS(sale.amount_paid)}
                </span>
              </div>
              {sale.amount_paid < sale.total && (
                <div className="flex justify-between font-bold text-destructive">
                  <span>Balance Due</span>
                  <span>{formatTZS(sale.total - sale.amount_paid)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-16 pt-6 border-t border-gray-200 text-center text-xs text-gray-400 space-y-1">
        <div className="font-semibold text-gray-500">
          Thank you! Asante!
        </div>
        <div>Powered by MauzoChap</div>
      </div>
    </div>
  );
}
