"use client";

import { useState } from "react";
import type { Road } from "@/lib/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Loader2 } from "lucide-react";

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
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {"路/街"}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled || loading}
          className="flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50"
        >
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {"載入中..."}
            </span>
          ) : value ? (
            <span className="truncate text-left">
              {value.name} ({value.en})
            </span>
          ) : (
            <span className="text-muted-foreground">{"請選擇路/街..."}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) p-0">
          <Command>
            <CommandInput placeholder={"搜尋路街名稱..."} />
            <CommandList>
              <CommandEmpty>{"查無結果"}</CommandEmpty>
              <CommandGroup>
                {roads.map((road) => (
                  <CommandItem
                    key={road.name}
                    value={`${road.name} ${road.en}`}
                    onSelect={() => {
                      onChange(road);
                      setOpen(false);
                    }}
                    data-checked={value?.name === road.name ? true : undefined}
                  >
                    <span>{road.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {road.en}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
