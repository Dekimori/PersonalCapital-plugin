// ───────────────────────────────────────────────────────────────────
// IMPORT FROM BEANCOUNT — parse beancount file → JSONL entries
// ───────────────────────────────────────────────────────────────────

import { resolveFlat } from "./account-map";
import type { Account, Category, LedgerEntry, PluginSettings } from "../core/types";
import type { ImportResult } from "./import-hledger";

interface BeancountPosting {
  account: string;
  amount: number | null;
  commodity: string | null;
  cost: number | null;
  price: number | null;
  priceCommodity?: string | null;
}

interface BeancountTxn {
  lineNum: number;
  date: string;
  description: string;
  postings: BeancountPosting[];
  isClose?: boolean;
  account?: string;
}

/** Parse beancount file and return importable entries. */
export function importFromBeancount(
  beancountText: string,
  settings: PluginSettings,
  accounts: Account[],
  categories: Category[]
): ImportResult {
  const entries: LedgerEntry[] = [];
  const warnings: string[] = [];
  const accountsToCreate = new Set<string>();
  const categoriesToCreate = new Set<string>();
  const knownAccounts = new Set(accounts.map((a) => a.name));
  const knownCategories = new Set(categories.map((c) => c.name));

  const transactions = parseBeancountTransactions(beancountText);

  for (const txn of transactions) {
    try {
      const entry = beancountTxnToEntry(
        txn,
        settings,
        accounts,
        categories,
        knownAccounts,
        knownCategories,
        accountsToCreate,
        categoriesToCreate
      );
      if (entry) entries.push(entry);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      warnings.push(`Line ${txn.lineNum}: ${msg}`);
    }
  }

  return {
    entries,
    accountsToCreate: [...accountsToCreate],
    categoriesToCreate: [...categoriesToCreate],
    warnings,
  };
}

/** Parse beancount text into transaction objects. */
function parseBeancountTransactions(text: string): BeancountTxn[] {
  const lines = text.split("\n");
  const transactions: BeancountTxn[] = [];
  let current: BeancountTxn | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty, comments, and non-transaction directives
    if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("*")) {
      if (current) {
        transactions.push(current);
        current = null;
      }
      continue;
    }

    // Skip directives: open, close, commodity, option, plugin, balance, pad, note, event, price
    if (
      /^\d{4}-\d{2}-\d{2}\s+(open|commodity|option|balance|pad|note|event|price)\s/.test(trimmed)
    ) {
      if (current) {
        transactions.push(current);
        current = null;
      }
      continue;
    }

    // Close directive — we DO process these
    const closeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+close\s+(.+)/);
    if (closeMatch) {
      if (current) {
        transactions.push(current);
        current = null;
      }
      transactions.push({
        lineNum: i + 1,
        date: closeMatch[1],
        description: "",
        isClose: true,
        account: closeMatch[2].trim(),
        postings: [],
      });
      continue;
    }

    // Non-date directives (option, plugin, include)
    if (/^(option|plugin|include)\s/.test(trimmed)) {
      if (current) {
        transactions.push(current);
        current = null;
      }
      continue;
    }

    // Transaction header: date [txn|*|!] ["payee"] "narration"
    const txnMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+([*!txn])\s+(.*)/);
    if (txnMatch && !line.startsWith(" ") && !line.startsWith("\t")) {
      if (current) transactions.push(current);
      const narration = extractNarration(txnMatch[3]);
      current = {
        lineNum: i + 1,
        date: txnMatch[1],
        description: narration,
        postings: [],
      };
      continue;
    }

    // Posting line (starts with whitespace)
    if (current && (line.startsWith(" ") || line.startsWith("\t"))) {
      const posting = parseBeancountPosting(trimmed);
      if (posting) current.postings.push(posting);
      continue;
    }

    // Anything else
    if (current) {
      transactions.push(current);
      current = null;
    }
  }
  if (current) transactions.push(current);

  return transactions;
}

/**
 * Extract narration from beancount txn header.
 * Formats: "narration", "payee" "narration", just text
 */
function extractNarration(str: string): string {
  const twoQuoted = str.match(/"([^"]*)"\s+"([^"]*)"/);
  if (twoQuoted) return twoQuoted[2] || twoQuoted[1];
  const oneQuoted = str.match(/"([^"]*)"/);
  if (oneQuoted) return oneQuoted[1];
  return str.trim();
}

/**
 * Parse a beancount posting line.
 * Format: Account  amount COMMODITY {cost} @ price COMMODITY
 */
function parseBeancountPosting(line: string): BeancountPosting | null {
  // Remove inline comments
  const commentIdx = line.indexOf(";");
  const clean = commentIdx >= 0 ? line.slice(0, commentIdx).trim() : line.trim();
  if (!clean) return null;

  // Split on two+ spaces
  const parts = clean.split(/\s{2,}/);
  const account = parts[0];
  if (parts.length < 2) return { account, amount: null, commodity: null, cost: null, price: null };

  const rest = parts.slice(1).join(" ").trim();
  return { account, ...parseBeancountAmount(rest) };
}

