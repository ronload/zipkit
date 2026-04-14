"use client";

import type { District } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DistrictSelectProps {
  districts: District[];
  value: District | null;
  onChange: (district: District | null) => void;
  disabled: boolean;
}

export function DistrictSelect({
  districts,
  value,
  onChange,
  disabled,
}: DistrictSelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {"鄉鎮市區"}
      </label>
      <Select
        value={value?.zip3 ?? null}
        onValueChange={(zip3) => {
          const district = districts.find((d) => d.zip3 === zip3) ?? null;
          onChange(district);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={"請選擇鄉鎮市區..."} />
        </SelectTrigger>
        <SelectContent>
          {districts.map((d) => (
            <SelectItem key={d.zip3} value={d.zip3}>
              {d.name} {d.en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
