"use client";

import type { Road } from "@/lib/types";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";

interface RoadComboboxProps {
  roads: Road[];
  value: Road | null;
  onChange: (road: Road | null) => void;
  disabled: boolean;
  loading: boolean;
}

export function RoadCombobox({
  roads,
  value,
  onChange,
  disabled,
  loading,
}: RoadComboboxProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-muted-foreground text-[11px] font-medium">
        {"路/街"}
      </label>
      {loading ? (
        <div className="border-input dark:bg-input/30 flex h-8 w-full items-center gap-2 rounded-lg border bg-transparent px-2.5">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-base">{"載入中..."}</span>
        </div>
      ) : (
        <Combobox
          items={roads}
          value={value}
          onValueChange={(val) => onChange(val ?? null)}
          itemToStringLabel={(road) => road.name}
          filter={(road, query) => {
            const q = query.toLowerCase();
            return (
              road.name.toLowerCase().includes(q) ||
              road.en.toLowerCase().includes(q)
            );
          }}
        >
          <ComboboxInput
            placeholder={"請選擇路/街..."}
            disabled={disabled}
          />
          <ComboboxContent>
            <ComboboxEmpty>{"查無結果"}</ComboboxEmpty>
            <ComboboxList>
              {(road: Road) => (
                <ComboboxItem key={road.name} value={road}>
                  {road.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}
    </div>
  );
}
