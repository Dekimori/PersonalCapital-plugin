// ───────────────────────────────────────────────────────────────────
// BUDGET SUMMARY
// ───────────────────────────────────────────────────────────────────

import { MONTH_KEYS } from "../../core/constants";
import { getCurrentMonthKey } from "../../core/utils";
import { getLiquidAvailable } from "../accounts/balance";
import type { Account, LedgerEntry, PluginSettings } from "../../core/types";
import type { CashflowRow } from "./cashflow";

interface AssetFlows {
  savesByMonthKey?: Record<string, number>;
  passiveIncome?: number;
  accounts?: Account[];
  allLedger?: LedgerEntry[];
}

export interface BudgetSummary {
  income: number;
  passiveIncome: number;
  totalIncome: number;
  needs: number;
  wants: number;
  saves: number;
  left: number;
  savesTarget: number;
  savesRate: number;
  savesOnTrack: boolean;
  comfortBudget: number;
  needsBudget: number;
}

export interface ProjectedRow {
  type: string;
  category: string;
  emoji: string;
  projected: number | null;
}

export function buildBudgetSummary(
  rows: CashflowRow[],
  settings: PluginSettings,
  assetFlows: AssetFlows
): BudgetSummary {
  const currentMk = getCurrentMonthKey();
  const currentIdx = MONTH_KEYS.indexOf(currentMk);
  const savesByMk = assetFlows.savesByMonthKey ?? {};
  const passiveIncome = assetFlows.passiveIncome ?? 0;
  const comfortBudget = settings.comfortBudget ?? 0;

  let rollingLeft = getLiquidAvailable(settings, assetFlows.accounts, assetFlows.allLedger);
  let prevUnspentWants = 0;

  for (let i = 0; i <= currentIdx; i++) {
    const mk = MONTH_KEYS[i];
    let income = 0,
      needs = 0,
      wants = 0;

    for (const r of rows) {
      const v = r.months[mk] ?? 0;
      if (r.type === "Income") income += v;
      if (r.type === "Needs") needs += v;
      if (r.type === "Wants") wants += v;
    }

    const saves = savesByMk[mk] ?? 0;
    const totalIncome = income + (i === currentIdx ? passiveIncome : 0);

    const monthLeft = totalIncome + needs + wants - saves + rollingLeft + prevUnspentWants;

    if (i === currentIdx) {
      const savesTargetPct = settings.savesTargetPct ?? 0;
      const savesTarget =
        savesTargetPct > 0 ? totalIncome * (savesTargetPct / 100) : (settings.savesMonthly ?? 0);
      const savesRate = totalIncome > 0 ? (saves / totalIncome) * 100 : 0;
      const savesOnTrack = savesTargetPct > 0 ? savesRate >= savesTargetPct : saves >= savesTarget;

      return {
        income,
        passiveIncome,
        totalIncome,
        needs,
        wants,
        saves,
        left: getLiquidAvailable(settings, assetFlows.accounts, assetFlows.allLedger),
        savesTarget,
        savesRate,
        savesOnTrack,
        comfortBudget,
        needsBudget: settings.needsBudget ?? 0,
      };
    }

    rollingLeft = monthLeft;
    prevUnspentWants = Math.max(0, comfortBudget + wants);
  }

  return {
    income: 0,
    passiveIncome,
    totalIncome: passiveIncome,
    needs: 0,
    wants: 0,
    saves: 0,
    left: 0,
    savesTarget: 0,
    savesRate: 0,
    savesOnTrack: false,
    comfortBudget,
    needsBudget: settings.needsBudget ?? 0,
  };
}

export function buildProjected(rows: CashflowRow[]): ProjectedRow[] {
  return rows
    .filter((r) => r.recurring && r.projected != null)
    .map((r) => ({ type: r.type, category: r.category, emoji: r.emoji, projected: r.projected }));
}
