// ───────────────────────────────────────────────────────────────────
// EXPORT TO HLEDGER — JSONL ledger → hledger journal format
// ───────────────────────────────────────────────────────────────────

import { buildFullMap, resolvePath, sanitize } from "./account-map";
import type { AccountKind, AccountMeta } from "./account-map";
import type { Account, Category, LedgerEntry, PluginSettings } from "../core/types";

type ResolveFn = (name: string, kind: AccountKind, meta?: AccountMeta) => string;

/** Export all ledger entries to hledger journal format. */
export function exportToHledger(
  entries: LedgerEntry[],
  accounts: Account[],
  categories: Category[],
  settings: PluginSettings
): string {
  const fmt = "hledger" as const;
  const home = settings.homeCurrency || "RUB";
  const map = buildFullMap(settings, accounts, categories, fmt);

  const resolve: ResolveFn = (name, kind, meta) => {
    if (map[name]) return map[name].toLowerCase();
    return resolvePath(name, settings, kind, meta, fmt).toLowerCase();
  };

  const lines: string[] = [];

  // Header: account declarations
  const allPaths = new Set<string>();
  const addPath = (p: string | null | undefined) => {
    if (p) allPaths.add(p);
  };

  // Sort entries by date
  const sorted = [...entries].sort((a, b) => (a.d || "").localeCompare(b.d || ""));

  // First pass: collect all account paths
  for (const e of sorted) {
    const paths = entryToPaths(e, resolve, accounts, home);
    paths.forEach(addPath);
  }

  // account declarations
  for (const p of [...allPaths].sort()) {
    lines.push(`account ${p}`);
  }
  lines.push("");

  // commodity
  lines.push(`commodity ${home}`);
  const currencies = new Set<string>();
  for (const a of accounts) {
    if (a.currency && a.currency !== home) currencies.add(a.currency);
  }
  for (const c of currencies) lines.push(`commodity ${c}`);
  lines.push("");

  // Transactions
  for (const e of sorted) {
    const txn = entryToHledger(e, resolve, accounts, home);
    if (txn) {
      lines.push(txn);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function getAccountCurrency(name: string, accounts: Account[], homeCurrency: string): string {
  const acct = accounts.find((a) => a.name === name);
  return acct?.currency || homeCurrency;
}

function entryToPaths(
  e: LedgerEntry,
  resolve: ResolveFn,
  accounts: Account[],
  _home: string
): string[] {
  const paths: string[] = [];
  const type = e.type;

  if (type === "expense") {
    if (e.from) paths.push(resolve(e.from, "account", { type: getAcctType(e.from, accounts) }));
    if (e.cat) paths.push(resolve(e.cat, "category", { categoryType: "expense" }));
  } else if (type === "income") {
    if (e.to) paths.push(resolve(e.to, "account", { type: getAcctType(e.to, accounts) }));
    if (e.cat) paths.push(resolve(e.cat, "category", { categoryType: "income" }));
  } else if (type === "transfer") {
    if (e.from) paths.push(resolve(e.from, "account", { type: getAcctType(e.from, accounts) }));
    if (e.to) paths.push(resolve(e.to, "account", { type: getAcctType(e.to, accounts) }));
  } else if (type === "buy") {
    if (e.from) paths.push(resolve(e.from, "account", { type: getAcctType(e.from, accounts) }));
    if (e.asset && e.from)
      paths.push(resolve(e.asset, "asset", { parentAccount: e.from }).toLowerCase());
    if (e.fee) paths.push("expenses:commissions");
  } else if (type === "sell") {
    if (e.to) paths.push(resolve(e.to, "account", { type: getAcctType(e.to, accounts) }));
    if (e.asset && e.to)
      paths.push(resolve(e.asset, "asset", { parentAccount: e.to }).toLowerCase());
  } else if (type === "dividend") {
    if (e.to) paths.push(resolve(e.to, "account", { type: getAcctType(e.to, accounts) }));
    if (e.asset) paths.push(`income:dividends:${sanitize(e.asset, "hledger")}`);
  } else if (type === "adjust") {
    if (e.asset)
      paths.push(resolve(e.asset, "asset", { parentAccount: e.from || e.to || "" }).toLowerCase());
    paths.push("equity:adjustments");
  }

  return paths;
}

function getAcctType(name: string, accounts: Account[]): string {
  const acct = accounts.find((a) => a.name === name);
  return acct?.type || "bank";
}

function entryToHledger(
  e: LedgerEntry,
  resolve: ResolveFn,
  accounts: Account[],
  home: string
): string | null {
  const type = e.type;
  const date = e.d;
  if (!date) return null;

  const cur = (name: string | undefined) => getAccountCurrency(name || "", accounts, home);
  const note = e.note ? `  ; ${e.note}` : "";

  if (type === "expense") {
    const fromPath = e.from
      ? resolve(e.from, "account", { type: getAcctType(e.from, accounts) })
      : "expenses:unknown";
    const catPath = e.cat
      ? resolve(e.cat, "category", { categoryType: "expense" })
      : "expenses:uncategorized";
    const c = cur(e.from);
    return `${date} ${e.cat || "Expense"}${note}\n    ${catPath}    ${e.amt} ${c}\n    ${fromPath}    ${-e.amt} ${c}`;
  }

  if (type === "income") {
    const toPath = e.to
      ? resolve(e.to, "account", { type: getAcctType(e.to, accounts) })
      : "assets:unknown";
    const catPath = e.cat
      ? resolve(e.cat, "category", { categoryType: "income" })
      : "income:uncategorized";
    const c = cur(e.to);
    return `${date} ${e.cat || "Income"}${note}\n    ${toPath}    ${e.amt} ${c}\n    ${catPath}    ${-e.amt} ${c}`;
  }

  if (type === "transfer") {
    const fromPath = e.from
      ? resolve(e.from, "account", { type: getAcctType(e.from, accounts) })
      : "assets:unknown";
    const toPath = e.to
      ? resolve(e.to, "account", { type: getAcctType(e.to, accounts) })
      : "assets:unknown";
    const c = cur(e.from);
    return `${date} Transfer${note}\n    ${toPath}    ${e.amt} ${c}\n    ${fromPath}    ${-e.amt} ${c}`;
  }

  if (type === "buy") {
    const fromPath = e.from
      ? resolve(e.from, "account", { type: getAcctType(e.from, accounts) })
      : "assets:broker:unknown";
    const assetPath = e.asset
      ? resolve(e.asset, "asset", { parentAccount: e.from || "" }).toLowerCase()
      : "assets:unknown";
    const c = cur(e.from);
    const qty = e.qty || 0;
    const price = e.price || 0;
    const amt = e.amt || qty * price;
    const fee = e.fee || 0;
    const ticker = sanitize(e.asset || "UNKNOWN", "hledger");
    let txn = `${date} Buy ${e.asset || "?"}${note}\n    ${assetPath}    ${qty} "${ticker}" @ ${price} ${c}`;
    txn += `\n    ${fromPath}    ${-amt} ${c}`;
    if (fee > 0) txn += `\n    expenses:commissions    ${fee} ${c}`;
    return txn;
  }

  if (type === "sell") {
    const toPath = e.to
      ? resolve(e.to, "account", { type: getAcctType(e.to, accounts) })
      : "assets:broker:unknown";
    const assetPath = e.asset
      ? resolve(e.asset, "asset", { parentAccount: e.to || "" }).toLowerCase()
      : "assets:unknown";
    const c = cur(e.to);
    const qty = e.qty || 0;
    const price = e.price || 0;
    const amt = e.amt || qty * price;
    const ticker = sanitize(e.asset || "UNKNOWN", "hledger");
    return `${date} Sell ${e.asset || "?"}${note}\n    ${toPath}    ${amt} ${c}\n    ${assetPath}    ${-qty} "${ticker}" @ ${price} ${c}`;
  }

  if (type === "dividend") {
    const toPath = e.to
      ? resolve(e.to, "account", { type: getAcctType(e.to, accounts) })
      : "assets:broker:unknown";
    const incPath = e.asset
      ? `income:dividends:${sanitize(e.asset, "hledger")}`
      : "income:dividends";
    const c = cur(e.to);
    return `${date} Dividend ${e.asset || ""}${note}\n    ${toPath}    ${e.amt} ${c}\n    ${incPath}    ${-e.amt} ${c}`;
  }

  if (type === "adjust") {
    const assetPath = e.asset
      ? resolve(e.asset, "asset", { parentAccount: e.from || e.to || "" }).toLowerCase()
      : "assets:unknown";
    return `${date} Cost adjustment ${e.asset || ""}${note}\n    ${assetPath}    ${e.amt} ${home}\n    equity:adjustments    ${-e.amt} ${home}`;
  }

  if (type === "close") {
    return `; ${date} Close ${e.asset || ""} (position fully liquidated)`;
  }

  // Unknown type — comment
  return `; ${date} ${type} ${JSON.stringify(e)}`;
}
