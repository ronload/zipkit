"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => {
        setTheme(resolvedTheme === "light" ? "dark" : "light");
      }}
      aria-label="切換主題"
      className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md transition-colors"
    >
      <Sun className="h-3.5 w-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-3.5 w-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </button>
  );
}
