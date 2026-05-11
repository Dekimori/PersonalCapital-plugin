// ───────────────────────────────────────────────────────────────────
// ASSET FLOWS  (for current month)
// ───────────────────────────────────────────────────────────────────

import type { App } from "obsidian";
import { MONTH_KEYS } from "../../core/constants";
import { toNum, getCurrentMonthIdx, getCurrentYear } from "../../core/utils";
import { readAllLedger } from "../ledger/io";
import { readAccounts } from "../accounts/io";
import { resolveFxRate } from "./fx";
import type { Account, LedgerEntry, PluginSettings } from "../../core/types";

export interface LogEvent {
  date: string;
  op: string;
  qty: number;
  val: number;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface AssetFlow {
  name: string;
  type: string;
  currency: string;
  fx: number;
  fxMissing: boolean;
  currentQty: number;
  currentPrice: number | null;
  currentValue: number;
  currentValueRub: number;
  plAmount: number;
  plPct: number;
  passiveIncomeTot: number;
  initialDate: string | null;
  lastUpdated: string | null;
  basket: string | null;
  priceHistory: PricePoint[];
  logEvents: LogEvent[];
}

export interface AssetFlowsResult {
  passiveIncome: number;
  saves: number;
  assets: AssetFlow[];
  savesByMonthKey: Record<string, number>;
  accounts: Account[];
  allLedger: LedgerEntry[];
}

export async function buildAssetFlowsAsync(
  app: App,
  settings: PluginSettings
): Promise<AssetFlowsResult> {
  const folder = settings.assetsFolder.toLowerCase().replace(/\/$/, "");
  const files = app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.toLowerCase().startsWith(folder + "/"));
  const curMonth = getCurrentMonthIdx() + 1;
  const curYear = getCurrentYear();

  const allLedger = await readAllLedger(app, settings);
  const accounts = await readAccounts(app, settings);

  let passiveIncome = 0;
  let saves = 0;
  const assets: AssetFlow[] = [];
  const savesByMonthKey: Record<string, number> = {};

