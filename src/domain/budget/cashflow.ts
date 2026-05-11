// ───────────────────────────────────────────────────────────────────
// CASHFLOW BUILDER
// ───────────────────────────────────────────────────────────────────

import type { App, TFile } from "obsidian";
import { MONTH_KEYS, TYPE_ORDER } from "../../core/constants";
import { toNum, getCurrentYear } from "../../core/utils";
import type { LedgerEntry, PluginSettings } from "../../core/types";

export interface CashflowRow {
  file: TFile;
  type: string;
  category: string;
  emoji: string;
  recurring: boolean;
  total: number;
  projected: number | null;
  months: Record<string, number | null>;
}

export function buildCashflowRows(
  app: App,
  settings: PluginSettings,
  ledgerEntries?: LedgerEntry[] | null
): CashflowRow[] {
  const folder = settings.categoriesFolder.toLowerCase().replace(/\/$/, "");
  const files = app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.toLowerCase().startsWith(folder + "/"));
  const curYear = getCurrentYear();
  const rows: CashflowRow[] = [];

  const ledgerByCatMonth: Record<string, number> = {};
  if (ledgerEntries && ledgerEntries.length > 0) {
    for (const e of ledgerEntries) {
      if (!e.cat || !e.d || !e.d.startsWith(String(curYear))) continue;
      if (e.type !== "expense" && e.type !== "income") continue;
      const mi = parseInt(e.d.slice(5, 7)) - 1;
      const mk = MONTH_KEYS[mi];
      const key = `${e.cat}|${mk}`;
      ledgerByCatMonth[key] =
        (ledgerByCatMonth[key] || 0) + (e.type === "income" ? toNum(e.amt) : -toNum(e.amt));
    }
  }
  const useLedger =
    !!ledgerEntries && ledgerEntries.length > 0 && Object.keys(ledgerByCatMonth).length > 0;

  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter as Record<string, unknown> | undefined;
    if (!fm) continue;

    const months: Record<string, number | null> = {};
    let total = 0,
      filledSum = 0,
      filledCount = 0;
    const category = String(fm.category ?? file.basename);

    for (const key of MONTH_KEYS) {
      let v: unknown;
      if (useLedger) {
        const lk = `${category}|${key}`;
        v = ledgerByCatMonth[lk] ?? null;
      } else {
        v = fm[key];
      }
      if (v == null || v === "") {
        months[key] = null;
      } else {
        const n = toNum(v);
        months[key] = n;
        total += n;
        if (n !== 0) {
          filledSum += n;
          filledCount++;
        }
      }
    }

    const recurring = !!fm.recurring;
    const projected =
      recurring && filledCount > 0 ? parseFloat((filledSum / filledCount).toFixed(0)) : null;
    const type = String(fm.type ?? "Wants");
    const emoji = String(fm.emoji ?? "");

    rows.push({ file, type, category, emoji, recurring, total, projected, months });
  }

  rows.sort((a, b) => {
    const oa = TYPE_ORDER[a.type] ?? 99;
    const ob = TYPE_ORDER[b.type] ?? 99;
    return oa !== ob ? oa - ob : a.category.localeCompare(b.category);
  });

  return rows;
}
