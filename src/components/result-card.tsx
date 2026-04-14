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
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success(label);
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-6 w-6 items-center justify-center rounded-md transition-colors"
    >
      {copied ? (
        <Check className="text-primary h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function ResultCard({ englishAddress, zip6, zip3 }: ResultCardProps) {
  return (
    <div className="divide-border/40 border-border/60 divide-y rounded-lg border">
      <div className="p-4">
        <div className="mb-2 flex h-6 items-center justify-between">
          <span className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
            {"英文地址"}
          </span>
          {englishAddress && (
            <CopyButton text={englishAddress} label={"已複製英文地址"} />
          )}
        </div>
        <p className="min-h-[4.875rem] text-base leading-relaxed font-medium tracking-wide">
          {englishAddress}
        </p>
      </div>

      <div className="divide-border/40 grid grid-cols-2 divide-x">
        <div className="p-4">
          <div className="mb-2 flex h-6 items-center justify-between">
            <span className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
              {"3+3 郵遞區號"}
            </span>
            {zip6 && <CopyButton text={zip6} label={"已複製 3+3 郵遞區號"} />}
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
            <span className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
              {"3 碼"}
            </span>
            {zip3 && <CopyButton text={zip3} label={"已複製郵遞區號"} />}
          </div>
          <p className="font-mono text-xl font-semibold tracking-wider tabular-nums">
            {zip3 ?? <span className="invisible">000</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
