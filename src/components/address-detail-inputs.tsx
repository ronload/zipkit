"use client";

import type { AddressDetail } from "@/lib/types";
import { Input } from "@/components/ui/input";

interface AddressDetailInputsProps {
  values: AddressDetail;
  onChange: (field: keyof AddressDetail, value: string) => void;
  disabled: boolean;
}

export function AddressDetailInputs({
  values,
  onChange,
  disabled,
}: AddressDetailInputsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{"巷"}</label>
        <Input
          placeholder={"如 16"}
          value={values.lane}
          onChange={(e) => onChange("lane", e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{"弄"}</label>
        <Input
          placeholder={"如 5"}
          value={values.alley}
          onChange={(e) => onChange("alley", e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          {"號"} <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder={"如 33 或 5之1"}
          value={values.number}
          onChange={(e) => onChange("number", e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{"樓"}</label>
        <Input
          placeholder={"如 5"}
          value={values.floor}
          onChange={(e) => onChange("floor", e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{"室"}</label>
        <Input
          placeholder={"如 2"}
          value={values.room}
          onChange={(e) => onChange("room", e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
