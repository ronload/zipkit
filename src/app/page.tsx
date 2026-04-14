import { AddressForm } from "@/components/address-form";
import baseData from "../../public/data/base.json";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <AddressForm cities={baseData.cities} />
    </div>
  );
}
