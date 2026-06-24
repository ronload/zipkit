import { Input as BaseInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Project-customized Input.
 * Overrides the stock shadcn md:text-sm so all inputs consistently use
 * text-base at every breakpoint, matching the select trigger font size.
 */
function Input({
  className,
  ...props
}: React.ComponentProps<typeof BaseInput>) {
  return <BaseInput className={cn("md:text-base", className)} {...props} />;
}

export { Input };
