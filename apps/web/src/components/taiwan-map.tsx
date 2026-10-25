"use client";

import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { LngLat } from "maplibre-gl";
import type {
  FilterSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  PaddingOptions,
} from "maplibre-gl";
import type { City, District } from "@zipkit/core";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/custom/map";
import { FeatureStateTweener } from "@/lib/feature-state-tween";
import { loadCountiesTopology, loadTownsTopology } from "@/lib/map-data-loader";
import {
  buildRegions,
  distance,
  flightDuration,
  nextTourStop,
  TAIWAN_BOUNDS,
  townKey,
  type Pace,
  type Region,
  type Regions,
  type SpotlightData,
} from "@/lib/map-spotlight";
import { normalizeCityName, type Bounds } from "@/lib/map-utils";

interface TaiwanMapProps {
  city: City | null;
  district: District | null;
  cities: City[];
}

type Theme = "light" | "dark";

interface Palette {
  /** The page background, so dimmed areas sink into the page and its fades. */
  mask: string;
  maskOpacity: number;
  countyLine: string;
  townLine: string;
  focus: string;
  /** Opacity of the focus color laid over the focused region. */
  lift: number;
}

interface Focus {
  key: string;
  region: Region;
  pace: Pace;
  maxZoom: number;
  title: string;
  caption: string;
}

interface CameraTarget {
  bounds: Bounds;
  maxZoom: number;
}

const SOURCE = "spotlight";
const COUNTY_LINE = "spotlight-county-line";
const TOWN_LINE = "spotlight-town-line";
const MASK = "spotlight-mask";
const FOCUS_FILL = "spotlight-focus-fill";
const FOCUS_LINE = "spotlight-focus-line";

const palettes: Record<Theme, Palette> = {
  dark: {
    mask: "#0a0a0a",
    maskOpacity: 0.65,
    countyLine: "rgba(255, 255, 255, 0.15)",
    townLine: "rgba(255, 255, 255, 0.2)",
    focus: "#fafafa",
    lift: 0.05,
  },
  light: {
    mask: "#ffffff",
    maskOpacity: 0.6,
    countyLine: "rgba(0, 0, 0, 0.15)",
    townLine: "rgba(0, 0, 0, 0.2)",
    focus: "#0a0a0a",
    lift: 0.04,
  },
};

const MAX_ZOOM = { tour: 9.5, county: 11, town: 13 };

const DIM_MS = 900;
const LIGHT_MS = 700;
/**
 * Share of the camera flight that passes before the new focus lights up.
 * flyTo eases out, so by half time the camera is already closing in.
 */
const LIGHT_LAG = 0.5;
const OUTLINE_IN_MS = 600;
const OUTLINE_OUT_MS = 400;
const REVEAL_MS = 450;
/** Shows the map even if the spotlight never gets drawn, e.g. without data. */
const REVEAL_TIMEOUT_MS = 2000;
const REDUCED_MOTION_MS = 200;

const TOUR_FIRST_MS = 1600;
const TOUR_RESUME_MS = 2000;
const TOUR_STEP_MS = 4600;
const REFIT_DELAY_MS = 200;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => {
    mql.removeEventListener("change", onChange);
  };
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
  };
}

function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}

function reportError(error: unknown) {
  console.error("Map data failed to load:", error);
}

function hideBasemapLabels(map: MapLibreMap) {
  for (const id of map.getLayersOrder()) {
    if (map.getLayer(id)?.type !== "symbol") continue;
    // Setting it unconditionally would change the style on every call, and
    // this runs on every styledata event.
    if (map.getLayoutProperty(id, "visibility") === "none") continue;
    map.setLayoutProperty(id, "visibility", "none");
  }
}

function hideCanvas(map: MapLibreMap) {
  const { style } = map.getCanvas();
  style.transition = "";
  style.opacity = "0";
}

function showCanvas(map: MapLibreMap, fadeMs: number) {
  const { style } = map.getCanvas();
  if (style.opacity !== "0") return;
  style.transition = `opacity ${String(fadeMs)}ms ease-out`;
  style.opacity = "";
}

