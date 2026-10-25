import { cn } from "@/lib/utils";

/** Mono uppercase caption led by a small corner mark in the accent color. */
export function SectionLabel({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.04em] uppercase",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="border-mark size-[7px] shrink-0 border-s-2 border-t-2"
      />
      {children}
    </span>
  );
}
