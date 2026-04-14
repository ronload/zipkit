"use client";

import type { City } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CitySelectProps {
  cities: City[];
  value: City | null;
  onChange: (city: City | null) => void;
}

export function CitySelect({ cities, value, onChange }: CitySelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-muted-foreground text-[11px] font-medium">
        {"縣市"}
      </label>
      <Select
        value={value?.name ?? null}
        onValueChange={(name) => {
          const city = cities.find((c) => c.name === name) ?? null;
          onChange(city);
        }}
      >
        <SelectTrigger className="w-full text-base">
          <SelectValue placeholder={"請選擇縣市..."} />
        </SelectTrigger>
        <SelectContent>
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
