// ───────────────────────────────────────────────────────────────────
// TEMPLATE CATCH-UP ENGINE
//
// User-triggered (not onload) — runs as part of the "Update prices"
// pipeline. For each asset whose frontmatter carries a `template:` block
// (currently only deposits), advances `next_due` while it's in the past
// and logs an op per elapsed period.
//
// Write pattern per iteration:
//   • mode = "cash"      → body `div` line + ledger `dividend` entry to account
//   • mode = "capitalize"→ body `capitalize` line, no ledger entry, principal
//                          compounds for the next iteration
//
// Idempotency: skips dates that already have an op recorded (body dedup),
// advances next_due regardless so a manually-recorded month doesn't leave
// the schedule stuck. Position-closed assets (current_qty <= 0) are skipped.
// ───────────────────────────────────────────────────────────────────

import type { App, TFile } from "obsidian";
import { toNum, getOrAssignAssetId } from "../../core/utils";
import { writeLedgerEntries } from "../ledger/io";
import { recalcAsset } from "./recalc";
import type { LedgerEntry, PluginSettings } from "../../core/types";

const MAX_ITERS_PER_TEMPLATE = 500; // 500 * 30d ≈ 40y — safety against runaway loops

interface TemplateApplyResult {
  opsApplied: number;
  ledgerEntries: LedgerEntry[];
  closed: boolean;
}

