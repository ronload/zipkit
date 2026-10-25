"use client";

import {
  useCallback,
  useEffect,
  useState,
  memo,
  type ComponentType,
} from "react";
import { ArrowUpRight } from "lucide-react";
import type { City, District } from "@zipkit/core";
import { useAddressState } from "@/hooks/use-address-state";
import { toSlug } from "@/lib/slug";
import { AddressForm } from "@/components/address-form";
import { BracketBadge } from "@/components/bracket-badge";

/* ------------------------------------------------------------------ */
/*  Module-level preload                                               */
/* ------------------------------------------------------------------ */

let mapPromise: Promise<typeof import("@/components/taiwan-map")> | null = null;

/** Returns (and caches) the dynamic import promise. */
function loadMapModule() {
  mapPromise ??= import("@/components/taiwan-map");
  return mapPromise;
}

// Fire-and-forget preload on desktop — runs during hydration, before any
// useEffect. The explicit `mapPromise` ref guarantees dedup regardless of
// bundler internals.
if (
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches
) {
  void loadMapModule();

  // Prefetch GeoJSON via <link rel="prefetch"> so the browser stores it in
  // the HTTP cache with correct headers. A bare fetch() can miss the cache
  // if TaiwanMap internally uses different request options.
  const link = Object.assign(document.createElement("link"), {
    rel: "prefetch",
    href: "/data/map/counties-10t.json",
    as: "fetch",
    crossOrigin: "anonymous",
  });
  document.head.appendChild(link);
}

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

const MAX_RETRIES = 2;

const POSTAL_DATA_URL =
  "https://www.post.gov.tw/post/internet/Download/index.jsp?ID=2292";

interface TaiwanMapProps {
  city: City | null;
  district: District | null;
  cities: City[];
}

type MapLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; Component: ComponentType<TaiwanMapProps> }
  | { status: "error" };

/* ------------------------------------------------------------------ */
/*  Hook: lazy map loader                                              */
/* ------------------------------------------------------------------ */

function useLazyMap() {
  const [state, setState] = useState<MapLoadState>({ status: "idle" });

  const load = useCallback(() => {
    let cancelled = false;
    let attempt = 0;

    const tryLoad = () => {
      setState({ status: "loading" });

      loadMapModule()
        .then((mod) => {
          if (!cancelled) {
            setState({ status: "ready", Component: mod.TaiwanMap });
          }
        })
        .catch(() => {
          mapPromise = null; // allow fresh import on next attempt
          if (cancelled) return;

          if (++attempt <= MAX_RETRIES) {
            tryLoad();
          } else {
            setState({ status: "error" });
          }
        });
    };

    tryLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  const retry = useCallback(() => {
    mapPromise = null;
    load();
  }, [load]);

  return { state, load, retry } as const;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const MapPlaceholder = () => (
  <div className="bg-muted/30 map-fade h-full w-full animate-pulse" />
);

const MapError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
    <p className="text-muted-foreground text-sm">地圖載入失敗</p>
    <button
      type="button"
      onClick={onRetry}
      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm transition-colors"
    >
      重試
    </button>
  </div>
);

/** Memo prevents re-renders when unrelated address fields change. */
const LazyMap = memo(function LazyMap({
  Component,
  city,
  district,
  cities,
}: TaiwanMapProps & { Component: ComponentType<TaiwanMapProps> }) {
  return <Component city={city} district={district} cities={cities} />;
});

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

interface AddressPageProps {
  cities: City[];
}

export function AddressPage({ cities }: AddressPageProps) {
  const addressState = useAddressState();
  const { state: mapState, load, retry } = useLazyMap();

  // Hydrate city/district from ?city=&district= query string (once on mount).
  // Landing pages CTA back to home with these params.
  useEffect(() => {
    const url = new URL(window.location.href);
    const citySlug = url.searchParams.get("city");
    const districtSlug = url.searchParams.get("district");
    if (!citySlug || !districtSlug) return;

    const city = cities.find((c) => toSlug(c.en) === citySlug);
    if (!city) return;
    const district = city.districts.find((d) => toSlug(d.en) === districtSlug);
    if (!district) return;

    addressState.setCity(city);
    addressState.setDistrict(district);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger map load when viewport hits desktop width.
  // Listens for resize so tablet rotation / window expansion still works.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    let cleanup: (() => void) | undefined;
    let loaded = false;

    const onChange = () => {
      if (mql.matches && !loaded) {
        loaded = true;
        cleanup = load();
      }
    };

    onChange(); // check immediately
    mql.addEventListener("change", onChange);

    return () => {
      mql.removeEventListener("change", onChange);
      cleanup?.();
    };
  }, [load]);

  return (
    <div className="@container">
      <div className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:flex lg:min-h-[calc(100dvh-3.5rem)] lg:max-w-6xl lg:items-center">
        <div className="relative z-10 lg:w-[46%] lg:min-w-[440px]">
          <div className="enter-fx [--enter-delay:100ms]">
            <BracketBadge href={POSTAL_DATA_URL} className="ml-1">
              {"資料來源"}
              <span aria-hidden="true" className="opacity-40">
                ·
              </span>
              {"中華郵政"}
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 opacity-60"
              />
            </BracketBadge>
          </div>
          <h1 className="enter-fx mt-6 text-[2rem] leading-[1.15] font-semibold tracking-tight [--enter-delay:180ms] sm:text-4xl lg:text-[2.5rem]">
            {"台灣地址英譯"}
            <br />
            {"與 3+3 郵遞區號查詢"}
          </h1>
          <div className="enter-fx mt-8 [--enter-delay:320ms]">
            <AddressForm cities={cities} {...addressState} />
          </div>
        </div>

        {/* Always in the DOM so the SSR layout is final; `hidden lg:block`
            toggles it without JS. The panel bleeds to the viewport's right
            edge: 100cqw is the page width, 100% the centered container's.
            The inner wrapper sticks under the header and never outgrows the
            viewport, so the camera only frames what is on screen. Only the
            canvas fades out at the edges; labels and controls stay crisp. */}
        <div className="isolate hidden lg:absolute lg:inset-y-0 lg:right-[calc((100%_-_100cqw)/2)] lg:left-[42%] lg:block">
          <div className="[&_.maplibregl-canvas]:map-fade sticky top-14 h-[min(100%,100dvh_-_3.5rem)]">
            {mapState.status === "ready" ? (
              <LazyMap
                Component={mapState.Component}
                city={addressState.state.city}
                district={addressState.state.district}
                cities={cities}
              />
            ) : mapState.status === "error" ? (
              <MapError onRetry={retry} />
            ) : (
              <MapPlaceholder />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
