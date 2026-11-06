import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Share2, MessageCircle, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  fileName: string;
  pdfBlob: Blob | null;
  whatsappSummary?: string;
  recipientPhone?: string | null;
}

export function PdfViewerDialog({
  open,
  onOpenChange,
  title = "PDF Document Viewer",
  fileName,
  pdfBlob,
  whatsappSummary = "",
  recipientPhone = "",
}: PdfViewerDialogProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setBlobUrl(null);
    }
  }, [pdfBlob]);

  const handleDownload = () => {
    if (!pdfBlob) return;
    const link = document.createElement("a");
    link.href = blobUrl || URL.createObjectURL(pdfBlob);
    link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Nyaraka ya PDF imepakuliwa!");
  };

  const handlePrint = () => {
    if (!blobUrl) return;
    const printFrame = document.createElement("iframe");
    printFrame.style.display = "none";
    printFrame.src = blobUrl;
    document.body.appendChild(printFrame);
    printFrame.onload = () => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (e) {
        console.warn("Direct iframe print failed, falling back to window print:", e);
        window.open(blobUrl, "_blank");
      }
    };
  };

  const handleShareWhatsAppPdf = async () => {
    if (!pdfBlob) return;
    setSharing(true);
    try {
      const cleanFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      const pdfFile = new File([pdfBlob], cleanFileName, { type: "application/pdf" });

      // Native Web Share API (Android, iOS Safari, macOS Safari)
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: title,
            text: whatsappSummary,
          });
          toast.success("Nyaraka ya PDF imeshirikishwa WhatsApp kikamilifu!");
          return;
        } catch (shareErr: any) {
          if (shareErr.name === "AbortError") {
            // User dismissed share dialog
            return;
          }
          console.log("Web share unsupported or cancelled, using download fallback:", shareErr);
        }
      }

      // Desktop / Fallback: Download the PDF document and launch WhatsApp
      handleDownload();

      const phoneParam = recipientPhone ? recipientPhone.replace(/[^0-9]/g, "") : "";
      const textParam = encodeURIComponent(
        `${whatsappSummary}\n\n📄 _(Nyaraka ya PDF imepakuliwa, tafadhali iambatanishe hapa mteja aipokee rasmi)_`
      );
      const waUrl = phoneParam ? `https://wa.me/${phoneParam}?text=${textParam}` : `https://wa.me/?text=${textParam}`;
      window.open(waUrl, "_blank");
      toast.success("PDF imepakuliwa na WhatsApp imefunguliwa!");
    } catch (err: any) {
      console.error("WhatsApp share error:", err);
      toast.error("Hitilafu wakati wa kushiriki PDF.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 border-b border-border bg-card flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground truncate max-w-xs sm:max-w-md">
                {title}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={handleShareWhatsAppPdf}
              disabled={sharing || !pdfBlob}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
            >
              {sharing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Tuma WhatsApp (PDF)</span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={!pdfBlob}
              className="text-xs font-semibold gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pakua PDF</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              disabled={!blobUrl}
              className="text-xs font-semibold gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-muted/30 relative overflow-hidden flex items-center justify-center">
          {blobUrl ? (
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title={title}
              className="w-full h-full border-none"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Inatayarisha muonekano wa PDF...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
