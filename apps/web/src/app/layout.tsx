import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { LogoIcon, GitHubIcon } from "@/components/icons";
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
    card: "summary_large_image",
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
}: {
  children: React.ReactNode;
}) {
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
          <header className="bg-background/60 sticky top-0 z-40 w-full backdrop-blur-sm">
            <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6 lg:max-w-6xl">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="bg-foreground text-background size-7 rounded-md p-1.5">
                  <LogoIcon className="size-full" />
                </span>
                <span className="text-foreground/80 font-mono text-sm font-medium tracking-[0.5px] uppercase sm:text-base">
                  zipkit
                </span>
              </Link>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/ronload/zipkit"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="text-muted-foreground hover:bg-secondary hover:text-foreground inline-flex h-8 w-8 items-center justify-center gap-1.5 rounded-full border font-mono text-xs transition-colors sm:w-auto sm:px-3"
                >
                  <GitHubIcon className="size-3.5" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
                <ModeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
            <Analytics />
            <SpeedInsights />
          </main>
          <footer className="border-border/50 text-muted-foreground/70 border-t text-xs">
            <div className="mx-auto w-full max-w-3xl px-4 py-3 sm:px-6 lg:max-w-6xl">
              <p>{"地址英譯僅供參考。"}</p>
              <p className="mt-1">
                {"資料來源："}
                <a
                  href="https://github.com/donma/TaiwanAddressCityAreaRoadChineseEnglishJSON"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground underline underline-offset-2"
                >
                  {"TaiwanAddressCityAreaRoadChineseEnglishJSON"}
                </a>
                {"、"}
                <a
                  href="https://www.post.gov.tw/post/internet/Download/index.jsp?ID=2292"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground underline underline-offset-2"
                >
                  {"中華郵政 3+3 郵遞區號"}
                </a>
              </p>
            </div>
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
