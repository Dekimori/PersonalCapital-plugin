import type { AssetType, MonthKey, PluginSettings } from "./types";

export const MONTH_KEYS: readonly MonthKey[] = [
  "m01",
  "m02",
  "m03",
  "m04",
  "m05",
  "m06",
  "m07",
  "m08",
  "m09",
  "m10",
  "m11",
  "m12",
];

export const MONTH_NAMES: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_SHORT: readonly string[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const ASSET_TYPES: readonly AssetType[] = [
  "shares",
  "bond",
  "deposit",
  "material",
  "crypto",
];

export const TYPE_ORDER: Record<string, number> = { Income: 0, Needs: 1, Wants: 2 };

export const DEFAULT_SETTINGS: PluginSettings = {
  categoriesFolder: "finance/Data/categories",
  assetsFolder: "finance/Data/assets",
  archiveFolder: "finance/Data/archive",
  accountsFolder: "finance/Data/accounts",
  ledgerFolder: "finance/Data",
  capitalHistoryPath: "finance/Data/capital_history.md",
  strategyPath: "finance/strategy.md",
  dashboardPath: "finance/Dashboard.md",
  ledgerNotePath: "finance/Ledger.md",
  wantsQueuePath: "finance/Data/wants_queue.md",

  ledgerViewMode: "classic",

  homeCurrency: "RUB",
  homeCurrencySymbol: "₽",

  // FX rates — two-layer model: manual overrides take precedence over auto-fetched.
  // Kept as { CURRENCY: rateToHome }. Missing key = no silent 1.0 fallback.
  fxRatesManual: {},
  fxRatesAuto: { RUB: 1, USD: 90, EUR: 98, CNY: 12.5 },
  fxRatesUpdated: null,
  fxAutoFetch: true,
  fxSourceLabel: "",

  // Reconciliation — how many days until an account is flagged as stale.
  reconcileStaleDays: 30,

  savesTargetPct: 30,
  comfortBudget: 100000,
  needsBudget: 0,
  savesMonthly: 0,

  liquidBank: 0,
  liquidBrokerCash: 0,
  liquidCash: 0,
  liquidBusiness: 0,
  liquidBankIsLiquid: true,
  liquidBrokerCashIsLiquid: true,
  liquidCashIsLiquid: true,
  liquidBusinessIsLiquid: false,

  onboardingDone: false,
  migrationDone: false,

  personalContext: "",

  strategyEnabled: false,
  targetCore: 0,
  targetFlash: 0,
  targetReserve: 0,

  // Import/Export — account mapping overrides (flat name → hierarchical path)
  accountMap: {},
};