function townLineFilter(countyId: number | null): FilterSpecification {
  return [
    "all",
    ["==", ["get", "kind"], "town"],
    ["==", ["get", "county"], countyId ?? -1],
  ];
}

function addSpotlight(
  map: MapLibreMap,
  data: SpotlightData,
  palette: Palette,
  countyId: number | null,
) {
  map.addSource(SOURCE, { type: "geojson", data });
  map.addLayer({
    id: COUNTY_LINE,
    type: "line",
    source: SOURCE,
    filter: ["==", ["get", "kind"], "county"],
    paint: { "line-color": palette.countyLine, "line-width": 0.8 },
  });
  map.addLayer({
    id: TOWN_LINE,
    type: "line",
    source: SOURCE,
    filter: townLineFilter(countyId),
    paint: { "line-color": palette.townLine, "line-width": 0.5 },
  });
  map.addLayer({
    id: MASK,
    type: "fill",
    source: SOURCE,
    paint: {
      "fill-color": palette.mask,
      // Features settle either clear or fully opaque, so overlapping county
      // and town masks never stack and shared borders leave no seams; the
      // layer opacity then sets the strength of the whole mask at once.
      "fill-opacity": [
        "case",
        ["==", ["get", "kind"], "outside"],
        1,
        ["number", ["feature-state", "dim"], 0],
      ],
      "fill-layer-opacity": palette.maskOpacity,
    },
  });
  // In dark mode the mask has the land's own color, so dimming only shows
  // on water and roads. Lifting the focused region makes it read as lit.
  map.addLayer({
    id: FOCUS_FILL,
    type: "fill",
    source: SOURCE,
    filter: ["!=", ["get", "kind"], "outside"],
    paint: {
      "fill-color": palette.focus,
      "fill-opacity": [
        "*",
        palette.lift,
        ["number", ["feature-state", "focus"], 0],
      ],
      "fill-antialias": false,
    },
  });
  map.addLayer({
    id: FOCUS_LINE,
    type: "line",
    source: SOURCE,
    filter: ["!=", ["get", "kind"], "outside"],
    paint: {
      "line-color": palette.focus,
      "line-width": 1.2,
      "line-opacity": ["*", 0.6, ["number", ["feature-state", "focus"], 0]],
    },
  });
}

/** Keeps the subject clear of the left fade, with headroom for its label. */
function fitPadding(width: number): PaddingOptions {
  return {
    top: 80,
    right: 56,
    bottom: 56,
    left: Math.round(width * 0.22) + 32,
  };
}

function cameraFor(map: MapLibreMap, { bounds, maxZoom }: CameraTarget) {
  const { clientWidth, clientHeight } = map.getContainer();
  if (clientWidth === 0 || clientHeight === 0) return undefined;
  return map.cameraForBounds(bounds, {
    padding: fitPadding(clientWidth),
    maxZoom,
  });
}

/** Returns how long the flight takes in ms; 0 when the camera did not fly. */
function flyTo(
  map: MapLibreMap,
  target: CameraTarget,
  pace: Pace,
  instant: boolean,
): number {
  const camera = cameraFor(map, target);
  if (!camera) return 0;

  const from = map.getCenter();
  const to = LngLat.convert(camera.center ?? from);
  const deg = distance([from.lng, from.lat], [to.lng, to.lat]);
  const zoomChange = Math.abs((camera.zoom ?? map.getZoom()) - map.getZoom());
  if (deg < 1e-4 && zoomChange < 0.01) return 0;

  if (instant) {
    map.jumpTo(camera);
    return 0;
  }
  const duration = flightDuration(deg, pace);
  map.flyTo({ ...camera, duration });
  return duration;
}

/**
 * What the spotlight is on: `null` lights the whole island, `undefined`
 * means the data needed to place it is still loading.
 */
