import type { TFile } from "obsidian";

export type LedgerOpType =
  | "buy"
  | "sell"
  | "dividend"
  | "close"
  | "expense"
  | "income"
  | "transfer"
  | "adjust";

export interface LedgerEntry {
  id?: string;
  d: string;
  type: LedgerOpType;
  amt: number;
  asset?: string;
  asset_id?: string;
  from?: string;
  to?: string;
  qty?: number;
  price?: number;
  fee?: number;
  cat?: string;
  note?: string;
  migrated?: boolean;
}

export type AccountType = "bank" | "broker" | "cash";

export interface Account {
  name: string;
  type: AccountType;
  currency: string;
  liquid: boolean;
  locked: boolean;
  initialBalance: number;
  lastReconciled: string | null;
  file: TFile;
}

export type CategoryType = "Income" | "Needs" | "Wants";

export interface Category {
  name: string;
  type: CategoryType;
}

export type AssetType = "shares" | "bond" | "deposit" | "material" | "crypto";

export interface AssetStats {
  currentQty: number;
  avgCost: number;
  totalInvested: number;
  currentPrice: number | null;
  currentValue: number;
  passiveIncomeTot: number;
  initialDate: string | null;
  lastUpdated: string | null;
  lastDivDate: string | null;
  initialPrice: number | null;
  plAmount: number;
  plPct: number;
}

export interface FxRates {
  [currency: string]: number;
}

export interface PluginSettings {
  categoriesFolder: string;
  assetsFolder: string;
  archiveFolder: string;
  accountsFolder: string;
  ledgerFolder: string;
  capitalHistoryPath: string;
  strategyPath: string;
  dashboardPath: string;
  ledgerNotePath: string;
  wantsQueuePath: string;

  ledgerViewMode: "classic" | string;

  homeCurrency: string;
  homeCurrencySymbol: string;

  fxRatesManual: FxRates;
  fxRatesAuto: FxRates;
  fxRatesUpdated: string | null;
  fxAutoFetch: boolean;
  fxSourceLabel: string;

  reconcileStaleDays: number;

  savesTargetPct: number;
  comfortBudget: number;
  needsBudget: number;
  savesMonthly: number;

  liquidBank: number;
  liquidBrokerCash: number;
  liquidCash: number;
  liquidBusiness: number;
  liquidBankIsLiquid: boolean;
  liquidBrokerCashIsLiquid: boolean;
  liquidCashIsLiquid: boolean;
  liquidBusinessIsLiquid: boolean;

  onboardingDone: boolean;
  migrationDone: boolean;

  personalContext: string;

  strategyEnabled: boolean;
  targetCore: number;
  targetFlash: number;
  targetReserve: number;

  accountMap: Record<string, string>;
}

export type MonthKey =
  | "m01"
  | "m02"
  | "m03"
  | "m04"
  | "m05"
  | "m06"
  | "m07"
  | "m08"
  | "m09"
  | "m10"
  | "m11"
  | "m12";
