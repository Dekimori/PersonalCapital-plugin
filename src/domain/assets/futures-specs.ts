// ───────────────────────────────────────────────────────────────────
// FUTURES CONTRACT SPECS — multiplier lookup + MOEX ISS auto-fetch
// ───────────────────────────────────────────────────────────────────
// Bundled table: pysystemtrade (MIT) + manual curation. ~50 entries, <4 KB.
// MOEX: live fetch from ISS (STEPPRICE / MINSTEP = multiplier).
// Last reviewed: 2026-06-01. Update yearly or when contracts change.

import { requestUrl } from "obsidian";

interface FuturesSpec {
  multiplier: number;
  currency: string;
  description: string;
}

// Common global futures by ROOT symbol (without expiry code).
// Key = uppercase root, e.g. "ES" for ESM6, "NQ" for NQZ5.
const GLOBAL_SPECS: Record<string, FuturesSpec> = {
  // ── US Equity Indices ──────────────────────────────────────────
  ES: { multiplier: 50, currency: "USD", description: "E-mini S&P 500" },
  MES: { multiplier: 5, currency: "USD", description: "Micro E-mini S&P 500" },
  NQ: { multiplier: 20, currency: "USD", description: "E-mini NASDAQ 100" },
  MNQ: { multiplier: 2, currency: "USD", description: "Micro E-mini NASDAQ" },
  YM: { multiplier: 5, currency: "USD", description: "E-mini Dow Jones" },
  MYM: { multiplier: 0.5, currency: "USD", description: "Micro E-mini Dow" },
  RTY: { multiplier: 50, currency: "USD", description: "E-mini Russell 2000" },
  M2K: { multiplier: 5, currency: "USD", description: "Micro E-mini Russell" },
  SP: { multiplier: 250, currency: "USD", description: "S&P 500 full-size" },

  // ── European Indices ───────────────────────────────────────────
  FDAX: { multiplier: 25, currency: "EUR", description: "DAX full-size" },
  FDXM: { multiplier: 5, currency: "EUR", description: "Mini-DAX" },
  FDXS: { multiplier: 1, currency: "EUR", description: "Micro-DAX" },
  FESX: { multiplier: 10, currency: "EUR", description: "EURO STOXX 50" },
  FSXE: { multiplier: 1, currency: "EUR", description: "Micro EURO STOXX 50" },
  FCE: { multiplier: 10, currency: "EUR", description: "CAC 40" },
  FTSE: { multiplier: 10, currency: "GBP", description: "FTSE 100" },
  FSMI: { multiplier: 10, currency: "CHF", description: "SMI" },
  FMIB: { multiplier: 5, currency: "EUR", description: "FTSE MIB" },

  // ── Asian Indices ──────────────────────────────────────────────
  NK: { multiplier: 1000, currency: "JPY", description: "Nikkei 225 (OSE)" },
  NKD: { multiplier: 5, currency: "USD", description: "Nikkei 225 (CME USD)" },
  HSI: { multiplier: 50, currency: "HKD", description: "Hang Seng" },
  MHI: { multiplier: 10, currency: "HKD", description: "Mini Hang Seng" },
  SFC: { multiplier: 200, currency: "AUD", description: "ASX SPI 200" },
  TWN: { multiplier: 40, currency: "USD", description: "FTSE Taiwan" },
  SGP: { multiplier: 10, currency: "SGD", description: "SGX Straits Times" },

  // ── Commodities: Energy ────────────────────────────────────────
  CL: { multiplier: 1000, currency: "USD", description: "WTI Crude Oil" },
  MCL: { multiplier: 100, currency: "USD", description: "Micro WTI Crude" },
  QM: { multiplier: 500, currency: "USD", description: "E-mini Crude" },
  BZ: { multiplier: 1000, currency: "USD", description: "Brent Crude (CME)" },
  NG: { multiplier: 10000, currency: "USD", description: "Natural Gas" },
  QG: { multiplier: 2500, currency: "USD", description: "E-mini Natural Gas" },
  RB: { multiplier: 42000, currency: "USD", description: "RBOB Gasoline" },
  HO: { multiplier: 42000, currency: "USD", description: "Heating Oil" },

  // ── Commodities: Metals ────────────────────────────────────────
  GC: { multiplier: 100, currency: "USD", description: "Gold" },
  MGC: { multiplier: 10, currency: "USD", description: "Micro Gold" },
  SI: { multiplier: 5000, currency: "USD", description: "Silver" },
  SIL: { multiplier: 1000, currency: "USD", description: "Micro Silver" },
  HG: { multiplier: 25000, currency: "USD", description: "Copper" },
  MHG: { multiplier: 2500, currency: "USD", description: "Micro Copper" },
  PL: { multiplier: 50, currency: "USD", description: "Platinum" },
  PA: { multiplier: 100, currency: "USD", description: "Palladium" },

  // ── Commodities: Grains ────────────────────────────────────────
  ZC: { multiplier: 50, currency: "USD", description: "Corn" },
  ZW: { multiplier: 50, currency: "USD", description: "Wheat" },
  ZS: { multiplier: 50, currency: "USD", description: "Soybeans" },
  ZM: { multiplier: 100, currency: "USD", description: "Soybean Meal" },
  ZL: { multiplier: 600, currency: "USD", description: "Soybean Oil" },
  XC: { multiplier: 10, currency: "USD", description: "Mini Corn" },
  XW: { multiplier: 10, currency: "USD", description: "Mini Wheat" },

  // ── Commodities: Softs ─────────────────────────────────────────
  KC: { multiplier: 375, currency: "USD", description: "Coffee" },
  SB: { multiplier: 1120, currency: "USD", description: "Sugar #11" },
  CC: { multiplier: 10, currency: "USD", description: "Cocoa" },
  CT: { multiplier: 500, currency: "USD", description: "Cotton" },
  OJ: { multiplier: 150, currency: "USD", description: "Orange Juice" },

  // ── FX (CME) ───────────────────────────────────────────────────
  EC: { multiplier: 125000, currency: "USD", description: "EUR/USD" },
  M6E: { multiplier: 12500, currency: "USD", description: "Micro EUR/USD" },
  BP: { multiplier: 62500, currency: "USD", description: "GBP/USD" },
  M6B: { multiplier: 6250, currency: "USD", description: "Micro GBP/USD" },
  JY: { multiplier: 12500000, currency: "USD", description: "JPY/USD" },
  M6J: { multiplier: 1250000, currency: "USD", description: "Micro JPY/USD" },
  AD: { multiplier: 100000, currency: "USD", description: "AUD/USD" },
  M6A: { multiplier: 10000, currency: "USD", description: "Micro AUD/USD" },
  CD: { multiplier: 100000, currency: "USD", description: "CAD/USD" },
  SF: { multiplier: 125000, currency: "USD", description: "CHF/USD" },
  DX: { multiplier: 1000, currency: "USD", description: "US Dollar Index" },

  // ── Bonds ──────────────────────────────────────────────────────
  ZN: { multiplier: 1000, currency: "USD", description: "10-Year T-Note" },
  ZF: { multiplier: 1000, currency: "USD", description: "5-Year T-Note" },
  ZT: { multiplier: 2000, currency: "USD", description: "2-Year T-Note" },
  ZB: { multiplier: 1000, currency: "USD", description: "30-Year T-Bond" },
  UB: { multiplier: 1000, currency: "USD", description: "Ultra T-Bond" },
  FGBL: { multiplier: 1000, currency: "EUR", description: "Euro-Bund" },
  FGBM: { multiplier: 1000, currency: "EUR", description: "Euro-Bobl" },
  FGBS: { multiplier: 1000, currency: "EUR", description: "Euro-Schatz" },

  // ── Volatility ─────────────────────────────────────────────────
  VX: { multiplier: 1000, currency: "USD", description: "VIX" },

  // ── Crypto (CME) ───────────────────────────────────────────────
  BTC: { multiplier: 5, currency: "USD", description: "Bitcoin (CME)" },
  MBT: { multiplier: 0.1, currency: "USD", description: "Micro Bitcoin" },
  ETH: { multiplier: 50, currency: "USD", description: "Ether (CME)" },
  MET: { multiplier: 0.1, currency: "USD", description: "Micro Ether" },

  // ── Livestock ──────────────────────────────────────────────────
  LE: { multiplier: 400, currency: "USD", description: "Live Cattle" },
  GF: { multiplier: 500, currency: "USD", description: "Feeder Cattle" },
  HE: { multiplier: 400, currency: "USD", description: "Lean Hogs" },
};