interface BeancountAmount {
  amount: number | null;
  commodity: string | null;
  cost: number | null;
  price: number | null;
  priceCommodity: string | null;
}

interface SimpleAmt {
  amount: number | null;
  commodity: string | null;
}

/** Parse beancount amount: "67 AEROFUELZ {1063.65 RUB} @ 1100 RUB" */
function parseBeancountAmount(str: string): BeancountAmount {
  let cost: number | null = null;
  let price: number | null = null;
  let priceCommodity: string | null = null;

  // Extract {cost}
  const costMatch = str.match(/\{([^}]+)\}/);
  if (costMatch) {
    const cp = parseSimpleAmt(costMatch[1]);
    cost = cp.amount;
    str = str.replace(/\{[^}]+\}/, "").trim();
  }

  // Extract @ price
  const atMatch = str.match(/(.+?)\s+@\s+(.+)/);
  let mainPart = str;
  if (atMatch) {
    mainPart = atMatch[1].trim();
    const pp = parseSimpleAmt(atMatch[2]);
    price = pp.amount;
    priceCommodity = pp.commodity;
  }

  const main = parseSimpleAmt(mainPart);
  return { amount: main.amount, commodity: main.commodity, cost, price, priceCommodity };
}

function parseSimpleAmt(str: string): SimpleAmt {
  str = str.trim();
  // number COMMODITY
  const m1 = str.match(/^([-\d.,]+)\s+([A-Za-z][A-Za-z0-9-]*)/);
  if (m1) return { amount: parseFloat(m1[1].replace(/,/g, "")), commodity: m1[2] };
  // COMMODITY number
  const m2 = str.match(/^([A-Za-z][A-Za-z0-9-]*)\s+([-\d.,]+)/);
  if (m2) return { amount: parseFloat(m2[2].replace(/,/g, "")), commodity: m2[1] };
  // just number
  const num = parseFloat(str.replace(/,/g, ""));
  return { amount: Number.isFinite(num) ? num : null, commodity: null };
}

