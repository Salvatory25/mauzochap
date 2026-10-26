import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";

export const Route = createFileRoute("/wholesale")({
  head: () => ({
    meta: [
      { title: "Wholesale & Distribution POS Software — MauzoChap Tanzania" },
      {
        name: "description",
        content:
          "Wholesale POS and stock distribution software for bulk suppliers, FMCG distributors, beverage agencies, and grain merchants in Tanzania. Multi-tier pricing and van sales.",
      },
    ],
  }),
  component: () => <BusinessIndustryPage industry="wholesale" />,
});
