import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useBusinessLogo, processLogoFile } from "@/lib/business-logo";

interface LogoUploaderProps {
  businessId?: string | null;
  compact?: boolean;
  onUploaded?: (dataUrl: string) => void;
  className?: string;
}

export function LogoUploader({
  businessId,
  compact = false,
  onUploaded,
  className = "",
}: LogoUploaderProps) {
  const { logo, updateLogo, clearLogo } = useBusinessLogo(businessId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileSelected = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukubwa wa picha ya logo usizidi MB 5.");
      return;
    }

    setProcessing(true);
    try {
      const dataUrl = await processLogoFile(file);
      await updateLogo(dataUrl);
      onUploaded?.(dataUrl);
      toast.success("Logo ya biashara imehifadhiwa kikamilifu!");
    } catch (err: any) {
      toast.error(err?.message || "Imeshindwa kupakia logo.");
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Una uhakika unataka kufuta logo ya duka lako?")) {
      await clearLogo();
      toast.success("Logo ya biashara imefutwa.");
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleInputChange}
        />
        {logo ? (
          <div className="flex items-center gap-2 bg-muted/60 pl-1.5 pr-2 py-1 rounded-lg border border-border text-xs">
            <img
              src={logo}
              alt="Store Logo"
              className="w-6 h-6 object-contain rounded bg-white p-0.5 border"
            />
            <span className="font-medium text-foreground truncate max-w-[100px]">Logo Ipo</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              title="Futa Logo"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={processing}
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold gap-1.5 border-dashed"
          >
            {processing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-primary" />
            )}
            <span>Weka Logo ya Duka</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleInputChange}
      />

      {logo ? (
        <div className="relative group border-2 border-primary/20 bg-primary/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-white p-2 border border-border shadow-xs flex items-center justify-center shrink-0">
              <img
                src={logo}
                alt="Business Logo Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" /> Logo Imewashwa
              </div>
              <p className="text-xs text-muted-foreground">
                Inaonekana kiotomatiki kwenye risiti zote (thermal 80mm & 58mm) na ankara za A4 za wateja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={processing}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold"
            >
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Badili Logo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/20"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Futa
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-all rounded-2xl p-6 text-center cursor-pointer space-y-2 group"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
            {processing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="font-bold text-sm text-foreground">
              Bofya au vuta picha ya Logo hapa
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              PNG yenye background safi (transparent), JPG au SVG (Ukubwa wa hadi 5MB).
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-primary/80 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Itatokea juu ya risiti na ankara zako zote kwa wateja</span>
          </div>
        </div>
      )}
    </div>
  );
}

