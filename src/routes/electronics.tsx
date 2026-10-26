import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";

export const Route = createFileRoute("/electronics")({
  head: () => ({
    meta: [
      { title: "Phones & Electronics POS with IMEI Tracking — MauzoChap Tanzania" },
      {
        name: "description",
        content:
          "Point of sale software for phone stores, laptop dealers, and electronics retailers in Tanzania. IMEI barcode logging, warranty tracking, and repair workshop job cards.",
      },
    ],
  }),
  component: () => <BusinessIndustryPage industry="electronics" />,
});
