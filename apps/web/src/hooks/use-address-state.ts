"use client";

import { useReducer, useEffect, useMemo } from "react";
import type {
  City,
  District,
  Road,
  AddressDetail,
  ZipRange,
} from "@zipkit/core";
import { loadRoads, loadZipRanges } from "@/lib/data-loader";
import { formatEnglishAddress, parseNumber } from "@zipkit/core";
import { lookupZip6 } from "@zipkit/core";

const EMPTY_DETAIL: AddressDetail = {
  lane: "",
  alley: "",
  number: "",
  floor: "",
  room: "",
};

type LoadStatus = "idle" | "loading" | "loaded" | "error";

interface State {
  city: City | null;
  district: District | null;
  road: Road | null;
  detail: AddressDetail;
  roads: Road[];
  roadsStatus: LoadStatus;
  zipRanges: ZipRange[];
  zipRangesStatus: LoadStatus;
}

// The async load actions carry the zip3 they were requested for. The reducer
// applies them only while that zip3 is still the selected district's, so a
// fetch that settles after the user has navigated away is dropped regardless
// of when React flushes the loading effect's cleanup.
type Action =
  | { type: "SET_CITY"; payload: City | null }
  | { type: "SET_DISTRICT"; payload: District | null }
  | { type: "SET_ROAD"; payload: Road | null }
  | { type: "SET_DETAIL"; field: keyof AddressDetail; value: string }
  | { type: "SET_ROADS"; zip3: string; payload: Road[] }
  | { type: "SET_ROADS_ERROR"; zip3: string }
  | { type: "SET_ZIP_RANGES"; zip3: string; payload: ZipRange[] }
  | { type: "SET_ZIP_RANGES_ERROR"; zip3: string }
  | { type: "RESET" };

const initialState: State = {
  city: null,
  district: null,
  road: null,
  detail: EMPTY_DETAIL,
  roads: [],
  roadsStatus: "idle",
  zipRanges: [],
  zipRangesStatus: "idle",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CITY":
      return {
        ...initialState,
        city: action.payload,
      };
    case "SET_DISTRICT": {
      // Base UI Select fires onValueChange even when the already-selected
      // item is pressed. Re-selecting the same district (unique by name within
      // a city) must be a no-op: wiping the loaded roads/ranges without a
      // district change would leave the load effect, keyed on the district
      // object, dormant and the form dead-ended with no reload.
      if (action.payload?.name === state.district?.name) return state;
      const loading: LoadStatus = action.payload ? "loading" : "idle";
      return {
        ...state,
        district: action.payload,
        road: null,
        detail: EMPTY_DETAIL,
        roads: [],
        roadsStatus: loading,
        zipRanges: [],
        zipRangesStatus: loading,
      };
    }
    case "SET_ROAD":
      return {
        ...state,
        road: action.payload,
        detail: EMPTY_DETAIL,
      };
    case "SET_DETAIL":
      return {
        ...state,
        detail: { ...state.detail, [action.field]: action.value },
      };
    case "SET_ROADS":
      if (state.district?.zip3 !== action.zip3) return state;
      return { ...state, roads: action.payload, roadsStatus: "loaded" };
    case "SET_ROADS_ERROR":
      if (state.district?.zip3 !== action.zip3) return state;
      return { ...state, roads: [], roadsStatus: "error" };
    case "SET_ZIP_RANGES":
      if (state.district?.zip3 !== action.zip3) return state;
      return {
        ...state,
        zipRanges: action.payload,
        zipRangesStatus: "loaded",
      };
    case "SET_ZIP_RANGES_ERROR":
      if (state.district?.zip3 !== action.zip3) return state;
      // Clear the ranges as well: leaving a prior district's ranges in place
      // would let lookupZip6 compute a zip6 against the wrong district's rules.
      return { ...state, zipRanges: [], zipRangesStatus: "error" };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useAddressState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const district = state.district;

  // Load roads and zip ranges when the selected district changes. SET_DISTRICT
  // has already moved both statuses to "loading"; the settlement actions carry
  // zip3 so the reducer can reject any that arrive for a district the user has
  // left, and the local `cancelled` flag skips dispatching for a superseded
  // effect in the common case.
  useEffect(() => {
    if (!district) return;

    let cancelled = false;
    const zip3 = district.zip3;

    void loadRoads(zip3)
      .then((roads) => {
        if (!cancelled) dispatch({ type: "SET_ROADS", zip3, payload: roads });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "SET_ROADS_ERROR", zip3 });
      });

    void loadZipRanges(zip3)
      .then((ranges) => {
        if (!cancelled)
          dispatch({ type: "SET_ZIP_RANGES", zip3, payload: ranges });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "SET_ZIP_RANGES_ERROR", zip3 });
      });

    return () => {
      cancelled = true;
    };
  }, [district]);

  // Computed: English address
  const englishAddress = useMemo(() => {
    if (!state.city || !state.district || !state.road) return "";
    return formatEnglishAddress(
      state.city,
      state.district,
      state.road,
      state.detail,
    );
  }, [state.city, state.district, state.road, state.detail]);

  // Computed: zip3
  const zip3 = state.district?.zip3 ?? null;

  // Computed: zip6
  const zip6 = useMemo(() => {
    if (!state.road || state.zipRanges.length === 0) return null;
    const { number: num, sub } = parseNumber(state.detail.number);
    if (num <= 0) return null;
    return lookupZip6(
      state.zipRanges,
      state.road.name,
      parseInt(state.detail.lane, 10) || 0,
      parseInt(state.detail.alley, 10) || 0,
      num,
      sub,
      parseInt(state.detail.floor, 10) || 0,
    );
  }, [state.road, state.zipRanges, state.detail]);

  const setCity = (city: City | null) => {
    dispatch({ type: "SET_CITY", payload: city });
  };
  const setDistrict = (district: District | null) => {
    dispatch({ type: "SET_DISTRICT", payload: district });
  };
  const setRoad = (road: Road | null) => {
    dispatch({ type: "SET_ROAD", payload: road });
  };
  const setDetail = (field: keyof AddressDetail, value: string) => {
    dispatch({ type: "SET_DETAIL", field, value });
  };
  const reset = () => {
    dispatch({ type: "RESET" });
  };

  return {
    state,
    setCity,
    setDistrict,
    setRoad,
    setDetail,
    reset,
    englishAddress,
    zip3,
    zip6,
  };
}
