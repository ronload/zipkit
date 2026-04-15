"use client";

import dynamic from "next/dynamic";
import type { City } from "@/lib/types";
import { useAddressState } from "@/hooks/use-address-state";
import { AddressForm } from "@/components/address-form";

const TaiwanMap = dynamic(
  () => import("@/components/taiwan-map").then((m) => m.TaiwanMap),
  {
    ssr: false,
    loading: () => (
      <div className="border-border/50 bg-muted/30 h-full w-full animate-pulse rounded-xl border" />
    ),
  },
);

interface AddressPageProps {
  cities: City[];
}

export function AddressPage({ cities }: AddressPageProps) {
  const addressState = useAddressState();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-8 lg:py-8">
      <AddressForm cities={cities} {...addressState} />
      <div className="hidden lg:block">
        <div className="sticky top-16 h-[calc(100vh-8rem)]">
          <TaiwanMap
            city={addressState.state.city}
            district={addressState.state.district}
            zip6={addressState.zip6}
          />
        </div>
      </div>
    </div>
  );
}
