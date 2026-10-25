import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const corner =
  "pointer-events-none absolute size-[9px] border-black dark:border-neutral-300";

interface BracketBadgeProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/** External link badge framed by four corner brackets. */
export function BracketBadge({ href, children, className }: BracketBadgeProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative inline-flex focus-visible:outline-2 focus-visible:outline-offset-[6px] motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(corner, "-top-1 -left-1 border-t-2 border-l-2")}
      />
      <span
        aria-hidden="true"
        className={cn(corner, "-top-1 -right-1 border-t-2 border-r-2")}
      />
      <span
        aria-hidden="true"
        className={cn(corner, "-bottom-1 -left-1 border-b-2 border-l-2")}
      />
      <span
        aria-hidden="true"
        className={cn(corner, "-right-1 -bottom-1 border-r-2 border-b-2")}
      />
      <span className="inline-flex h-[26px] items-center gap-1.5 bg-[#ececec] px-2.5 text-[13px] text-black transition-colors group-hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:group-hover:bg-neutral-700">
        {children}
      </span>
    </a>
  );
}
