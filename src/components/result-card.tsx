"use client";

import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface ResultCardProps {
  englishAddress: string;
  zip6: string | null;
  zip3: string | null;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(label);
  });
}

export function ResultCard({ englishAddress, zip6, zip3 }: ResultCardProps) {
  if (!englishAddress && !zip3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{"查詢結果"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {"請先選擇地址以查看英譯結果與郵遞區號。"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{"查詢結果"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {englishAddress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground tracking-wide">
                {"英文地址"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(englishAddress, "已複製英文地址")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-sm font-medium leading-relaxed break-all">
              {englishAddress}
            </p>
          </div>
        )}

        {zip3 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground tracking-wide">
                  {"3+3 郵遞區號"}
                </span>
                {zip6 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() =>
                      copyToClipboard(zip6, "已複製 3+3 郵遞區號")
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-lg font-mono font-semibold">
                {zip6 ?? (
                  <span className="text-sm text-muted-foreground font-normal">
                    {"請輸入門牌號碼查詢"}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground tracking-wide">
                  {"3 碼郵遞區號"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(zip3, "已複製郵遞區號")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-lg font-mono font-semibold">{zip3}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
