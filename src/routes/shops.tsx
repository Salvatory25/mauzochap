import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";

export const Route = createFileRoute("/shops")({
  head: () => ({
    meta: [
      { title: "POS System for Retail Shops & Maduka — MauzoChap Tanzania" },
      {
        name: "description",
        content:
          "MauzoChap point of sale system for retail shops, neighborhood dukas, and general stores in Tanzania. Track sales, credit customer notebooks, and get daily SMS summaries.",
      },
    ],
  }),
  component: () => <BusinessIndustryPage industry="shops" />,
});
