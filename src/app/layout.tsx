import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "zipkit | 台灣地址英譯 & 郵遞區號查詢",
    template: "%s | zipkit",
  },
  description:
    "輸入台灣中文地址，一鍵取得標準英文地址與 3+3 郵遞區號。免驗證碼、純前端運算、零延遲。",
  keywords: [
    "台灣地址英譯",
    "郵遞區號查詢",
    "3+3郵遞區號",
    "Taiwan address translation",
    "zip code lookup",
    "中文地址翻譯英文",
    "郵遞區號",
    "zipkit",
  ],
  authors: [{ name: "ronload", url: "https://github.com/ronload" }],
  creator: "ronload",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "zipkit",
    title: "zipkit | 台灣地址英譯 & 郵遞區號查詢",
    description:
      "輸入台灣中文地址，一鍵取得標準英文地址與 3+3 郵遞區號。免驗證碼、純前端運算、零延遲。",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "zipkit | 台灣地址英譯 & 郵遞區號查詢",
    description:
      "輸入台灣中文地址，一鍵取得標準英文地址與 3+3 郵遞區號。免驗證碼、純前端運算、零延遲。",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <header className="border-border/50 bg-background/80 sticky top-0 z-40 flex h-12 items-center justify-between border-b px-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight">
                zipkit
              </span>
              <span className="text-muted-foreground hidden text-base sm:inline">
                /
              </span>
              <span className="text-muted-foreground hidden text-base sm:inline">
                {"地址英譯"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <a
                href="https://github.com/ronload/zipkit"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </a>
              <ModeToggle />
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-border/50 text-muted-foreground/70 border-t px-4 py-3 text-xs sm:px-6">
            {"地址英譯僅供參考。資料來源：中華郵政。"}
          </footer>
          <Toaster
            toastOptions={{
              className:
                "!bg-card !text-card-foreground !border-border/50 !shadow-lg",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
