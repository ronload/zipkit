"use client";

import { useId } from "react";
import type { City } from "@zipkit/core";
import { FieldLabel } from "@/components/custom/field-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/custom/select";

interface CitySelectProps {
  cities: City[];
  value: City | null;
  onChange: (city: City | null) => void;
}

export function CitySelect({ cities, value, onChange }: CitySelectProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{"縣市"}</FieldLabel>
      <Select
        value={value?.name ?? null}
        onValueChange={(name) => {
          const city = cities.find((c) => c.name === name) ?? null;
          onChange(city);
        }}
      >
        <SelectTrigger id={id} className="w-full text-base">
          <SelectValue placeholder={"請選擇縣市..."} />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {cities.map((city) => (
            <SelectItem key={city.name} value={city.name}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
