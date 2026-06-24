import { describe, it, expect } from "vitest";
import { lookupZip6 } from "./lookup-zipcode";
import type { ZipRange } from "./types";

/**
 * Build a ZipRange with every field defaulting to 0 (= "no constraint"),
 * overriding only the fields a test cares about.
 */
function range(overrides: Partial<ZipRange> = {}): ZipRange {
  return {
    road: "Test Rd.",
    zip6: "100000",
    even: 0,
    lane: 0,
    lane1: 0,
    alley: 0,
    alley1: 0,
    numStart: 0,
    numStart1: 0,
    numEnd: 0,
    numEnd1: 0,
    floorStart: 0,
    floorEnd: 0,
    ...overrides,
  };
}

/** Readable wrapper around lookupZip6's positional signature. */
function lookup(
  ranges: ZipRange[],
  road: string,
  opts: {
    lane?: number;
    alley?: number;
    number?: number;
    sub?: number;
    floor?: number;
  } = {},
): string | null {
  const { lane = 0, alley = 0, number = 0, sub = 0, floor = 0 } = opts;
  return lookupZip6(ranges, road, lane, alley, number, sub, floor);
}

describe("lookupZip6", () => {
  describe("road matching", () => {
    it("returns null for an empty range list", () => {
      expect(lookup([], "Test Rd.")).toBeNull();
    });

    it("returns null when no range matches the road name", () => {
      const ranges = [range({ road: "Other Rd.", zip6: "999999" })];
      expect(lookup(ranges, "Test Rd.")).toBeNull();
    });

    it("matches a catch-all range (all constraints 0) for any input", () => {
      const ranges = [range({ zip6: "111000" })];
      expect(lookup(ranges, "Test Rd.")).toBe("111000");
      expect(
        lookup(ranges, "Test Rd.", { lane: 9, alley: 9, number: 99, floor: 9 }),
      ).toBe("111000");
    });
  });

  describe("lane constraint", () => {
    it("matches only the exact lane when lane1 is unset", () => {
      const ranges = [range({ lane: 5, zip6: "L5" })];
      expect(lookup(ranges, "Test Rd.", { lane: 5 })).toBe("L5");
      expect(lookup(ranges, "Test Rd.", { lane: 4 })).toBeNull();
    });

    it("matches an inclusive lane range when lane1 is set", () => {
      const ranges = [range({ lane: 5, lane1: 10, zip6: "L5_10" })];
      expect(lookup(ranges, "Test Rd.", { lane: 5 })).toBe("L5_10"); // lower bound
      expect(lookup(ranges, "Test Rd.", { lane: 7 })).toBe("L5_10");
      expect(lookup(ranges, "Test Rd.", { lane: 10 })).toBe("L5_10"); // upper bound
      expect(lookup(ranges, "Test Rd.", { lane: 4 })).toBeNull();
      expect(lookup(ranges, "Test Rd.", { lane: 11 })).toBeNull();
    });
  });

  describe("alley constraint", () => {
    it("matches only the exact alley when alley1 is unset", () => {
      const ranges = [range({ alley: 3, zip6: "A3" })];
      expect(lookup(ranges, "Test Rd.", { alley: 3 })).toBe("A3");
      expect(lookup(ranges, "Test Rd.", { alley: 2 })).toBeNull();
    });

    it("matches an inclusive alley range when alley1 is set", () => {
      const ranges = [range({ alley: 2, alley1: 6, zip6: "A2_6" })];
      expect(lookup(ranges, "Test Rd.", { alley: 2 })).toBe("A2_6");
      expect(lookup(ranges, "Test Rd.", { alley: 6 })).toBe("A2_6");
      expect(lookup(ranges, "Test Rd.", { alley: 7 })).toBeNull();
    });
  });

  describe("even/odd parity", () => {
    it("even=1 matches odd numbers only", () => {
      const ranges = [range({ even: 1, zip6: "ODD" })];
      expect(lookup(ranges, "Test Rd.", { number: 3 })).toBe("ODD");
      expect(lookup(ranges, "Test Rd.", { number: 4 })).toBeNull();
    });

    it("even=2 matches even numbers only", () => {
      const ranges = [range({ even: 2, zip6: "EVEN" })];
      expect(lookup(ranges, "Test Rd.", { number: 4 })).toBe("EVEN");
      expect(lookup(ranges, "Test Rd.", { number: 3 })).toBeNull();
    });

    it("ignores the parity constraint when no number is given", () => {
      const ranges = [range({ even: 1, zip6: "ODD" })];
      expect(lookup(ranges, "Test Rd.", { number: 0 })).toBe("ODD");
    });
  });

  describe("number range", () => {
    it("matches inside an inclusive [start, end] range", () => {
      const ranges = [range({ numStart: 1, numEnd: 99, zip6: "N1_99" })];
      expect(lookup(ranges, "Test Rd.", { number: 1 })).toBe("N1_99"); // lower bound
      expect(lookup(ranges, "Test Rd.", { number: 50 })).toBe("N1_99");
      expect(lookup(ranges, "Test Rd.", { number: 99 })).toBe("N1_99"); // upper bound
      expect(lookup(ranges, "Test Rd.", { number: 100 })).toBeNull();
    });

    it("rejects a number-constrained range when no number is given", () => {
      const ranges = [range({ numStart: 1, numEnd: 99, zip6: "N1_99" })];
      expect(lookup(ranges, "Test Rd.", { number: 0 })).toBeNull();
    });

    it("treats numEnd=9999 as an open upper bound", () => {
      const ranges = [range({ numStart: 100, numEnd: 9999, zip6: "N100_UP" })];
      expect(lookup(ranges, "Test Rd.", { number: 5000 })).toBe("N100_UP");
      expect(lookup(ranges, "Test Rd.", { number: 50 })).toBeNull(); // below start
    });

    it("excludes a sub-number (之) that exceeds an exact number range", () => {
      // Range covers exactly No. 5 (numStart=numEnd=5, no sub span).
      const ranges = [range({ numStart: 5, numEnd: 5, zip6: "N5" })];
      expect(lookup(ranges, "Test Rd.", { number: 5, sub: 0 })).toBe("N5");
      expect(lookup(ranges, "Test Rd.", { number: 5, sub: 1 })).toBeNull();
    });

    it("includes a sub-number (之) that falls within the range's sub span", () => {
      // Range covers No. 5 through No. 5之5 (numEnd1=5).
      const ranges = [
        range({ numStart: 5, numEnd: 5, numEnd1: 5, zip6: "N5_sub5" }),
      ];
      expect(lookup(ranges, "Test Rd.", { number: 5, sub: 1 })).toBe("N5_sub5");
      expect(lookup(ranges, "Test Rd.", { number: 5, sub: 6 })).toBeNull();
    });
  });

  describe("floor constraint", () => {
    it("matches inside an inclusive floor range", () => {
      const ranges = [range({ floorStart: 2, floorEnd: 5, zip6: "F2_5" })];
      expect(lookup(ranges, "Test Rd.", { floor: 2 })).toBe("F2_5"); // lower bound
      expect(lookup(ranges, "Test Rd.", { floor: 3 })).toBe("F2_5");
      expect(lookup(ranges, "Test Rd.", { floor: 5 })).toBe("F2_5"); // upper bound
      expect(lookup(ranges, "Test Rd.", { floor: 1 })).toBeNull();
      expect(lookup(ranges, "Test Rd.", { floor: 6 })).toBeNull();
    });

    it("ignores the floor constraint when no floor is given", () => {
      const ranges = [range({ floorStart: 2, floorEnd: 5, zip6: "F2_5" })];
      expect(lookup(ranges, "Test Rd.", { floor: 0 })).toBe("F2_5");
    });
  });

  describe("specificity ordering", () => {
    it("prefers the more specific range when several match", () => {
      const ranges = [
        range({ zip6: "GENERAL" }), // score 0
        range({ lane: 5, zip6: "LANE5" }), // score 100
      ];
      // Both match lane 5 -> the lane-specific range wins.
      expect(lookup(ranges, "Test Rd.", { lane: 5 })).toBe("LANE5");
    });

    it("falls back to the general range when the specific one misses", () => {
      const ranges = [
        range({ zip6: "GENERAL" }),
        range({ lane: 5, zip6: "LANE5" }),
      ];
      // Lane 7 only satisfies the catch-all range.
      expect(lookup(ranges, "Test Rd.", { lane: 7 })).toBe("GENERAL");
    });

    it("resolves a layered general / range / parity stack by score", () => {
      const ranges = [
        range({ zip6: "GENERAL" }), // score 0
        range({ numStart: 1, numEnd: 50, zip6: "LOW" }), // score 20
        range({ numStart: 1, numEnd: 50, even: 1, zip6: "LOW_ODD" }), // score 30
      ];
      // 11 is odd and in [1,50] -> highest-scoring odd range wins.
      expect(lookup(ranges, "Test Rd.", { number: 11 })).toBe("LOW_ODD");
      // 12 is even -> the odd range is rejected, the plain range wins.
      expect(lookup(ranges, "Test Rd.", { number: 12 })).toBe("LOW");
      // 80 is outside [1,50] -> only the catch-all remains.
      expect(lookup(ranges, "Test Rd.", { number: 80 })).toBe("GENERAL");
    });
  });
});
