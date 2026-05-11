// ───────────────────────────────────────────────────────────────────
// ACCOUNT MAP — shadow hierarchical mapping for PTA export/import
// ───────────────────────────────────────────────────────────────────

import type { Account, Category, LedgerEntry, PluginSettings } from "../core/types";

export type PtaFormat = "hledger" | "beancount";
export type AccountKind = "account" | "category" | "asset";

export interface AccountMeta {
  type?: string;
  parentAccount?: string;
  categoryType?: string;
}

export interface MapValidation {
  orphans: string[];
  missing: string[];
}

/** Sanitize a name for use in PTA account paths. */
export function sanitize(name: string, format: PtaFormat): string {
  const s = String(name)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9Ѐ-ӿ-]/g, "");
  if (format === "hledger") return s.toLowerCase();
  // beancount: TitleCase each segment
  return s
    .split("-")
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("-");
}

/** Auto-generate a hierarchical path from a flat account/category/asset name. */
export function autoGeneratePath(
  name: string,
  kind: AccountKind,
  meta: AccountMeta | undefined,
  format: PtaFormat
): string {
  const s = (n: string) => sanitize(n, format);
  const sep = ":";

  if (kind === "account") {
    const type = String(meta?.type || "bank").toLowerCase();
    if (type === "broker") return `Assets${sep}Broker${sep}${s(name)}`;
    return `Assets${sep}Bank${sep}${s(name)}`;
  }

  if (kind === "category") {
    const catType = String(meta?.categoryType || "").toLowerCase();
    if (catType === "income") return `Income${sep}${s(name)}`;
    return `Expenses${sep}${s(name)}`;
  }

  if (kind === "asset") {
    const parent = meta?.parentAccount;
    if (parent) return `Assets${sep}Broker${sep}${s(parent)}${sep}${s(name)}`;
    return `Assets${sep}Investments${sep}${s(name)}`;
  }

  return s(name);
}

/**
 * Resolve a flat name to a hierarchical PTA path.
 * Manual override wins over auto-generated.
 */
export function resolvePath(
  flatName: string,
  settings: PluginSettings,
  kind: AccountKind,
  meta: AccountMeta | undefined,
  format: PtaFormat
): string {
  const map = settings.accountMap || {};
  if (map[flatName]) return format === "hledger" ? map[flatName].toLowerCase() : map[flatName];
  return autoGeneratePath(flatName, kind, meta, format);
}

/**
 * Reverse lookup: hierarchical path → flat name.
 * Searches manual overrides first, then tries to infer from path structure.
 */
export function resolveFlat(
  hierarchicalPath: string,
  settings: PluginSettings,
  accounts: Account[] | null | undefined,
  categories: Category[] | null | undefined
): string {
  const map = settings.accountMap || {};
  const lower = hierarchicalPath.toLowerCase();

  // Check manual overrides
  for (const [flat, path] of Object.entries(map)) {
    if (path.toLowerCase() === lower) return flat;
  }

  // Infer from path segments
  const segments = hierarchicalPath.split(":");
  const lastName = segments[segments.length - 1].replace(/-/g, " ");

  // Match accounts
  if (accounts) {
    const match = accounts.find((a) => a.name.toLowerCase() === lastName.toLowerCase());
    if (match) return match.name;
  }

  // Match categories
  if (categories) {
    const match = categories.find((c) => c.name.toLowerCase() === lastName.toLowerCase());
    if (match) return match.name;
  }

  return lastName;
}

/**
 * Validate mapping completeness. Returns orphans (manual overrides that no
 * longer match any real account/category) and missing (entries without mapping).
 */
export function validateMap(
  settings: PluginSettings,
  allEntries: LedgerEntry[],
  accounts: Account[],
  categories: Category[]
): MapValidation {
  const map = settings.accountMap || {};
  const orphans: string[] = [];
  const knownNames = new Set<string>([
    ...accounts.map((a) => a.name),
    ...categories.map((c) => c.name),
  ]);

  for (const key of Object.keys(map)) {
    if (!knownNames.has(key)) orphans.push(key);
  }

  // Find all unique from/to/cat values in ledger
  const usedNames = new Set<string>();
  for (const e of allEntries) {
    if (e.from) usedNames.add(e.from);
    if (e.to) usedNames.add(e.to);
    if (e.cat) usedNames.add(e.cat);
  }

  const missing: string[] = [];
  for (const name of usedNames) {
    if (!map[name] && !knownNames.has(name)) missing.push(name);
  }

  return { orphans, missing };
}

/** Build a full resolved map for export: every known name → hierarchical path. */
export function buildFullMap(
  settings: PluginSettings,
  accounts: Account[],
  categories: Category[],
  format: PtaFormat
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const a of accounts) {
    result[a.name] = resolvePath(a.name, settings, "account", { type: a.type }, format);
  }
  for (const c of categories) {
    result[c.name] = resolvePath(c.name, settings, "category", { categoryType: c.type }, format);
  }
  return result;
}