function resolveFocus(
  regions: Regions | null,
  cities: readonly City[],
  city: City | null,
  district: District | null,
  tourId: number | null,
): Focus | null | undefined {
  if (!regions) return undefined;

  if (!city) {
    const stop = regions.counties.find((county) => county.id === tourId);
    if (!stop) return null;
    const match = cities.find((c) => normalizeCityName(c.name) === stop.name);
    return {
      key: `tour:${String(stop.id)}`,
      region: stop,
      pace: "tour",
      maxZoom: MAX_ZOOM.tour,
      title: match?.name ?? stop.name,
      caption: match?.en ?? "",
    };
  }

  const county = regions.countyByName.get(normalizeCityName(city.name));
  if (!county) return null;

  if (district) {
    // Wait for the towns instead of settling on the county first.
    if (!regions.hasTowns) return undefined;
    // 釣魚臺, 東沙群島 and 南沙群島 have no boundary and keep the county.
    const town = regions.townByKey.get(townKey(county.id, district.name));
    if (town) {
      return {
        key: `town:${String(town.id)}`,
        region: town,
        pace: "select",
        maxZoom: MAX_ZOOM.town,
        title: district.name,
        caption: `${district.en} · ${district.zip3}`,
      };
    }
  }

  return {
    key: `county:${String(county.id)}`,
    region: county,
    pace: "select",
    maxZoom: MAX_ZOOM.county,
    title: city.name,
    caption: city.en,
  };
}

/**
 * Dims everything but the focus. Dimming starts at once; lighting waits for
 * `lightDelay`, so the new region lights up as the camera arrives.
 */
function fadeTo(
  tweener: FeatureStateTweener,
  regions: Regions,
  focus: Focus | null,
  lightDelay: number,
  reducedMotion: boolean,
) {
  const dimMs = reducedMotion ? REDUCED_MOTION_MS : DIM_MS;
  const lightMs = reducedMotion ? REDUCED_MOTION_MS : LIGHT_MS;
  const dimTo = (id: number, target: number) => {
    if (target > tweener.get(id, "dim")) {
      tweener.to(id, "dim", target, { duration: dimMs });
    } else {
      tweener.to(id, "dim", target, { duration: lightMs, delay: lightDelay });
    }
  };

  const litCounty = focus?.region.countyId ?? null;
  for (const county of regions.counties) {
    dimTo(county.id, litCounty === null || county.id === litCounty ? 0 : 1);
  }

  const litTown = focus?.region.kind === "town" ? focus.region : null;
  for (const town of regions.towns) {
    if (litTown?.countyId === town.countyId) {
      dimTo(town.id, town.id === litTown.id ? 0 : 1);
    } else if (litCounty !== null && town.countyId !== litCounty) {
      // Its county is going dark on top of it; clear it once that is done.
      tweener.to(town.id, "dim", 0, { duration: 0, delay: dimMs });
    } else {
      dimTo(town.id, 0);
    }
  }
}

