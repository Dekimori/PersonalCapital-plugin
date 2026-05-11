// ───────────────────────────────────────────────────────────────────
// WANTS QUEUE  (read / write / cleanup)
// ───────────────────────────────────────────────────────────────────

import type { App, TFile } from "obsidian";
import { toNum, getCurrentMonthKey } from "./core/utils";
import { enqueueWrite } from "./domain/ledger/write-queue";
import type { PluginSettings } from "./core/types";

export interface WantsItem {
  name: string;
  cost: number;
  done?: string | null;
}

function isFile(f: unknown): f is TFile {
  return !!f && typeof (f as TFile).extension === "string";
}

export async function readWantsQueue(app: App, settings: PluginSettings): Promise<WantsItem[]> {
  const path = settings.wantsQueuePath;
  const file = app.vault.getAbstractFileByPath(path);
  if (!isFile(file)) return [];
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!fm?.items || !Array.isArray(fm.items)) return [];
  return (fm.items as Array<Record<string, unknown>>).map((it) => ({
    name: String(it.name ?? ""),
    cost: toNum(it.cost),
    done: (it.done as string | null | undefined) ?? null,
  }));
}

export async function writeWantsQueue(
  app: App,
  settings: PluginSettings,
  items: WantsItem[]
): Promise<void> {
  const path = settings.wantsQueuePath;
  return enqueueWrite(path, async () => {
    let file = app.vault.getAbstractFileByPath(path);
    if (!isFile(file)) {
      const dir = path.split("/").slice(0, -1).join("/");
      if (dir && !app.vault.getAbstractFileByPath(dir)) {
        await app.vault.createFolder(dir).catch(() => {});
      }
      file = await app.vault.create(path, "---\nitems: []\n---\n");
    }
    await app.fileManager.processFrontMatter(file as TFile, (fm: Record<string, unknown>) => {
      fm.items = items.map((it) => {
        const o: Record<string, unknown> = { name: it.name, cost: it.cost };
        if (it.done) o.done = it.done;
        return o;
      });
    });
  });
}

export function cleanupDoneItems(items: WantsItem[]): WantsItem[] {
  const currentMk = getCurrentMonthKey();
  return items.filter((it) => !it.done || it.done === currentMk);
}

export function getWantsQueueTotal(items: WantsItem[]): number {
  return items.filter((it) => !it.done).reduce((s, it) => s + it.cost, 0);
}