/**
 * Strip expiry code from a futures ticker to get the root symbol.
 * Expiry = month letter [FGHJKMNQUVXZ] + year digit(s), e.g. "M6", "Z25".
 * "ESM6" → "ES", "NQZ25" → "NQ", "FDAXH7" → "FDAX", "SFM6" → "SF".
 */
export function extractFuturesRoot(ticker: string): string {
  const t = ticker.trim();
  // Try 1-digit year first: ...M6, ...Z5
  const m1 = t.match(/^(.+?)[FGHJKMNQUVXZ]\d$/i);
  if (m1) return m1[1].toUpperCase();
  // 2-digit year: ...M26, ...Z25
  const m2 = t.match(/^(.+?)[FGHJKMNQUVXZ]\d{2}$/i);
  if (m2) return m2[1].toUpperCase();
  return t.toUpperCase();
}

/**
 * Look up multiplier from the bundled global table.
 * Returns null if the root isn't in the table.
 */
export function lookupGlobalSpec(ticker: string): FuturesSpec | null {
  const root = extractFuturesRoot(ticker);
  return GLOBAL_SPECS[root] ?? null;
}

/**
 * Fetch multiplier from MOEX ISS for a specific FORTS contract.
 * Returns STEPPRICE / MINSTEP (= ₽ per point), or null on failure.
 */
