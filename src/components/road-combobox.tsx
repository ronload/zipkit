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
      <label className="text-[11px] font-medium text-muted-foreground">
        {"路/街"}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled || loading}
          className="flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50"
        >
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {"載入中..."}
            </span>
          ) : value ? (
            <span className="truncate text-left">
              {value.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{"請選擇路/街..."}</span>
          )}
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-40" />
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
                    {road.name}
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
