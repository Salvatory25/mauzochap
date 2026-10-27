import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";
import { buildSeoHead, getBreadcrumbSchema, getSoftwareApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/pharmacies")({
  head: () =>
    buildSeoHead({
      title: "Pharmacy POS System na Usimamizi wa Duka la Dawa Tanzania — MauzoChap",
      description:
        "Mfumo maalum wa POS na stoo kwa maduka ya dawa (Pharmacy & Duka la Dawa Part II) Tanzania. Fuatilia tarehe za kuisha kwa dawa (expiry dates), batch FEFO, na ripoti za kila siku.",
      path: "/pharmacies",
      keywords: [
        "mfumo wa duka la dawa",
        "pharmacy POS system Tanzania",
        "mfumo wa pharmacy Tanzania",
        "expiry tracking pharmacy software",
        "FEFO inventory medicine",
        "programu ya duka la dawa",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Pharmacies & Duka la Dawa", path: "/pharmacies" },
        ]),
        getSoftwareApplicationSchema(),
      ],
    }),
  component: () => <BusinessIndustryPage industry="pharmacies" />,
});