function Spotlight({ city, district, cities }: TaiwanMapProps) {
  const { map, isLoaded, resolvedTheme } = useMap();
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisible();

  const [regions, setRegions] = useState<Regions | null>(null);
  const [tourId, setTourId] = useState<number | null>(null);
  const [labelKey, setLabelKey] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [ready, setReady] = useState(false);

  const tweenerRef = useRef<FeatureStateTweener | null>(null);
  const appliedRef = useRef<{
    data: SpotlightData | null;
    countyId: number | null;
  }>({ data: null, countyId: null });
  const themeRef = useRef(resolvedTheme);
  /** Set by a theme switch until the map has applied the new basemap. */
  const restylingRef = useRef(false);
  const focusIdRef = useRef<number | null>(null);
  const cameraTargetRef = useRef<CameraTarget>({
    bounds: TAIWAN_BOUNDS,
    maxZoom: MAX_ZOOM.tour,
  });
  const tourBagRef = useRef<number[]>([]);
  const touredRef = useRef(false);

  // Latched so the reload a theme switch causes does not restart the tour.
  if (!ready && isLoaded && regions) setReady(true);

  const focus = resolveFocus(regions, cities, city, district, tourId);
  const focusKey = focus === undefined ? null : (focus?.key ?? "none");
  if (labelKey !== null && labelKey !== focusKey) setLabelKey(null);

  const selectedCountyId = city
    ? (regions?.countyByName.get(normalizeCityName(city.name))?.id ?? null)
    : null;
  const needTowns = city !== null && !regions?.hasTowns;
  const tourActive =
    ready && !city && !reducedMotion && !hovered && !focusWithin && pageVisible;

  // Declared first: the effects below expect the tweener to exist.
  useEffect(() => {
    if (!map) return;
    const tweener = new FeatureStateTweener(map, SOURCE);
    tweenerRef.current = tweener;
    return () => {
      tweener.dispose();
      tweenerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const camera = cameraFor(map, cameraTargetRef.current);
    if (camera) map.jumpTo(camera);
  }, [map]);

  useEffect(() => {
    let cancelled = false;
    loadCountiesTopology().then((topology) => {
      if (cancelled) return;
      const counties = buildRegions(topology);
      // Towns may have won the race; they include the counties.
      setRegions((current) => current ?? counties);
    }, reportError);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!needTowns) return;
    let cancelled = false;
    loadTownsTopology().then((topology) => {
      if (!cancelled) setRegions(buildRegions(topology));
    }, reportError);
    return () => {
      cancelled = true;
    };
  }, [needTowns]);

  const syncSpotlight = useEffectEvent(() => {
    if (!map) return;
    hideBasemapLabels(map);
    if (!regions) return;

    const source = map.getSource<GeoJSONSource>(SOURCE);
    if (!source) {
      // First load, or a theme switch whose style diff dropped the layers.
      // Colors are applied only here, once the new basemap is in place;
      // repainting on the theme change itself would run before the diff.
      addSpotlight(
        map,
        regions.data,
        palettes[resolvedTheme],
        selectedCountyId,
      );
      appliedRef.current = { data: regions.data, countyId: selectedCountyId };
      tweenerRef.current?.reapply();
      return;
    }

    const applied = appliedRef.current;
    if (applied.data !== regions.data) {
      applied.data = regions.data;
      source.setData(regions.data).catch(reportError);
    }
    if (applied.countyId !== selectedCountyId) {
      applied.countyId = selectedCountyId;
      map.setFilter(TOWN_LINE, townLineFilter(selectedCountyId));
    }
  });

  const revealCanvas = useEffectEvent(() => {
    if (map) showCanvas(map, reducedMotion ? REDUCED_MOTION_MS : REVEAL_MS);
  });

  useEffect(() => {
    if (!map) return;
    const subscriptions = [
      map.on("styledata", () => {
        syncSpotlight();
      }),
      // Fires once a theme switch's basemap is in place. Its style diff
      // removed the spotlight; the next styledata adds it back.
      map.on("style.load", () => {
        restylingRef.current = false;
      }),
      map.on("sourcedata", (event) => {
        // Before that, loads of the old spotlight, its removal included,
        // would reveal a map that is about to lose its mask.
        if (
          event.sourceId === SOURCE &&
          event.isSourceLoaded &&
          !restylingRef.current
        ) {
          revealCanvas();
        }
      }),
    ];
    return () => {
      for (const subscription of subscriptions) subscription.unsubscribe();
    };
  }, [map]);

  useEffect(() => {
    if (isLoaded) syncSpotlight();
  }, [isLoaded, regions, selectedCountyId]);

  // The canvas stays hidden until the spotlight is drawn: on first load, and
  // while a theme switch restyles the basemap, which would otherwise show
  // the old basemap on the new page and then an unmasked map. A layout
  // effect, so it hides in the same frame the page changes theme.
  useLayoutEffect(() => {
    if (!map) return;
    if (themeRef.current !== resolvedTheme) {
      themeRef.current = resolvedTheme;
      restylingRef.current = true;
    }
    hideCanvas(map);
    const timer = setTimeout(() => {
      revealCanvas();
    }, REVEAL_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [map, resolvedTheme]);

  const applyFocus = useEffectEvent((): number => {
    const tweener = tweenerRef.current;
    if (!map || !tweener || !regions || focus === undefined) return 0;

    const target: CameraTarget = focus
      ? { bounds: focus.region.bounds, maxZoom: focus.maxZoom }
      : { bounds: TAIWAN_BOUNDS, maxZoom: MAX_ZOOM.tour };
    cameraTargetRef.current = target;
    const flight = flyTo(map, target, focus?.pace ?? "select", reducedMotion);
    const lightDelay = reducedMotion ? 0 : flight * LIGHT_LAG;
    fadeTo(tweener, regions, focus, lightDelay, reducedMotion);

    const previousId = focusIdRef.current;
    const nextId = focus?.region.id ?? null;
    focusIdRef.current = nextId;
    if (previousId !== null && previousId !== nextId) {
      tweener.to(previousId, "focus", 0, {
        duration: reducedMotion ? REDUCED_MOTION_MS : OUTLINE_OUT_MS,
      });
    }
    if (nextId !== null) {
      tweener.to(nextId, "focus", 1, {
        duration: reducedMotion ? REDUCED_MOTION_MS : OUTLINE_IN_MS,
        delay: lightDelay,
      });
    }
    return flight;
  });

  useEffect(() => {
    if (focusKey === null) return;
    const flight = applyFocus();
    const timer = setTimeout(() => {
      setLabelKey(focusKey);
    }, flight);
    return () => {
      clearTimeout(timer);
    };
  }, [focusKey]);

  const advanceTour = useEffectEvent(() => {
    if (!regions) return;
    const next = nextTourStop(regions.counties, tourBagRef.current, tourId);
    if (next) setTourId(next.id);
  });

  useEffect(() => {
    if (!tourActive) return;
    const step = () => {
      touredRef.current = true;
      advanceTour();
      timer = setTimeout(step, TOUR_STEP_MS);
    };
    let timer = setTimeout(
      step,
      touredRef.current ? TOUR_RESUME_MS : TOUR_FIRST_MS,
    );
    return () => {
      clearTimeout(timer);
    };
  }, [tourActive]);

  const refit = useEffectEvent(() => {
    if (!map || map.isMoving()) return;
    const camera = cameraFor(map, cameraTargetRef.current);
    if (camera) map.jumpTo(camera);
  });

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    let width = container.clientWidth;
    let height = container.clientHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const { clientWidth, clientHeight } = container;
        if (clientWidth === width && clientHeight === height) return;
        width = clientWidth;
        height = clientHeight;
        refit();
      }, REFIT_DELAY_MS);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    const onEnter = () => {
      setHovered(true);
    };
    const onLeave = () => {
      setHovered(false);
    };
    // Only keyboard focus pauses the tour. A click focuses the canvas too,
    // and that pause would outlast the pointer leaving.
    const onFocusIn = (event: FocusEvent) => {
      setFocusWithin(
        event.target instanceof Element &&
          event.target.matches(":focus-visible"),
      );
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node && container.contains(next))) {
        setFocusWithin(false);
      }
    };
    container.addEventListener("pointerenter", onEnter);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("focusin", onFocusIn);
    container.addEventListener("focusout", onFocusOut);
    return () => {
      container.removeEventListener("pointerenter", onEnter);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("focusin", onFocusIn);
      container.removeEventListener("focusout", onFocusOut);
    };
  }, [map]);

  if (!focus || labelKey !== focusKey) return null;

  const west = focus.region.bounds[0][0];
  const north = focus.region.bounds[1][1];
  return (
    <MapMarker
      key={focus.key}
      longitude={west}
      latitude={north}
      anchor="bottom-left"
      className="pointer-events-none"
    >
      <MarkerContent className="enter-fx pointer-events-none cursor-default">
        <div aria-hidden="true" className="pb-3 whitespace-nowrap">
          <p className="text-foreground text-sm font-medium">{focus.title}</p>
          {focus.caption && (
            <p className="text-muted-foreground mt-0.5 font-mono text-[11px] font-medium tracking-[0.04em] uppercase">
              {focus.caption}
            </p>
          )}
          <span className="border-mark absolute top-full left-0 size-[9px] border-t-2 border-l-2" />
        </div>
      </MarkerContent>
    </MapMarker>
  );
}

export function TaiwanMap({ city, district, cities }: TaiwanMapProps) {
  return (
    <div className="h-full w-full">
      <Map
        bounds={TAIWAN_BOUNDS}
        className="h-full w-full"
        attributionControl={false}
      >
        <Spotlight city={city} district={district} cities={cities} />
        <MapControls className="right-4 bottom-4" />
      </Map>
    </div>
  );
}
