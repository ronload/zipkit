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
      <label className="text-muted-foreground text-[11px] font-medium">
        {"鄉鎮市區"}
      </label>
      <Select
        value={value?.name ?? null}
        onValueChange={(name) => {
          const district = districts.find((d) => d.name === name) ?? null;
          onChange(district);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full text-base">
          <SelectValue placeholder={"請選擇鄉鎮市區..."} />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {districts.map((d) => (
            <SelectItem key={d.name} value={d.name}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
