import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";
import { buildSeoHead, getBreadcrumbSchema, getSoftwareApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/restaurants")({
  head: () =>
    buildSeoHead({
      title: "Restaurant & Bar POS System Tanzania — MauzoChap",
      description:
        "Mfumo wa mauzo ya haraka kwa migahawa, baa (bars), cafes na lounges Tanzania. Fuatilia mauzo ya chupa na kreti, agizo la jikoni (KOT), na ripoti ya shift za wahudumu kila siku.",
      path: "/restaurants",
      keywords: [
        "restaurant POS system Tanzania",
        "mfumo wa mauzo kwa bar",
        "bar POS software Tanzania",
        "mfumo wa mgahawa",
        "hospitality POS system",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Restaurants & Bars", path: "/restaurants" },
        ]),
        getSoftwareApplicationSchema(),
      ],
    }),
  component: () => <BusinessIndustryPage industry="restaurants" />,
});
