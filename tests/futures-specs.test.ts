import { describe, it, expect } from "vitest";
import { extractFuturesRoot, lookupGlobalSpec } from "../src/domain/assets/futures-specs.js";

describe("extractFuturesRoot", () => {
  it("strips 1-digit year expiry", () => {
    expect(extractFuturesRoot("ESM6")).toBe("ES");
    expect(extractFuturesRoot("SFM6")).toBe("SF");
    expect(extractFuturesRoot("NQZ5")).toBe("NQ");
    expect(extractFuturesRoot("SiH7")).toBe("SI");
  });

  it("strips 2-digit year expiry", () => {
    expect(extractFuturesRoot("ESM26")).toBe("ES");
    expect(extractFuturesRoot("FDAXH25")).toBe("FDAX");
  });

  it("returns ticker as-is when no expiry pattern", () => {
    expect(extractFuturesRoot("ES")).toBe("ES");
    expect(extractFuturesRoot("GOLD")).toBe("GOLD");
  });
});

describe("lookupGlobalSpec", () => {
  it("finds E-mini S&P 500", () => {
    const spec = lookupGlobalSpec("ESM6");
    expect(spec).not.toBeNull();
    expect(spec!.multiplier).toBe(50);
    expect(spec!.currency).toBe("USD");
  });

  it("finds Gold", () => {
    const spec = lookupGlobalSpec("GCZ5");
    expect(spec).not.toBeNull();
    expect(spec!.multiplier).toBe(100);
  });

  it("returns null for unknown ticker", () => {
    expect(lookupGlobalSpec("ZZZZZ9")).toBeNull();
  });

  it("finds Micro E-mini NASDAQ", () => {
    const spec = lookupGlobalSpec("MNQM6");
    expect(spec).not.toBeNull();
    expect(spec!.multiplier).toBe(2);
  });
});
