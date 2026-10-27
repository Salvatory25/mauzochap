import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";
import { buildSeoHead, getBreadcrumbSchema, getSoftwareApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/fashion")({
  head: () =>
    buildSeoHead({
      title: "Boutique & Fashion POS System Tanzania — MauzoChap",
      description:
        "Mfumo wa mauzo na stoo kwa maduka ya nguo, viatu na boutiques Tanzania. Usimamizi wa variants za rangi na saizi (size/color), risiti za WhatsApp, na ripoti za kila siku.",
      path: "/fashion",
      keywords: [
        "boutique POS system Tanzania",
        "mfumo wa duka la nguo",
        "clothing store POS software",
        "fashion inventory software",
        "POS ya boutique",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Boutiques & Fashion", path: "/fashion" },
        ]),
        getSoftwareApplicationSchema(),
      ],
    }),
  component: () => <BusinessIndustryPage industry="fashion" />,
});
