// ───────────────────────────────────────────────────────────────────
// ASSET PARSER
// ───────────────────────────────────────────────────────────────────

import { toNum } from "../../core/utils";
import type { AssetStats } from "../../core/types";

export function parseAssetBody(bodyText: string): AssetStats {
  const lines = bodyText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let currentQty = 0;
  let totalInvested = 0;
  // currentPrice is set ONLY by explicit `price` ops (MOEX/Yahoo fetcher or
  // manual override). Buy/reinvest prices are transaction prices, NOT market
  // quotes — using them as "current price" yields misleading values when the
  // user has mixed-price entries (e.g. 67@1063 + 1@1407 → 68×1407). When no
  // `price` op exists, currentPrice stays null and currentValue falls back to
  // totalInvested (i.e. "what you paid"), which is neutral and non-misleading.
  let currentPrice: number | null = null;
  let passiveIncomeTot = 0;
  let initialDate: string | null = null;
  let lastUpdated: string | null = null;
  // Last div-op date — used by deposit accrual to start "unpaid interest"
  // clock from the most recent payout instead of initial_date. Without this,
  // simple-interest deposits whose bank pays monthly would double-count
  // (currentValue grows from day 0, but interest already moved to card).
  let lastDivDate: string | null = null;
  // First buy price — what the user originally paid per unit. Useful for
  // "bought at X, now Y" display in asset cards.
  let initialPrice: number | null = null;

  const chronoLines = [...lines].reverse();

  for (const line of chronoLines) {
    const parts = line.includes("|") ? line.split("|").map((p) => p.trim()) : line.split(/\s+/);

    if (parts.length < 4) continue;

    const dateStr = parts[0];
    const op = parts[1].toLowerCase();
    const qtyRaw = parts[2];
    const valRaw = parts[3];

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) continue;

    if (!initialDate || date < new Date(initialDate)) initialDate = dateStr;
    if (!lastUpdated || date > new Date(lastUpdated)) lastUpdated = dateStr;

    const qty = toNum(qtyRaw);
    const val = toNum(valRaw);

    if (op === "buy") {
      if (initialPrice === null) initialPrice = val;
      currentQty += qty;
      totalInvested += qty * val;
    } else if (op === "sell") {
      const costPerShare = currentQty > 0 ? totalInvested / currentQty : 0;
      currentQty -= qty;
      totalInvested -= qty * costPerShare;
      if (currentQty < 0) currentQty = 0;
      if (totalInvested < 0) totalInvested = 0;
    } else if (op === "div") {
      passiveIncomeTot += val;
      if (!lastDivDate || dateStr > lastDivDate) lastDivDate = dateStr;
    } else if (op === "capitalize") {
      // Deposit interest capitalized into principal — grows totalInvested
      // (so fallback currentValue rises) without touching qty. Counted as
      // passive income: it IS a payout, just reinvested automatically.
      // No cash flow → no ledger entry from the template engine.
      totalInvested += val;
      passiveIncomeTot += val;
      // Track last interest-event date so the recalc accrual block doesn't
      // double-count: principal has already absorbed this period's growth,
      // so daily accrual must restart from the capitalize date — not from
      // initial_date (which would re-add already-compounded interest).
      if (!lastDivDate || dateStr > lastDivDate) lastDivDate = dateStr;
    } else if (op === "reinvest") {
      currentQty += qty;
      totalInvested += qty * val;
    } else if (op === "adjust") {
      // Cost basis correction — adds to totalInvested without changing qty.
      // Use case: НКД at purchase, broker fees, rounding corrections.
      totalInvested += val;
    } else if (op === "price") {
      currentPrice = val;
    }
  }

  const avgCost = currentQty > 0 ? totalInvested / currentQty : 0;
  const currentValue = currentPrice != null ? currentPrice * currentQty : totalInvested;
  const plAmount = currentValue - totalInvested;
  const plPct = totalInvested > 0 ? (plAmount / totalInvested) * 100 : 0;

  return {
    currentQty: parseFloat(currentQty.toFixed(6)),
    avgCost: parseFloat(avgCost.toFixed(4)),
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    currentPrice: currentPrice != null ? parseFloat(currentPrice.toFixed(4)) : null,
    currentValue: parseFloat(currentValue.toFixed(2)),
    plAmount: parseFloat(plAmount.toFixed(2)),
    plPct: parseFloat(plPct.toFixed(2)),
    passiveIncomeTot: parseFloat(passiveIncomeTot.toFixed(2)),
    initialPrice: initialPrice != null ? parseFloat(initialPrice.toFixed(4)) : null,
    initialDate,
    lastUpdated,
    lastDivDate,
  };
}
