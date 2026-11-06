import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const LOGO_STORAGE_PREFIX = "mauzochap_business_logo_";
const LOGO_DEFAULT_KEY = "mauzochap_business_logo_default";
export const LOGO_UPDATED_EVENT = "mauzochap:logo-updated";
export const BUSINESS_LOGO_EVENT = LOGO_UPDATED_EVENT;

/**
 * Retrieve the active business logo (data URL or remote URL)
 */
export function getStoredBusinessLogo(businessId?: string | null): string | null {
  if (typeof window === "undefined") return null;
  try {
    if (businessId) {
      const byId = localStorage.getItem(`${LOGO_STORAGE_PREFIX}${businessId}`);
      if (byId) return byId;
    }
    return localStorage.getItem(LOGO_DEFAULT_KEY);
  } catch {
    return null;
  }
}

export const getBusinessLogo = getStoredBusinessLogo;

/**
 * Persist business logo across client sessions and attempt database sync
 */
export async function saveBusinessLogo(
  dataUrl: string,
  businessId?: string | null,
): Promise<void> {
  if (typeof window === "undefined" || !dataUrl) return;

  try {
    if (businessId) {
      localStorage.setItem(`${LOGO_STORAGE_PREFIX}${businessId}`, dataUrl);
    }
    localStorage.setItem(LOGO_DEFAULT_KEY, dataUrl);

    // Notify all active React components to re-render logo in real-time
    window.dispatchEvent(
      new CustomEvent(LOGO_UPDATED_EVENT, { detail: { businessId, logoUrl: dataUrl, logo: dataUrl } }),
    );

    // Best-effort database update if businesses table has logo_url
    if (businessId) {
      try {
        await (supabase.from("businesses") as any)
          .update({ logo_url: dataUrl })
          .eq("id", businessId);
      } catch (e) {
        console.warn("Database logo_url sync notice:", e);
      }
    }
  } catch (err) {
    console.error("Failed to save business logo:", err);
  }
}

/**
 * Remove business logo
 */
export async function removeBusinessLogo(businessId?: string | null): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (businessId) {
      localStorage.removeItem(`${LOGO_STORAGE_PREFIX}${businessId}`);
    }
    localStorage.removeItem(LOGO_DEFAULT_KEY);

    window.dispatchEvent(
      new CustomEvent(LOGO_UPDATED_EVENT, { detail: { businessId, logoUrl: null, logo: null } }),
    );

    if (businessId) {
      try {
        await (supabase.from("businesses") as any)
          .update({ logo_url: null })
          .eq("id", businessId);
      } catch (e) {
        console.warn("Database logo_url clear notice:", e);
      }
    }
  } catch (err) {
    console.error("Failed to remove business logo:", err);
  }
}

/**
 * React hook to read & reactively update the business logo
 */
export function useBusinessLogo(businessId?: string | null) {
  const [logo, setLogoState] = useState<string | null>(() => getStoredBusinessLogo(businessId));

  useEffect(() => {
    // Initial fetch from storage or database
    setLogoState(getStoredBusinessLogo(businessId));

    const handleLogoUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ businessId?: string; logoUrl?: string | null }>;
      if (!businessId || !customEvent.detail.businessId || customEvent.detail.businessId === businessId) {
        setLogoState(customEvent.detail.logoUrl || null);
      }
    };

    window.addEventListener(LOGO_UPDATED_EVENT, handleLogoUpdate);
    return () => window.removeEventListener(LOGO_UPDATED_EVENT, handleLogoUpdate);
  }, [businessId]);

  const updateLogo = useCallback(
    async (dataUrl: string) => {
      setLogoState(dataUrl);
      await saveBusinessLogo(dataUrl, businessId);
    },
    [businessId],
  );

  const clearLogo = useCallback(async () => {
    setLogoState(null);
    await removeBusinessLogo(businessId);
  }, [businessId]);

  return {
    logo,
    updateLogo,
    clearLogo,
  };
}

/**
 * Helper to compress and convert an uploaded File into a high-res base64 data-URL
 * (Max dimension: 500px, preserves PNG transparency for receipts & invoices)
 */
export function processLogoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Tafadhali chagua picha sahihi (PNG, JPG, SVG, WebP)"));
    }

    // SVG files can be loaded as data URL directly
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Save as PNG to maintain crisp transparency
        const compressedDataUrl = canvas.toDataURL("image/png", 0.92);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error("Imeshindwa kusoma picha ya logo"));
      img.src = e.target?.result as string;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Validate logo file format and size
 */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: "Tafadhali chagua faili." };

  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return { valid: false, error: "Aina ya picha haikubaliki. Tafadhali tumia PNG, JPG, WebP au SVG." };
  }

  const MAX_BYTES = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_BYTES) {
    return { valid: false, error: "Ukubwa wa faili unazidi 5MB. Tafadhali chagua picha ndogo zaidi." };
  }

  return { valid: true };
}


