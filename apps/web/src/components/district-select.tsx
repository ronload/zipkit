"use client";

import { useId } from "react";
import type { District } from "@zipkit/core";
import { FieldLabel } from "@/components/custom/field-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/custom/select";

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
  const id = useId();
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id}>{"鄉鎮市區"}</FieldLabel>
      <Select
        value={value?.name ?? null}
        onValueChange={(name) => {
          const district = districts.find((d) => d.name === name) ?? null;
          onChange(district);
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full text-base">
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
