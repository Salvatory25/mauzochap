import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";
import { buildSeoHead, getBreadcrumbSchema, getSoftwareApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/hardware")({
  head: () =>
    buildSeoHead({
      title: "Mfumo wa Mauzo kwa Hardware & Vifaa vya Ujenzi Tanzania — MauzoChap",
      description:
        "Mfumo wa POS, ankara (invoices/proforma), na usimamizi wa stoo ya vifaa vya ujenzi na electricals Tanzania. Fuatilia vipimo (mita, mifuko, mabati), madeni ya wakandarasi, na stoo.",
      path: "/hardware",
      keywords: [
        "mfumo wa hardware Tanzania",
        "hardware store POS software",
        "mfumo wa vifaa vya ujenzi",
        "invoicing system Tanzania",
        "stock management hardware",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Hardware & Electricals", path: "/hardware" },
        ]),
        getSoftwareApplicationSchema(),
      ],
    }),
  component: () => <BusinessIndustryPage industry="hardware" />,
});
