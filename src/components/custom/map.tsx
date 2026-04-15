"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { Map as BaseMap, useMap } from "@/components/ui/map";
import { proxyCartoUrl, neutralizeMapColors } from "@/lib/map-proxy";

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
 */
function Map({
  children,
  styles,
  ...props
}: MapProps & { children?: ReactNode }) {
  const mergedStyles = {
    dark: styles?.dark ?? proxyStyles.dark,
    light: styles?.light ?? proxyStyles.light,
  };

  return (
    <BaseMap
      {...props}
      styles={mergedStyles}
      transformRequest={(url: string) => ({ url: proxyCartoUrl(url) })}
    >
      <NeutralizeColors />
      {children}
    </BaseMap>
  );
}

export { Map };
export {
  useMap,
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
