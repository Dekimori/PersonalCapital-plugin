// ───────────────────────────────────────────────────────────────────
// EXPORT TO BEANCOUNT — JSONL ledger → beancount format
// ───────────────────────────────────────────────────────────────────

import { buildFullMap, resolvePath, sanitize } from "./account-map";
import type { AccountKind, AccountMeta } from "./account-map";
import type { Account, Category, LedgerEntry, PluginSettings } from "../core/types";

type ResolveFn = (name: string, kind: AccountKind, meta?: AccountMeta) => string;
type CommodityFn = (assetName: string) => string;
type CurrencyFn = (name: string | undefined) => string;

export interface AssetMeta {
  ticker?: string;
  currency?: string;
}

export type AssetMetas = Record<string, AssetMeta>;

/** Transliterate Cyrillic to ASCII for beancount commodity symbols. */
export function transliterate(str: string): string {
  const map: Record<string, string> = {
    А: "A",
    Б: "B",
    В: "V",
    Г: "G",
    Д: "D",
    Е: "E",
    Ё: "Yo",
    Ж: "Zh",
    З: "Z",
    И: "I",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "Kh",
    Ц: "Ts",
    Ч: "Ch",
    Ш: "Sh",
    Щ: "Sch",
    Ъ: "",
    Ы: "Y",
    Ь: "",
    Э: "E",
    Ю: "Yu",
    Я: "Ya",
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return str
    .split("")
    .map((c) => map[c] || c)
    .join("");
}

/** Make a valid beancount commodity symbol (uppercase, ASCII, starts with letter). */
export function toCommodity(name: string, ticker?: string): string {
  if (ticker && /^[A-Z][A-Z0-9\-.]{0,23}$/.test(ticker)) return ticker;
  let s = transliterate(String(name))
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
  if (!s || !/^[A-Z]/.test(s)) s = "X" + s;
  return s.slice(0, 24);
}

/** Ensure beancount TitleCase account path — each segment starts uppercase. */
function ensureTitleCase(path: string): string {
  return path
    .split(":")
    .map((seg) =>
      seg
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("-")
    )
    .join(":");
}

/** Export all ledger entries to beancount format. */
export function exportToBeancount(
  entries: LedgerEntry[],
  accounts: Account[],
  categories: Category[],
  settings: PluginSettings,
  assetMetas?: AssetMetas
): string {
  const fmt = "beancount" as const;
  const home = settings.homeCurrency || "RUB";
  const map = buildFullMap(settings, accounts, categories, fmt);

  const resolve: ResolveFn = (name, kind, meta) => {
    const raw = map[name] || resolvePath(name, settings, kind, meta, fmt);
    return ensureTitleCase(raw);
  };

  const lines: string[] = [];
  const sorted = [...entries].sort((a, b) => (a.d || "").localeCompare(b.d || ""));

  // Collect all account paths + commodities
  const allPaths = new Set<string>();
  const commodities = new Set<string>([home]);
  const assetCommodities: Record<string, string> = {};

  // Build commodity map from asset metas
  if (assetMetas) {
    for (const [name, meta] of Object.entries(assetMetas)) {
      assetCommodities[name] = toCommodity(name, meta.ticker);
      if (meta.currency) commodities.add(meta.currency);
    }
  }

  const getComm: CommodityFn = (assetName) => {
    if (assetCommodities[assetName]) return assetCommodities[assetName];
    const comm = toCommodity(assetName);
    assetCommodities[assetName] = comm;
    return comm;
  };

  const getCur: CurrencyFn = (name) => {
    const acct = accounts.find((a) => a.name === name);
    return acct?.currency || home;
  };

  // First pass: collect paths
  for (const e of sorted) {
    collectPaths(e, resolve, allPaths, accounts);
  }

  // Open directives (earliest date - 1 day)
  const firstDate = sorted.length > 0 ? sorted[0].d : "2020-01-01";
  const openDate = firstDate; // use same date

  // Option header
  lines.push(`option "title" "Personal Capital Export"`);
  lines.push(`option "operating_currency" "${home}"`);
  lines.push("");

  // Commodity declarations
  for (const c of [...commodities].sort()) {
    lines.push(`${openDate} commodity ${c}`);
  }
  for (const [, comm] of Object.entries(assetCommodities).sort()) {
    if (!commodities.has(comm)) lines.push(`${openDate} commodity ${comm}`);
  }
  lines.push("");

  // Open directives
  for (const p of [...allPaths].sort()) {
    lines.push(`${openDate} open ${p}`);
  }
  lines.push("");

  // Transactions
  for (const e of sorted) {
    const txn = entryToBeancount(e, resolve, accounts, home, getComm, getCur);
    if (txn) {
      lines.push(txn);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function collectPaths(
  e: LedgerEntry,
  resolve: ResolveFn,
  allPaths: Set<string>,
  accounts: Account[]
): void {
  const getAcctType = (name: string) => {
    const acct = accounts.find((a) => a.name === name);
    return acct?.type || "bank";
  };

  const type = e.type;
  if (type === "expense") {
    if (e.from) allPaths.add(resolve(e.from, "account", { type: getAcctType(e.from) }));
    if (e.cat) allPaths.add(resolve(e.cat, "category", { categoryType: "expense" }));
  } else if (type === "income") {
    if (e.to) allPaths.add(resolve(e.to, "account", { type: getAcctType(e.to) }));
    if (e.cat) allPaths.add(resolve(e.cat, "category", { categoryType: "income" }));
  } else if (type === "transfer") {
    if (e.from) allPaths.add(resolve(e.from, "account", { type: getAcctType(e.from) }));
    if (e.to) allPaths.add(resolve(e.to, "account", { type: getAcctType(e.to) }));
  } else if (type === "buy") {
    if (e.from) allPaths.add(resolve(e.from, "account", { type: getAcctType(e.from) }));
    if (e.asset) allPaths.add(resolve(e.asset, "asset", { parentAccount: e.from || "" }));
    if (e.fee) allPaths.add("Expenses:Commissions");
  } else if (type === "sell") {
    if (e.to) allPaths.add(resolve(e.to, "account", { type: getAcctType(e.to) }));
    if (e.asset) allPaths.add(resolve(e.asset, "asset", { parentAccount: e.to || "" }));
    allPaths.add("Income:Capital-Gains");
  } else if (type === "dividend") {
    if (e.to) allPaths.add(resolve(e.to, "account", { type: getAcctType(e.to) }));
    const divAcct = e.asset
      ? `Income:Dividends:${sanitize(e.asset, "beancount")}`
      : "Income:Dividends";
    allPaths.add(ensureTitleCase(divAcct));
  } else if (type === "adjust") {
    if (e.asset) allPaths.add(resolve(e.asset, "asset", { parentAccount: e.from || e.to || "" }));
    allPaths.add("Equity:Adjustments");
  } else if (type === "close") {
    if (e.asset) allPaths.add(resolve(e.asset, "asset", { parentAccount: e.to || e.from || "" }));
  }
}

function entryToBeancount(
  e: LedgerEntry,
  resolve: ResolveFn,
  accounts: Account[],
  home: string,
  getComm: CommodityFn,
  getCur: CurrencyFn
): string | null {
  const type = e.type;
  const date = e.d;
  if (!date) return null;

  const getAcctType = (name: string) => {
    const acct = accounts.find((a) => a.name === name);
    return acct?.type || "bank";
  };

  const note = e.note ? ` ; ${e.note}` : "";

  if (type === "expense") {
    const fromPath = e.from
      ? resolve(e.from, "account", { type: getAcctType(e.from) })
      : "Expenses:Unknown";
    const catPath = e.cat
      ? resolve(e.cat, "category", { categoryType: "expense" })
      : "Expenses:Uncategorized";
    const c = getCur(e.from);
    return `${date} * "${e.cat || "Expense"}"${note}\n  ${catPath}    ${e.amt} ${c}\n  ${fromPath}    -${e.amt} ${c}`;
  }

  if (type === "income") {
    const toPath = e.to ? resolve(e.to, "account", { type: getAcctType(e.to) }) : "Assets:Unknown";
    const catPath = e.cat
      ? resolve(e.cat, "category", { categoryType: "income" })
      : "Income:Uncategorized";
    const c = getCur(e.to);
    return `${date} * "${e.cat || "Income"}"${note}\n  ${toPath}    ${e.amt} ${c}\n  ${catPath}    -${e.amt} ${c}`;
  }

  if (type === "transfer") {
    const fromPath = e.from
      ? resolve(e.from, "account", { type: getAcctType(e.from) })
      : "Assets:Unknown";
    const toPath = e.to ? resolve(e.to, "account", { type: getAcctType(e.to) }) : "Assets:Unknown";
    const c = getCur(e.from);
    return `${date} * "Transfer"${note}\n  ${toPath}    ${e.amt} ${c}\n  ${fromPath}    -${e.amt} ${c}`;
  }

  if (type === "buy") {
    const fromPath = e.from
      ? resolve(e.from, "account", { type: getAcctType(e.from) })
      : "Assets:Broker:Unknown";
    const assetPath = e.asset
      ? resolve(e.asset, "asset", { parentAccount: e.from || "" })
      : "Assets:Unknown";
    const c = getCur(e.from);
    const comm = getComm(e.asset || "UNKNOWN");
    const qty = e.qty || 0;
    const price = e.price || 0;
    const amt = e.amt || qty * price;
    const fee = e.fee || 0;
    let txn = `${date} * "Buy ${e.asset || "?"}"${note}\n  ${assetPath}    ${qty} ${comm} {${price} ${c}}`;
    txn += `\n  ${fromPath}    -${amt} ${c}`;
    if (fee > 0) txn += `\n  Expenses:Commissions    ${fee} ${c}`;
    return txn;
  }

  if (type === "sell") {
    const toPath = e.to
      ? resolve(e.to, "account", { type: getAcctType(e.to) })
      : "Assets:Broker:Unknown";
    const assetPath = e.asset
      ? resolve(e.asset, "asset", { parentAccount: e.to || "" })
      : "Assets:Unknown";
    const c = getCur(e.to);
    const comm = getComm(e.asset || "UNKNOWN");
    const qty = e.qty || 0;
    const price = e.price || 0;
    const amt = e.amt || qty * price;
    return `${date} * "Sell ${e.asset || "?"}"${note}\n  ${toPath}    ${amt} ${c}\n  ${assetPath}    -${qty} ${comm} {} @ ${price} ${c}\n  Income:Capital-Gains`;
  }

  if (type === "dividend") {
    const toPath = e.to
      ? resolve(e.to, "account", { type: getAcctType(e.to) })
      : "Assets:Broker:Unknown";
    const divAcct = e.asset
      ? ensureTitleCase(`Income:Dividends:${sanitize(e.asset, "beancount")}`)
      : "Income:Dividends";
    const c = getCur(e.to);
    return `${date} * "Dividend ${e.asset || ""}"${note}\n  ${toPath}    ${e.amt} ${c}\n  ${divAcct}    -${e.amt} ${c}`;
  }

  if (type === "adjust") {
    const assetPath = e.asset
      ? resolve(e.asset, "asset", { parentAccount: e.from || e.to || "" })
      : "Assets:Unknown";
    return `${date} * "Cost adjustment ${e.asset || ""}"${note}\n  ${assetPath}    ${e.amt} ${home}\n  Equity:Adjustments    -${e.amt} ${home}`;
  }

  if (type === "close") {
    if (e.asset) {
      const assetPath = resolve(e.asset, "asset", { parentAccount: e.to || e.from || "" });
      return `${date} close ${assetPath}`;
    }
    return `; ${date} close ${e.asset || "unknown"}`;
  }

  return `; ${date} ${type} ${JSON.stringify(e)}`;
}
