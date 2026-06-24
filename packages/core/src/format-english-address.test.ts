import { describe, it, expect } from "vitest";
import { parseNumber, formatEnglishAddress } from "./format-english-address";
import type { City, District, Road, AddressDetail } from "./types";

describe("parseNumber", () => {
  it("parses a plain number", () => {
    expect(parseNumber("33")).toEqual({ number: 33, sub: 0 });
  });

  it("parses the 之 (sub-number) notation", () => {
    expect(parseNumber("5之1")).toEqual({ number: 5, sub: 1 });
    expect(parseNumber("12之34")).toEqual({ number: 12, sub: 34 });
  });

  it("trims surrounding whitespace", () => {
    expect(parseNumber("  7  ")).toEqual({ number: 7, sub: 0 });
  });

  it("returns zeros for non-numeric or malformed input", () => {
    expect(parseNumber("")).toEqual({ number: 0, sub: 0 });
    expect(parseNumber("abc")).toEqual({ number: 0, sub: 0 });
    expect(parseNumber("5之")).toEqual({ number: 0, sub: 0 }); // dangling 之
    expect(parseNumber("之5")).toEqual({ number: 0, sub: 0 }); // missing base
  });
});

describe("formatEnglishAddress", () => {
  const city: City = { name: "臺北市", en: "Taipei City", districts: [] };
  const district: District = {
    name: "大安區",
    en: "Da'an Dist.",
    zip3: "106",
  };
  const road: Road = { name: "仁愛路四段", en: "Sec. 4, Ren'ai Rd." };

  /** Build an AddressDetail with empty defaults. */
  function detail(overrides: Partial<AddressDetail> = {}): AddressDetail {
    return {
      lane: "",
      alley: "",
      number: "",
      floor: "",
      room: "",
      ...overrides,
    };
  }

  it("formats a full address in UPU order", () => {
    const result = formatEnglishAddress(
      city,
      district,
      road,
      detail({
        room: "5",
        floor: "4",
        number: "12之3",
        alley: "5",
        lane: "100",
      }),
    );
    expect(result).toBe(
      "Rm. 5, 4F., No. 12-3, Aly. 5, Ln. 100, Sec. 4, Ren'ai Rd., Da'an Dist., Taipei City 106, Taiwan (R.O.C.)",
    );
  });

  it("omits empty optional parts", () => {
    const result = formatEnglishAddress(
      city,
      district,
      road,
      detail({ number: "33" }),
    );
    expect(result).toBe(
      "No. 33, Sec. 4, Ren'ai Rd., Da'an Dist., Taipei City 106, Taiwan (R.O.C.)",
    );
  });

  it("renders road / district / city / country even with no detail", () => {
    const result = formatEnglishAddress(city, district, road, detail());
    expect(result).toBe(
      "Sec. 4, Ren'ai Rd., Da'an Dist., Taipei City 106, Taiwan (R.O.C.)",
    );
  });

  it("converts 之 in the number to a hyphen", () => {
    const result = formatEnglishAddress(
      city,
      district,
      road,
      detail({ number: "5之1" }),
    );
    expect(result).toContain("No. 5-1");
  });

  it("trims whitespace around detail fields", () => {
    const result = formatEnglishAddress(
      city,
      district,
      road,
      detail({ number: " 12 ", room: " A " }),
    );
    expect(result).toContain("Rm. A");
    expect(result).toContain("No. 12");
  });
});
