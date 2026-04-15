"use client";

import {
  useCallback,
  useEffect,
  useState,
  memo,
  type ComponentType,
} from "react";
import type { City, District } from "@/lib/types";
import { useAddressState } from "@/hooks/use-address-state";
import { AddressForm } from "@/components/address-form";
import { ModeToggle } from "@/components/mode-toggle";
import { Card } from "@/components/ui/card";

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

interface TaiwanMapProps {
  city: City | null;
  district: District | null;
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
  <div className="border-border/50 bg-muted/30 h-full w-full animate-pulse rounded-xl border" />
);

const MapError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="border-border/50 bg-muted/10 flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border">
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
}: {
  Component: ComponentType<TaiwanMapProps>;
  city: City | null;
  district: District | null;
}) {
  return <Component city={city} district={district} />;
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
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:grid lg:min-h-screen lg:max-w-6xl lg:grid-cols-[minmax(0,30rem)_1fr] lg:items-center lg:gap-8 lg:py-0">
      <div>
        <Card className="mb-6 hidden border-l lg:flex" size="sm">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0"/><circle cx="12" cy="8" r="2"/><path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712"/></svg>
              <span className="text-lg font-semibold tracking-tight">
                zipkit
              </span>
              <span className="text-muted-foreground text-base">/</span>
              <span className="text-muted-foreground text-base">
                {"地址英譯 & 郵遞區號"}
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
          </div>
        </Card>
        <AddressForm cities={cities} {...addressState} />
      </div>

      {/* Always in the DOM — SSR grid is correct, zero layout shift.
          CSS `hidden lg:block` toggles visibility without JS. */}
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          {mapState.status === "ready" ? (
            <LazyMap
              Component={mapState.Component}
              city={addressState.state.city}
              district={addressState.state.district}
            />
          ) : mapState.status === "error" ? (
            <MapError onRetry={retry} />
          ) : (
            <MapPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}
