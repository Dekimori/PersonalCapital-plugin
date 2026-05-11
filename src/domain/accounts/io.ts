// ───────────────────────────────────────────────────────────────────
// ACCOUNTS I/O — read account files from vault
// ───────────────────────────────────────────────────────────────────

import type { App, TFile } from "obsidian";
import { toNum } from "../../core/utils";
import type { Account, AccountType, PluginSettings } from "../../core/types";

interface AccountWithBank extends Account {
  bank: string;
}

export async function readAccounts(app: App, settings: PluginSettings): Promise<AccountWithBank[]> {
  const folder = (settings.accountsFolder || "finance/Data/accounts")
    .toLowerCase()
    .replace(/\/$/, "");
  const files = app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.toLowerCase().startsWith(folder + "/"));
  const accounts: AccountWithBank[] = [];
  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter ?? {};
    accounts.push({
      name: fm.name || file.basename,
      type: (fm.type || "bank") as AccountType,
      bank: fm.bank || "",
      currency: fm.currency || settings.homeCurrency || "RUB",
      liquid: fm.liquid !== false,
      locked: fm.locked === true,
      initialBalance: toNum(fm.initial_balance),
      lastReconciled: fm.last_reconciled || null,
      file,
    });
  }
  return accounts;
}

// Update frontmatter fields on an account file. Uses processFrontMatter when
// available (fast, preserves rest of file) and falls back to a manual splice
// that keeps YAML intact.
export async function updateAccountFields(
  app: App,
  file: TFile | null | undefined,
  fields: Record<string, unknown>
): Promise<void> {
  if (!file) return;
  if (typeof app.fileManager?.processFrontMatter === "function") {
    await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(fields)) {
        if (v === null || v === undefined) delete fm[k];
        else fm[k] = v;
      }
    });
    return;
  }
  const raw = await app.vault.read(file);
  if (!raw.startsWith("---")) return;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return;
  let head = raw.slice(4, end);
  const body = raw.slice(end);
  for (const [k, v] of Object.entries(fields)) {
    const line = v == null ? "" : `${k}: ${typeof v === "string" ? `"${v}"` : v}`;
    const re = new RegExp(`^${k}:.*$`, "m");
    if (re.test(head)) {
      head = v == null ? head.replace(re, "").replace(/\n\n+/g, "\n") : head.replace(re, line);
    } else if (v != null) {
      head = head.replace(/\n?$/, "\n") + line;
    }
  }
  await app.vault.modify(file, `---\n${head.replace(/\n+$/, "")}\n${body}`);
}

export async function updateLastReconciled(app: App, file: TFile, dateStr: string): Promise<void> {
  await updateAccountFields(app, file, { last_reconciled: dateStr });
}
