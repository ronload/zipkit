"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { City } from "@/lib/types";
import { useAddressState } from "@/hooks/use-address-state";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AddressForm } from "@/components/address-form";

// Module-level: start downloading the map chunk during hydration (before any
// useEffect fires). Only on desktop to avoid wasting mobile bandwidth.
// The bundler caches the module, so subsequent import() calls in useEffect
// resolve instantly without an extra network request.
// Also prime the HTTP cache for counties data in parallel.
const isDesktopAtLoad =
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1024px)").matches;

if (isDesktopAtLoad) {
  void import("@/components/taiwan-map");
  void fetch("/data/map/counties-10t.json");
}

const MapPlaceholder = () => (
  <div className="border-border/50 bg-muted/30 h-full w-full animate-pulse rounded-xl border" />
);

interface AddressPageProps {
  cities: City[];
}

export function AddressPage({ cities }: AddressPageProps) {
  const addressState = useAddressState();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [TaiwanMap, setTaiwanMap] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    if (!isDesktop) return;

    let cancelled = false;

    // The bundler caches dynamic imports, so this resolves instantly if the
    // module-level preload already completed. No module-level promise ref
    // needed -- avoids Strict-Mode / HMR race conditions and adds retry on
    // transient chunk-load failures.
    import("@/components/taiwan-map").then(
      (mod) => {
        if (!cancelled) setTaiwanMap(() => mod.TaiwanMap);
      },
      () => {
        // Retry once on transient chunk-load failure
        if (!cancelled) {
          void import("@/components/taiwan-map").then((mod) => {
            if (!cancelled) setTaiwanMap(() => mod.TaiwanMap);
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [isDesktop]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-8 lg:py-8">
      <AddressForm cities={cities} {...addressState} />
      {isDesktop && (
        <div>
          <div className="sticky top-16 h-[calc(100vh-8rem)]">
            {TaiwanMap ? (
              <TaiwanMap
                city={addressState.state.city}
                district={addressState.state.district}
                zip6={addressState.zip6}
              />
            ) : (
              <MapPlaceholder />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
