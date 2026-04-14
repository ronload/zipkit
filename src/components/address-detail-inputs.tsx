"use client";

import type { AddressDetail } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { RotateCcw } from "lucide-react";

interface AddressDetailInputsProps {
  values: AddressDetail;
  onChange: (field: keyof AddressDetail, value: string) => void;
  disabled: boolean;
  onReset: () => void;
}

const fields: {
  key: keyof AddressDetail;
  label: string;
  placeholder: string;
  required?: boolean;
}[] = [
  { key: "lane", label: "巷", placeholder: "16" },
  { key: "alley", label: "弄", placeholder: "5" },
  { key: "number", label: "號", placeholder: "33 或 5之1", required: true },
  { key: "floor", label: "樓", placeholder: "5" },
  { key: "room", label: "室", placeholder: "2" },
];

export function AddressDetailInputs({
  values,
  onChange,
  disabled,
  onReset,
}: AddressDetailInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">
            {f.label}
            {f.required && (
              <span className="ml-0.5 text-destructive">*</span>
            )}
          </label>
          <Input
            placeholder={f.placeholder}
            value={values[f.key]}
            onChange={(e) => onChange(f.key, e.target.value)}
            disabled={disabled}
            className="text-base"
          />
        </div>
      ))}
      <div className="flex items-end">
        <button
          onClick={onReset}
          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-input text-base text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {"重設"}
        </button>
      </div>
    </div>
  );
}
