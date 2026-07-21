"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { City } from "@zipkit/core";
import type { useAddressState } from "@/hooks/use-address-state";
import { CitySelect } from "@/components/city-select";
import { DistrictSelect } from "@/components/district-select";
import { RoadCombobox } from "@/components/road-combobox";
import { AddressDetailInputs } from "@/components/address-detail-inputs";
import { ResultCard } from "@/components/result-card";
import { toSlug } from "@/lib/slug";

type AddressFormProps = {
  cities: City[];
} & ReturnType<typeof useAddressState>;

export function AddressForm({
  cities,
  state,
  setCity,
  setDistrict,
  setRoad,
  setDetail,
  englishAddress,
  zip3,
  zip6,
}: AddressFormProps) {
  // The road live region must live here, not inside RoadCombobox: the combobox
  // is remounted on every district change (keyed by district name) to reset its
  // local error state, and screen readers do not reliably announce text present
  // at a node's insertion time. The text is derived from the explicit
  // roadsStatus machine, so an idle form stays silent and a district whose road
  // list is legitimately empty still announces completion.
  const roadStatusText =
    state.roadsStatus === "loading"
      ? "路/街選項載入中"
      : state.roadsStatus === "error"
        ? "路/街選項載入失敗"
        : state.roadsStatus === "loaded"
          ? "路/街選項載入完成"
          : "";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <CitySelect cities={cities} value={state.city} onChange={setCity} />
          <DistrictSelect
            key={state.city?.name ?? "empty"}
            districts={state.city?.districts ?? []}
            value={state.district}
            onChange={setDistrict}
            disabled={!state.city}
          />
        </div>

        <span role="status" className="sr-only">
          {roadStatusText}
        </span>
        <div className="grid grid-cols-2 gap-3">
          <RoadCombobox
            key={state.district?.name ?? "empty"}
            roads={state.roads}
            value={state.road}
            onChange={setRoad}
            disabled={!state.district}
            loading={state.roadsStatus === "loading"}
          />
          <AddressDetailInputs
            values={state.detail}
            onChange={setDetail}
            disabled={!state.road}
          />
        </div>
      </div>

      <div>
        <div className="mb-3">
          <span className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
            {"查詢結果"}
          </span>
        </div>
        <ResultCard englishAddress={englishAddress} zip6={zip6} zip3={zip3} />
        {state.city && state.district && (
          <div className="mt-3">
            <Link
              href={`/tw/${toSlug(state.city.en)}/${toSlug(state.district.en)}`}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
            >
              查看{state.district.name}全區道路英譯與 3+3 區段
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
