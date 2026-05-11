// ───────────────────────────────────────────────────────────────────
// IMPORT FROM HLEDGER — parse hledger journal → JSONL entries
// ───────────────────────────────────────────────────────────────────

import { resolveFlat } from "./account-map";
import type { Account, Category, LedgerEntry, PluginSettings } from "../core/types";

interface ParsedPosting {
  account: string;
  amount: number | null;
  commodity: string | null;
  price: number | null;
  priceCommodity: string | null;
}

interface ParsedTxn {
  lineNum: number;
  date: string;
  description: string;
  postings: ParsedPosting[];
}

export interface ImportResult {
  entries: LedgerEntry[];
  accountsToCreate: string[];
  categoriesToCreate: string[];
  warnings: string[];
}

/** Parse hledger journal text and return importable entries. */
export function importFromHledger(
  journalText: string,
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

  const transactions = parseTransactions(journalText);

  for (const txn of transactions) {
    try {
      const entry = transactionToEntry(
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

/** Parse raw journal text into transaction objects. */
function parseTransactions(text: string): ParsedTxn[] {
  const lines = text.split("\n");
  const transactions: ParsedTxn[] = [];
  let current: ParsedTxn | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines, comments, directives
    if (!trimmed || trimmed.startsWith(";") || trimmed.startsWith("#")) {
      if (current) {
        transactions.push(current);
        current = null;
      }
      continue;
    }

    // Directive lines (account, commodity, P, etc.) — skip
    if (/^(account|commodity|P|alias|include|tag)\s/.test(trimmed)) {
      if (current) {
        transactions.push(current);
        current = null;
      }
      continue;
    }

    // Transaction header: date [=date2] [status] description
    const headerMatch = trimmed.match(/^(\d{4}[-/]\d{2}[-/]\d{2})\s+(.*)/);
    if (headerMatch && !line.startsWith(" ") && !line.startsWith("\t")) {
      if (current) transactions.push(current);
      current = {
        lineNum: i + 1,
        date: headerMatch[1].replace(/\//g, "-"),
        description: headerMatch[2].replace(/^[*!]\s*/, "").trim(),
        postings: [],
      };
      continue;
    }

    // Posting line (starts with whitespace)
    if (current && (line.startsWith(" ") || line.startsWith("\t"))) {
      const posting = parsePosting(trimmed);
      if (posting) current.postings.push(posting);
      continue;
    }

    // Anything else: end current transaction
    if (current) {
      transactions.push(current);
      current = null;
    }
  }
  if (current) transactions.push(current);

  return transactions;
}

/**
 * Parse a single posting line.
 * Format: account  [amount] [commodity] [@ price commodity]
 */
function parsePosting(line: string): ParsedPosting | null {
  // Remove inline comments
  const commentIdx = line.indexOf(";");
  const clean = commentIdx >= 0 ? line.slice(0, commentIdx).trim() : line.trim();
  if (!clean) return null;

  // Split on two or more spaces — first part is account, rest is amount
  const parts = clean.split(/\s{2,}/);
  const account = parts[0];
  let amount: number | null = null;
  let commodity: string | null = null;
  let price: number | null = null;
  let priceCommodity: string | null = null;

  if (parts.length > 1) {
    const amtStr = parts.slice(1).join(" ").trim();
    const parsed = parseAmount(amtStr);
    amount = parsed.amount;
    commodity = parsed.commodity;
    price = parsed.price;
    priceCommodity = parsed.priceCommodity;
  }

  return { account, amount, commodity, price, priceCommodity };
}

interface ParsedAmount {
  amount: number | null;
  commodity: string | null;
  price: number | null;
  priceCommodity: string | null;
}

interface SimpleAmount {
  amount: number;
  commodity: string | null;
}

/** Parse amount string: "100 RUB", "-3 \"TICKER\" @ 3217 RUB", etc. */
function parseAmount(str: string): ParsedAmount {
  let price: number | null = null;
  let priceCommodity: string | null = null;

  // Check for @ price
  const atMatch = str.match(/(.+?)\s+@\s+(.+)/);
  let mainPart = str;
  if (atMatch) {
    mainPart = atMatch[1].trim();
    const pricePart = atMatch[2].trim();
    const pp = parseSimpleAmount(pricePart);
    price = pp.amount;
    priceCommodity = pp.commodity;
  }

  const main = parseSimpleAmount(mainPart);
  return { amount: main.amount, commodity: main.commodity, price, priceCommodity };
}

function parseSimpleAmount(str: string): SimpleAmount {
  // Remove quoted commodity names: 67 "TICKER"
  const quotedMatch = str.match(/^([-\d.,]+)\s+"[^"]+"/);
  if (quotedMatch) {
    return { amount: parseFloat(quotedMatch[1].replace(/,/g, "")), commodity: null };
  }

  // Commodity after number: 100 RUB or -100 RUB
  const afterMatch = str.match(/^([-\d.,]+)\s+([A-Za-zА-Яа-яё₽$€£¥]+.*)/);
  if (afterMatch) {
    return { amount: parseFloat(afterMatch[1].replace(/,/g, "")), commodity: afterMatch[2].trim() };
  }

  // Commodity before number: RUB 100
  const beforeMatch = str.match(/^([A-Za-zА-Яа-яё₽$€£¥]+)\s*([-\d.,]+)/);
  if (beforeMatch) {
    return {
      amount: parseFloat(beforeMatch[2].replace(/,/g, "")),
      commodity: beforeMatch[1].trim(),
    };
  }

  // Just a number
  const num = parseFloat(str.replace(/,/g, ""));
  return { amount: Number.isFinite(num) ? num : 0, commodity: null };
}

/** Convert parsed transaction to a JSONL entry. */
function transactionToEntry(
  txn: ParsedTxn,
  settings: PluginSettings,
  accounts: Account[],
  categories: Category[],
  knownAccounts: Set<string>,
  knownCategories: Set<string>,
  accountsToCreate: Set<string>,
  categoriesToCreate: Set<string>
): LedgerEntry | null {
  if (txn.postings.length < 2) return null;

  // Compute elided posting amount
  const postingsWithAmount = txn.postings.filter((p) => p.amount != null);
  const postingsWithoutAmount = txn.postings.filter((p) => p.amount == null);
  if (postingsWithoutAmount.length === 1 && postingsWithAmount.length > 0) {
    const sum = postingsWithAmount.reduce((s, p) => s + (p.amount as number), 0);
    postingsWithoutAmount[0].amount = -sum;
  }

  // Classify by account path prefixes
  const expensePostings = txn.postings.filter((p) => /^expenses?[:/]/i.test(p.account));
  const incomePostings = txn.postings.filter((p) => /^income[:/]/i.test(p.account));
  const assetPostings = txn.postings.filter((p) => /^assets?[:/]/i.test(p.account));
  const equityPostings = txn.postings.filter((p) => /^equity[:/]/i.test(p.account));

  // Expense: assets → expenses
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

  // Income: income → assets
  if (incomePostings.length > 0 && assetPostings.length > 0 && expensePostings.length === 0) {
    // Check if it's a dividend
    const isDividend =
      /dividend/i.test(incomePostings[0].account) || /dividend/i.test(txn.description);
    if (isDividend) {
      const assetPost = assetPostings[0];
      const toName = resolveFlat(assetPost.account, settings, accounts, categories);
      trackNew(toName, knownAccounts, accountsToCreate);
      // Try to extract asset name from account or description
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

  // Transfer: assets → assets (two asset postings, no expense/income)
  if (assetPostings.length >= 2 && expensePostings.length === 0 && incomePostings.length === 0) {
    // Check for buy/sell (one posting has @ price or quoted commodity)
    const withPrice = txn.postings.find((p) => p.price != null);
    if (withPrice) {
      const wpAmount = withPrice.amount ?? 0;
      const wpPrice = withPrice.price ?? 0;
      // Buy or sell
      if (wpAmount > 0) {
        // Buy: positive amount on asset with price
        const fromPost = assetPostings.find((p) => p !== withPrice && (p.amount ?? 0) < 0);
        const fromName = fromPost
          ? resolveFlat(fromPost.account, settings, accounts, categories)
          : "";
        trackNew(fromName, knownAccounts, accountsToCreate);
        const assetName = extractAssetName(withPrice.account);
        const fee = expensePostings.length > 0 ? Math.abs(expensePostings[0].amount || 0) : 0;
        return {
          d: txn.date,
          type: "buy",
          asset: assetName,
          qty: Math.abs(wpAmount),
          price: wpPrice,
          amt: Math.abs(wpAmount) * wpPrice,
          from: fromName || undefined,
          fee: fee || undefined,
          note: txn.description || undefined,
        };
      } else {
        // Sell: negative amount on asset with price
        const toPost = assetPostings.find((p) => p !== withPrice && (p.amount ?? 0) > 0);
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
    }

    // Simple transfer
    const credit = assetPostings.find((p) => (p.amount ?? 0) > 0);
    const debit = assetPostings.find((p) => (p.amount ?? 0) < 0);
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

  // Adjust: equity → assets
  if (equityPostings.length > 0 && assetPostings.length > 0) {
    const assetPost = assetPostings.find((p) => (p.amount ?? 0) > 0);
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

  // Fallback: couldn't classify
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
  // income:dividends:aapl → aapl
  const segments = accountPath.split(":");
  if (segments.length >= 3) return segments[segments.length - 1].replace(/-/g, " ");
  // Try from description: "Dividend AAPL"
  const match = description?.match(/dividend\s+(.+)/i);
  return match ? match[1].trim() : null;
}
