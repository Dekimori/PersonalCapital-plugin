// ───────────────────────────────────────────────────────────────────
// ACCOUNT BALANCES — derive balances from ledger entries
// ───────────────────────────────────────────────────────────────────

import { toNum } from "../../core/utils";
import type { Account, LedgerEntry, PluginSettings } from "../../core/types";

export function getAccountBalance(account: Account, ledgerEntries: LedgerEntry[]): number {
  let balance = account.initialBalance;
  for (const e of ledgerEntries) {
    if (e.to === account.name) balance += toNum(e.amt);
    if (e.from === account.name) balance -= toNum(e.amt);
  }
  return balance;
}

export function getAccountsWithBalances<A extends Account>(
  accounts: A[],
  ledgerEntries: LedgerEntry[]
): Array<A & { balance: number }> {
  return accounts.map((a) => ({ ...a, balance: getAccountBalance(a, ledgerEntries) }));
}

export function getAccountsTotal(accounts: Account[], ledgerEntries: LedgerEntry[]): number {
  return accounts.reduce((s, a) => s + getAccountBalance(a, ledgerEntries), 0);
}

export function getLiquidAccountsTotal(accounts: Account[], ledgerEntries: LedgerEntry[]): number {
  return accounts
    .filter((a) => a.liquid && !a.locked)
    .reduce((s, a) => s + getAccountBalance(a, ledgerEntries), 0);
}

// ───────────────────────────────────────────────────────────────────
// LIQUID POOLS HELPERS (legacy fallback + new account-based)
// ───────────────────────────────────────────────────────────────────

export function getLiquidAvailableLegacy(settings: PluginSettings): number {
  let sum = 0;
  if (settings.liquidBankIsLiquid) sum += settings.liquidBank ?? 0;
  if (settings.liquidBrokerCashIsLiquid) sum += settings.liquidBrokerCash ?? 0;
  if (settings.liquidCashIsLiquid) sum += settings.liquidCash ?? 0;
  if (settings.liquidBusinessIsLiquid) sum += settings.liquidBusiness ?? 0;
  return sum;
}

export function getLiquidTotalLegacy(settings: PluginSettings): number {
  return (
    (settings.liquidBank ?? 0) +
    (settings.liquidBrokerCash ?? 0) +
    (settings.liquidCash ?? 0) +
    (settings.liquidBusiness ?? 0)
  );
}

// Wrappers used everywhere — check if accounts exist, else legacy
export function getLiquidAvailable(
  settings: PluginSettings,
  accounts?: Account[] | null,
  ledgerEntries?: LedgerEntry[] | null
): number {
  if (accounts && accounts.length > 0) return getLiquidAccountsTotal(accounts, ledgerEntries || []);
  return getLiquidAvailableLegacy(settings);
}

export function getLiquidTotal(
  settings: PluginSettings,
  accounts?: Account[] | null,
  ledgerEntries?: LedgerEntry[] | null
): number {
  if (accounts && accounts.length > 0) return getAccountsTotal(accounts, ledgerEntries || []);
  return getLiquidTotalLegacy(settings);
}
