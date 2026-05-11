// ───────────────────────────────────────────────────────────────────
// DATA SNAPSHOT (shared between strategy & analysis prompts)
// ───────────────────────────────────────────────────────────────────

import type { App } from "obsidian";
import { MONTH_NAMES } from "../core/constants";
import {
  fmt,
  fmtSigned,
  getCurrentMonthIdx,
  getCurrentYear,
  getCurrentMonthKey,
} from "../core/utils";
import { buildAssetFlowsAsync } from "../domain/assets/flows";
import { buildCashflowRows } from "../domain/budget/cashflow";
import { buildBudgetSummary } from "../domain/budget/summary";
import { readCapitalHistory } from "../domain/budget/timeline";
import { getAccountBalance, getLiquidTotal } from "../domain/accounts/balance";
import { readWantsQueue } from "../wants-queue";
import type { PluginSettings } from "../core/types";
import type { BudgetSummary } from "../domain/budget/summary";
import type { AssetFlow } from "../domain/assets/flows";
import type { CapitalPoint } from "../domain/budget/timeline";

export interface DataSnapshot {
  lines: string[];
  budget: BudgetSummary;
  assets: AssetFlow[];
  history: CapitalPoint[];
  totalCapital: number;
  curMonth: string;
  curYear: number;
}

export async function buildDataSnapshot(app: App, settings: PluginSettings): Promise<DataSnapshot> {
  const af = await buildAssetFlowsAsync(app, settings);
  const { assets, accounts, allLedger } = af;
  const cfRows = buildCashflowRows(app, settings, allLedger);
  const budget = buildBudgetSummary(cfRows, settings, af);
  const history = await readCapitalHistory(app, settings);
  const wqItems = await readWantsQueue(app, settings);
  const wqPending = wqItems.filter((it) => !it.done);
  const sym = settings.homeCurrencySymbol;

  const investedCapital = assets.reduce((s, a) => s + a.currentValueRub, 0);
  const liquidTotal = getLiquidTotal(settings, accounts, allLedger);
  const totalCapital = investedCapital + liquidTotal;
  const curMonth = MONTH_NAMES[getCurrentMonthIdx()];
  const curYear = getCurrentYear();
  const mk = getCurrentMonthKey();

  const lines = [
    `## Current Period: ${curMonth} ${curYear}`,
    ``,
    `## Budget Summary`,
    `- Active Income:   ${fmt(budget.income)} ${sym}`,
    `- Passive Income:  ${fmt(budget.passiveIncome)} ${sym}`,
    `- Total Income:    ${fmt(budget.totalIncome)} ${sym}`,
    `- Needs:           ${fmt(budget.needs)} ${sym}  (${budget.totalIncome !== 0 ? Math.round((Math.abs(budget.needs) / budget.totalIncome) * 100) : 0}% of income)`,
    `- Wants:           ${fmt(budget.wants)} ${sym}`,
    `- Saves (actual):  ${fmt(budget.saves)} ${sym}`,
    `- Saves (target):  ${fmt(budget.savesTarget)} ${sym}  (${settings.savesTargetPct}% of income)`,
    `- Left (liquid):   ${fmt(budget.left)} ${sym}`,
    ``,
    `## Cashflow Breakdown (${curMonth})`,
    `| Type | Category | Recurring | This Month | Projected Mo. |`,
    `|---|---|---|---|---|`,
    ...cfRows.map((r) => {
      const act = r.months[mk] != null ? fmt(r.months[mk]) : "—";
      const prj = r.projected != null ? fmt(r.projected) : "—";
      return `| ${r.type} | ${r.emoji} ${r.category} | ${r.recurring ? "✓" : ""} | ${act} | ${prj} |`;
    }),
    ``,
    `## Portfolio — Assets`,
    `| Ticker | Type | Ccy | Qty | Price | Value | P&L | P&L% | Div/Income |`,
    `|---|---|---|---|---|---|---|---|---|`,
    ...assets.map(
      (a) =>
        `| ${a.name} | ${a.type} | ${a.currency} | ${a.currentQty} | ${a.currentPrice ?? "—"} | ${fmt(a.currentValue, 2)} | ${fmtSigned(a.plAmount, 2)} | ${fmtSigned(a.plPct, 1)}% | ${fmt(a.passiveIncomeTot, 2)} |`
    ),
    ``,
    `## Accounts`,
    ...(accounts && accounts.length > 0
      ? [
          accounts
            .map((a) => `${a.name} ${fmt(getAccountBalance(a, allLedger))}${a.locked ? " 🔒" : ""}`)
            .join(", ") + ` — Total: ${fmt(liquidTotal)} ${sym}`,
        ]
      : [
          `Bank ${fmt(settings.liquidBank ?? 0)}${settings.liquidBankIsLiquid !== false ? "" : " 🔒"}, Broker ${fmt(settings.liquidBrokerCash ?? 0)}${settings.liquidBrokerCashIsLiquid !== false ? "" : " 🔒"}, Cash ${fmt(settings.liquidCash ?? 0)}${settings.liquidCashIsLiquid !== false ? "" : " 🔒"}, Business ${fmt(settings.liquidBusiness ?? 0)}${settings.liquidBusinessIsLiquid ? "" : " 🔒"} — Total: ${fmt(liquidTotal)} ${sym}`,
        ]),
    ``,
    `## Total Capital`,
    `Invested: ${fmt(investedCapital)}, Liquid: ${fmt(liquidTotal)}, **Total: ${fmt(totalCapital)} ${sym}**`,
    ``,
    ``,
  ];

  if (wqPending.length > 0) {
    lines.push(`## Wants Queue (planned purchases)`);
    lines.push(`| Item | Est. Cost |`);
    lines.push(`|---|---|`);
    for (const it of wqPending) {
      lines.push(`| ${it.name} | ${fmt(it.cost)} ${sym} |`);
    }
    lines.push(`- Queue total: ${fmt(wqPending.reduce((s, it) => s + it.cost, 0))} ${sym}`);
    lines.push(``);
  }

  return { lines, budget, assets, history, totalCapital, curMonth, curYear };
}
