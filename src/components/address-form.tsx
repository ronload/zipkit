"use client";

import type { City } from "@/lib/types";
import type { useAddressState } from "@/hooks/use-address-state";
import { CitySelect } from "@/components/city-select";
import { DistrictSelect } from "@/components/district-select";
import { RoadCombobox } from "@/components/road-combobox";
import { AddressDetailInputs } from "@/components/address-detail-inputs";
import { ResultCard } from "@/components/result-card";

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

        <div className="grid grid-cols-2 gap-3">
          <RoadCombobox
            key={state.district?.zip3 ?? "empty"}
            roads={state.roads}
            value={state.road}
            onChange={setRoad}
            disabled={!state.district}
            loading={state.roadsLoading}
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
      </div>
    </div>
  );
}
