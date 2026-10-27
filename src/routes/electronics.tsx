import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";
import { buildSeoHead, getBreadcrumbSchema, getSoftwareApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/electronics")({
  head: () =>
    buildSeoHead({
      title: "Phones & Electronics POS na IMEI Tracking Tanzania — MauzoChap",
      description:
        "Mfumo wa mauzo na stoo kwa maduka ya simu, spea na vifaa vya electronics Tanzania. Rekodi namba za IMEI au serial numbers, risiti za dhamana (warranty), na ankara rasmi.",
      path: "/electronics",
      keywords: [
        "phones POS system Tanzania",
        "IMEI tracking software Tanzania",
        "mfumo wa duka la simu",
        "electronics POS software",
        "mfumo wa simu na computer",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Phones & Electronics", path: "/electronics" },
        ]),
        getSoftwareApplicationSchema(),
      ],
    }),
  component: () => <BusinessIndustryPage industry="electronics" />,
});
