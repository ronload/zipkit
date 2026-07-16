"use client";

import { useId } from "react";
import type { AddressDetail } from "@zipkit/core";
import { Input } from "@/components/custom/input";

interface AddressDetailInputsProps {
  values: AddressDetail;
  onChange: (field: keyof AddressDetail, value: string) => void;
  disabled: boolean;
}

const fields: {
  key: keyof AddressDetail;
  label: string;
  placeholder?: string;
  required?: boolean;
}[] = [
  { key: "lane", label: "巷" },
  { key: "alley", label: "弄" },
  { key: "number", label: "號", placeholder: "33 或 5之1", required: true },
  { key: "floor", label: "樓" },
  { key: "room", label: "室" },
];

export function AddressDetailInputs({
  values,
  onChange,
  disabled,
}: AddressDetailInputsProps) {
  const id = useId();
  return (
    <>
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <label
            htmlFor={`${id}-${f.key}`}
            className="text-muted-foreground text-[11px] font-medium"
          >
            {f.label}
            {f.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          <Input
            id={`${id}-${f.key}`}
            placeholder={f.placeholder}
            value={values[f.key]}
            onChange={(e) => {
              onChange(f.key, e.target.value);
            }}
            disabled={disabled}
            className="text-base"
          />
        </div>
      ))}
    </>
  );
}