/** Convert parsed beancount transaction to JSONL entry. */
function beancountTxnToEntry(
  txn: BeancountTxn,
  settings: PluginSettings,
  accounts: Account[],
  categories: Category[],
  knownAccounts: Set<string>,
  knownCategories: Set<string>,
  accountsToCreate: Set<string>,
  categoriesToCreate: Set<string>
): LedgerEntry | null {
  // Close directive
  if (txn.isClose && txn.account) {
    const assetName = extractAssetName(txn.account);
    return { d: txn.date, type: "close", asset: assetName, amt: 0, note: "position closed" };
  }

  if (txn.postings.length < 2) return null;

  // Compute elided posting
  const postingsWithAmount = txn.postings.filter((p) => p.amount != null);
  const postingsWithoutAmount = txn.postings.filter((p) => p.amount == null);
  if (postingsWithoutAmount.length === 1 && postingsWithAmount.length > 0) {
    const sum = postingsWithAmount.reduce((s, p) => s + (p.amount || 0), 0);
    postingsWithoutAmount[0].amount = -sum;
  }

  // Classify by account prefix
  const expensePostings = txn.postings.filter((p) => /^Expenses?[:/]/i.test(p.account));
  const incomePostings = txn.postings.filter((p) => /^Income[:/]/i.test(p.account));
  const assetPostings = txn.postings.filter((p) => /^Assets?[:/]/i.test(p.account));
  const equityPostings = txn.postings.filter((p) => /^Equity[:/]/i.test(p.account));

  // Expense
  if (expensePostings.length > 0 && assetPostings.length > 0 && incomePostings.length === 0) {
    const exp = expensePostings[0];
    const asset = assetPostings[0];
    const catName = resolveFlat(exp.account, settings, accounts, categories);
    const fromName = resolveFlat(asset.account, settings, accounts, categories);
    trackNew(fromName, knownAccounts, accountsToCreate);
    trackNew(catName, knownCategories, categoriesToCreate);
    return {
      d: txn.date,
      type: "expense",
      cat: catName,
      amt: Math.abs(exp.amount || 0),
      from: fromName,
      note: txn.description || undefined,
    };
  }

  // Income / Dividend
  if (incomePostings.length > 0 && assetPostings.length > 0 && expensePostings.length === 0) {
    const isDividend =
      /dividend/i.test(incomePostings[0].account) || /dividend/i.test(txn.description);
    if (isDividend) {
      const assetPost = assetPostings[0];
      const toName = resolveFlat(assetPost.account, settings, accounts, categories);
      trackNew(toName, knownAccounts, accountsToCreate);
      const assetName = extractAssetFromDividend(incomePostings[0].account, txn.description);
      return {
        d: txn.date,
        type: "dividend",
        asset: assetName || undefined,
        amt: Math.abs(assetPost.amount || 0),
        to: toName,
        note: txn.description || undefined,
      };
    }

    const assetPost = assetPostings[0];
    const incPost = incomePostings[0];
    const catName = resolveFlat(incPost.account, settings, accounts, categories);
    const toName = resolveFlat(assetPost.account, settings, accounts, categories);
    trackNew(toName, knownAccounts, accountsToCreate);
    trackNew(catName, knownCategories, categoriesToCreate);
    return {
      d: txn.date,
      type: "income",
      cat: catName,
      amt: Math.abs(assetPost.amount || 0),
      to: toName,
      note: txn.description || undefined,
    };
  }

  // Transfer or Buy/Sell
  if (assetPostings.length >= 2 && expensePostings.length === 0 && incomePostings.length === 0) {
    // Check for cost basis (buy) or @ price (sell)
    const withCost = txn.postings.find((p) => p.cost != null && /^Assets?[:/]/i.test(p.account));
    const withPrice = txn.postings.find((p) => p.price != null && /^Assets?[:/]/i.test(p.account));

    if (withCost && (withCost.amount ?? 0) > 0) {
      // Buy
      const wcAmount = withCost.amount ?? 0;
      const wcCost = withCost.cost ?? 0;
      const fromPost = assetPostings.find((p) => p !== withCost && (p.amount || 0) < 0);
      const fromName = fromPost
        ? resolveFlat(fromPost.account, settings, accounts, categories)
        : "";
      trackNew(fromName, knownAccounts, accountsToCreate);
      const assetName = extractAssetName(withCost.account);
      const fee = expensePostings.length > 0 ? Math.abs(expensePostings[0].amount || 0) : 0;
      return {
        d: txn.date,
        type: "buy",
        asset: assetName,
        qty: Math.abs(wcAmount),
        price: wcCost,
        amt: Math.abs(wcAmount) * wcCost,
        from: fromName || undefined,
        fee: fee || undefined,
        note: txn.description || undefined,
      };
    }

    if (withPrice && (withPrice.amount || 0) < 0) {
      // Sell
      const wpAmount = withPrice.amount ?? 0;
      const wpPrice = withPrice.price ?? 0;
      const toPost = assetPostings.find((p) => p !== withPrice && (p.amount || 0) > 0);
      const toName = toPost ? resolveFlat(toPost.account, settings, accounts, categories) : "";
      trackNew(toName, knownAccounts, accountsToCreate);
      const assetName = extractAssetName(withPrice.account);
      return {
        d: txn.date,
        type: "sell",
        asset: assetName,
        qty: Math.abs(wpAmount),
        price: wpPrice,
        amt: Math.abs(wpAmount) * wpPrice,
        to: toName || undefined,
        note: txn.description || undefined,
      };
    }

    // Simple transfer
    const credit = assetPostings.find((p) => (p.amount || 0) > 0);
    const debit = assetPostings.find((p) => (p.amount || 0) < 0);
    if (credit && debit) {
      const fromName = resolveFlat(debit.account, settings, accounts, categories);
      const toName = resolveFlat(credit.account, settings, accounts, categories);
      trackNew(fromName, knownAccounts, accountsToCreate);
      trackNew(toName, knownAccounts, accountsToCreate);
      return {
        d: txn.date,
        type: "transfer",
        amt: Math.abs(credit.amount ?? 0),
        from: fromName,
        to: toName,
        note: txn.description || undefined,
      };
    }
  }

  // Adjust (equity)
  if (equityPostings.length > 0 && assetPostings.length > 0) {
    const assetPost = assetPostings.find((p) => (p.amount || 0) > 0);
    if (assetPost) {
      const assetName = extractAssetName(assetPost.account);
      return {
        d: txn.date,
        type: "adjust",
        asset: assetName || undefined,
        amt: Math.abs(assetPost.amount ?? 0),
        note: txn.description || undefined,
      };
    }
  }

  return null;
}

function trackNew(name: string, knownSet: Set<string>, createSet: Set<string>): void {
  if (name && !knownSet.has(name)) createSet.add(name);
}

function extractAssetName(accountPath: string): string {
  const segments = accountPath.split(":");
  return segments[segments.length - 1].replace(/-/g, " ");
}

function extractAssetFromDividend(accountPath: string, description: string): string | null {
  const segments = accountPath.split(":");
  if (segments.length >= 3) return segments[segments.length - 1].replace(/-/g, " ");
  const match = description?.match(/dividend\s+(.+)/i);
  return match ? match[1].trim() : null;
}
