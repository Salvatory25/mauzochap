import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";

export const Route = createFileRoute("/hardware")({
  head: () => ({
    meta: [
      { title: "POS & Invoicing System for Hardware & Building Materials — MauzoChap" },
      {
        name: "description",
        content:
          "Point of sale, proforma invoicing, and measurement unit tracking for hardware stores, timber yards, and electrical suppliers in Tanzania.",
      },
    ],
  }),
  component: () => <BusinessIndustryPage industry="hardware" />,
});
