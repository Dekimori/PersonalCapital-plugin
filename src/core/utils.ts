import { Notice } from "obsidian";
import type { App, TFile } from "obsidian";
import { MONTH_KEYS } from "./constants";
import type { MonthKey } from "./types";

export function showNotice(msg: string, duration = 2500): void {
  const n = new Notice(msg);
  setTimeout(() => {
    try {
      n.hide();
    } catch {
      // Notice may already be hidden — safe to ignore
    }
  }, duration);
}

export function toNum(x: unknown): number {
  if (typeof x === "number" && !Number.isNaN(x)) return x;
  if (typeof x === "string" && x.trim() !== "" && x.trim() !== "—") {
    const n = parseFloat(x.replace(/[, ]/g, ""));
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

export function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function fmtSigned(n: number | null | undefined, decimals = 0): string {
  if (n == null || Number.isNaN(n)) return "—";
  const s = fmt(Math.abs(n), decimals);
  return n >= 0 ? "+" + s : "−" + s;
}

export function getCurrentMonthIdx(): number {
  return new Date().getMonth();
}

export function getCurrentMonthKey(): MonthKey {
  return MONTH_KEYS[getCurrentMonthIdx()];
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/** Make a DOM element keyboard-accessible with Enter/Space activation */
export function makeInteractive(el: HTMLElement, role = "button"): void {
  el.setAttribute("role", role);
  el.setAttribute("tabindex", "0");
  el.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      el.click();
    }
  });
}

// Stable canonical key for an asset across renames. Stored in the asset's
// frontmatter as `id` and denormalised onto every ledger entry as `asset_id`.
// Lets users rename asset md files without breaking dashboard joins.
export function makeAssetId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "ast_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// Read fm.id from cache, generating + persisting a new one if missing.
// Use at write sites so legacy assets that survived migration still get an id
// the moment they're touched, instead of waiting for the next migration pass.
export async function getOrAssignAssetId(app: App, file: TFile): Promise<string> {
  const cache = app.metadataCache.getFileCache(file);
  let id = cache?.frontmatter?.id;
  if (id) return String(id);
  id = makeAssetId();
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.id = id;
  });
  return id;
}

// Block Chromium's wheel-changes-value quirk on <input type=number>.
// Attach once at creation; handler dies with the element, no global state.
// Use in place of el.addEventListener("wheel", ...) boilerplate.
export function killWheelChange<T extends HTMLInputElement | null | undefined>(inputEl: T): T {
  if (!inputEl) return inputEl;
  inputEl.addEventListener(
    "wheel",
    (e) => {
      if (document.activeElement === inputEl) e.preventDefault();
    },
    { passive: false }
  );
  return inputEl;
}
