// ───────────────────────────────────────────────────────────────────
// FX RATES — CBR (RUB home) + Yahoo v8/chart (all others) + manual override
// ───────────────────────────────────────────────────────────────────
// Storage shape (on settings):
//   fxRatesManual:  { USD: 100 }           ← user overrides, always win
//   fxRatesAuto:    { USD: 92.15, EUR: … } ← fetched by updateFxRates()
//   fxRatesUpdated: "2026-04-18T10:00:00Z"
//   fxSourceLabel:  "CBR · 18.04.2026"
//
// All rates are stored as {CURRENCY: rateToHome}. home==="RUB" → RUB:1 etc.
// If homeCurrency changes, callers should trigger a fresh updateFxRates().

import { requestUrl } from "obsidian";
import type { FxRates, PluginSettings } from "../../core/types";

interface FetchResult {
  rates: FxRates;
  source: string;
  pubDate: string | null;
}

export interface UpdateResult {
  updated: boolean;
  source?: string;
  pubDate?: string | null;
  rates?: FxRates;
  reason?: string;
  error?: string;
}

export function resolveFxRate(currency: string, settings: PluginSettings): number | null {
  const c = String(currency || "").toUpperCase();
  const home = String(settings.homeCurrency || "RUB").toUpperCase();
  if (!c) return null;
  if (c === home) return 1;
  const manual = settings.fxRatesManual?.[c];
  if (manual != null && manual > 0) return manual;
  const auto = settings.fxRatesAuto?.[c];
  if (auto != null && auto > 0) return auto;
  return null;
}

// ── CBR ──────────────────────────────────────────────────────────────

export async function fetchCbrRates(): Promise<FetchResult> {
  const url = "https://www.cbr.ru/scripts/XML_daily.asp";
  const resp = await requestUrl({ url, method: "GET" });

  // CBR serves XML declared as windows-1251. Obsidian's requestUrl gives us
  // arrayBuffer and a (possibly mis-decoded) .text. Prefer arrayBuffer +
  // TextDecoder so Cyrillic <Name> doesn't mojibake. Numeric fields are
  // ASCII so they survive either path.
  let text: string;
  if (resp.arrayBuffer) {
    try {
      text = new TextDecoder("windows-1251").decode(resp.arrayBuffer);
    } catch {
      text = resp.text;
    }
  } else {
    text = resp.text;
  }

  const doc = new DOMParser().parseFromString(text, "text/xml");
  const rates: FxRates = { RUB: 1 };
  const valutes = doc.getElementsByTagName("Valute");
  for (let i = 0; i < valutes.length; i++) {
    const v = valutes[i];
    const code = v.getElementsByTagName("CharCode")[0]?.textContent?.trim();
    const vRate = v.getElementsByTagName("VunitRate")[0]?.textContent?.trim();
    if (!code || !vRate) continue;
    const num = parseFloat(vRate.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) continue;
    rates[code.toUpperCase()] = num;
  }
  const root = doc.getElementsByTagName("ValCurs")[0];
  const pubDate = root?.getAttribute("Date") || null;
  return { rates, source: "CBR", pubDate };
}

// ── Yahoo ────────────────────────────────────────────────────────────

async function fetchYahooRate(pairSymbol: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(pairSymbol)}`;
  const resp = await requestUrl({ url, method: "GET" });
  const price = resp.json?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!Number.isFinite(price) || price <= 0) return null;
  return price;
}

export async function fetchYahooRates(
  homeCurrency: string,
  wantedCurrencies: string[]
): Promise<FetchResult> {
  const home = homeCurrency.toUpperCase();
  const rates: FxRates = { [home]: 1 };
  const pairs = wantedCurrencies.map((c) => c.toUpperCase()).filter((c) => c && c !== home);

  await Promise.all(
    pairs.map(async (c) => {
      // Try BASE+HOME=X first (e.g. USDRUB=X → RUB per USD)
      try {
        const p = await fetchYahooRate(`${c}${home}=X`);
        if (p != null) {
          rates[c] = p;
          return;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[PC] Yahoo FX ${c}${home}=X failed:`, msg);
      }
      // Fallback: HOME+BASE=X reciprocal (e.g. RUBUSD=X → 1/result)
      try {
        const p = await fetchYahooRate(`${home}${c}=X`);
        if (p != null && p > 0) {
          rates[c] = 1 / p;
          return;
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[PC] Yahoo FX ${home}${c}=X failed:`, msg);
      }
    })
  );

  const today = new Date().toISOString().slice(0, 10);
  return { rates, source: "Yahoo", pubDate: today };
}

// ── Orchestrator ────────────────────────────────────────────────────

export async function updateFxRates(settings: PluginSettings): Promise<UpdateResult> {
  if (!settings.fxAutoFetch) {
    return { updated: false, reason: "auto-fetch disabled" };
  }
  const home = String(settings.homeCurrency || "RUB").toUpperCase();
  try {
    let result: FetchResult;
    if (home === "RUB") {
      result = await fetchCbrRates();
    } else {
      const currencies = Array.from(
        new Set([
          ...Object.keys(settings.fxRatesAuto || {}),
          ...Object.keys(settings.fxRatesManual || {}),
          "USD",
          "EUR",
          "RUB",
          "CNY",
          "GBP",
          "JPY",
        ])
      ).map((c) => c.toUpperCase());
      result = await fetchYahooRates(home, currencies);
    }
    if (!result.rates || Object.keys(result.rates).length === 0) {
      return { updated: false, error: "no rates returned" };
    }
    settings.fxRatesAuto = Object.assign({}, settings.fxRatesAuto, result.rates);
    settings.fxRatesUpdated = new Date().toISOString();
    settings.fxSourceLabel = `${result.source} · ${result.pubDate ?? "now"}`;
    return { updated: true, source: result.source, pubDate: result.pubDate, rates: result.rates };
  } catch (e) {
    console.warn("[PC] FX update failed:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return { updated: false, error: msg };
  }
}
