import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";
import { buildSeoHead, getBreadcrumbSchema, getSoftwareApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/shops")({
  head: () =>
    buildSeoHead({
      title: "Mfumo wa Mauzo kwa Maduka ya Rejareja (Shops & Maduka) — MauzoChap Tanzania",
      description:
        "Mfumo rahisi na wa haraka wa mauzo na stoo kwa maduka ya rejareja na maduka ya mtaani Tanzania. Rekodi mauzo, madeni ya wateja (daftari la mikopo), na pokea ripoti ya SMS kila siku saa 2:30 usiku.",
      path: "/shops",
      keywords: [
        "mfumo wa mauzo kwa duka",
        "mfumo wa kusimamia duka",
        "programu ya kusimamia duka la rejareja",
        "retail POS software Tanzania",
        "POS system Tanzania",
        "daftari la mauzo",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Maduka ya Rejareja", path: "/shops" },
        ]),
        getSoftwareApplicationSchema(),
      ],
    }),
  component: () => <BusinessIndustryPage industry="shops" />,
});
