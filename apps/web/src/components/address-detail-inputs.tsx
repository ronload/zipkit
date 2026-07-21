"use client";

import { useId } from "react";
import type { AddressDetail } from "@zipkit/core";
import { FieldLabel } from "@/components/custom/field-label";
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
      {fields.map((f) => {
        const fieldId = `${id}-${f.key}`;
        return (
          <div key={f.key} className="space-y-1.5">
            <FieldLabel htmlFor={fieldId} required={f.required}>
              {f.label}
            </FieldLabel>
            <Input
              id={fieldId}
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => {
                onChange(f.key, e.target.value);
              }}
              disabled={disabled}
              required={f.required}
              className="text-base"
            />
          </div>
        );
      })}
    </>
  );
}