export async function fetchMoexSpec(ticker: string): Promise<FuturesSpec | null> {
  const url =
    `https://iss.moex.com/iss/engines/futures/markets/forts/securities/${encodeURIComponent(ticker)}.json` +
    `?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME,STEPPRICE,MINSTEP`;
  try {
    const resp = await requestUrl({ url, method: "GET" });
    const rows = resp.json?.securities?.data;
    if (!rows || rows.length === 0) return null;
    const [secid, shortname, stepprice, minstep] = rows[0];
    if (!stepprice || !minstep || minstep <= 0) return null;
    const multiplier = stepprice / minstep;
    if (!Number.isFinite(multiplier) || multiplier <= 0) return null;
    return {
      multiplier: parseFloat(multiplier.toFixed(6)),
      currency: "RUB",
      description: String(shortname || secid || ticker),
    };
  } catch {
    return null;
  }
}

/**
 * Resolve multiplier for a futures ticker: MOEX first (when currency hints
 * RUB), then global table. Skips MOEX for non-RUB currencies to avoid
 * false matches (e.g. CME Silver "SI" vs MOEX "Si" USD/RUB future).
 */
export async function resolveSpec(
  ticker: string,
  currency?: string
): Promise<FuturesSpec | null> {
  if (!ticker || !ticker.trim()) return null;
  const cur = (currency || "").toUpperCase();
  // Skip MOEX when currency clearly isn't RUB — prevents collisions like
  // SI (CME Silver) vs Si (MOEX USD/RUB), and avoids a wasted network call.
  if (!cur || cur === "RUB") {
    const moex = await fetchMoexSpec(ticker.trim());
    if (moex) return moex;
  }
  // Fall back to bundled global table
  return lookupGlobalSpec(ticker);
}
