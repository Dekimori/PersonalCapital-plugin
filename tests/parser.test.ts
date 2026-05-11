import { describe, it, expect } from "vitest";
import { parseAssetBody } from "../src/domain/assets/parser.js";

describe("parseAssetBody", () => {
  it("parses a single buy line", () => {
    const body = "2024-01-15 | buy | 10 | 100";
    const result = parseAssetBody(body);

    expect(result.currentQty).toBe(10);
    expect(result.totalInvested).toBe(1000);
    expect(result.initialDate).toBe("2024-01-15");
    expect(result.lastUpdated).toBe("2024-01-15");
    expect(result.initialPrice).toBe(100);
  });

  it("aggregates multiple buys (qty * price)", () => {
    // File body lists newest-first; parser reverses internally to process chronologically.
    const body = ["2024-02-15 | buy | 5 | 200", "2024-01-15 | buy | 10 | 100"].join("\n");
    const result = parseAssetBody(body);

    expect(result.currentQty).toBe(15);
    expect(result.totalInvested).toBe(2000);
    expect(result.initialPrice).toBe(100);
  });

  it("handles sell using avg cost basis", () => {
    const body = ["2024-03-01 | sell | 4 | 150", "2024-01-15 | buy | 10 | 100"].join("\n");
    const result = parseAssetBody(body);

    expect(result.currentQty).toBe(6);
    expect(result.totalInvested).toBe(600);
  });

  it("ignores malformed lines", () => {
    const body = ["bad line", "2024-01-15 | buy | 10 | 100", "another bad"].join("\n");
    const result = parseAssetBody(body);

    expect(result.currentQty).toBe(10);
  });

  it("returns zeros for empty body", () => {
    const result = parseAssetBody("");

    expect(result.currentQty).toBe(0);
    expect(result.totalInvested).toBe(0);
    expect(result.initialDate).toBeNull();
  });

  it("sets currentPrice from explicit price op", () => {
    const body = ["2024-04-01 | price | 0 | 150", "2024-01-15 | buy | 10 | 100"].join("\n");
    const result = parseAssetBody(body);

    expect(result.currentPrice).toBe(150);
  });

  it("supports space-separated fields too", () => {
    const body = "2024-01-15 buy 10 100";
    const result = parseAssetBody(body);

    expect(result.currentQty).toBe(10);
    expect(result.totalInvested).toBe(1000);
  });
});
