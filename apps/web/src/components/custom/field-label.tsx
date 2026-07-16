import { cn } from "@/lib/utils";

/**
 * Shared form field label: consistent typography plus an optional required
 * marker that stays out of the accessible name.
 */
function FieldLabel({
  required = false,
  className,
  children,
  ...props
}: React.ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label
      className={cn("text-muted-foreground text-[11px] font-medium", className)}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-destructive ml-0.5">
          *
        </span>
      )}
    </label>
  );
}

export { FieldLabel };
