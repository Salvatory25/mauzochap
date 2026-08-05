import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { QrCode, Barcode, Download, Printer, Copy, RefreshCw, Sparkles } from "lucide-react";
import { generateCode128 } from "@/lib/barcode";

export const Route = createFileRoute("/_authenticated/tools")({
  component: ToolsPage,
});

function ToolsPage() {
  const [activeTab, setActiveTab] = useState<"qr" | "barcode">("qr");

  // QR Code State
  const [qrText, setQrText] = useState("https://mauzochap.vercel.app");
  const [qrSize, setQrSize] = useState("300");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}`;

  // Barcode State
  const [barcodeText, setBarcodeText] = useState("MC-SKU-100293");
  const [showBarcodeText, setShowBarcodeText] = useState(true);
  const { svgContent, widths } = generateCode128(barcodeText);

  // Copy helpers
  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Download QR Code as PNG
  const downloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QR_Code_${barcodeText || "generator"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("QR Code downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download QR Code. Try right-clicking the image and saving.");
    }
  };

  // Download Barcode as SVG
  const downloadBarcode = () => {
    try {
      const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widths} ${showBarcodeText ? 110 : 80}" width="${widths * 2}" height="${showBarcodeText ? 220 : 160}">`;
      const svgBody = svgContent;
      const svgFooter = showBarcodeText 
        ? `<text x="${widths / 2}" y="100" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="black">${barcodeText}</text>` 
        : "";
      const fullSvg = `${svgHeader}${svgBody}${svgFooter}</svg>`;

      const blob = new Blob([fullSvg], { type: "image/svg+xml" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Barcode_${barcodeText}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Barcode SVG downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download Barcode SVG");
    }
  };

  // Print single labels cleanly
  const printLabel = (type: "qr" | "barcode") => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Pop-up blocked. Please allow pop-ups to print.");

    const style = `
      <style>
        body {
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-family: monospace;
          background: white;
          color: black;
        }
        .print-container {
          text-align: center;
          padding: 20px;
          border: 1px dashed #ccc;
          border-radius: 8px;
        }
        img, svg {
          max-width: 100%;
          height: auto;
        }
        .label-text {
          margin-top: 10px;
          font-size: 14px;
          font-weight: bold;
        }
      </style>
    `;

    let content = "";
    if (type === "qr") {
      content = `
        <div class="print-container">
          <img src="${qrUrl}" alt="QR" />
          <div class="label-text">${qrText}</div>
        </div>
      `;
    } else {
      content = `
        <div class="print-container">
          <svg viewBox="0 0 ${widths} ${showBarcodeText ? 110 : 80}" width="${widths * 2}" height="${showBarcodeText ? 220 : 160}">
            ${svgContent}
            ${showBarcodeText ? `<text x="${widths / 2}" y="100" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="black">${barcodeText}</text>` : ""}
          </svg>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - MauzoChap</title>
          ${style}
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          Tools & Utilities
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate high-quality, professional Barcodes and QR Codes for your inventory, marketing, and labels for free.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("qr")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === "qr"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode className="h-4 w-4" />
          QR Code Generator
        </button>
        <button
          onClick={() => setActiveTab("barcode")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === "barcode"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Barcode className="h-4 w-4" />
          Barcode Generator
        </button>
      </div>

      {activeTab === "qr" && (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Settings */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-[var(--shadow-soft)] space-y-6">
            <h2 className="text-lg font-bold">QR Code Options</h2>
            
            <div className="space-y-2">
              <Label htmlFor="qr-text">Data / Link / Text</Label>
              <Input
                id="qr-text"
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                placeholder="e.g. https://mybusiness.com or product code"
              />
              <p className="text-xs text-muted-foreground">
                Enter any URL, text, or phone number to encode into the QR Code.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-size">Dimension Size</Label>
              <select
                id="qr-size"
                value={qrSize}
                onChange={(e) => setQrSize(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="150">Small (150 x 150 px)</option>
                <option value="300">Medium (300 x 300 px)</option>
                <option value="500">Large (500 x 500 px)</option>
              </select>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" className="flex items-center gap-2" onClick={() => handleCopyLink(qrText)}>
                <Copy className="h-4 w-4" /> Copy Content
              </Button>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => setQrText("https://mauzochap.vercel.app")}>
                <RefreshCw className="h-4 w-4" /> Reset Default
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card border border-border p-8 rounded-2xl shadow-[var(--shadow-soft)] flex flex-col items-center justify-center text-center space-y-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Live Preview</h3>
            
            <div className="bg-white p-6 rounded-xl border border-border shadow-inner max-w-xs flex items-center justify-center">
              {qrText.trim() ? (
                <img
                  src={qrUrl}
                  alt="QR Code Preview"
                  className="w-48 h-48 object-contain"
                  onError={() => toast.error("Failed to render QR Code")}
                />
              ) : (
                <div className="w-48 h-48 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  Enter text to generate
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full max-w-xs">
              <Button className="flex-1" onClick={downloadQR} disabled={!qrText.trim()}>
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
              <Button variant="outline" onClick={() => printLabel("qr")} disabled={!qrText.trim()}>
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "barcode" && (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Settings */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-[var(--shadow-soft)] space-y-6">
            <h2 className="text-lg font-bold">Barcode Options</h2>

            <div className="space-y-2">
              <Label htmlFor="barcode-text">Barcode Value (SKU / Code)</Label>
              <Input
                id="barcode-text"
                value={barcodeText}
                onChange={(e) => setBarcodeText(e.target.value.toUpperCase())}
                placeholder="e.g. SKU10023"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                Enter an alphanumeric code to encode as a Code128 barcode.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-text"
                checked={showBarcodeText}
                onChange={(e) => setShowBarcodeText(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="show-text" className="cursor-pointer">
                Render human-readable text at bottom of barcode
              </Label>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" className="flex items-center gap-2" onClick={() => handleCopyLink(barcodeText)}>
                <Copy className="h-4 w-4" /> Copy Code
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card border border-border p-8 rounded-2xl shadow-[var(--shadow-soft)] flex flex-col items-center justify-center text-center space-y-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Live Preview</h3>

            <div className="bg-white p-6 rounded-xl border border-border shadow-inner w-full max-w-sm flex items-center justify-center min-h-[160px]">
              {barcodeText.trim() && svgContent ? (
                <svg
                  viewBox={`0 0 ${widths} ${showBarcodeText ? 110 : 80}`}
                  className="w-full max-h-36"
                >
                  <g dangerouslySetInnerHTML={{ __html: svgContent }} />
                  {showBarcodeText && (
                    <text
                      x={widths / 2}
                      y={100}
                      fontFamily="monospace"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill="black"
                    >
                      {barcodeText}
                    </text>
                  )}
                </svg>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Enter code to generate barcode
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full max-w-sm">
              <Button className="flex-1" onClick={downloadBarcode} disabled={!barcodeText.trim() || !svgContent}>
                <Download className="h-4 w-4 mr-2" /> Download SVG
              </Button>
              <Button variant="outline" onClick={() => printLabel("barcode")} disabled={!barcodeText.trim() || !svgContent}>
                <Printer className="h-4 w-4" /> Print Label
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
