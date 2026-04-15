"use client";

import { useReducer, useEffect, useMemo } from "react";
import type {
  City,
  District,
  Road,
  AddressDetail,
  ZipRange,
} from "@/lib/types";
import { loadRoads, loadZipRanges } from "@/lib/data-loader";
import {
  formatEnglishAddress,
  parseNumber,
} from "@/lib/format-english-address";
import { lookupZip6 } from "@/lib/lookup-zipcode";

const EMPTY_DETAIL: AddressDetail = {
  lane: "",
  alley: "",
  number: "",
  floor: "",
  room: "",
};

interface State {
  city: City | null;
  district: District | null;
  road: Road | null;
  detail: AddressDetail;
  roads: Road[];
  roadsLoading: boolean;
  zipRanges: ZipRange[];
  zipRangesLoading: boolean;
}

type Action =
  | { type: "SET_CITY"; payload: City | null }
  | { type: "SET_DISTRICT"; payload: District | null }
  | { type: "SET_ROAD"; payload: Road | null }
  | { type: "SET_DETAIL"; field: keyof AddressDetail; value: string }
  | { type: "SET_ROADS"; payload: Road[] }
  | { type: "SET_ROADS_LOADING"; payload: boolean }
  | { type: "SET_ZIP_RANGES"; payload: ZipRange[] }
  | { type: "SET_ZIP_RANGES_LOADING"; payload: boolean }
  | { type: "RESET" };

const initialState: State = {
  city: null,
  district: null,
  road: null,
  detail: EMPTY_DETAIL,
  roads: [],
  roadsLoading: false,
  zipRanges: [],
  zipRangesLoading: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CITY":
      return {
        ...initialState,
        city: action.payload,
      };
    case "SET_DISTRICT":
      return {
        ...state,
        district: action.payload,
        road: null,
        detail: EMPTY_DETAIL,
        roads: [],
        roadsLoading: false,
        zipRanges: [],
      };
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
      return { ...state, roads: action.payload, roadsLoading: false };
    case "SET_ROADS_LOADING":
      return { ...state, roadsLoading: action.payload };
    case "SET_ZIP_RANGES":
      return { ...state, zipRanges: action.payload, zipRangesLoading: false };
    case "SET_ZIP_RANGES_LOADING":
      return { ...state, zipRangesLoading: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function useAddressState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load roads and zip ranges when district changes
  useEffect(() => {
    if (!state.district) return;

    let cancelled = false;
    const zip3 = state.district.zip3;

    dispatch({ type: "SET_ROADS_LOADING", payload: true });
    dispatch({ type: "SET_ZIP_RANGES_LOADING", payload: true });

    void loadRoads(zip3)
      .then((roads) => {
        if (!cancelled) dispatch({ type: "SET_ROADS", payload: roads });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "SET_ROADS_LOADING", payload: false });
      });

    void loadZipRanges(zip3)
      .then((ranges) => {
        if (!cancelled) dispatch({ type: "SET_ZIP_RANGES", payload: ranges });
      })
      .catch(() => {
        if (!cancelled)
          dispatch({ type: "SET_ZIP_RANGES_LOADING", payload: false });
      });

    return () => {
      cancelled = true;
    };
  }, [state.district]);

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
