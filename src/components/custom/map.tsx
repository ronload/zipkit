"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Map as BaseMap, useMap as useBaseMap } from "@/components/ui/map";
import { proxyCartoUrl } from "@/lib/map-proxy";

type Theme = "light" | "dark";

interface CustomMapContextValue {
  resolvedTheme: Theme;
}

const CustomMapContext = createContext<CustomMapContextValue>({
  resolvedTheme: "light",
});

/**
 * Custom useMap that extends the stock mapcn useMap with resolvedTheme.
 * Upstream mapcn removed resolvedTheme from its context; this wrapper
 * re-provides it via next-themes so consuming components keep working.
 */
function useMap() {
  const base = useBaseMap();
  const { resolvedTheme } = useContext(CustomMapContext);
  return { ...base, resolvedTheme };
}

const proxyStyles = {
  dark: "/data/styles/dark-matter-neutral.json",
  light: "/data/styles/positron-neutral.json",
};

type MapProps = React.ComponentProps<typeof BaseMap>;

/**
 * Project-customized Map.
 * Wraps the stock mapcn Map with:
 * - Pre-processed neutral basemap styles (no runtime color flash)
 * - resolvedTheme re-added to useMap context (removed by upstream)
 */
function Map({
  children,
  styles,
  ...props
}: MapProps & { children?: ReactNode }) {
  const { resolvedTheme: nextTheme } = useTheme();
  const resolvedTheme: Theme = nextTheme === "dark" ? "dark" : "light";

  const mergedStyles = {
    dark: styles?.dark ?? proxyStyles.dark,
    light: styles?.light ?? proxyStyles.light,
  };

  return (
    <CustomMapContext.Provider value={{ resolvedTheme }}>
      <BaseMap
        {...props}
        styles={mergedStyles}
        transformRequest={(url: string) => ({ url: proxyCartoUrl(url) })}
      >
        {children}
      </BaseMap>
    </CustomMapContext.Provider>
  );
}

export { Map, useMap };
export {
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  MarkerLabel,
  MapPopup,
  MapControls,
  MapRoute,
  MapClusterLayer,
} from "@/components/ui/map";
export type { MapRef, MapViewport } from "@/components/ui/map";
