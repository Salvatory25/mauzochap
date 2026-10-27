import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";
import { buildSeoHead, getBreadcrumbSchema, getSoftwareApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/supermarkets")({
  head: () =>
    buildSeoHead({
      title: "Mfumo wa POS kwa Supermarket na Minimarts Tanzania — MauzoChap",
      description:
        "Mfumo wa kisasa wa barcode scanner POS kwa supermarkets, minimarts, na grocery stores Tanzania. Malipo ya haraka, mashine za risiti za thermal, usimamizi wa stoo na cashier shift audit.",
      path: "/supermarkets",
      keywords: [
        "mfumo wa POS kwa supermarket",
        "supermarket POS software Tanzania",
        "barcode scanner POS system",
        "programu ya supermarket Tanzania",
        "multi lane POS checkout",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Supermarkets & Minimarts", path: "/supermarkets" },
        ]),
        getSoftwareApplicationSchema(),
      ],
    }),
  component: () => <BusinessIndustryPage industry="supermarkets" />,
});
