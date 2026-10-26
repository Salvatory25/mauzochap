import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";

export const Route = createFileRoute("/pharmacies")({
  head: () => ({
    meta: [
      { title: "Pharmacy POS System with FEFO & Expiry Tracking — MauzoChap Tanzania" },
      {
        name: "description",
        content:
          "Point of sale and inventory management software for pharmacies, Part II drugstores, and agrovet shops in Tanzania. Batch tracking, FEFO compliance, and expiry alerts.",
      },
    ],
  }),
  component: () => <BusinessIndustryPage industry="pharmacies" />,
});
