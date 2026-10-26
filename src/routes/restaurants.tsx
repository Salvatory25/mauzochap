import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";

export const Route = createFileRoute("/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurant & Bar POS System — MauzoChap Tanzania" },
      {
        name: "description",
        content:
          "Fast POS system for restaurants, bars, lounges, and cafes in Tanzania. Crate-to-bottle tracking, waitstaff shift balancing, and instant kitchen order tickets.",
      },
    ],
  }),
  component: () => <BusinessIndustryPage industry="restaurants" />,
});
