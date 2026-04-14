import { AddressForm } from "@/components/address-form";
import baseData from "../../public/data/base.json";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {"台灣地址英譯工具"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {"輸入台灣中文地址，一鍵取得英文地址與 3+3 郵遞區號。"}
        </p>
      </div>
      <AddressForm cities={baseData.cities} />
      <footer className="mt-8 text-xs text-muted-foreground">
        {"地址英譯僅供參考。資料來源：中華郵政。"}
      </footer>
    </div>
  );
}
