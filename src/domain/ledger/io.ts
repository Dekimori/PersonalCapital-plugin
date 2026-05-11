// -------------------------------------------------------------------
// LEDGER I/O — single source of truth for all money movements
// -------------------------------------------------------------------
// JSONL format: one JSON object per line, one file per year.
// Entry: { id, d, type, amt, asset?, from?, to?, qty?, price?, cat?, note?, migrated? }
// Types: buy, sell, dividend, close, expense, income, transfer, reconciliation

import type { App, TAbstractFile, TFile } from "obsidian";
import { enqueueWrite } from "./write-queue";
import { getCached, setCache, invalidate } from "./cache";
import type { LedgerEntry, PluginSettings } from "../../core/types";

export function getLedgerPath(settings: PluginSettings, year?: number): string {
  const y = year || new Date().getFullYear();
  return `${settings.ledgerFolder || "finance/Data"}/ledger-${y}.jsonl`;
}

function isFile(f: TAbstractFile | null): f is TFile {
  return !!f && typeof (f as TFile).extension === "string";
}

export async function readLedger(
  app: App,
  settings: PluginSettings,
  year?: number
): Promise<LedgerEntry[]> {
  const path = getLedgerPath(settings, year);
  const cached = getCached(path);
  if (cached) return cached;
  const file = app.vault.getAbstractFileByPath(path);
  if (!isFile(file)) return [];
  const content = await app.vault.read(file);
  const entries = content
    .split("\n")
    .filter((l) => l.trim())
    .map((l): LedgerEntry | null => {
      try {
        return JSON.parse(l) as LedgerEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is LedgerEntry => e !== null);
  setCache(path, entries);
  return entries;
}

export async function readLedgerMultiYear(
  app: App,
  settings: PluginSettings,
  years: number[]
): Promise<LedgerEntry[]> {
  const all: LedgerEntry[] = [];
  for (const y of years) {
    const entries = await readLedger(app, settings, y);
    all.push(...entries);
  }
  return all;
}

/** Discover all ledger-YYYY.jsonl files and read them all */
export async function readAllLedger(app: App, settings: PluginSettings): Promise<LedgerEntry[]> {
  const folder = settings.ledgerFolder || "finance/Data";
  const all: LedgerEntry[] = [];
  for (const f of app.vault.getFiles()) {
    if (
      f.path.startsWith(folder + "/") &&
      f.name.startsWith("ledger-") &&
      f.name.endsWith(".jsonl")
    ) {
      const content = await app.vault.read(f);
      const entries = content
        .split("\n")
        .filter((l) => l.trim())
        .map((l): LedgerEntry | null => {
          try {
            return JSON.parse(l) as LedgerEntry;
          } catch {
            return null;
          }
        })
        .filter((e): e is LedgerEntry => e !== null);
      all.push(...entries);
    }
  }
  return all;
}

export async function writeLedgerEntry(
  app: App,
  settings: PluginSettings,
  entry: LedgerEntry
): Promise<void> {
  entry.id = entry.id || crypto.randomUUID();
  const year = entry.d ? parseInt(entry.d.slice(0, 4)) : new Date().getFullYear();
  const path = getLedgerPath(settings, year);
  return enqueueWrite(path, async () => {
    invalidate(path);
    const line = JSON.stringify(entry);
    const file = app.vault.getAbstractFileByPath(path);
    if (isFile(file)) {
      const content = await app.vault.read(file);
      await app.vault.modify(file, content.trimEnd() + "\n" + line + "\n");
    } else {
      const dir = path.split("/").slice(0, -1).join("/");
      if (dir && !app.vault.getAbstractFileByPath(dir)) {
        await app.vault.createFolder(dir).catch(() => {});
      }
      await app.vault.create(path, line + "\n");
    }
  });
}

/**
 * Delete a ledger entry. Matches by `id` when present.
 * Fallback for legacy entries: field matching with epsilon for numerics.
 */
export async function deleteLedgerEntry(
  app: App,
  settings: PluginSettings,
  entry: LedgerEntry
): Promise<boolean> {
  if (!entry || !entry.d) return false;
  const year = parseInt(entry.d.slice(0, 4));
  const path = getLedgerPath(settings, year);
  return enqueueWrite(path, async () => {
    invalidate(path);
    const file = app.vault.getAbstractFileByPath(path);
    if (!isFile(file)) return false;
    const content = await app.vault.read(file);
    const lines = content.split("\n");
    const strKeys: (keyof LedgerEntry)[] = ["d", "type", "cat", "asset", "from", "to", "note"];
    const numKeys: (keyof LedgerEntry)[] = ["amt", "qty", "price"];
    let removed = false;
    const out: string[] = [];
    for (const line of lines) {
      if (!line.trim() || removed) {
        out.push(line);
        continue;
      }
      let parsed: LedgerEntry;
      try {
        parsed = JSON.parse(line) as LedgerEntry;
      } catch {
        out.push(line);
        continue;
      }

      // Prefer ID match
      if (entry.id && parsed.id && entry.id === parsed.id) {
        removed = true;
        continue;
      }

      // Fallback: field matching with epsilon for numerics
      if (!entry.id || !parsed.id) {
        let match = true;
        for (const k of strKeys) {
          const a = parsed[k] == null ? undefined : parsed[k];
          const b = entry[k] == null ? undefined : entry[k];
          if (a !== b) {
            match = false;
            break;
          }
        }
        if (match) {
          for (const k of numKeys) {
            const a = parsed[k] as number | undefined;
            const b = entry[k] as number | undefined;
            if (a === undefined && b === undefined) continue;
            if (a === undefined || b === undefined) {
              match = false;
              break;
            }
            if (Math.abs(a - b) >= 0.005) {
              match = false;
              break;
            }
          }
        }
        if (match) {
          removed = true;
          continue;
        }
      }

      out.push(line);
    }
    if (!removed) return false;
    await app.vault.modify(file, out.join("\n").replace(/\n+$/, "\n"));
    return true;
  });
}

export async function writeLedgerEntries(
  app: App,
  settings: PluginSettings,
  entries: LedgerEntry[]
): Promise<void> {
  for (const e of entries) {
    e.id = e.id || crypto.randomUUID();
  }
  const byYear: Record<string, LedgerEntry[]> = {};
  for (const e of entries) {
    const year = e.d ? parseInt(e.d.slice(0, 4)) : new Date().getFullYear();
    (byYear[year] = byYear[year] || []).push(e);
  }
  for (const [year, yearEntries] of Object.entries(byYear)) {
    const path = getLedgerPath(settings, parseInt(year));
    await enqueueWrite(path, async () => {
      invalidate(path);
      const lines = yearEntries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      const file = app.vault.getAbstractFileByPath(path);
      if (isFile(file)) {
        const content = await app.vault.read(file);
        await app.vault.modify(file, content.trimEnd() + "\n" + lines);
      } else {
        const dir = path.split("/").slice(0, -1).join("/");
        if (dir && !app.vault.getAbstractFileByPath(dir)) {
          await app.vault.createFolder(dir).catch(() => {});
        }
        await app.vault.create(path, lines);
      }
    });
  }
}
