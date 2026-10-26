import { createFileRoute, useParams } from "@tanstack/react-router";
import { BusinessIndustryPage, IndustryKey } from "@/components/landing/BusinessIndustryPage";

export const Route = createFileRoute("/business/$slug")({
  component: DynamicBusinessPage,
});

function DynamicBusinessPage() {
  const { slug } = useParams({ from: "/business/$slug" });

  const aliasMap: Record<string, IndustryKey> = {
    shops: "shops",
    maduka: "shops",
    "shops-and-maduka": "shops",
    retail: "supermarkets",
    supermarkets: "supermarkets",
    supermarket: "supermarkets",
    "supermarkets-and-retail": "supermarkets",
    pharmacy: "pharmacies",
    pharmacies: "pharmacies",
    "duka-la-dawa": "pharmacies",
    "pharmacies-and-duka-la-dawa": "pharmacies",
    hardware: "hardware",
    electricals: "hardware",
    "hardware-and-electricals": "hardware",
    wholesale: "wholesale",
    distribution: "wholesale",
    "wholesale-and-distribution": "wholesale",
    restaurant: "restaurants",
    restaurants: "restaurants",
    bars: "restaurants",
    "restaurants-and-bars": "restaurants",
    fashion: "fashion",
    boutique: "fashion",
    boutiques: "fashion",
    "boutiques-and-fashion": "fashion",
    electronics: "electronics",
    phones: "electronics",
    "phones-and-electronics": "electronics",
  };

  const industryKey = aliasMap[slug.toLowerCase()] || "shops";

  return <BusinessIndustryPage industry={industryKey} />;
}