export interface ApplyTemplatesResult {
  opsApplied: number;
  depositsAffected: number;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function applyTemplatesForFile(
  app: App,
  settings: PluginSettings,
  file: TFile,
  today: string
): Promise<TemplateApplyResult | null> {
  const cache = app.metadataCache.getFileCache(file);
  const fm = (cache?.frontmatter ?? {}) as Record<string, unknown>;
  const tpl = fm.template as Record<string, unknown> | undefined;
  if (!tpl || typeof tpl !== "object") return null;

  const currentQty = toNum(fm.current_qty);
  if (currentQty <= 0) return null; // closed position

  const rate = toNum(tpl.rate);
  const freqDays = Math.max(1, Math.round(toNum(tpl.freq_days) || 30));
  const mode = String(tpl.mode || "cash").toLowerCase();
  const account = tpl.account ? String(tpl.account) : null;
  let nextDue = String(tpl.next_due || "").slice(0, 10);
  const endDate = String(tpl.end_date || "").slice(0, 10);
  const effectiveEnd = endDate && endDate < today ? endDate : today;

  if (!nextDue || rate <= 0) return null;

  // Stable id for ledger join — generated lazily for pre-id assets.
  const assetId = await getOrAssignAssetId(app, file);

  const raw = await app.vault.read(file);
  const fmEnd = raw.indexOf("---", 3);
  if (fmEnd === -1) return null;

  const body = raw.slice(fmEnd + 3).replace(/^\n/, "");
  const existingLines = body.split("\n").filter((l: string) => l.trim());
  const existingByDate = new Map<string, Set<string>>(); // date → Set of (op names)
  for (const l of existingLines) {
    const parts = l.split("|").map((p: string) => p.trim());
    if (parts.length < 2) continue;
    const d = parts[0];
    const op = parts[1].toLowerCase();
    if (!existingByDate.has(d)) existingByDate.set(d, new Set());
    existingByDate.get(d)!.add(op);
  }

  const newBodyLines: string[] = [];
  const newLedgerEntries: LedgerEntry[] = [];
  let principal = toNum(fm.total_invested);
  let opsApplied = 0;
  let iters = 0;

  while (nextDue <= effectiveEnd && iters < MAX_ITERS_PER_TEMPLATE) {
    iters += 1;
    const interest = parseFloat((principal * (rate / 100) * (freqDays / 365)).toFixed(2));
    if (interest <= 0.005) {
      nextDue = addDays(nextDue, freqDays);
      continue;
    }

    const opName = mode === "capitalize" ? "capitalize" : "div";
    const existingOpsOnDate = existingByDate.get(nextDue);

    const hasConflict =
      existingOpsOnDate &&
      (existingOpsOnDate.has("div") ||
        existingOpsOnDate.has("capitalize") ||
        existingOpsOnDate.has("reinvest"));

    if (!hasConflict) {
      const line = `${nextDue} | ${opName} | — | ${interest}`;
      newBodyLines.push(line);
      opsApplied += 1;

      if (mode === "cash" && account) {
        newLedgerEntries.push({
          d: nextDue,
          type: "dividend",
          asset: file.basename,
          asset_id: assetId,
          amt: interest,
          to: account,
          note: "auto-log template",
        });
      }
    }

    if (mode === "capitalize") principal += interest;

    nextDue = addDays(nextDue, freqDays);
  }

  if (iters >= MAX_ITERS_PER_TEMPLATE) {
    console.warn(
      `[PC] template catch-up: hit iter limit for ${file.basename}, advancing next_due to today`
    );
    nextDue = today;
  }

  const matured = !!endDate && today >= endDate && currentQty > 0;
  let closed = false;
  if (matured) {
    const lastBoundary = addDays(nextDue, -freqDays);
    const tailMs = new Date(endDate).getTime() - new Date(lastBoundary).getTime();
    const tailDays = Math.max(0, Math.floor(tailMs / 86400000));
    if (tailDays > 0 && tailDays < freqDays) {
      const tailInterest = parseFloat((principal * (rate / 100) * (tailDays / 365)).toFixed(2));
      const existingOnEnd = existingByDate.get(endDate);
      const tailConflict =
        existingOnEnd &&
        (existingOnEnd.has("div") ||
          existingOnEnd.has("capitalize") ||
          existingOnEnd.has("reinvest"));
      if (tailInterest > 0.005 && !tailConflict) {
        const opName = mode === "capitalize" ? "capitalize" : "div";
        newBodyLines.push(`${endDate} | ${opName} | — | ${tailInterest}`);
        opsApplied += 1;
        if (mode === "cash" && account) {
          newLedgerEntries.push({
            d: endDate,
            type: "dividend",
            asset: file.basename,
            asset_id: assetId,
            amt: tailInterest,
            to: account,
            note: "auto-log template (final)",
          });
        }
        if (mode === "capitalize") principal += tailInterest;
      }
    }

    const existingOnClose = existingByDate.get(endDate);
    const alreadyClosed =
      existingOnClose && (existingOnClose.has("sell") || existingOnClose.has("close"));
    if (!alreadyClosed) {
      const pricePerUnit = parseFloat((principal / currentQty).toFixed(4));
      newBodyLines.push(`${endDate} | sell | ${currentQty} | ${pricePerUnit}`);
      newLedgerEntries.push({
        d: endDate,
        type: "sell",
        asset: file.basename,
        asset_id: assetId,
        qty: currentQty,
        price: pricePerUnit,
        amt: principal,
        ...(account ? { to: account } : {}),
        note: "deposit matured",
      });
    }
    closed = true;
  }

  // Write body once per file (if we generated any lines)
  if (newBodyLines.length > 0) {
    const merged = [...newBodyLines, ...existingLines].join("\n") + "\n";
    const fmSection = raw.slice(0, fmEnd + 3);
    await app.vault.modify(file, fmSection + "\n" + merged);
  }

  await app.fileManager.processFrontMatter(file, (f: Record<string, unknown>) => {
    if (!f.template || typeof f.template !== "object") return;
    if (closed) {
      f.status = "closed";
      f.closed_date = endDate;
      delete f.template;
    } else {
      (f.template as Record<string, unknown>).next_due = nextDue;
    }
  });

  await recalcAsset(app, file, settings);

  if (closed) {
    const archFolder = String(settings.archiveFolder || "finance/Data/archive").replace(/\/$/, "");
    if (archFolder && !app.vault.getAbstractFileByPath(archFolder)) {
      await app.vault.createFolder(archFolder).catch(() => {});
    }
    const newPath = `${archFolder}/${file.basename}.md`;
    if (!app.vault.getAbstractFileByPath(newPath)) {
      try {
        await app.fileManager.renameFile(file, newPath);
      } catch (e) {
        console.warn(`[PC] template close: failed to archive ${file.basename}:`, e);
      }
    }
  }

  return { opsApplied, ledgerEntries: newLedgerEntries, closed };
}

export async function applyTemplates(
  app: App,
  settings: PluginSettings
): Promise<ApplyTemplatesResult> {
  const folder = String(settings.assetsFolder || "")
    .toLowerCase()
    .replace(/\/$/, "");
  if (!folder) return { opsApplied: 0, depositsAffected: 0 };

  const files = app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.toLowerCase().startsWith(folder + "/"));

  const today = new Date().toISOString().slice(0, 10);
  const allLedgerEntries: LedgerEntry[] = [];
  let opsApplied = 0;
  let depositsAffected = 0;

  for (const file of files) {
    try {
      const result = await applyTemplatesForFile(app, settings, file, today);
      if (!result) continue;
      if (result.opsApplied > 0) {
        depositsAffected += 1;
        opsApplied += result.opsApplied;
      }
      if (result.ledgerEntries.length > 0) {
        allLedgerEntries.push(...result.ledgerEntries);
      }
    } catch (e) {
      console.warn(`[PC] template catch-up failed for ${file.basename}:`, e);
    }
  }

  if (allLedgerEntries.length > 0) {
    try {
      await writeLedgerEntries(app, settings, allLedgerEntries);
    } catch (e) {
      console.warn("[PC] template catch-up: batched ledger write failed:", e);
    }
  }

  return { opsApplied, depositsAffected };
}
