// ───────────────────────────────────────────────────────────────────
// BASKET CLASSIFICATION
// ───────────────────────────────────────────────────────────────────

import { fmt } from "../../core/utils";
import { getLiquidTotal } from "../accounts/balance";
import type { Account, LedgerEntry, PluginSettings } from "../../core/types";

export type BasketKey = "core" | "flash" | "reserve";

export interface BasketMeta {
  label: string;
  color: string;
  icon: string;
}

export const BASKET_META: Record<BasketKey, BasketMeta> = {
  core: { label: "Core", color: "#6366f1", icon: "🏛" },
  flash: { label: "Flash", color: "#f59e0b", icon: "⚡" },
  reserve: { label: "Reserve", color: "#34d399", icon: "🛡" },
};

interface BasketAsset {
  name?: string;
  ticker?: string;
  basket?: BasketKey;
  assetType?: string;
  type?: string;
  currentValueRub: number;
  currentValue: number;
  plAmount: number;
  passiveIncomeTot: number;
  initialDate?: string;
}

export interface BasketData {
  value: number;
  assets: BasketAsset[];
  target: number;
  pct?: number;
}

export interface BasketsResult {
  baskets: Record<BasketKey, BasketData>;
  total: number;
}

export interface BasketAlert {
  type: string;
  icon: string;
  asset?: string;
  text: string;
}

export function classifyAssetBasket(asset: BasketAsset): BasketKey | null {
  if (asset.basket) return asset.basket;
  const t = (asset.assetType || asset.type || "shares").toLowerCase();

  if (t === "bond" || t === "deposit") return "core";
  if (t === "etf" || t === "fund" || t === "index") return "core";

  const name = (asset.name || "").toUpperCase();
  const ticker = (asset.ticker || asset.name || "").toUpperCase();
  if (name.endsWith("@") || ticker.endsWith("@")) return "core";
  if (/\bETF\b|\bINDEX\b|\bФОНД\b|\bИНДЕКС\b/i.test(name)) return "core";
  if (/^RU\d{3}[A-Z]\d/.test(ticker)) return "core";

  if (t === "material") return null;
  if (t === "crypto") return "flash";

  return "flash";
}

export function buildBasketData(
  assets: BasketAsset[],
  settings: PluginSettings,
  accounts?: Account[] | null,
  allLedger?: LedgerEntry[] | null
): BasketsResult {
  const baskets: Record<BasketKey, BasketData> = {
    core: { value: 0, assets: [], target: settings.targetCore || 0 },
    flash: { value: 0, assets: [], target: settings.targetFlash || 0 },
    reserve: { value: 0, assets: [], target: settings.targetReserve || 0 },
  };
  for (const a of assets) {
    const bk = classifyAssetBasket(a);
    if (bk && baskets[bk]) {
      baskets[bk].value += a.currentValueRub;
      baskets[bk].assets.push(a);
    }
  }
  const liq = getLiquidTotal(settings, accounts, allLedger);
  if (liq > 0) baskets.reserve.value += liq;
  const total = baskets.core.value + baskets.flash.value + baskets.reserve.value;
  for (const bk of Object.values(baskets)) bk.pct = total > 0 ? (bk.value / total) * 100 : 0;
  return { baskets, total };
}

export function checkBasketTriggers(
  baskets: Record<BasketKey, BasketData>,
  settings: PluginSettings
): string[] {
  const alerts: string[] = [];
  const hasTargets =
    (settings.targetCore || 0) + (settings.targetFlash || 0) + (settings.targetReserve || 0) > 0;
  if (!hasTargets) return alerts;

  const THRESHOLD = 5;
  for (const [key, meta] of Object.entries(BASKET_META)) {
    const bk = baskets[key as BasketKey];
    if (!bk.target || bk.target <= 0) continue;
    const diff = (bk.pct ?? 0) - bk.target;
    if (Math.abs(diff) >= THRESHOLD) {
      const dir = diff > 0 ? "overweight" : "underweight";
      alerts.push(
        `${meta.icon} ${meta.label}: ${dir} by ${fmt(Math.abs(diff), 1)}% (${fmt(bk.pct ?? 0, 1)}% vs ${bk.target}% target)`
      );
    }
  }
  return alerts;
}

export function checkInstrumentTriggers(assets: BasketAsset[]): BasketAlert[] {
  const alerts: BasketAlert[] = [];
  const now = new Date();

  for (const a of assets) {
    const invested = a.currentValue - a.plAmount;
    const totalRetPct = invested > 0 ? ((a.plAmount + a.passiveIncomeTot) / invested) * 100 : 0;
    const holdMonths = a.initialDate
      ? (now.getTime() - new Date(a.initialDate).getTime()) / (30.44 * 24 * 3600 * 1000)
      : 0;

    const t = (a.assetType || a.type || "").toLowerCase();

    if (holdMonths >= 12 && totalRetPct < 0) {
      alerts.push({
        type: "underperformer",
        icon: "📉",
        asset: a.name,
        text: `${a.name}: total return ${fmt(totalRetPct, 1)}% after ${Math.floor(holdMonths)} months`,
      });
    }

    if ((t === "bond" || t === "deposit") && holdMonths >= 6) {
      const yoc = invested > 0 ? (a.passiveIncomeTot / invested) * 100 : 0;
      if (yoc < 2) {
        alerts.push({
          type: "dividend_dry",
          icon: "💧",
          asset: a.name,
          text: `${a.name}: yield on cost only ${fmt(yoc, 1)}% — low for fixed income`,
        });
      }
    }

    if (totalRetPct > 50 && holdMonths >= 1) {
      const annualized = holdMonths > 0 ? (totalRetPct / holdMonths) * 12 : totalRetPct;
      if (annualized > 100) {
        alerts.push({
          type: "winner",
          icon: "🏆",
          asset: a.name,
          text: `${a.name}: up ${fmt(totalRetPct, 1)}% in ${Math.floor(holdMonths)} mo — rapid spike, consider locking profit`,
        });
      } else if (holdMonths < 3 && totalRetPct > 30) {
        alerts.push({
          type: "winner",
          icon: "🏆",
          asset: a.name,
          text: `${a.name}: up ${fmt(totalRetPct, 1)}% in ${Math.floor(holdMonths)} mo — short-term opportunity`,
        });
      }
    }
  }

  return alerts;
}
