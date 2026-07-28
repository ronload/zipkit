"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-3 px-4 py-24 text-center sm:px-6">
      <h1 className="text-lg font-semibold tracking-tight">頁面發生錯誤</h1>
      <p className="text-muted-foreground text-sm">
        請重新整理再試一次，若持續發生歡迎回報問題。
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-1 rounded-md px-4 py-2 text-sm transition-colors"
      >
        重試
      </button>
    </div>
  );
}
