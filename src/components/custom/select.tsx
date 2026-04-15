"use client";

import { SelectTrigger as BaseSelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Project-customized SelectTrigger.
 * Adds disabled background styles to match the Input disabled appearance.
 */
function SelectTrigger({
  className,
  ...props
}: React.ComponentProps<typeof BaseSelectTrigger>) {
  return (
    <BaseSelectTrigger
      className={cn("disabled:bg-input/50 dark:disabled:bg-input/80", className)}
      {...props}
    />
  );
}

export { SelectTrigger };
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectValue,
} from "@/components/ui/select";
