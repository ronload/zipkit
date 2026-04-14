"use client";

import type { City } from "@/lib/types";
import { useAddressState } from "@/hooks/use-address-state";
import { CitySelect } from "@/components/city-select";
import { DistrictSelect } from "@/components/district-select";
import { RoadCombobox } from "@/components/road-combobox";
import { AddressDetailInputs } from "@/components/address-detail-inputs";
import { ResultCard } from "@/components/result-card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface AddressFormProps {
  cities: City[];
}

export function AddressForm({ cities }: AddressFormProps) {
  const {
    state,
    setCity,
    setDistrict,
    setRoad,
    setDetail,
    reset,
    englishAddress,
    zip3,
    zip6,
  } = useAddressState();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            {"地址輸入"}
          </h3>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {"重設"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CitySelect
            cities={cities}
            value={state.city}
            onChange={setCity}
          />
          <DistrictSelect
            districts={state.city?.districts ?? []}
            value={state.district}
            onChange={setDistrict}
            disabled={!state.city}
          />
        </div>

        <RoadCombobox
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

      <div>
        <ResultCard
          englishAddress={englishAddress}
          zip6={zip6}
          zip3={zip3}
        />
      </div>
    </div>
  );
}
