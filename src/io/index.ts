// ───────────────────────────────────────────────────────────────────
// IO — Public API for import/export
// ───────────────────────────────────────────────────────────────────

import type { App, TFile } from "obsidian";
import { exportToHledger } from "./export-hledger";
import { exportToBeancount } from "./export-beancount";
import { importFromHledger } from "./import-hledger";
import { importFromBeancount } from "./import-beancount";
import { buildFullMap, validateMap } from "./account-map";
import type { PtaFormat } from "./account-map";
import type { ImportResult } from "./import-hledger";
import type { AssetMetas } from "./export-beancount";

import { readAllLedger } from "../domain/ledger/io";
import { readAccounts } from "../domain/accounts/io";
import type { Category, PluginSettings } from "../core/types";

export { buildFullMap, validateMap };

interface ExportResult {
  success: boolean;
  path: string;
  warnings: string[];
  entryCount: number;
}

function isFile(f: unknown): f is TFile {
  return !!f && typeof (f as TFile).extension === "string";
}

/** Read categories from vault (same pattern as readAccounts). */
export async function readCategories(app: App, settings: PluginSettings): Promise<Category[]> {
  const folder = (settings.categoriesFolder || "finance/Data/categories")
    .toLowerCase()
    .replace(/\/$/, "");
  const files = app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.toLowerCase().startsWith(folder + "/"));
  const categories: Category[] = [];
  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = (cache?.frontmatter ?? {}) as Record<string, unknown>;
    categories.push({
      name: (fm.name as string) || file.basename,
      type: ((fm.type as string) || "expense") as Category["type"],
    });
  }
  return categories;
}

/** Read asset metadata for beancount commodity symbols. */
export async function readAssetMetas(app: App, settings: PluginSettings): Promise<AssetMetas> {
  const folder = (settings.assetsFolder || "finance/Data/assets").toLowerCase().replace(/\/$/, "");
  const files = app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.toLowerCase().startsWith(folder + "/"));
  const metas: AssetMetas = {};
  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = (cache?.frontmatter ?? {}) as Record<string, unknown>;
    const name = (fm.name as string) || file.basename;
    metas[name] = {
      ticker: (fm.ticker as string) || undefined,
      currency: (fm.currency as string) || undefined,
    };
  }
  return metas;
}

/** Export ledger to file in vault. */
export async function exportToFile(
  app: App,
  settings: PluginSettings,
  format: PtaFormat,
  outputPath: string
): Promise<ExportResult> {
  const [entries, accounts, categories] = await Promise.all([
    readAllLedger(app, settings),
    readAccounts(app, settings),
    readCategories(app, settings),
  ]);

  const { orphans } = validateMap(settings, entries, accounts, categories);
  const warnings =
    orphans.length > 0
      ? [`Orphaned map entries (no matching account/category): ${orphans.join(", ")}`]
      : [];

  let content: string;
  if (format === "beancount") {
    const assetMetas = await readAssetMetas(app, settings);
    content = exportToBeancount(entries, accounts, categories, settings, assetMetas);
  } else {
    content = exportToHledger(entries, accounts, categories, settings);
  }

  // Write to vault
  const existing = app.vault.getAbstractFileByPath(outputPath);
  if (isFile(existing)) {
    await app.vault.modify(existing, content);
  } else {
    const dir = outputPath.split("/").slice(0, -1).join("/");
    if (dir && !app.vault.getAbstractFileByPath(dir)) {
      await app.vault.createFolder(dir).catch(() => {});
    }
    await app.vault.create(outputPath, content);
  }

  return { success: true, path: outputPath, warnings, entryCount: entries.length };
}

/** Import from file in vault. */
export async function importFromFile(
  app: App,
  settings: PluginSettings,
  inputPath: string,
  format: PtaFormat
): Promise<ImportResult> {
  const file = app.vault.getAbstractFileByPath(inputPath);
  if (!isFile(file)) throw new Error(`File not found: ${inputPath}`);

  const content = await app.vault.read(file);
  const [accounts, categories] = await Promise.all([
    readAccounts(app, settings),
    readCategories(app, settings),
  ]);

  if (format === "beancount") {
    return importFromBeancount(content, settings, accounts, categories);
  }
  return importFromHledger(content, settings, accounts, categories);
}
