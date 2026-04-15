"use client";

import { useCallback, useRef, useState } from "react";
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

function matchesRoad(road: Road, query: string): boolean {
  const q = query.toLowerCase();
  return (
    road.name.toLowerCase().includes(q) || road.en.toLowerCase().includes(q)
  );
}

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
  const [showError, setShowError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputValueRef = useRef("");

  const triggerShake = useCallback(() => {
    setShaking(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShaking(true);
      });
    });
  }, []);

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
          autoHighlight
          onValueChange={(val) => {
            setShowError(false);
            setShaking(false);
            onChange(val ?? null);
          }}
          itemToStringLabel={(road) => road.name}
          filter={matchesRoad}
          onInputValueChange={(val) => {
            inputValueRef.current = val;
            if (showError) {
              setShowError(false);
              setShaking(false);
            }
          }}
          onOpenChange={(open, eventDetails) => {
            if (!open && eventDetails.reason === "none") {
              const trimmed = inputValueRef.current.trim();
              if (
                trimmed !== "" &&
                !roads.some((r) => matchesRoad(r, trimmed))
              ) {
                eventDetails.cancel();
                setShowError(true);
                triggerShake();
              }
            }
          }}
        >
          <ComboboxInput
            placeholder={"請選擇路/街..."}
            disabled={disabled}
            aria-invalid={showError || undefined}
            className={shaking ? "animate-shake" : undefined}
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
