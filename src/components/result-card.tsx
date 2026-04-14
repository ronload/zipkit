"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

interface ResultCardProps {
  englishAddress: string;
  zip6: string | null;
  zip3: string | null;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(label);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function ResultCard({ englishAddress, zip6, zip3 }: ResultCardProps) {
  return (
    <div className="divide-y divide-border/40 rounded-lg border border-border/60">
      <div className="p-4">
        <div className="mb-2 flex h-6 items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {"英文地址"}
          </span>
          {englishAddress && (
            <CopyButton text={englishAddress} label={"已複製英文地址"} />
          )}
        </div>
        <p className="min-h-[4.875rem] text-base font-medium leading-relaxed tracking-wide">
          {englishAddress}
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border/40">
        <div className="p-4">
          <div className="mb-2 flex h-6 items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {"3+3 郵遞區號"}
            </span>
            {zip6 && (
              <CopyButton text={zip6} label={"已複製 3+3 郵遞區號"} />
            )}
          </div>
          <p className="font-mono text-xl font-semibold tracking-wider tabular-nums">
            {zip6 ? (
              <>
                <span className="text-foreground">{zip6.slice(0, 3)}</span>
                <span className="text-primary">{zip6.slice(3)}</span>
              </>
            ) : (
              <span className="invisible">000000</span>
            )}
          </p>
        </div>
        <div className="p-4">
          <div className="mb-2 flex h-6 items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {"3 碼"}
            </span>
            {zip3 && (
              <CopyButton text={zip3} label={"已複製郵遞區號"} />
            )}
          </div>
          <p className="font-mono text-xl font-semibold tracking-wider tabular-nums">
            {zip3 || <span className="invisible">000</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
