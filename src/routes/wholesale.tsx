import { createFileRoute } from "@tanstack/react-router";
import { BusinessIndustryPage } from "@/components/landing/BusinessIndustryPage";
import { buildSeoHead, getBreadcrumbSchema, getSoftwareApplicationSchema } from "@/lib/seo";

export const Route = createFileRoute("/wholesale")({
  head: () =>
    buildSeoHead({
      title: "Wholesale & Distribution POS Software Tanzania — MauzoChap",
      description:
        "Mfumo wa mauzo ya jumla (wholesale) na usambazaji kwa wasambazaji wa vinywaji, nafaka na FMCG Tanzania. Bei za ngazi mbalimbali (tiered pricing), ankara, na stoo ya maghala.",
      path: "/wholesale",
      keywords: [
        "mfumo wa biashara ya jumla",
        "wholesale POS software Tanzania",
        "mfumo wa kusimamia bidhaa za jumla",
        "distribution inventory software",
        "FMCG wholesale system",
      ],
      schema: [
        getBreadcrumbSchema([
          { name: "Nyumbani", path: "/" },
          { name: "Wholesale & Distribution", path: "/wholesale" },
        ]),
        getSoftwareApplicationSchema(),
      ],
    }),
  component: () => <BusinessIndustryPage industry="wholesale" />,
});
