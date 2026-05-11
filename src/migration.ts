// ───────────────────────────────────────────────────────────────────
// MIGRATION — old data → ledger + account files
// ───────────────────────────────────────────────────────────────────

import type { App } from "obsidian";
import { MONTH_KEYS } from "./core/constants";
import { toNum, showNotice } from "./core/utils";
import { writeLedgerEntries } from "./domain/ledger/io";
import type { LedgerEntry, LedgerOpType, PluginSettings } from "./core/types";

interface PluginLike {
  saveSettings(): Promise<void>;
}

export async function runMigration(
  app: App,
  settings: PluginSettings,
  plugin: PluginLike
): Promise<void> {
  showNotice("Migrating to ledger…", 5000);
  const entries: LedgerEntry[] = [];

  // 1. Migrate asset logEvents → ledger
  const assetFolder = settings.assetsFolder.toLowerCase().replace(/\/$/, "");
  const assetFiles = app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.toLowerCase().startsWith(assetFolder + "/"));
  for (const file of assetFiles) {
    const raw = await app.vault.read(file);
    const fmEnd = raw.indexOf("---", 3);
    if (fmEnd === -1) continue;
    const body = raw.slice(fmEnd + 3);
    const assetName = file.basename;
    for (const line of body.split("\n")) {
      const parts = line.trim().includes("|")
        ? line
            .trim()
            .split("|")
            .map((p) => p.trim())
        : line.trim().split(/\s+/);
      if (parts.length < 4) continue;
      const d = new Date(parts[0]);
      if (Number.isNaN(d.getTime())) continue;
      const op = parts[1].toLowerCase();
      const qty = toNum(parts[2]);
      const val = toNum(parts[3]);
      if (op === "price") continue;
      const entry: LedgerEntry = {
        d: parts[0],
        type: "buy",
        amt: 0,
        asset: assetName,
        migrated: true,
      };
      if (op === "buy" || op === "reinvest") {
        entry.type = "buy";
        entry.qty = qty;
        entry.price = val;
        entry.amt = qty * val;
        if (op === "reinvest") entry.note = "reinvest";
      } else if (op === "sell") {
        entry.type = "sell";
        entry.qty = qty;
        entry.price = val;
        entry.amt = qty * val;
      } else if (op === "div") {
        entry.type = "dividend";
        entry.amt = val;
      } else {
        continue;
      }
      entries.push(entry);
    }
  }

  // 2. Migrate liquid pools → account files
  const accountsFolder = settings.accountsFolder || "finance/Data/accounts";
  if (!app.vault.getAbstractFileByPath(accountsFolder)) {
    await app.vault.createFolder(accountsFolder).catch(() => {});
  }
  const pools = [
    { key: "liquidBank", liq: "liquidBankIsLiquid", name: "Bank", type: "bank" },
    {
      key: "liquidBrokerCash",
      liq: "liquidBrokerCashIsLiquid",
      name: "Broker Cash",
      type: "broker",
    },
    { key: "liquidCash", liq: "liquidCashIsLiquid", name: "Cash", type: "cash" },
    { key: "liquidBusiness", liq: "liquidBusinessIsLiquid", name: "Business", type: "business" },
  ];
  for (const pm of pools) {
    const val = (settings as unknown as Record<string, number>)[pm.key] ?? 0;
    if (val === 0) continue;
    const path = `${accountsFolder}/${pm.name}.md`;
    if (!app.vault.getAbstractFileByPath(path)) {
      const isLiquid = (settings as unknown as Record<string, boolean>)[pm.liq];
      const content = [
        "---",
        `name: "${pm.name}"`,
        `type: ${pm.type}`,
        `currency: ${settings.homeCurrency || "RUB"}`,
        `liquid: ${isLiquid !== false}`,
        `locked: ${isLiquid === false}`,
        `initial_balance: ${val}`,
        `last_reconciled: "${new Date().toISOString().slice(0, 10)}"`,
        "---",
        "",
      ].join("\n");
      await app.vault.create(path, content);
    }
  }

  // 3. Migrate category m01-m12 → ledger entries
  const catFolder = settings.categoriesFolder.toLowerCase().replace(/\/$/, "");
  const catFiles = app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.toLowerCase().startsWith(catFolder + "/"));
  const curYear = new Date().getFullYear();
  for (const file of catFiles) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter as Record<string, unknown> | undefined;
    if (!fm) continue;
    const catName = (fm.category as string) || file.basename;
    const catType = String(fm.type || "Wants");
    for (let mi = 0; mi < MONTH_KEYS.length; mi++) {
      const val = fm[MONTH_KEYS[mi]];
      if (val == null || val === "" || toNum(val) === 0) continue;
      const amt = toNum(val);
      const mm = String(mi + 1).padStart(2, "0");
      entries.push({
        d: `${curYear}-${mm}-15`,
        type: (catType === "Income" ? "income" : "expense") as LedgerOpType,
        cat: catName,
        amt: Math.abs(amt),
        migrated: true,
      });
    }
  }

  if (entries.length > 0) {
    await writeLedgerEntries(app, settings, entries);
  }

  settings.migrationDone = true;
  await plugin.saveSettings();
  showNotice(`✓ Migration complete: ${entries.length} ledger entries`, 4000);
}
