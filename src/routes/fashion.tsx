import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";

export const Route = createFileRoute("/fashion")({
  head: () => ({
    meta: [
      { title: "Boutique & Fashion POS System — MauzoChap Tanzania" },
      {
        name: "description",
        content:
          "Point of sale software for clothing boutiques, shoe stores, and fashion outlets in Tanzania. Matrix size and color variants, WhatsApp receipts, and layaway tracking.",
      },
    ],
  }),
  component: () => <BusinessIndustryPage industry="fashion" />,
});
