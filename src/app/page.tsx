import { AddressForm } from "@/components/address-form";
import baseData from "../../public/data/base.json";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "zipkit",
  description:
    "輸入台灣中文地址，一鍵取得標準英文地址與 3+3 郵遞區號。免驗證碼、純前端運算、零延遲。",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TWD",
  },
  inLanguage: "zh-TW",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <AddressForm cities={baseData.cities} />
      </div>
    </>
  );
}
