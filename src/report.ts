// ───────────────────────────────────────────────────────────────────
// MONTHLY REPORT — rich markdown note
// ───────────────────────────────────────────────────────────────────

import type { App, TFile } from "obsidian";
import { MONTH_NAMES, MONTH_KEYS } from "./core/constants";
import { toNum, fmt } from "./core/utils";
import { readAccounts } from "./domain/accounts/io";
import { getLiquidTotal } from "./domain/accounts/balance";
import { readAllLedger } from "./domain/ledger/io";
import {
  buildBasketData,
  checkBasketTriggers,
  checkInstrumentTriggers,
} from "./domain/budget/baskets";
import type { PluginSettings } from "./core/types";

function isFile(f: unknown): f is TFile {
  return !!f && typeof (f as TFile).extension === "string";
}

export async function generateMonthlyReport(
  app: App,
  settings: PluginSettings,
  budget: any,
  assets: any[],
  cfRows: any,
  sym: string
): Promise<string> {
  void budget;
  void cfRows;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const monthName = MONTH_NAMES[now.getMonth()];
  const day = String(now.getDate()).padStart(2, "0");

  void MONTH_KEYS;
  let totalValue = 0,
    totalPL = 0,
    totalDiv = 0,
    periodDiv = 0;
  for (const a of assets) {
    totalValue += a.currentValueRub;
    totalPL += toNum(a.plAmount) * a.fx;
    totalDiv += toNum(a.passiveIncomeTot) * a.fx;
    if (a.logEvents) {
      for (const ev of a.logEvents) {
        if (ev.op === "div" && ev.date && ev.date.startsWith(`${yyyy}-${mm}`)) {
          periodDiv += toNum(ev.val) * a.fx;
        }
      }
    }
  }
  void periodDiv;
  let accounts_r: any[], allLedger_r: any[];
  try {
    accounts_r = await readAccounts(app, settings);
    allLedger_r = await readAllLedger(app, settings);
  } catch {
    accounts_r = [];
    allLedger_r = [];
  }
  const liquidTotal = getLiquidTotal(settings, accounts_r, allLedger_r);
  const netWorth = totalValue + liquidTotal;
  const investedBasis = totalValue - totalPL;
  const returnPct = investedBasis > 0 ? (totalPL / investedBasis) * 100 : 0;
  void returnPct;
  const totalReturn = totalPL + totalDiv;
  const totalRetPct = investedBasis > 0 ? (totalReturn / investedBasis) * 100 : 0;

  const sv = (v: number) => (v >= 0 ? `+ ${fmt(Math.abs(v))}` : `− ${fmt(Math.abs(v))}`);

  let allAlerts: string[] = [];
  try {
    const { baskets } = buildBasketData(assets, settings, null, null);
    const hasStrategy =
      (settings.targetCore || 0) + (settings.targetFlash || 0) + (settings.targetReserve || 0) > 0;
    const basketAlerts = hasStrategy ? checkBasketTriggers(baskets, settings) : [];
    const instrAlerts = checkInstrumentTriggers(assets);
    allAlerts = [...basketAlerts, ...instrAlerts.map((t) => `${t.icon} ${t.text}`)];
  } catch (e) {
    console.error("Report signals error:", e);
  }

  const monthPrefix = `${yyyy}-${mm}`;
  let periodBuys = 0,
    periodSells = 0,
    periodDivs = 0;
  const periodByAsset: Record<string, { buys: number; sells: number; divs: number }> = {};
  for (const a of assets) {
    for (const ev of a.logEvents || []) {
      if (!ev.date || !ev.date.startsWith(monthPrefix)) continue;
      const amt = Math.abs(toNum(ev.qty) * toNum(ev.val)) * a.fx;
      if (ev.op === "buy" || ev.op === "reinvest") {
        periodBuys += amt;
        if (!periodByAsset[a.name]) periodByAsset[a.name] = { buys: 0, sells: 0, divs: 0 };
        periodByAsset[a.name].buys += amt;
      } else if (ev.op === "sell") {
        periodSells += amt;
        if (!periodByAsset[a.name]) periodByAsset[a.name] = { buys: 0, sells: 0, divs: 0 };
        periodByAsset[a.name].sells += amt;
      } else if (ev.op === "div") {
        const dAmt = Math.abs(toNum(ev.qty || ev.val)) * a.fx;
        periodDivs += dAmt;
        if (!periodByAsset[a.name]) periodByAsset[a.name] = { buys: 0, sells: 0, divs: 0 };
        periodByAsset[a.name].divs += dAmt;
      }
    }
  }
  const periodNet = periodDivs + periodSells - periodBuys;

  const periodActive = Object.entries(periodByAsset)
    .map(([name, d]) => ({ name, net: d.divs + d.sells - d.buys, ...d }))
    .filter((a) => Math.abs(a.net) > 0)
    .sort((a, b) => b.net - a.net);
  const periodTop = periodActive.filter((a) => a.net > 0).slice(0, 3);
  const periodBot = periodActive
    .filter((a) => a.net < 0)
    .slice(-3)
    .reverse();

  const row = (label: string, value: string) =>
    `<div class="cr-row"><span class="cr-name">${label}</span><span class="cr-val">${value}</span></div>`;

  const H: string[] = [];
  H.push(`<div class="cr-ticket">`);
  H.push(
    `<div class="cr-header"><span class="cr-title">Capital Statement</span><span class="cr-period">${monthName.slice(0, 3)} 01 – ${monthName.slice(0, 3)} ${day}, ${yyyy}</span></div>`
  );

  H.push(`<div class="cr-group-label cr-first">Portfolio</div>`);
  H.push(row("Net Worth", `${fmt(netWorth)} ${sym}`));
  const retPctStr = `${totalRetPct >= 0 ? "▲" : "▼"} ${fmt(Math.abs(totalRetPct), 1)}%`;
  H.push(
    row(
      "Unrealized P&L",
      `<span class="${totalReturn >= 0 ? "cr-pos" : "cr-neg"}">${sv(totalReturn)} ${sym}</span> <span class="cr-badge">${retPctStr}</span>`
    )
  );

  H.push(`<div class="cr-group-label">This period</div>`);
  if (periodBuys > 0)
    H.push(row("Invested", `<span class="cr-neg">− ${fmt(periodBuys)} ${sym}</span>`));
  if (periodSells > 0)
    H.push(row("Sold", `<span class="cr-pos">+ ${fmt(periodSells)} ${sym}</span>`));
  if (periodDivs > 0)
    H.push(row("Dividends & Coupons", `<span class="cr-pos">+ ${fmt(periodDivs)} ${sym}</span>`));
  if (periodBuys === 0 && periodSells === 0 && periodDivs === 0) {
    H.push(row("Activity", `<span class="cr-muted">—</span>`));
  }

  H.push(`<div class="cr-tear"></div>`);
  H.push(
    `<div class="cr-total-row"><span class="cr-total-label">Period net</span><span class="cr-total-value ${periodNet >= 0 ? "cr-pos" : "cr-neg"}">${sv(periodNet)} ${sym}</span></div>`
  );

  if (periodTop.length > 0 || periodBot.length > 0) {
    H.push(`<div class="cr-group-label">Period performers</div>`);
    for (const a of periodTop)
      H.push(row(a.name, `<span class="cr-pos">+ ${fmt(a.net)} ${sym}</span>`));
    for (const a of periodBot)
      H.push(row(a.name, `<span class="cr-neg">− ${fmt(Math.abs(a.net))} ${sym}</span>`));
  }

  H.push(`<div class="cr-group-label">Signals</div>`);
  for (const a of allAlerts) H.push(`<div class="cr-signal">${a}</div>`);

  H.push(`<div class="cr-footer">Statement generated automatically</div>`);
  H.push(`</div>`);

  const L: string[] = [];
  L.push(`---`);
  L.push(`cssclasses: [pc-report]`);
  L.push(`report_month: "${yyyy}-${mm}"`);
  L.push(`generated: "${yyyy}-${mm}-${day}"`);
  L.push(`net_worth: ${Math.round(netWorth)}`);
  L.push(`---`);
  L.push("");
  L.push(H.join("\n"));

  const content = L.join("\n");
  const folderPath = "finance/Data/reports";

  const fParts = folderPath.split("/");
  let cur = "";
  for (const p of fParts) {
    cur = cur ? `${cur}/${p}` : p;
    if (!app.vault.getAbstractFileByPath(cur)) {
      try {
        await app.vault.createFolder(cur);
      } catch {
        // folder may already exist — race-safe
      }
    }
  }

  const baseName = `${yyyy}-${mm}-${day}`;
  let filePath = `${folderPath}/${baseName}.md`;
  const existingFile = app.vault.getAbstractFileByPath(filePath);
  if (isFile(existingFile)) {
    const openFiles = app.workspace
      .getLeavesOfType("markdown")
      .map((l: any) => l.view?.file?.path)
      .filter(Boolean);
    if (openFiles.includes(filePath)) {
      await app.vault.modify(existingFile, content);
    } else {
      let n = 2;
      while (app.vault.getAbstractFileByPath(`${folderPath}/${baseName}_${n}.md`)) n++;
      filePath = `${folderPath}/${baseName}_${n}.md`;
      await app.vault.create(filePath, content);
    }
  } else {
    await app.vault.create(filePath, content);
  }

  const file = app.vault.getAbstractFileByPath(filePath);
  if (isFile(file)) {
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(file);
    const viewState = leaf.getViewState();
    viewState.state = viewState.state || {};
    viewState.state.mode = "preview";
    await leaf.setViewState(viewState);
  }

  return filePath;
}
