"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import { Map as BaseMap, useMap as useBaseMap } from "@/components/ui/map";
import { proxyCartoUrl, neutralizeMapColors } from "@/lib/map-proxy";

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
  dark: "/map-cdn/basemaps/gl/dark-matter-gl-style/style.json",
  light: "/map-cdn/basemaps/gl/positron-gl-style/style.json",
};

/**
 * Applies color neutralization to Carto basemap layers after each style load.
 * Strips saturation and pins background/water colors to the project palette.
 * Uses useLayoutEffect to run before the browser paints, avoiding color flash.
 */
function NeutralizeColors() {
  const { map, isLoaded, resolvedTheme } = useMap();

  useLayoutEffect(() => {
    if (!map || !isLoaded) return;
    neutralizeMapColors(map, resolvedTheme);
  }, [map, isLoaded, resolvedTheme]);

  return null;
}

type MapProps = React.ComponentProps<typeof BaseMap>;

/**
 * Project-customized Map.
 * Wraps the stock mapcn Map with:
 * - Proxied Carto CDN URLs to bypass CORS
 * - Automatic basemap color neutralization
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
        <NeutralizeColors />
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
