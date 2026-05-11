// ───────────────────────────────────────────────────────────────────
// ASSET RECALC — recompute frontmatter from log lines
// ───────────────────────────────────────────────────────────────────

import type { App, TFile } from "obsidian";
import { parseAssetBody } from "./parser";
import { toNum } from "../../core/utils";
import { resolveFxRate } from "./fx";
import type { AssetStats, PluginSettings } from "../../core/types";

export async function recalcAsset(
  app: App,
  file: TFile,
  settings?: PluginSettings
): Promise<AssetStats | null> {
  const raw = await app.vault.read(file);
  const fmEnd = raw.indexOf("---", 3);
  if (fmEnd === -1) return null;

  const body = raw.slice(fmEnd + 3).replace(/^\n/, "");
  const stats = parseAssetBody(body);
  const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};

  // Bond НКД is added to currentValue below (after deposit block) using fx
  // conversion. See bond block comment for full rationale on approach.

  // Deposit accrual — simple interest, days/365. Overrides currentValue/P&L.
  // No compounding, no freq, no maturity. User records actual coupon payouts
  // via manual div op if the deposit pays monthly/quarterly to a card.
  // Rate source: top-level `interest_rate` (manual config) OR nested
  // `template.rate` (auto-log template). Either way it's annual %.
  const depositRate = toNum(fm.interest_rate) || toNum(fm.template?.rate);
  if (String(fm.type).toLowerCase() === "deposit" && depositRate > 0) {
    const principal = stats.totalInvested;
    const rate = depositRate / 100;
    // Start accrual clock from last div payout (bank paid interest to card),
    // else from initial_date. This way compounded deposits grow from day 0,
    // and simple-payout deposits show only "unpaid yet" interest.
    const startDate = stats.lastDivDate || stats.initialDate || fm.initial_date;
    if (startDate && principal > 0) {
      const days = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000));
      const accrued = principal * rate * (days / 365);
      stats.currentValue = parseFloat((principal + accrued).toFixed(2));
      stats.currentPrice =
        stats.currentQty > 0
          ? parseFloat((stats.currentValue / stats.currentQty).toFixed(4))
          : null;
      stats.plAmount = parseFloat(accrued.toFixed(2));
      stats.plPct = parseFloat(((accrued / principal) * 100).toFixed(2));
    }
  }

  // Bond НКД (accrued interest): fm.accrued_interest is per-bond НКД in RUB
  // (MOEX ACCRUEDINT always denominates in RUB, even for USD замещайки).
  // Convert to asset currency using fx: for RUB bonds fx=1 (no-op); for USD
  // bonds fx≈82 → НКД_USD = НКД_RUB / 82. Skip when fx unavailable (non-RUB
  // bond without configured fx rate) — under-report rather than corrupt.
  // NOTE: MOEX НКД may differ from broker (settlement T+1, face convention).
  if (
    String(fm.type).toLowerCase() === "bond" &&
    toNum(fm.accrued_interest) > 0 &&
    stats.currentQty > 0
  ) {
    const currency = String(fm.currency || "RUB").toUpperCase();
    let fx: number | null;
    if (settings) {
      const resolved = resolveFxRate(currency, settings);
      fx = resolved != null && resolved > 0 ? resolved : null;
    } else {
      // No settings: only safe for home-currency (RUB) bonds; skip non-RUB.
      fx = currency === "RUB" ? 1 : null;
    }
    if (fx != null) {
      const accruedRubPerBond = toNum(fm.accrued_interest);
      const accruedNativeTotal = parseFloat(
        ((accruedRubPerBond / fx) * stats.currentQty).toFixed(2)
      );
      stats.currentValue = parseFloat((stats.currentValue + accruedNativeTotal).toFixed(2));
      stats.plAmount = parseFloat((stats.currentValue - stats.totalInvested).toFixed(2));
      stats.plPct =
        stats.totalInvested > 0
          ? parseFloat(((stats.plAmount / stats.totalInvested) * 100).toFixed(2))
          : 0;
    }
  }

  await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
    fm.current_qty = stats.currentQty;
    fm.avg_cost = stats.avgCost;
    fm.total_invested = stats.totalInvested;
    // Parser is primary source for currentPrice (only `price` ops set it).
    // Fallback to existing fm.current_price preserves legacy frontmatter
    // for users upgrading from versions where the parser copied buy/reinvest
    // transaction prices here. Without the fallback, first recalc on a legacy
    // asset with no `price` op in body would zero out current_price and shrink
    // current_value mid-release. Next "Update prices" run writes a real market
    // `price` op which makes stats.currentPrice non-null and overrides.
    fm.current_price = stats.currentPrice ?? fm.current_price ?? null;
    fm.current_value = stats.currentValue;
    fm.pl_amount = stats.plAmount;
    fm.pl_pct = stats.plPct;
    fm.passive_income_total = stats.passiveIncomeTot;
    if (stats.initialPrice != null) fm.initial_price = stats.initialPrice;
    if (stats.initialDate) fm.initial_date = stats.initialDate;
    fm.last_updated = stats.lastUpdated ?? new Date().toISOString().slice(0, 10);
  });
  return stats;
}
