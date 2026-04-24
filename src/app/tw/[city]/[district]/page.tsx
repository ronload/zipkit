import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { toSlug } from "@/lib/slug";
import type { City, District, Road, ZipRange } from "@/lib/types";
import baseData from "../../../../../public/data/base.json";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface Params {
  city: string;
  district: string;
}

const CITIES = baseData.cities as City[];
const GENERATED_AT =
  (baseData as { generatedAt?: string }).generatedAt ??
  new Date().toISOString();

function findBySlug(
  citySlug: string,
  districtSlug: string,
): { city: City; district: District } | null {
  for (const city of CITIES) {
    if (toSlug(city.en) !== citySlug) continue;
    const district = city.districts.find((d) => toSlug(d.en) === districtSlug);
    if (district) return { city, district };
  }
  return null;
}

async function loadRoads(zip3: string): Promise<Road[]> {
  const path = join(process.cwd(), "public", "data", "roads", `${zip3}.json`);
  const raw = await readFile(path, "utf-8");
  return (JSON.parse(raw) as { roads: Road[] }).roads;
}

async function loadZipRanges(zip3: string): Promise<ZipRange[]> {
  const path = join(
    process.cwd(),
    "public",
    "data",
    "zip-ranges",
    `${zip3}.json`,
  );
  const raw = await readFile(path, "utf-8");
  return (JSON.parse(raw) as { ranges: ZipRange[] }).ranges;
}

export function generateStaticParams(): Params[] {
  const params: Params[] = [];
  for (const city of CITIES) {
    for (const district of city.districts) {
      params.push({
        city: toSlug(city.en),
        district: toSlug(district.en),
      });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city: citySlug, district: districtSlug } = await params;
  const match = findBySlug(citySlug, districtSlug);
  if (!match) return {};
  const { city, district } = match;
  const title = `${district.name}郵遞區號 & 英文地址 | ${city.name}`;
  const description = `${city.name}${district.name} 3 碼郵遞區號 ${district.zip3}，英文標準寫法為 ${district.en}, ${city.en}。查看該區完整 3+3 郵遞區號列表與道路英譯對照。`;
  const url = `${SITE_URL}/tw/${citySlug}/${districtSlug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "zh_TW",
      siteName: "zipkit",
      title,
      description,
      url,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function DistrictPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city: citySlug, district: districtSlug } = await params;
  const match = findBySlug(citySlug, districtSlug);
  if (!match) notFound();
  const { city, district } = match;

  const [roads, ranges] = await Promise.all([
    loadRoads(district.zip3),
    loadZipRanges(district.zip3),
  ]);

  const zip6Set = new Set(ranges.map((r) => r.zip6));

  const summary = `${city.name}${district.name}為${city.name}下轄之行政區，3 碼郵遞區號為 ${district.zip3}，英文標準寫法為 ${district.en}, ${city.en}。本區共收錄 ${String(roads.length)} 條登錄道路與 ${String(zip6Set.size)} 組 3+3 郵遞區號區段。`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首頁",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `${city.name}${district.name}`,
        item: `${SITE_URL}/tw/${citySlug}/${districtSlug}`,
      },
    ],
  };

  const rangesByRoad = new Map<string, ZipRange[]>();
  for (const r of ranges) {
    const list = rangesByRoad.get(r.road) ?? [];
    list.push(r);
    rangesByRoad.set(r.road, list);
  }
  const sortedRoads = [...roads].sort((a, b) =>
    a.name.localeCompare(b.name, "zh-Hant"),
  );

  const ctaHref = `/?city=${citySlug}&district=${districtSlug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:max-w-6xl">
        <nav
          aria-label="breadcrumb"
          className="text-muted-foreground mb-6 text-sm"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                首頁
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span className="text-foreground">
                {city.name}
                {district.name}
              </span>
            </li>
          </ol>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {district.name}郵遞區號 & 英文地址
          </h1>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">
            {summary}
          </p>
        </header>

        <section className="mb-10">
          <h2 className="sr-only">基本資訊</h2>
          <dl className="border-border/50 dark:bg-input/30 grid grid-cols-2 gap-0 divide-x divide-y rounded-lg border sm:grid-cols-4 sm:divide-y-0">
            <div className="p-4">
              <dt className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
                3 碼郵遞區號
              </dt>
              <dd className="mt-2 font-mono text-xl font-semibold tabular-nums">
                {district.zip3}
              </dd>
            </div>
            <div className="p-4">
              <dt className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
                英文區名
              </dt>
              <dd className="mt-2 text-base font-medium">{district.en}</dd>
            </div>
            <div className="p-4">
              <dt className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
                道路數
              </dt>
              <dd className="mt-2 font-mono text-xl font-semibold tabular-nums">
                {roads.length}
              </dd>
            </div>
            <div className="p-4">
              <dt className="text-muted-foreground text-[11px] font-medium tracking-widest uppercase">
                3+3 區段數
              </dt>
              <dd className="mt-2 font-mono text-xl font-semibold tabular-nums">
                {zip6Set.size}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              {district.name}道路英譯對照
            </h2>
            <span className="text-muted-foreground text-sm">
              共 {roads.length} 條
            </span>
          </div>
          <div className="border-border/50 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground text-[11px] tracking-widest uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">中文</th>
                  <th className="px-4 py-3 text-left font-medium">英文</th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {sortedRoads.map((road) => (
                  <tr key={road.name}>
                    <td className="px-4 py-2.5">{road.name}</td>
                    <td className="text-muted-foreground px-4 py-2.5">
                      {road.en}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              {district.name} 3+3 郵遞區號區段
            </h2>
            <span className="text-muted-foreground text-sm">
              共 {zip6Set.size} 組
            </span>
          </div>
          <div className="border-border/50 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground text-[11px] tracking-widest uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">道路</th>
                  <th className="px-4 py-3 text-left font-medium">
                    對應 3+3 郵遞區號
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border/40 divide-y">
                {[...rangesByRoad.entries()].map(([roadName, list]) => {
                  const unique = [...new Set(list.map((r) => r.zip6))].sort();
                  return (
                    <tr key={roadName}>
                      <td className="px-4 py-2.5 align-top">{roadName}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {unique.map((z) => (
                            <span
                              key={z}
                              className="bg-muted/50 rounded px-1.5 py-0.5 font-mono text-xs tabular-nums"
                            >
                              {z}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-border/50 dark:bg-input/30 rounded-lg border p-5">
          <h2 className="mb-2 text-base font-semibold">
            查詢門牌 3+3 郵遞區號
          </h2>
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
            本頁列出{district.name}全區道路與 3+3
            區段總覽。若要查詢特定門牌號碼對應的 3+3
            郵遞區號與標準英文地址，請使用首頁完整表單。
          </p>
          <Link
            href={ctaHref}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            前往{city.name}
            {district.name}查詢
          </Link>
        </section>

        <footer className="text-muted-foreground/70 mt-10 text-xs">
          <p>
            資料來源：
            <a
              href="https://www.post.gov.tw/post/internet/Download/index.jsp?ID=2292"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              中華郵政 3+3 郵遞區號
            </a>
            、
            <a
              href="https://github.com/donma/TaiwanAddressCityAreaRoadChineseEnglishJSON"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-2"
            >
              TaiwanAddressCityAreaRoadChineseEnglishJSON
            </a>
            。最後更新：
            <time dateTime={GENERATED_AT}>{GENERATED_AT.slice(0, 10)}</time>
          </p>
        </footer>
      </article>
    </>
  );
}
