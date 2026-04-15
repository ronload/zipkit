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
  zip6: string | null;
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
  zip6,
}: {
  Component: ComponentType<TaiwanMapProps>;
  city: City | null;
  district: District | null;
  zip6: string | null;
}) {
  return <Component city={city} district={district} zip6={zip6} />;
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
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-8 lg:py-8">
      <AddressForm cities={cities} {...addressState} />

      {/* Always in the DOM — SSR grid is correct, zero layout shift.
          CSS `hidden lg:block` toggles visibility without JS. */}
      <div className="hidden lg:block">
        <div className="sticky top-16 h-[calc(100vh-8rem)]">
          {mapState.status === "ready" ? (
            <LazyMap
              Component={mapState.Component}
              city={addressState.state.city}
              district={addressState.state.district}
              zip6={addressState.zip6}
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