  for (const file of files) {
    const raw = await app.vault.read(file);
    const fmEnd = raw.indexOf("---", 3);
    const body = fmEnd !== -1 ? raw.slice(fmEnd + 3) : raw;
    const cache = app.metadataCache.getFileCache(file);
    const fm = (cache?.frontmatter ?? {}) as Record<string, unknown>;
    const assetName = file.basename;
    const assetId = fm.id ? String(fm.id) : null;
    const currency = String(fm.currency || "RUB").toUpperCase();
    const fxRaw = resolveFxRate(currency, settings);
    const fx = fxRaw ?? 0;
    const fxMissing = fxRaw == null;
    const type = String(fm.type || "shares").toLowerCase();

    const assetEntries = allLedger.filter((e) => {
      if (assetId && e.asset_id) return e.asset_id === assetId;
      return e.asset === assetName;
    });
    const sorted = [...assetEntries].sort((a, b) => (a.d || "").localeCompare(b.d || ""));

    let currentQty = 0,
      totalInvested = 0,
      passiveIncomeTot = 0;
    let initialDate: string | null = null,
      lastUpdated: string | null = null;
    const logEvents: LogEvent[] = [];

    for (const e of sorted) {
      if (!initialDate || e.d < initialDate) initialDate = e.d;
      if (!lastUpdated || e.d > lastUpdated) lastUpdated = e.d;
      if (e.type === "buy") {
        const qtyNum = toNum(e.qty);
        const priceNum = toNum(e.price || toNum(e.amt) / (qtyNum || 1));
        currentQty += qtyNum;
        totalInvested += qtyNum * priceNum;
        logEvents.push({ date: e.d, op: "buy", qty: qtyNum, val: priceNum });
      } else if (e.type === "sell") {
        const costPerShare = currentQty > 0 ? totalInvested / currentQty : 0;
        const soldQty = toNum(e.qty);
        currentQty -= soldQty;
        totalInvested -= soldQty * costPerShare;
        if (currentQty < 0) currentQty = 0;
        if (totalInvested < 0) totalInvested = 0;
        logEvents.push({
          date: e.d,
          op: "sell",
          qty: soldQty,
          val: toNum(e.price || toNum(e.amt) / soldQty),
        });
      } else if (e.type === "dividend") {
        passiveIncomeTot += toNum(e.amt);
        logEvents.push({ date: e.d, op: "div", qty: 0, val: toNum(e.amt) });
      } else if (e.type === "adjust") {
        totalInvested += toNum(e.amt);
        logEvents.push({ date: e.d, op: "adjust", qty: 0, val: toNum(e.amt) });
      } else if (e.type === "close") {
        logEvents.push({ date: e.d, op: "close", qty: currentQty, val: toNum(e.amt) });
        currentQty = 0;
        totalInvested = 0;
      }
    }

    const monthPrefix = `${curYear}-${String(curMonth).padStart(2, "0")}`;
    for (const e of assetEntries) {
      if (!e.d || !e.d.startsWith(monthPrefix)) continue;
      if (e.type === "dividend") passiveIncome += toNum(e.amt) * fx;
      if (e.type === "buy") saves += toNum(e.amt) * fx;
    }
    if (!fm.dividend_account) {
      for (const line of body.split("\n")) {
        const parts = line
          .trim()
          .split("|")
          .map((p: string) => p.trim());
        if (parts.length < 4 || !parts[0].startsWith(monthPrefix)) continue;
        if (parts[1].toLowerCase() === "div") {
          passiveIncome += toNum(parts[3]) * fx;
        }
      }
    }

    for (const e of assetEntries) {
      if (!e.d || !e.d.startsWith(String(curYear))) continue;
      if (e.type === "buy") {
        const mk = MONTH_KEYS[parseInt(e.d.slice(5, 7)) - 1];
        savesByMonthKey[mk] = (savesByMonthKey[mk] ?? 0) + toNum(e.amt) * fx;
      }
    }

    const priceHistory: PricePoint[] = [];
    for (const line of body.split("\n")) {
      const parts = line.trim().includes("|")
        ? line
            .trim()
            .split("|")
            .map((p: string) => p.trim())
        : line.trim().split(/\s+/);
      if (parts.length < 4) continue;
      const d = new Date(parts[0]);
      if (Number.isNaN(d.getTime())) continue;
      const op = parts[1].toLowerCase();
      const val = toNum(parts[3]);
      if ((op === "buy" || op === "reinvest" || op === "price") && val > 0) {
        priceHistory.push({ date: parts[0], price: val });
      }
    }
    priceHistory.sort((a, b) => a.date.localeCompare(b.date));
    logEvents.sort((a, b) => a.date.localeCompare(b.date));

    const currentPrice = (fm.current_price as number | null | undefined) ?? null;
    const accruedRubPerBond = type === "bond" ? toNum(fm.accrued_interest) : 0;
    const accruedNativeTotal =
      accruedRubPerBond > 0 && !fxMissing && fx > 0 && currentQty > 0
        ? parseFloat(((accruedRubPerBond / fx) * currentQty).toFixed(2))
        : 0;
    const cleanValue = currentPrice != null ? currentPrice * currentQty : totalInvested;
    const currentValue = parseFloat((cleanValue + accruedNativeTotal).toFixed(2));
    const plAmount = currentValue - totalInvested;
    const plPct = totalInvested > 0 ? (plAmount / totalInvested) * 100 : 0;

    assets.push({
      name: assetName,
      type,
      currency,
      fx,
      fxMissing,
      currentQty: parseFloat(currentQty.toFixed(6)),
      currentPrice,
      currentValue: parseFloat(currentValue.toFixed(2)),
      currentValueRub: parseFloat(currentValue.toFixed(2)) * fx,
      plAmount: parseFloat(plAmount.toFixed(2)),
      plPct: parseFloat(plPct.toFixed(2)),
      passiveIncomeTot: parseFloat((toNum(fm.passive_income_total) || passiveIncomeTot).toFixed(2)),
      initialDate: initialDate ?? (fm.initial_date as string | undefined) ?? null,
      lastUpdated: lastUpdated ?? (fm.last_updated as string | undefined) ?? null,
      basket: (fm.basket as string | null | undefined) ?? null,
      priceHistory,
      logEvents,
    });
  }

  return { passiveIncome, saves, assets, savesByMonthKey, accounts, allLedger };
}
