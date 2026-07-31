"use client";

import {
  Component,
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useTheme } from "next-themes";
import { Map as BaseMap, useMap as useBaseMap } from "@/components/ui/map";
import { proxyCartoUrl } from "@/lib/map-proxy";
import { cn } from "@/lib/utils";

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

/**
 * MapLibre defaults to `powerPreference: "high-performance"`, which Gecko maps
 * to CreateContextFlags::HIGH_POWER; that in turn drops
 * NSOpenGLPFAAllowOfflineRenderers from the pixel format, so context creation
 * fails on Apple silicon (FEATURE_FAILURE_CGL_FBO). Apple silicon has one GPU,
 * so the hint buys nothing anyway. Mozilla's own fix for this strips the same
 * flag unconditionally on aarch64 (bug 2048402, Firefox 154).
 *
 * Shared with the probe below so it asks for exactly what the map asks for; a
 * probe requesting something easier would pass and let the map throw anyway.
 */
const CANVAS_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  powerPreference: "default",
};

/**
 * MapLibre GL v6 requires a `webgl2` context. Probe for the same capability so
 * the map can degrade to a placeholder instead of tearing down the page.
 */
function probeWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", CANVAS_CONTEXT_ATTRIBUTES);
    if (!gl) return false;
    // Release the probe context immediately; browsers cap live GL contexts.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

let cachedSupport: boolean | null = null;

function getWebGLSupport(): boolean {
  cachedSupport ??= probeWebGL();
  return cachedSupport;
}

const unsubscribeFromNothing = () => {
  // WebGL availability cannot change for the lifetime of the document.
};
const subscribeToNothing = () => unsubscribeFromNothing;

/**
 * The server snapshot assumes WebGL is available so SSR markup matches what a
 * working browser renders; the client snapshot takes over after hydration and
 * swaps in the fallback when it does not.
 */
function useWebGLSupport(): boolean {
  return useSyncExternalStore(subscribeToNothing, getWebGLSupport, () => true);
}

/**
 * Catches whatever the probe misses (driver loses the context between probe
 * and construction, style parse failure, …) so a broken map never unmounts
 * the rest of the tree.
 */
class MapErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Map initialization failed:", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function MapUnavailable({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-border/50 bg-muted/10 text-muted-foreground flex h-full w-full items-center justify-center rounded-xl border p-6 text-center text-sm",
        className,
      )}
    >
      此瀏覽器無法顯示地圖（WebGL 無法啟用），其他功能不受影響。
    </div>
  );
}

type MapProps = React.ComponentProps<typeof BaseMap>;

/**
 * Project-customized Map.
 * Wraps the stock mapcn Map with:
 * - Pre-processed neutral basemap styles (no runtime color flash)
 * - resolvedTheme re-added to useMap context (removed by upstream)
 * - WebGL guard + error boundary so a map failure stays contained
 */
function Map({
  children,
  className,
  styles,
  fallback,
  canvasContextAttributes,
  ...props
}: MapProps & { children?: ReactNode; fallback?: ReactNode }) {
  const { resolvedTheme: nextTheme } = useTheme();
  const resolvedTheme: Theme = nextTheme === "dark" ? "dark" : "light";
  const hasWebGL = useWebGLSupport();

  const mergedStyles = {
    dark: styles?.dark ?? proxyStyles.dark,
    light: styles?.light ?? proxyStyles.light,
  };

  const fallbackNode = fallback ?? <MapUnavailable className={className} />;

  if (!hasWebGL) {
    return fallbackNode;
  }

  return (
    <CustomMapContext.Provider value={{ resolvedTheme }}>
      <MapErrorBoundary fallback={fallbackNode}>
        <BaseMap
          {...props}
          className={className}
          styles={mergedStyles}
          canvasContextAttributes={{
            ...CANVAS_CONTEXT_ATTRIBUTES,
            ...canvasContextAttributes,
          }}
          transformRequest={(url: string) => ({ url: proxyCartoUrl(url) })}
        >
          {children}
        </BaseMap>
      </MapErrorBoundary>
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
