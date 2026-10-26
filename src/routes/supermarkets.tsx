import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";

export const Route = createFileRoute("/supermarkets")({
  head: () => ({
    meta: [
      { title: "POS System for Supermarkets & Minimarts — MauzoChap Tanzania" },
      {
        name: "description",
        content:
          "High-speed barcode multi-lane point of sale system for supermarkets, minimarts, and grocery retailers in Tanzania. Fast checkouts, receipt printing, and stock audits.",
      },
    ],
  }),
  component: () => <BusinessIndustryPage industry="supermarkets" />,
});
