var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/constants.js
var require_constants = __commonJS({
  "src/constants.js"(exports2, module2) {
    var MONTH_KEYS2 = ["m01", "m02", "m03", "m04", "m05", "m06", "m07", "m08", "m09", "m10", "m11", "m12"];
    var MONTH_NAMES2 = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var ASSET_TYPES = ["shares", "bond", "deposit", "material", "crypto"];
    var TYPE_ORDER = { "Income": 0, "Needs": 1, "Wants": 2 };
    var DEFAULT_SETTINGS2 = {
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
      homeCurrencySymbol: "\u20BD",
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
      comfortBudget: 1e5,
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
      targetReserve: 0
    };
    module2.exports = {
      MONTH_KEYS: MONTH_KEYS2,
      MONTH_NAMES: MONTH_NAMES2,
      MONTH_SHORT,
      ASSET_TYPES,
      TYPE_ORDER,
      DEFAULT_SETTINGS: DEFAULT_SETTINGS2
    };
  }
});

// src/utils.js
var require_utils = __commonJS({
  "src/utils.js"(exports2, module2) {
    var { Notice } = require("obsidian");
    var { MONTH_KEYS: MONTH_KEYS2 } = require_constants();
    function showNotice2(msg, duration = 2500) {
      const n = new Notice(msg);
      setTimeout(() => {
        try {
          n.hide();
        } catch (_) {
        }
      }, duration);
    }
    function toNum(x) {
      if (typeof x === "number" && !Number.isNaN(x)) return x;
      if (typeof x === "string" && x.trim() !== "" && x.trim() !== "\u2014") {
        const n = parseFloat(x.replace(/[, ]/g, ""));
        if (!Number.isNaN(n)) return n;
      }
      return 0;
    }
    function fmt(n, decimals = 0) {
      if (n == null || Number.isNaN(n)) return "\u2014";
      return new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(n);
    }
    function fmtSigned(n, decimals = 0) {
      if (n == null || Number.isNaN(n)) return "\u2014";
      const s = fmt(Math.abs(n), decimals);
      return n >= 0 ? "+" + s : "\u2212" + s;
    }
    function getCurrentMonthIdx() {
      return (/* @__PURE__ */ new Date()).getMonth();
    }
    function getCurrentMonthKey() {
      return MONTH_KEYS2[getCurrentMonthIdx()];
    }
    function getCurrentYear2() {
      return (/* @__PURE__ */ new Date()).getFullYear();
    }
    function makeInteractive(el, role = "button") {
      el.setAttribute("role", role);
      el.setAttribute("tabindex", "0");
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          el.click();
        }
      });
    }
    function killWheelChange(inputEl) {
      if (!inputEl) return inputEl;
      inputEl.addEventListener("wheel", (e) => {
        if (document.activeElement === inputEl) e.preventDefault();
      }, { passive: false });
      return inputEl;
    }
    module2.exports = {
      showNotice: showNotice2,
      toNum,
      fmt,
      fmtSigned,
      getCurrentMonthIdx,
      getCurrentMonthKey,
      getCurrentYear: getCurrentYear2,
      makeInteractive,
      killWheelChange
    };
  }
});

// src/ledger/write-queue.js
var require_write_queue = __commonJS({
  "src/ledger/write-queue.js"(exports2, module2) {
    var _queues = /* @__PURE__ */ new Map();
    function enqueueWrite(path, fn) {
      const prev = _queues.get(path) || Promise.resolve();
      const next = prev.then(fn, fn);
      _queues.set(path, next);
      return next;
    }
    module2.exports = { enqueueWrite };
  }
});

// src/ledger/cache.js
var require_cache = __commonJS({
  "src/ledger/cache.js"(exports2, module2) {
    var TTL_MS = 5e3;
    var _cache = /* @__PURE__ */ new Map();
    function getCached(path) {
      const entry = _cache.get(path);
      if (!entry) return null;
      if (Date.now() - entry.ts > TTL_MS) {
        _cache.delete(path);
        return null;
      }
      return entry.data;
    }
    function setCache(path, data) {
      _cache.set(path, { data, ts: Date.now() });
    }
    function invalidate(path) {
      if (path) {
        _cache.delete(path);
      } else {
        _cache.clear();
      }
    }
    module2.exports = { getCached, setCache, invalidate };
  }
});

// src/ledger/io.js
var require_io = __commonJS({
  "src/ledger/io.js"(exports2, module2) {
    var { enqueueWrite } = require_write_queue();
    var { getCached, setCache, invalidate } = require_cache();
    function getLedgerPath(settings, year) {
      year = year || (/* @__PURE__ */ new Date()).getFullYear();
      return `${settings.ledgerFolder || "finance/Data"}/ledger-${year}.jsonl`;
    }
    async function readLedger(app, settings, year) {
      const path = getLedgerPath(settings, year);
      const cached = getCached(path);
      if (cached) return cached;
      const file = app.vault.getAbstractFileByPath(path);
      if (!file) return [];
      const content = await app.vault.read(file);
      const entries = content.split("\n").filter((l) => l.trim()).map((l) => {
        try {
          return JSON.parse(l);
        } catch (_) {
          return null;
        }
      }).filter(Boolean);
      setCache(path, entries);
      return entries;
    }
    async function readLedgerMultiYear2(app, settings, years) {
      const all = [];
      for (const y of years) {
        const entries = await readLedger(app, settings, y);
        all.push(...entries);
      }
      return all;
    }
    async function readAllLedger(app, settings) {
      const folder = settings.ledgerFolder || "finance/Data";
      const all = [];
      for (const f of app.vault.getFiles()) {
        if (f.path.startsWith(folder + "/") && f.name.startsWith("ledger-") && f.name.endsWith(".jsonl")) {
          const content = await app.vault.read(f);
          const entries = content.split("\n").filter((l) => l.trim()).map((l) => {
            try {
              return JSON.parse(l);
            } catch (_) {
              return null;
            }
          }).filter(Boolean);
          all.push(...entries);
        }
      }
      return all;
    }
    async function writeLedgerEntry(app, settings, entry) {
      entry.id = entry.id || crypto.randomUUID();
      const year = entry.d ? parseInt(entry.d.slice(0, 4)) : (/* @__PURE__ */ new Date()).getFullYear();
      const path = getLedgerPath(settings, year);
      return enqueueWrite(path, async () => {
        invalidate(path);
        const line = JSON.stringify(entry);
        const file = app.vault.getAbstractFileByPath(path);
        if (file) {
          const content = await app.vault.read(file);
          await app.vault.modify(file, content.trimEnd() + "\n" + line + "\n");
        } else {
          const dir = path.split("/").slice(0, -1).join("/");
          if (dir && !app.vault.getAbstractFileByPath(dir)) {
            await app.vault.createFolder(dir).catch(() => {
            });
          }
          await app.vault.create(path, line + "\n");
        }
      });
    }
    async function deleteLedgerEntry(app, settings, entry) {
      if (!entry || !entry.d) return false;
      const year = parseInt(entry.d.slice(0, 4));
      const path = getLedgerPath(settings, year);
      return enqueueWrite(path, async () => {
        invalidate(path);
        const file = app.vault.getAbstractFileByPath(path);
        if (!file) return false;
        const content = await app.vault.read(file);
        const lines = content.split("\n");
        const strKeys = ["d", "type", "cat", "asset", "from", "to", "note"];
        const numKeys = ["amt", "qty", "price"];
        let removed = false;
        const out = [];
        for (const line of lines) {
          if (!line.trim() || removed) {
            out.push(line);
            continue;
          }
          let parsed;
          try {
            parsed = JSON.parse(line);
          } catch (_) {
            out.push(line);
            continue;
          }
          if (entry.id && parsed.id && entry.id === parsed.id) {
            removed = true;
            continue;
          }
          if (!entry.id || !parsed.id) {
            let match = true;
            for (const k of strKeys) {
              const a = parsed[k] == null ? void 0 : parsed[k];
              const b = entry[k] == null ? void 0 : entry[k];
              if (a !== b) {
                match = false;
                break;
              }
            }
            if (match) {
              for (const k of numKeys) {
                const a = parsed[k] == null ? void 0 : parsed[k];
                const b = entry[k] == null ? void 0 : entry[k];
                if (a === void 0 && b === void 0) continue;
                if (a === void 0 || b === void 0) {
                  match = false;
                  break;
                }
                if (Math.abs(a - b) >= 5e-3) {
                  match = false;
                  break;
                }
              }
            }
            if (match) {
              removed = true;
              continue;
            }
          }
          out.push(line);
        }
        if (!removed) return false;
        await app.vault.modify(file, out.join("\n").replace(/\n+$/, "\n"));
        return true;
      });
    }
    async function writeLedgerEntries(app, settings, entries) {
      for (const e of entries) {
        e.id = e.id || crypto.randomUUID();
      }
      const byYear = {};
      for (const e of entries) {
        const year = e.d ? parseInt(e.d.slice(0, 4)) : (/* @__PURE__ */ new Date()).getFullYear();
        (byYear[year] = byYear[year] || []).push(e);
      }
      for (const [year, yearEntries] of Object.entries(byYear)) {
        const path = getLedgerPath(settings, parseInt(year));
        await enqueueWrite(path, async () => {
          invalidate(path);
          const lines = yearEntries.map((e) => JSON.stringify(e)).join("\n") + "\n";
          const file = app.vault.getAbstractFileByPath(path);
          if (file) {
            const content = await app.vault.read(file);
            await app.vault.modify(file, content.trimEnd() + "\n" + lines);
          } else {
            const dir = path.split("/").slice(0, -1).join("/");
            if (dir && !app.vault.getAbstractFileByPath(dir)) {
              await app.vault.createFolder(dir).catch(() => {
              });
            }
            await app.vault.create(path, lines);
          }
        });
      }
    }
    module2.exports = {
      getLedgerPath,
      readLedger,
      readLedgerMultiYear: readLedgerMultiYear2,
      readAllLedger,
      writeLedgerEntry,
      deleteLedgerEntry,
      writeLedgerEntries
    };
  }
});

// src/accounts/io.js
var require_io2 = __commonJS({
  "src/accounts/io.js"(exports2, module2) {
    var { toNum } = require_utils();
    async function readAccounts2(app, settings) {
      const folder = (settings.accountsFolder || "finance/Data/accounts").toLowerCase().replace(/\/$/, "");
      const files = app.vault.getMarkdownFiles().filter(
        (f) => f.path.toLowerCase().startsWith(folder + "/")
      );
      const accounts = [];
      for (const file of files) {
        const cache = app.metadataCache.getFileCache(file);
        const fm = cache?.frontmatter ?? {};
        accounts.push({
          name: fm.name || file.basename,
          type: fm.type || "bank",
          bank: fm.bank || "",
          currency: fm.currency || settings.homeCurrency || "RUB",
          liquid: fm.liquid !== false,
          locked: fm.locked === true,
          initialBalance: toNum(fm.initial_balance),
          lastReconciled: fm.last_reconciled || null,
          file
        });
      }
      return accounts;
    }
    async function updateAccountFields(app, file, fields) {
      if (!file) return;
      if (typeof app.fileManager?.processFrontMatter === "function") {
        await app.fileManager.processFrontMatter(file, (fm) => {
          for (const [k, v] of Object.entries(fields)) {
            if (v === null || v === void 0) delete fm[k];
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
      let body = raw.slice(end);
      for (const [k, v] of Object.entries(fields)) {
        const line = v == null ? "" : `${k}: ${typeof v === "string" ? `"${v}"` : v}`;
        const re = new RegExp(`^${k}:.*$`, "m");
        if (re.test(head)) {
          head = v == null ? head.replace(re, "").replace(/\n\n+/g, "\n") : head.replace(re, line);
        } else if (v != null) {
          head = head.replace(/\n?$/, "\n") + line;
        }
      }
      await app.vault.modify(file, `---
${head.replace(/\n+$/, "")}
${body}`);
    }
    async function updateLastReconciled(app, file, dateStr) {
      await updateAccountFields(app, file, { last_reconciled: dateStr });
    }
    module2.exports = { readAccounts: readAccounts2, updateAccountFields, updateLastReconciled };
  }
});

// src/assets/fx.js
var require_fx = __commonJS({
  "src/assets/fx.js"(exports2, module2) {
    var { requestUrl } = require("obsidian");
    function resolveFxRate(currency, settings) {
      const c = String(currency || "").toUpperCase();
      const home = String(settings.homeCurrency || "RUB").toUpperCase();
      if (!c) return null;
      if (c === home) return 1;
      const manual = settings.fxRatesManual?.[c];
      if (manual != null && manual > 0) return manual;
      const auto = settings.fxRatesAuto?.[c];
      if (auto != null && auto > 0) return auto;
      return null;
    }
    async function fetchCbrRates() {
      const url = "https://www.cbr.ru/scripts/XML_daily.asp";
      const resp = await requestUrl({ url, method: "GET" });
      let text;
      if (resp.arrayBuffer) {
        try {
          text = new TextDecoder("windows-1251").decode(resp.arrayBuffer);
        } catch (_) {
          text = resp.text;
        }
      } else {
        text = resp.text;
      }
      const doc = new DOMParser().parseFromString(text, "text/xml");
      const rates = { RUB: 1 };
      const valutes = doc.getElementsByTagName("Valute");
      for (let i = 0; i < valutes.length; i++) {
        const v = valutes[i];
        const code = v.getElementsByTagName("CharCode")[0]?.textContent?.trim();
        const vRate = v.getElementsByTagName("VunitRate")[0]?.textContent?.trim();
        if (!code || !vRate) continue;
        const num = parseFloat(vRate.replace(",", "."));
        if (!Number.isFinite(num) || num <= 0) continue;
        rates[code.toUpperCase()] = num;
      }
      const root = doc.getElementsByTagName("ValCurs")[0];
      const pubDate = root?.getAttribute("Date") || null;
      return { rates, source: "CBR", pubDate };
    }
    async function fetchYahooRate(pairSymbol) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(pairSymbol)}`;
      const resp = await requestUrl({ url, method: "GET" });
      const price = resp.json?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (!Number.isFinite(price) || price <= 0) return null;
      return price;
    }
    async function fetchYahooRates(homeCurrency, wantedCurrencies) {
      const home = homeCurrency.toUpperCase();
      const rates = { [home]: 1 };
      const pairs = wantedCurrencies.map((c) => c.toUpperCase()).filter((c) => c && c !== home);
      await Promise.all(pairs.map(async (c) => {
        try {
          const p = await fetchYahooRate(`${c}${home}=X`);
          if (p != null) {
            rates[c] = p;
            return;
          }
        } catch (e) {
          console.warn(`[PC] Yahoo FX ${c}${home}=X failed:`, e.message || e);
        }
        try {
          const p = await fetchYahooRate(`${home}${c}=X`);
          if (p != null && p > 0) {
            rates[c] = 1 / p;
            return;
          }
        } catch (e) {
          console.warn(`[PC] Yahoo FX ${home}${c}=X failed:`, e.message || e);
        }
      }));
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      return { rates, source: "Yahoo", pubDate: today };
    }
    async function updateFxRates(settings) {
      if (!settings.fxAutoFetch) {
        return { updated: false, reason: "auto-fetch disabled" };
      }
      const home = String(settings.homeCurrency || "RUB").toUpperCase();
      try {
        let result;
        if (home === "RUB") {
          result = await fetchCbrRates();
        } else {
          const currencies = Array.from(/* @__PURE__ */ new Set([
            ...Object.keys(settings.fxRatesAuto || {}),
            ...Object.keys(settings.fxRatesManual || {}),
            "USD",
            "EUR",
            "RUB",
            "CNY",
            "GBP",
            "JPY"
          ])).map((c) => c.toUpperCase());
          result = await fetchYahooRates(home, currencies);
        }
        if (!result.rates || Object.keys(result.rates).length === 0) {
          return { updated: false, error: "no rates returned" };
        }
        settings.fxRatesAuto = Object.assign({}, settings.fxRatesAuto, result.rates);
        settings.fxRatesUpdated = (/* @__PURE__ */ new Date()).toISOString();
        settings.fxSourceLabel = `${result.source} \xB7 ${result.pubDate ?? "now"}`;
        return { updated: true, source: result.source, pubDate: result.pubDate, rates: result.rates };
      } catch (e) {
        console.warn("[PC] FX update failed:", e);
        return { updated: false, error: e.message || String(e) };
      }
    }
    module2.exports = { resolveFxRate, updateFxRates, fetchCbrRates, fetchYahooRates };
  }
});

// src/assets/flows.js
var require_flows = __commonJS({
  "src/assets/flows.js"(exports2, module2) {
    var { MONTH_KEYS: MONTH_KEYS2 } = require_constants();
    var { toNum, getCurrentMonthIdx, getCurrentYear: getCurrentYear2 } = require_utils();
    var { readAllLedger } = require_io();
    var { readAccounts: readAccounts2 } = require_io2();
    var { resolveFxRate } = require_fx();
    async function buildAssetFlowsAsync(app, settings) {
      const folder = settings.assetsFolder.toLowerCase().replace(/\/$/, "");
      const files = app.vault.getMarkdownFiles().filter(
        (f) => f.path.toLowerCase().startsWith(folder + "/")
      );
      const curMonth = getCurrentMonthIdx() + 1;
      const curYear = getCurrentYear2();
      const allLedger = await readAllLedger(app, settings);
      const accounts = await readAccounts2(app, settings);
      let passiveIncome = 0;
      let saves = 0;
      const assets = [];
      const savesByMonthKey = {};
      for (const file of files) {
        const raw = await app.vault.read(file);
        const fmEnd = raw.indexOf("---", 3);
        const body = fmEnd !== -1 ? raw.slice(fmEnd + 3) : raw;
        const cache = app.metadataCache.getFileCache(file);
        const fm = cache?.frontmatter ?? {};
        const assetName = file.basename;
        const currency = String(fm.currency || "RUB").toUpperCase();
        const fxRaw = resolveFxRate(currency, settings);
        const fx = fxRaw ?? 0;
        const fxMissing = fxRaw == null;
        const type = String(fm.type || "shares").toLowerCase();
        const assetEntries = allLedger.filter((e) => e.asset === assetName);
        const sorted = [...assetEntries].sort((a, b) => a.d.localeCompare(b.d));
        let currentQty = 0, totalInvested = 0, passiveIncomeTot = 0;
        let initialDate = null, lastUpdated = null;
        const logEvents = [];
        for (const e of sorted) {
          if (!initialDate || e.d < initialDate) initialDate = e.d;
          if (!lastUpdated || e.d > lastUpdated) lastUpdated = e.d;
          if (e.type === "buy") {
            const qtyNum = toNum(e.qty);
            const priceNum = toNum(e.price || toNum(e.amt) / (qtyNum || 1));
            currentQty += qtyNum;
            totalInvested += qtyNum * priceNum;
            logEvents.push({ date: e.d, op: "buy", qty: qtyNum, val: priceNum });
          } else if (e.type === "sell") {
            const costPerShare = currentQty > 0 ? totalInvested / currentQty : 0;
            const soldQty = toNum(e.qty);
            currentQty -= soldQty;
            totalInvested -= soldQty * costPerShare;
            if (currentQty < 0) currentQty = 0;
            if (totalInvested < 0) totalInvested = 0;
            logEvents.push({ date: e.d, op: "sell", qty: soldQty, val: toNum(e.price || toNum(e.amt) / soldQty) });
          } else if (e.type === "dividend") {
            passiveIncomeTot += toNum(e.amt);
            logEvents.push({ date: e.d, op: "div", qty: 0, val: toNum(e.amt) });
          } else if (e.type === "close") {
            logEvents.push({ date: e.d, op: "close", qty: currentQty, val: toNum(e.amt) });
            currentQty = 0;
            totalInvested = 0;
          }
        }
        const monthPrefix = `${curYear}-${String(curMonth).padStart(2, "0")}`;
        for (const e of assetEntries) {
          if (!e.d || !e.d.startsWith(monthPrefix)) continue;
          if (e.type === "dividend") passiveIncome += toNum(e.amt) * fx;
          if (e.type === "buy") saves += toNum(e.amt) * fx;
        }
        for (const e of assetEntries) {
          if (!e.d || !e.d.startsWith(String(curYear))) continue;
          if (e.type === "buy") {
            const mk = MONTH_KEYS2[parseInt(e.d.slice(5, 7)) - 1];
            savesByMonthKey[mk] = (savesByMonthKey[mk] ?? 0) + toNum(e.amt) * fx;
          }
        }
        const priceHistory = [];
        for (const line of body.split("\n")) {
          const parts = line.trim().includes("|") ? line.trim().split("|").map((p) => p.trim()) : line.trim().split(/\s+/);
          if (parts.length < 4) continue;
          const d = new Date(parts[0]);
          if (Number.isNaN(d.getTime())) continue;
          const op = parts[1].toLowerCase();
          const val = toNum(parts[3]);
          if ((op === "buy" || op === "reinvest" || op === "price") && val > 0) {
            priceHistory.push({ date: parts[0], price: val });
          }
        }
        priceHistory.sort((a, b) => a.date.localeCompare(b.date));
        logEvents.sort((a, b) => a.date.localeCompare(b.date));
        const currentPrice = fm.current_price ?? null;
        const currentValue = currentPrice != null ? currentPrice * currentQty : totalInvested;
        const plAmount = currentValue - totalInvested;
        const plPct = totalInvested > 0 ? plAmount / totalInvested * 100 : 0;
        assets.push({
          name: assetName,
          type,
          currency,
          fx,
          fxMissing,
          currentQty: parseFloat(currentQty.toFixed(6)),
          currentPrice,
          currentValue: parseFloat(currentValue.toFixed(2)),
          currentValueRub: parseFloat(currentValue.toFixed(2)) * fx,
          plAmount: parseFloat(plAmount.toFixed(2)),
          plPct: parseFloat(plPct.toFixed(2)),
          passiveIncomeTot: parseFloat(passiveIncomeTot.toFixed(2)),
          initialDate: initialDate ?? fm.initial_date ?? null,
          lastUpdated: lastUpdated ?? fm.last_updated ?? null,
          basket: fm.basket ?? null,
          priceHistory,
          logEvents
        });
      }
      return { passiveIncome, saves, assets, savesByMonthKey, accounts, allLedger };
    }
    module2.exports = { buildAssetFlowsAsync };
  }
});

// src/budget/cashflow.js
var require_cashflow = __commonJS({
  "src/budget/cashflow.js"(exports2, module2) {
    var { MONTH_KEYS: MONTH_KEYS2, TYPE_ORDER } = require_constants();
    var { toNum, getCurrentYear: getCurrentYear2 } = require_utils();
    function buildCashflowRows2(app, settings, ledgerEntries) {
      const folder = settings.categoriesFolder.toLowerCase().replace(/\/$/, "");
      const files = app.vault.getMarkdownFiles().filter(
        (f) => f.path.toLowerCase().startsWith(folder + "/")
      );
      const curYear = getCurrentYear2();
      const rows = [];
      const ledgerByCatMonth = {};
      if (ledgerEntries && ledgerEntries.length > 0) {
        for (const e of ledgerEntries) {
          if (!e.cat || !e.d || !e.d.startsWith(String(curYear))) continue;
          if (e.type !== "expense" && e.type !== "income") continue;
          const mi = parseInt(e.d.slice(5, 7)) - 1;
          const mk = MONTH_KEYS2[mi];
          const key = `${e.cat}|${mk}`;
          ledgerByCatMonth[key] = (ledgerByCatMonth[key] || 0) + (e.type === "income" ? toNum(e.amt) : -toNum(e.amt));
        }
      }
      const useLedger = ledgerEntries && ledgerEntries.length > 0 && Object.keys(ledgerByCatMonth).length > 0;
      for (const file of files) {
        const cache = app.metadataCache.getFileCache(file);
        const fm = cache?.frontmatter;
        if (!fm) continue;
        const months = {};
        let total = 0, filledSum = 0, filledCount = 0;
        const category = String(fm.category ?? file.basename);
        for (const key of MONTH_KEYS2) {
          let v;
          if (useLedger) {
            const lk = `${category}|${key}`;
            v = ledgerByCatMonth[lk] ?? null;
          } else {
            v = fm[key];
          }
          if (v == null || v === "") {
            months[key] = null;
          } else {
            const n = toNum(v);
            months[key] = n;
            total += n;
            if (n !== 0) {
              filledSum += n;
              filledCount++;
            }
          }
        }
        const recurring = !!fm.recurring;
        const projected = recurring && filledCount > 0 ? parseFloat((filledSum / filledCount).toFixed(0)) : null;
        const type = String(fm.type ?? "Wants");
        const emoji = String(fm.emoji ?? "");
        rows.push({ file, type, category, emoji, recurring, total, projected, months });
      }
      rows.sort((a, b) => {
        const oa = TYPE_ORDER[a.type] ?? 99;
        const ob = TYPE_ORDER[b.type] ?? 99;
        return oa !== ob ? oa - ob : a.category.localeCompare(b.category);
      });
      return rows;
    }
    module2.exports = { buildCashflowRows: buildCashflowRows2 };
  }
});

// src/accounts/balance.js
var require_balance = __commonJS({
  "src/accounts/balance.js"(exports2, module2) {
    var { toNum } = require_utils();
    function getAccountBalance(account, ledgerEntries) {
      let balance = account.initialBalance;
      for (const e of ledgerEntries) {
        if (e.to === account.name) balance += toNum(e.amt);
        if (e.from === account.name) balance -= toNum(e.amt);
      }
      return balance;
    }
    function getAccountsWithBalances(accounts, ledgerEntries) {
      return accounts.map((a) => ({ ...a, balance: getAccountBalance(a, ledgerEntries) }));
    }
    function getAccountsTotal(accounts, ledgerEntries) {
      return accounts.reduce((s, a) => s + getAccountBalance(a, ledgerEntries), 0);
    }
    function getLiquidAccountsTotal(accounts, ledgerEntries) {
      return accounts.filter((a) => a.liquid && !a.locked).reduce((s, a) => s + getAccountBalance(a, ledgerEntries), 0);
    }
    function getLiquidAvailableLegacy(settings) {
      let sum = 0;
      if (settings.liquidBankIsLiquid) sum += settings.liquidBank ?? 0;
      if (settings.liquidBrokerCashIsLiquid) sum += settings.liquidBrokerCash ?? 0;
      if (settings.liquidCashIsLiquid) sum += settings.liquidCash ?? 0;
      if (settings.liquidBusinessIsLiquid) sum += settings.liquidBusiness ?? 0;
      return sum;
    }
    function getLiquidTotalLegacy(settings) {
      return (settings.liquidBank ?? 0) + (settings.liquidBrokerCash ?? 0) + (settings.liquidCash ?? 0) + (settings.liquidBusiness ?? 0);
    }
    function getLiquidAvailable(settings, accounts, ledgerEntries) {
      if (accounts && accounts.length > 0) return getLiquidAccountsTotal(accounts, ledgerEntries || []);
      return getLiquidAvailableLegacy(settings);
    }
    function getLiquidTotal(settings, accounts, ledgerEntries) {
      if (accounts && accounts.length > 0) return getAccountsTotal(accounts, ledgerEntries || []);
      return getLiquidTotalLegacy(settings);
    }
    module2.exports = {
      getAccountBalance,
      getAccountsWithBalances,
      getAccountsTotal,
      getLiquidAccountsTotal,
      getLiquidAvailableLegacy,
      getLiquidTotalLegacy,
      getLiquidAvailable,
      getLiquidTotal
    };
  }
});

// src/budget/summary.js
var require_summary = __commonJS({
  "src/budget/summary.js"(exports2, module2) {
    var { MONTH_KEYS: MONTH_KEYS2 } = require_constants();
    var { getCurrentMonthKey } = require_utils();
    var { getLiquidAvailable } = require_balance();
    function buildBudgetSummary(rows, settings, assetFlows) {
      const currentMk = getCurrentMonthKey();
      const currentIdx = MONTH_KEYS2.indexOf(currentMk);
      const savesByMk = assetFlows.savesByMonthKey ?? {};
      const passiveIncome = assetFlows.passiveIncome ?? 0;
      const comfortBudget = settings.comfortBudget ?? 0;
      let rollingLeft = getLiquidAvailable(settings, assetFlows.accounts, assetFlows.allLedger);
      let prevUnspentWants = 0;
      for (let i = 0; i <= currentIdx; i++) {
        const mk = MONTH_KEYS2[i];
        let income = 0, needs = 0, wants = 0;
        for (const r of rows) {
          const v = r.months[mk] ?? 0;
          if (r.type === "Income") income += v;
          if (r.type === "Needs") needs += v;
          if (r.type === "Wants") wants += v;
        }
        const saves = savesByMk[mk] ?? 0;
        const totalIncome = income + (i === currentIdx ? passiveIncome : 0);
        const monthLeft = totalIncome + needs + wants - saves + rollingLeft + prevUnspentWants;
        if (i === currentIdx) {
          const savesTargetPct = settings.savesTargetPct ?? 0;
          const savesTarget = savesTargetPct > 0 ? totalIncome * (savesTargetPct / 100) : settings.savesMonthly ?? 0;
          const savesRate = totalIncome > 0 ? saves / totalIncome * 100 : 0;
          const savesOnTrack = savesTargetPct > 0 ? savesRate >= savesTargetPct : saves >= savesTarget;
          return {
            income,
            passiveIncome,
            totalIncome,
            needs,
            wants,
            saves,
            left: getLiquidAvailable(settings, assetFlows.accounts, assetFlows.allLedger),
            savesTarget,
            savesRate,
            savesOnTrack,
            comfortBudget,
            needsBudget: settings.needsBudget ?? 0
          };
        }
        rollingLeft = monthLeft;
        prevUnspentWants = Math.max(0, comfortBudget + wants);
      }
      return {
        income: 0,
        passiveIncome,
        totalIncome: passiveIncome,
        needs: 0,
        wants: 0,
        saves: 0,
        left: 0,
        savesTarget: 0,
        savesRate: 0,
        savesOnTrack: false,
        comfortBudget,
        needsBudget: settings.needsBudget ?? 0
      };
    }
    function buildProjected(rows) {
      return rows.filter((r) => r.recurring && r.projected != null).map((r) => ({ type: r.type, category: r.category, emoji: r.emoji, projected: r.projected }));
    }
    module2.exports = { buildBudgetSummary, buildProjected };
  }
});

// src/budget/timeline.js
var require_timeline = __commonJS({
  "src/budget/timeline.js"(exports2, module2) {
    var { toNum } = require_utils();
    async function readCapitalHistory(app, settings) {
      const path = settings.capitalHistoryPath;
      const file = app.vault.getAbstractFileByPath(path);
      if (!file) return [];
      const cache = app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter;
      if (!fm?.snapshots || !Array.isArray(fm.snapshots)) return [];
      return fm.snapshots.filter((s) => s.date && s.value != null).map((s) => ({ date: String(s.date), value: toNum(s.value) })).sort((a, b) => a.date.localeCompare(b.date));
    }
    function buildCapitalTimeline(assets, settings) {
      const allEvents = [];
      for (let ai = 0; ai < assets.length; ai++) {
        const a = assets[ai];
        for (const ev of a.logEvents || []) {
          allEvents.push({ date: ev.date, op: ev.op, qty: ev.qty, val: ev.val, ai, fx: a.fx });
        }
      }
      if (allEvents.length === 0) return [];
      allEvents.sort((a, b) => a.date.localeCompare(b.date));
      const assetState = assets.map(() => ({ qty: 0, lastPrice: 0 }));
      let runningTotal = 0;
      const dateValues = /* @__PURE__ */ new Map();
      for (const ev of allEvents) {
        const st = assetState[ev.ai];
        const oldContrib = st.qty * st.lastPrice * ev.fx;
        if (ev.op === "buy" || ev.op === "reinvest") {
          st.qty += ev.qty;
          st.lastPrice = ev.val;
        } else if (ev.op === "sell") {
          st.qty = Math.max(0, st.qty - ev.qty);
        } else if (ev.op === "price") {
          st.lastPrice = ev.val;
        }
        const newContrib = st.qty * st.lastPrice * ev.fx;
        runningTotal += newContrib - oldContrib;
        dateValues.set(ev.date, runningTotal);
      }
      const timeline = [];
      for (const [date, value] of dateValues) {
        timeline.push({ date, value });
      }
      const byMonth = {};
      for (const pt of timeline) {
        const mk = pt.date.slice(0, 7);
        byMonth[mk] = pt;
      }
      const months = Object.keys(byMonth).sort();
      if (months.length >= 2) {
        const [startY, startM] = months[0].split("-").map(Number);
        const [endY, endM] = months[months.length - 1].split("-").map(Number);
        let y = startY, m = startM;
        let lastVal = byMonth[months[0]].value;
        while (y < endY || y === endY && m <= endM) {
          const mk = `${y}-${String(m).padStart(2, "0")}`;
          if (byMonth[mk]) {
            lastVal = byMonth[mk].value;
          } else {
            byMonth[mk] = { date: `${mk}-15`, value: lastVal };
          }
          m++;
          if (m > 12) {
            m = 1;
            y++;
          }
        }
      }
      return Object.values(byMonth).sort((a, b) => a.date.localeCompare(b.date));
    }
    module2.exports = { readCapitalHistory, buildCapitalTimeline };
  }
});

// src/budget/baskets.js
var require_baskets = __commonJS({
  "src/budget/baskets.js"(exports2, module2) {
    var { fmt } = require_utils();
    var { getLiquidTotal } = require_balance();
    var BASKET_META = {
      core: { label: "Core", color: "#6366f1", icon: "\u{1F3DB}" },
      flash: { label: "Flash", color: "#f59e0b", icon: "\u26A1" },
      reserve: { label: "Reserve", color: "#34d399", icon: "\u{1F6E1}" }
    };
    function classifyAssetBasket(asset) {
      if (asset.basket) return asset.basket;
      const t = (asset.assetType || asset.type || "shares").toLowerCase();
      if (t === "bond" || t === "deposit") return "core";
      if (t === "etf" || t === "fund" || t === "index") return "core";
      const name = (asset.name || "").toUpperCase();
      const ticker = (asset.ticker || asset.name || "").toUpperCase();
      if (name.endsWith("@") || ticker.endsWith("@")) return "core";
      if (/\bETF\b|\bINDEX\b|\bФОНД\b|\bИНДЕКС\b/i.test(name)) return "core";
      if (/^RU\d{3}[A-Z]\d/.test(ticker)) return "core";
      if (t === "material") return null;
      if (t === "crypto") return "flash";
      return "flash";
    }
    function buildBasketData(assets, settings, accounts, allLedger) {
      const baskets = {
        core: { value: 0, assets: [], target: settings.targetCore || 0 },
        flash: { value: 0, assets: [], target: settings.targetFlash || 0 },
        reserve: { value: 0, assets: [], target: settings.targetReserve || 0 }
      };
      for (const a of assets) {
        const bk = classifyAssetBasket(a);
        if (bk && baskets[bk]) {
          baskets[bk].value += a.currentValueRub;
          baskets[bk].assets.push(a);
        }
      }
      const liq = getLiquidTotal(settings, accounts, allLedger);
      if (liq > 0) baskets.reserve.value += liq;
      const total = baskets.core.value + baskets.flash.value + baskets.reserve.value;
      for (const bk of Object.values(baskets)) bk.pct = total > 0 ? bk.value / total * 100 : 0;
      return { baskets, total };
    }
    function checkBasketTriggers(baskets, settings) {
      const alerts = [];
      const hasTargets = (settings.targetCore || 0) + (settings.targetFlash || 0) + (settings.targetReserve || 0) > 0;
      if (!hasTargets) return alerts;
      const THRESHOLD = 5;
      for (const [key, meta] of Object.entries(BASKET_META)) {
        const bk = baskets[key];
        if (!bk.target || bk.target <= 0) continue;
        const diff = bk.pct - bk.target;
        if (Math.abs(diff) >= THRESHOLD) {
          const dir = diff > 0 ? "overweight" : "underweight";
          alerts.push(`${meta.icon} ${meta.label}: ${dir} by ${fmt(Math.abs(diff), 1)}% (${fmt(bk.pct, 1)}% vs ${bk.target}% target)`);
        }
      }
      return alerts;
    }
    function checkInstrumentTriggers(assets) {
      const alerts = [];
      const now = /* @__PURE__ */ new Date();
      for (const a of assets) {
        const invested = a.currentValue - a.plAmount;
        const totalRetPct = invested > 0 ? (a.plAmount + a.passiveIncomeTot) / invested * 100 : 0;
        const holdMonths = a.initialDate ? (now - new Date(a.initialDate)) / (30.44 * 24 * 3600 * 1e3) : 0;
        const t = (a.assetType || a.type || "").toLowerCase();
        if (holdMonths >= 12 && totalRetPct < 0) {
          alerts.push({
            type: "underperformer",
            icon: "\u{1F4C9}",
            asset: a.name,
            text: `${a.name}: total return ${fmt(totalRetPct, 1)}% after ${Math.floor(holdMonths)} months`
          });
        }
        if ((t === "bond" || t === "deposit") && holdMonths >= 6) {
          const yoc = invested > 0 ? a.passiveIncomeTot / invested * 100 : 0;
          if (yoc < 2) {
            alerts.push({
              type: "dividend_dry",
              icon: "\u{1F4A7}",
              asset: a.name,
              text: `${a.name}: yield on cost only ${fmt(yoc, 1)}% \u2014 low for fixed income`
            });
          }
        }
        if (totalRetPct > 50 && holdMonths >= 1) {
          const annualized = holdMonths > 0 ? totalRetPct / holdMonths * 12 : totalRetPct;
          if (annualized > 100) {
            alerts.push({
              type: "winner",
              icon: "\u{1F3C6}",
              asset: a.name,
              text: `${a.name}: up ${fmt(totalRetPct, 1)}% in ${Math.floor(holdMonths)} mo \u2014 rapid spike, consider locking profit`
            });
          } else if (holdMonths < 3 && totalRetPct > 30) {
            alerts.push({
              type: "winner",
              icon: "\u{1F3C6}",
              asset: a.name,
              text: `${a.name}: up ${fmt(totalRetPct, 1)}% in ${Math.floor(holdMonths)} mo \u2014 short-term opportunity`
            });
          }
        }
      }
      return alerts;
    }
    module2.exports = {
      BASKET_META,
      classifyAssetBasket,
      buildBasketData,
      checkBasketTriggers,
      checkInstrumentTriggers
    };
  }
});

// src/report.js
var require_report = __commonJS({
  "src/report.js"(exports2, module2) {
    var { MONTH_NAMES: MONTH_NAMES2, MONTH_KEYS: MONTH_KEYS2 } = require_constants();
    var { toNum, fmt } = require_utils();
    var { readAccounts: readAccounts2 } = require_io2();
    var { getLiquidTotal } = require_balance();
    var { readAllLedger } = require_io();
    var { buildBasketData, checkBasketTriggers, checkInstrumentTriggers } = require_baskets();
    async function generateMonthlyReport(app, settings, budget, assets, cfRows, sym) {
      const now = /* @__PURE__ */ new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const monthName = MONTH_NAMES2[now.getMonth()];
      const day = String(now.getDate()).padStart(2, "0");
      const mk = MONTH_KEYS2[now.getMonth()];
      let totalValue = 0, totalPL = 0, totalDiv = 0, periodDiv = 0;
      for (const a of assets) {
        totalValue += a.currentValueRub;
        totalPL += toNum(a.plAmount) * a.fx;
        totalDiv += toNum(a.passiveIncomeTot) * a.fx;
        if (a.logEvents) {
          for (const ev of a.logEvents) {
            if (ev.op === "div" && ev.date && ev.date.startsWith(`${yyyy}-${mm}`)) {
              periodDiv += toNum(ev.val) * a.fx;
            }
          }
        }
      }
      let accounts_r, allLedger_r;
      try {
        accounts_r = await readAccounts2(app, settings);
        allLedger_r = await readAllLedger(app, settings);
      } catch (_) {
        accounts_r = [];
        allLedger_r = [];
      }
      const liquidTotal = getLiquidTotal(settings, accounts_r, allLedger_r);
      const netWorth = totalValue + liquidTotal;
      const investedBasis = totalValue - totalPL;
      const returnPct = investedBasis > 0 ? totalPL / investedBasis * 100 : 0;
      const totalReturn = totalPL + totalDiv;
      const totalRetPct = investedBasis > 0 ? totalReturn / investedBasis * 100 : 0;
      const sv = (v) => v >= 0 ? `+ ${fmt(Math.abs(v))}` : `\u2212 ${fmt(Math.abs(v))}`;
      let allAlerts = [];
      try {
        const { baskets } = buildBasketData(assets, settings, null, null);
        const hasStrategy = (settings.targetCore || 0) + (settings.targetFlash || 0) + (settings.targetReserve || 0) > 0;
        const basketAlerts = hasStrategy ? checkBasketTriggers(baskets, settings) : [];
        const instrAlerts = checkInstrumentTriggers(assets);
        allAlerts = [...basketAlerts, ...instrAlerts.map((t) => `${t.icon} ${t.text}`)];
      } catch (e) {
        console.error("Report signals error:", e);
      }
      const monthPrefix = `${yyyy}-${mm}`;
      let periodBuys = 0, periodSells = 0, periodDivs = 0;
      const periodByAsset = {};
      for (const a of assets) {
        for (const ev of a.logEvents || []) {
          if (!ev.date || !ev.date.startsWith(monthPrefix)) continue;
          const amt = Math.abs(toNum(ev.qty) * toNum(ev.val)) * a.fx;
          if (ev.op === "buy" || ev.op === "reinvest") {
            periodBuys += amt;
            if (!periodByAsset[a.name]) periodByAsset[a.name] = { buys: 0, sells: 0, divs: 0 };
            periodByAsset[a.name].buys += amt;
          } else if (ev.op === "sell") {
            periodSells += amt;
            if (!periodByAsset[a.name]) periodByAsset[a.name] = { buys: 0, sells: 0, divs: 0 };
            periodByAsset[a.name].sells += amt;
          } else if (ev.op === "div") {
            const dAmt = Math.abs(toNum(ev.qty || ev.val)) * a.fx;
            periodDivs += dAmt;
            if (!periodByAsset[a.name]) periodByAsset[a.name] = { buys: 0, sells: 0, divs: 0 };
            periodByAsset[a.name].divs += dAmt;
          }
        }
      }
      const periodNet = periodDivs + periodSells - periodBuys;
      const periodActive = Object.entries(periodByAsset).map(([name, d]) => ({ name, net: d.divs + d.sells - d.buys, ...d })).filter((a) => Math.abs(a.net) > 0).sort((a, b) => b.net - a.net);
      const periodTop = periodActive.filter((a) => a.net > 0).slice(0, 3);
      const periodBot = periodActive.filter((a) => a.net < 0).slice(-3).reverse();
      const row = (label, value) => `<div class="cr-row"><span class="cr-name">${label}</span><span class="cr-val">${value}</span></div>`;
      const H = [];
      H.push(`<div class="cr-ticket">`);
      H.push(`<div class="cr-header"><span class="cr-title">Capital Statement</span><span class="cr-period">${monthName.slice(0, 3)} 01 \u2013 ${monthName.slice(0, 3)} ${day}, ${yyyy}</span></div>`);
      H.push(`<div class="cr-group-label cr-first">Portfolio</div>`);
      H.push(row("Net Worth", `${fmt(netWorth)} ${sym}`));
      const retPctStr = `${totalRetPct >= 0 ? "\u25B2" : "\u25BC"} ${fmt(Math.abs(totalRetPct), 1)}%`;
      H.push(row("Unrealized P&L", `<span class="${totalReturn >= 0 ? "cr-pos" : "cr-neg"}">${sv(totalReturn)} ${sym}</span> <span class="cr-badge">${retPctStr}</span>`));
      H.push(`<div class="cr-group-label">This period</div>`);
      if (periodBuys > 0) H.push(row("Invested", `<span class="cr-neg">\u2212 ${fmt(periodBuys)} ${sym}</span>`));
      if (periodSells > 0) H.push(row("Sold", `<span class="cr-pos">+ ${fmt(periodSells)} ${sym}</span>`));
      if (periodDivs > 0) H.push(row("Dividends & Coupons", `<span class="cr-pos">+ ${fmt(periodDivs)} ${sym}</span>`));
      if (periodBuys === 0 && periodSells === 0 && periodDivs === 0) {
        H.push(row("Activity", `<span class="cr-muted">\u2014</span>`));
      }
      H.push(`<div class="cr-tear"></div>`);
      H.push(`<div class="cr-total-row"><span class="cr-total-label">Period net</span><span class="cr-total-value ${periodNet >= 0 ? "cr-pos" : "cr-neg"}">${sv(periodNet)} ${sym}</span></div>`);
      if (periodTop.length > 0 || periodBot.length > 0) {
        H.push(`<div class="cr-group-label">Period performers</div>`);
        for (const a of periodTop) H.push(row(a.name, `<span class="cr-pos">+ ${fmt(a.net)} ${sym}</span>`));
        for (const a of periodBot) H.push(row(a.name, `<span class="cr-neg">\u2212 ${fmt(Math.abs(a.net))} ${sym}</span>`));
      }
      H.push(`<div class="cr-group-label">Signals</div>`);
      for (const a of allAlerts) H.push(`<div class="cr-signal">${a}</div>`);
      H.push(`<div class="cr-footer">Statement generated automatically</div>`);
      H.push(`</div>`);
      const L = [];
      L.push(`---`);
      L.push(`cssclasses: [pc-report]`);
      L.push(`report_month: "${yyyy}-${mm}"`);
      L.push(`generated: "${yyyy}-${mm}-${day}"`);
      L.push(`net_worth: ${Math.round(netWorth)}`);
      L.push(`---`);
      L.push("");
      L.push(H.join("\n"));
      const content = L.join("\n");
      const folderPath = "finance/Data/reports";
      const fParts = folderPath.split("/");
      let cur = "";
      for (const p of fParts) {
        cur = cur ? `${cur}/${p}` : p;
        if (!app.vault.getAbstractFileByPath(cur)) {
          try {
            await app.vault.createFolder(cur);
          } catch (_) {
          }
        }
      }
      const baseName = `${yyyy}-${mm}-${day}`;
      let filePath = `${folderPath}/${baseName}.md`;
      const existingFile = app.vault.getAbstractFileByPath(filePath);
      if (existingFile) {
        const openFiles = app.workspace.getLeavesOfType("markdown").map((l) => l.view?.file?.path).filter(Boolean);
        if (openFiles.includes(filePath)) {
          await app.vault.modify(existingFile, content);
        } else {
          let n = 2;
          while (app.vault.getAbstractFileByPath(`${folderPath}/${baseName}_${n}.md`)) n++;
          filePath = `${folderPath}/${baseName}_${n}.md`;
          await app.vault.create(filePath, content);
        }
      } else {
        await app.vault.create(filePath, content);
      }
      const file = app.vault.getAbstractFileByPath(filePath);
      if (file) {
        const leaf = app.workspace.getLeaf(false);
        await leaf.openFile(file);
        const viewState = leaf.getViewState();
        viewState.state = viewState.state || {};
        viewState.state.mode = "preview";
        await leaf.setViewState(viewState);
      }
      return filePath;
    }
    module2.exports = { generateMonthlyReport };
  }
});

// src/ui/fit-text.js
var require_fit_text = __commonJS({
  "src/ui/fit-text.js"(exports2, module2) {
    function fitCardText(el) {
      el.style.whiteSpace = "nowrap";
      requestAnimationFrame(() => {
        if (el.scrollWidth <= el.offsetWidth) return;
        let sizePx = parseFloat(getComputedStyle(el).fontSize);
        const minPx = 10;
        while (el.scrollWidth > el.offsetWidth && sizePx > minPx) {
          sizePx -= 1;
          el.style.fontSize = sizePx + "px";
        }
      });
    }
    module2.exports = { fitCardText };
  }
});

// src/ui/cards.js
var require_cards = __commonJS({
  "src/ui/cards.js"(exports2, module2) {
    var { fmt } = require_utils();
    var { fitCardText } = require_fit_text();
    function renderBudgetCards(container, budget, sym) {
      const needsPct = budget.totalIncome > 0 ? Math.abs(budget.needs) / budget.totalIncome * 100 : 0;
      const savesPct = budget.savesRate ?? 0;
      const liquidOk = budget.left >= 0;
      const SEGS = 22;
      const wantsAbs = Math.abs(budget.wants);
      const wantsOver = wantsAbs > budget.comfortBudget;
      const wantsFilled = budget.comfortBudget > 0 ? Math.min(SEGS, Math.round(wantsAbs / budget.comfortBudget * SEGS)) : 0;
      const cards = [
        {
          id: "needs",
          label: "Needs",
          icon: "\u{1F3E0}",
          main: `${fmt(needsPct, 0)}%`,
          sub: "of income",
          status: liquidOk ? "ok" : "over"
        },
        {
          id: "saves",
          label: "Saves",
          icon: "\u{1F4C8}",
          main: `${fmt(savesPct, 0)}%`,
          sub: `${fmt(Math.abs(budget.saves))} ${sym} invested`,
          status: budget.savesOnTrack ? "ok" : budget.saves > 0 ? "partial" : "empty"
        },
        {
          id: "wants",
          label: "Wants",
          icon: "\u2728",
          status: wantsOver ? "over" : "ok",
          segbar: true
        },
        {
          id: "left",
          label: "Left",
          icon: "\u{1F4B0}",
          main: `${fmt(budget.left)} ${sym}`,
          fitText: true,
          noBadge: true,
          leftCard: true,
          status: budget.left >= 0 ? "ok" : "over"
        }
      ];
      const badgeText = { ok: "On track", over: "Over budget", partial: "Behind", neutral: "\u2014", empty: "No data" };
      for (const card of cards) {
        const el = container.createDiv({ cls: `pc-card pc-card--${card.id}` });
        const top = el.createDiv({ cls: "pc-card-top" });
        const labelRow = top.createDiv({ cls: "pc-card-label-row" });
        labelRow.createEl("span", { cls: "pc-card-icon", text: card.icon });
        labelRow.createEl("span", { cls: "pc-card-label", text: card.label });
        if (!card.noBadge) {
          top.createEl("span", {
            cls: `pc-card-badge pc-badge--${card.status}`,
            text: badgeText[card.status] ?? ""
          });
        }
        if (card.segbar) {
          const body = el.createDiv({ cls: "pc-card-body pc-card-body--bar" });
          const bar = body.createDiv({ cls: "pc-segbar" });
          for (let i = 0; i < SEGS; i++) {
            const lit = i < wantsFilled;
            bar.createDiv({ cls: `pc-seg ${lit ? wantsOver ? "pc-seg--over" : "pc-seg--on" : "pc-seg--off"}` });
          }
          const nums = body.createDiv({ cls: "pc-segbar-nums" });
          nums.createEl("span", { cls: wantsOver ? "pc-segbar-over" : "pc-segbar-val", text: fmt(wantsAbs) });
          nums.createEl("span", { text: ` / ${fmt(budget.comfortBudget)} ${sym}` });
        } else if (card.leftCard) {
          const body = el.createDiv({ cls: "pc-card-body pc-card-body--left" });
          body.createEl("span", { cls: "pc-card-liquidity-label", text: "Available liquidity" });
          const mainEl = body.createEl("div", { cls: "pc-card-main", text: card.main });
          if (card.fitText) fitCardText(mainEl);
        } else {
          const body = el.createDiv({ cls: "pc-card-body" });
          const mainEl = body.createEl("div", { cls: "pc-card-main", text: card.main });
          if (card.fitText) fitCardText(mainEl);
          if (card.sub) body.createEl("div", { cls: "pc-card-sub", text: card.sub });
        }
      }
    }
    module2.exports = { renderBudgetCards };
  }
});

// src/ui/projected.js
var require_projected = __commonJS({
  "src/ui/projected.js"(exports2, module2) {
    var { fmt } = require_utils();
    function renderProjected(container, proj, sym, budget) {
      if (proj.length === 0) {
        container.createEl("p", { cls: "pc-empty", text: "No recurring categories set. Mark categories as recurring in cashflow." });
        return;
      }
      const ticket = container.createDiv({ cls: "pc-proj-ticket" });
      const hdr = ticket.createDiv({ cls: "pc-proj-ticket-header" });
      hdr.createEl("span", { cls: "pc-proj-ticket-title", text: "Projected" });
      hdr.createEl("span", { cls: "pc-proj-ticket-period", text: "next month" });
      const list = ticket.createEl("ul", { cls: "pc-projected-list" });
      const grouped = {};
      for (const p of proj) {
        (grouped[p.type] = grouped[p.type] || []).push(p);
      }
      const typeLabel = { Income: "Income", Needs: "Needs", Wants: "Wants", Saves: "Saves" };
      for (const type of ["Income", "Needs", "Wants"]) {
        const items = grouped[type];
        if (!items) continue;
        const groupEl = list.createEl("li", { cls: "pc-proj-group" });
        groupEl.createEl("span", { cls: `pc-proj-group-label pc-proj-group--${type.toLowerCase()}`, text: typeLabel[type] });
        for (const item of items) {
          const row = groupEl.createEl("div", { cls: "pc-proj-row" });
          row.createEl("span", { cls: "pc-proj-name", text: item.category });
          row.createEl("span", { cls: "pc-proj-value", text: `${fmt(item.projected)} ${sym}` });
        }
      }
      const savesEl = list.createEl("li", { cls: "pc-proj-group" });
      savesEl.createEl("span", { cls: "pc-proj-group-label pc-proj-group--saves", text: "Saves" });
      const savesRow = savesEl.createEl("div", { cls: "pc-proj-row" });
      savesRow.createEl("span", { cls: "pc-proj-name", text: "Investments (target)" });
      savesRow.createEl("span", { cls: "pc-proj-value", text: `${fmt(budget.savesTarget)} ${sym}` });
      ticket.createDiv({ cls: "pc-proj-tear" });
      let projTotal = 0;
      for (const p of proj) projTotal += p.projected;
      projTotal -= budget.savesTarget;
      const totalRow = ticket.createDiv({ cls: "pc-proj-total-row" });
      totalRow.createEl("span", { cls: "pc-proj-total-label", text: "Net projected" });
      totalRow.createEl("span", { cls: `pc-proj-total-value ${projTotal >= 0 ? "pc-pos" : "pc-neg"}`, text: `${fmt(projTotal)} ${sym}` });
    }
    module2.exports = { renderProjected };
  }
});

// src/ui/chart.js
var require_chart = __commonJS({
  "src/ui/chart.js"(exports2, module2) {
    var { toNum, fmt, fmtSigned } = require_utils();
    var { getLiquidTotal } = require_balance();
    var { buildCapitalTimeline } = require_timeline();
    function paintGrainCanvas(container, w, h) {
      const canvas = document.createElement("canvas");
      canvas.className = "pc-grain-canvas";
      canvas.width = w * 2;
      canvas.height = h * 2;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cw = canvas.width, ch = canvas.height;
      const imageData = ctx.createImageData(cw, ch);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const py = Math.floor(i / 4 / cw);
        const px = i / 4 % cw;
        const ny = py / ch;
        const fadeIn = Math.max(0, (ny - 0.3) / 0.5);
        const fadeOut = Math.max(0, 1 - (ny - 0.85) / 0.15);
        const grainStrength = Math.min(fadeIn, fadeOut);
        if (grainStrength > 0 && Math.random() < grainStrength * 0.25) {
          const brightness = Math.random() * 140 + 60;
          const isTinted = Math.random() > 0.4;
          if (isTinted) {
            d[i] = brightness * 0.3;
            d[i + 1] = brightness * 0.7;
            d[i + 2] = brightness * 0.4;
            d[i + 3] = Math.floor(grainStrength * (25 + Math.random() * 40));
          } else {
            d[i] = brightness * 0.5;
            d[i + 1] = brightness * 0.7;
            d[i + 2] = brightness * 0.55;
            d[i + 3] = Math.floor(grainStrength * (12 + Math.random() * 25));
          }
        }
        const fold1Center = 0.55;
        const fold1 = Math.max(0, 1 - Math.abs(ny - fold1Center) / 0.04);
        const fold1X = px / cw;
        const fold1XFade = fold1X > 0.15 && fold1X < 0.5 ? Math.sin((fold1X - 0.15) / 0.35 * Math.PI) : 0;
        const fold2Center = 0.7;
        const fold2 = Math.max(0, 1 - Math.abs(ny - fold2Center) / 0.03);
        const fold2XFade = fold1X > 0.3 && fold1X < 0.7 ? Math.sin((fold1X - 0.3) / 0.4 * Math.PI) : 0;
        const foldIntensity = fold1 * fold1XFade * 0.18 + fold2 * fold2XFade * 0.14;
        if (foldIntensity > 0.01) {
          d[i] = Math.min(255, d[i] + 120 * foldIntensity);
          d[i + 1] = Math.min(255, d[i + 1] + 180 * foldIntensity);
          d[i + 2] = Math.min(255, d[i + 2] + 130 * foldIntensity);
          d[i + 3] = Math.max(d[i + 3], Math.floor(foldIntensity * 255));
        }
      }
      ctx.putImageData(imageData, 0, 0);
      container.appendChild(canvas);
    }
    function interpolateSmooth(points) {
      if (points.length < 2) return points.map((p, i) => ({
        ...p,
        isReal: true,
        realIdx: i,
        realDate: p.date,
        realValue: p.value
      }));
      const totalSteps = 120;
      const out = [];
      for (let s = 0; s <= totalSteps; s++) {
        const t = s / totalSteps;
        const realT = t * (points.length - 1);
        const idx0 = Math.min(Math.floor(realT), points.length - 2);
        const frac = realT - idx0;
        const value = points[idx0].value + (points[idx0 + 1].value - points[idx0].value) * frac;
        const nearestReal = Math.round(realT);
        const isOnReal = Math.abs(realT - nearestReal) < 0.5 / (points.length - 1);
        const rp = isOnReal ? points[nearestReal] : null;
        out.push({
          date: rp ? rp.date : points[idx0].date,
          value,
          isReal: !!rp,
          realIdx: rp ? nearestReal : -1,
          realDate: rp ? rp.date : null,
          realValue: rp ? rp.value : null
        });
      }
      return out;
    }
    function renderGrowthChart(container, points, sym, periodMonths) {
      const W = 800, H = 256;
      const PAD = { top: 10, right: 0, bottom: 36, left: 0 };
      const cW = W;
      const cH = H - PAD.top - PAD.bottom;
      const ns = "http://www.w3.org/2000/svg";
      const uid = Date.now();
      const wave = interpolateSmooth(points);
      const vals = wave.map((p) => p.value);
      const dataMin = Math.min(...vals);
      const dataMax = Math.max(...vals);
      const dataRange = dataMax - dataMin || dataMax * 0.1 || 1;
      const minV = dataMin - dataRange * 1.2;
      const maxV = dataMax + dataRange * 0.3;
      const range = maxV - minV || 1;
      const xOf = (i) => i / Math.max(wave.length - 1, 1) * cW;
      const yOf = (v) => PAD.top + cH - (v - minV) / range * cH;
      const bottomY = H;
      const wx = wave.map((_, i) => xOf(i));
      const wy = wave.map((p) => yOf(p.value));
      const n = wave.length;
      const alpha = 1 / 6;
      let lineD = `M${wx[0]},${wy[0]}`;
      for (let i = 0; i < n - 1; i++) {
        const p0 = i > 0 ? i - 1 : 0;
        const p3 = i + 2 < n ? i + 2 : n - 1;
        const cp1x = wx[i] + (wx[i + 1] - wx[p0]) * alpha;
        const cp1y = wy[i] + (wy[i + 1] - wy[p0]) * alpha;
        const cp2x = wx[i + 1] - (wx[p3] - wx[i]) * alpha;
        const cp2y = wy[i + 1] - (wy[p3] - wy[i]) * alpha;
        lineD += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${wx[i + 1]},${wy[i + 1]}`;
      }
      const areaD = lineD + ` L${cW},${bottomY} L0,${bottomY} Z`;
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("class", "pc-growth-svg");
      svg.setAttribute("preserveAspectRatio", "none");
      const defs = document.createElementNS(ns, "defs");
      const gradId = "ag" + uid;
      const grad = document.createElementNS(ns, "linearGradient");
      grad.setAttribute("id", gradId);
      grad.setAttribute("x1", "0");
      grad.setAttribute("y1", "0");
      grad.setAttribute("x2", "0");
      grad.setAttribute("y2", "1");
      const stops = [
        ["0%", "hsl(155, 35%, 45%)", "0.55"],
        ["35%", "hsl(155, 28%, 30%)", "0.30"],
        ["70%", "hsl(155, 20%, 18%)", "0.10"],
        ["100%", "hsl(240, 15%, 4%)", "0"]
      ];
      for (const [off, color, op] of stops) {
        const s = document.createElementNS(ns, "stop");
        s.setAttribute("offset", off);
        s.setAttribute("stop-color", color);
        s.setAttribute("stop-opacity", op);
        grad.appendChild(s);
      }
      defs.appendChild(grad);
      svg.appendChild(defs);
      const area = document.createElementNS(ns, "path");
      area.setAttribute("d", areaD);
      area.setAttribute("fill", `url(#${gradId})`);
      area.setAttribute("stroke", "none");
      svg.appendChild(area);
      const line = document.createElementNS(ns, "path");
      line.setAttribute("d", lineD);
      line.setAttribute("class", "pc-growth-line");
      svg.appendChild(line);
      const MNAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const labelPad = 30;
      if (periodMonths > 0) {
        for (let m = 0; m < 12; m++) {
          const x = labelPad + m / 11 * (cW - labelPad * 2);
          const lbl = document.createElementNS(ns, "text");
          lbl.setAttribute("x", x);
          lbl.setAttribute("y", H - 12);
          lbl.setAttribute("class", "pc-growth-month-label");
          lbl.textContent = MNAMES[m];
          svg.appendChild(lbl);
        }
      } else {
        const firstDate = points[0].date;
        const lastDate = points[points.length - 1].date;
        const firstYear = parseInt(firstDate.slice(0, 4));
        const lastYear = parseInt(lastDate.slice(0, 4));
        const years = [];
        for (let y = firstYear; y <= lastYear; y++) years.push(y);
        if (years.length < 2) years.push(lastYear);
        for (let i = 0; i < years.length; i++) {
          const x = labelPad + i / Math.max(years.length - 1, 1) * (cW - labelPad * 2);
          const lbl = document.createElementNS(ns, "text");
          lbl.setAttribute("x", x);
          lbl.setAttribute("y", H - 12);
          lbl.setAttribute("class", "pc-growth-month-label");
          lbl.textContent = String(years[i]);
          svg.appendChild(lbl);
        }
      }
      const dot = document.createElementNS(ns, "circle");
      dot.setAttribute("r", "4");
      dot.setAttribute("class", "pc-growth-dot");
      dot.style.display = "none";
      svg.appendChild(dot);
      const hitArea = document.createElementNS(ns, "rect");
      hitArea.setAttribute("x", "0");
      hitArea.setAttribute("y", "0");
      hitArea.setAttribute("width", W);
      hitArea.setAttribute("height", H);
      hitArea.setAttribute("fill", "transparent");
      hitArea.style.cursor = "default";
      svg.appendChild(hitArea);
      container.appendChild(svg);
      requestAnimationFrame(() => {
        const rect = svg.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          paintGrainCanvas(container, Math.round(rect.width), Math.round(rect.height));
        }
      });
      const tooltip = container.createDiv({ cls: "pc-growth-tooltip" });
      tooltip.style.display = "none";
      const fmtVal = (v) => v >= 1e6 ? `${fmt(v / 1e6, 2)}M` : fmt(v);
      const fmtD = (d) => {
        const parts = d.split("-");
        if (parts.length < 3) return d;
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        return months[parseInt(parts[1]) - 1];
      };
      const waveCoords = wave.map((p, i) => ({ x: xOf(i), y: yOf(p.value) }));
      const PROX = 20;
      function nearestIdx(mouseX) {
        const svgRect = svg.getBoundingClientRect();
        const scaleX = W / svgRect.width;
        const svgX = (mouseX - svgRect.left) * scaleX;
        let best = 0, bestDist = Infinity;
        for (let i = 0; i < wave.length; i++) {
          const dd = Math.abs(waveCoords[i].x - svgX);
          if (dd < bestDist) {
            bestDist = dd;
            best = i;
          }
        }
        return best;
      }
      function showDot(idx) {
        const cx = waveCoords[idx].x, cy = waveCoords[idx].y;
        const wp = wave[idx];
        const dispVal = wp.realValue != null ? wp.realValue : wp.value;
        const dispDate = wp.realDate || wp.date;
        dot.setAttribute("cx", cx);
        dot.setAttribute("cy", cy);
        dot.style.display = "";
        tooltip.empty();
        tooltip.createEl("p", { cls: "pc-growth-tt-date", text: fmtD(dispDate) });
        tooltip.createEl("p", { cls: "pc-growth-tt-val", text: `${sym}${fmtVal(dispVal)}` });
        tooltip.style.display = "block";
        const svgRect = svg.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const dotScreenX = svgRect.left + cx / W * svgRect.width - containerRect.left;
        const dotScreenY = svgRect.top + cy / H * svgRect.height - containerRect.top;
        let tx = dotScreenX + 14;
        let ty = dotScreenY - 50;
        if (tx + 140 > containerRect.width) tx = dotScreenX - 150;
        if (ty < 0) ty = dotScreenY + 20;
        tooltip.style.left = tx + "px";
        tooltip.style.top = ty + "px";
      }
      function hideDot() {
        dot.style.display = "none";
        tooltip.style.display = "none";
      }
      hitArea.addEventListener("mousemove", (e) => {
        const svgRect = svg.getBoundingClientRect();
        const scaleY = H / svgRect.height;
        const svgY = (e.clientY - svgRect.top) * scaleY;
        const idx = nearestIdx(e.clientX);
        const dy = Math.abs(svgY - waveCoords[idx].y);
        if (dy < PROX) {
          hitArea.style.cursor = "crosshair";
          showDot(idx);
        } else {
          hitArea.style.cursor = "default";
          hideDot();
        }
      });
      hitArea.addEventListener("mouseleave", hideDot);
      hitArea.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (e.touches[0]) showDot(nearestIdx(e.touches[0].clientX));
      });
      hitArea.addEventListener("touchend", hideDot);
    }
    function renderCapitalChart(container, history, assets, settings, budget, accounts, allLedger) {
      const sym = settings.homeCurrencySymbol;
      const investedCapital = assets.reduce((s, a) => s + a.currentValueRub, 0);
      const liquidTotal = getLiquidTotal(settings, accounts, allLedger);
      const totalCapital = investedCapital + liquidTotal;
      let allPoints = history.length >= 2 ? [...history] : buildCapitalTimeline(assets, settings);
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      if (allPoints.length < 2 && investedCapital > 0) {
        const ago = /* @__PURE__ */ new Date();
        ago.setMonth(ago.getMonth() - 6);
        allPoints = [
          { date: ago.toISOString().slice(0, 10), value: investedCapital * 0.95 },
          { date: today, value: investedCapital }
        ];
      }
      if (allPoints.length < 2) return;
      const portfolioValue = investedCapital;
      const netProfit = assets.reduce((s, a) => s + toNum(a.plAmount) * a.fx, 0);
      const passiveTotal = assets.reduce((s, a) => s + toNum(a.passiveIncomeTot) * a.fx, 0);
      const totalReturn = netProfit + passiveTotal;
      const totalInvBasis = assets.reduce((s, a) => {
        const basis = a.currentValueRub - toNum(a.plAmount) * a.fx;
        return s + Math.max(basis, 0);
      }, 0);
      const returnPct = totalInvBasis > 0 ? totalReturn / totalInvBasis * 100 : 0;
      if (investedCapital > 0) {
        const todayMonth = today.slice(0, 7);
        const tidx = allPoints.findIndex((p) => p.date.startsWith(todayMonth));
        if (tidx >= 0) allPoints[tidx] = { date: today, value: investedCapital };
        else allPoints.push({ date: today, value: investedCapital });
      }
      const card = container.createDiv({ cls: "pc-cap-card" });
      const hero = card.createDiv({ cls: "pc-cap-hero" });
      hero.createEl("p", { cls: "pc-cap-hero-label", text: "PORTFOLIO" });
      const valDiv = hero.createDiv({ cls: "pc-cap-hero-row" });
      valDiv.createEl("span", { cls: "pc-cap-hero-value", text: `${sym}${fmt(portfolioValue, 0)}` });
      const metricsRow = hero.createDiv({ cls: "pc-cap-metrics" });
      const arrow = totalReturn >= 0 ? "\u2197" : "\u2198";
      metricsRow.createEl("span", {
        cls: `pc-cap-metric-return ${totalReturn >= 0 ? "pc-pos" : "pc-neg"}`,
        text: `${arrow} ${totalReturn >= 0 ? "+" : ""}${fmt(totalReturn, 0)} ${sym}  (${returnPct >= 0 ? "+" : ""}${fmt(returnPct, 1)}%)`
      });
      if (passiveTotal > 0) {
        metricsRow.createEl("span", {
          cls: "pc-cap-metric-passive",
          text: `\u{1F4B0} ${fmt(passiveTotal, 0)} ${sym} income`
        });
      }
      const periodBar = hero.createDiv({ cls: "pc-period-bar" });
      const periods = [
        { label: "12M", months: 12 },
        { label: "ALL", months: 0 }
      ];
      let activePeriod = "ALL";
      const chartArea = card.createDiv({ cls: "pc-chart-area" });
      function filterPoints(months) {
        if (months === 0) return allPoints;
        const cutoff = /* @__PURE__ */ new Date();
        cutoff.setMonth(cutoff.getMonth() - months);
        const cutStr = cutoff.toISOString().slice(0, 10);
        const filtered = allPoints.filter((p) => p.date >= cutStr);
        return filtered.length >= 2 ? filtered : allPoints;
      }
      function draw(periodMonths) {
        chartArea.empty();
        renderGrowthChart(chartArea, filterPoints(periodMonths), sym, periodMonths);
      }
      for (const p of periods) {
        const btn = periodBar.createEl("button", {
          cls: `pc-period-btn ${p.label === activePeriod ? "pc-period-btn--active" : ""}`,
          text: p.label
        });
        btn.onclick = () => {
          activePeriod = p.label;
          periodBar.querySelectorAll(".pc-period-btn").forEach((b) => b.classList.remove("pc-period-btn--active"));
          btn.classList.add("pc-period-btn--active");
          draw(p.months);
        };
      }
      draw(0);
    }
    module2.exports = { paintGrainCanvas, interpolateSmooth, renderGrowthChart, renderCapitalChart };
  }
});

// src/modals/strategy.js
var require_strategy = __commonJS({
  "src/modals/strategy.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { showNotice: showNotice2, killWheelChange } = require_utils();
    var StrategyModal = class extends Modal2 {
      constructor(app, plugin, onSave) {
        super(app);
        this.plugin = plugin;
        this.onSave = onSave;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("pc-strategy-modal");
        const s = this.plugin.settings;
        const wrap = contentEl.createDiv({ cls: "pc-strategy-form" });
        wrap.createEl("h2", { cls: "pc-strategy-title", text: "Strategy Targets" });
        wrap.createEl("p", { cls: "pc-strategy-desc", text: "Set target allocation for each basket. Leave at 0 to skip. Alerts appear here and in reports when allocation drifts more than 5% from target." });
        const fields = [
          { key: "targetCore", label: "\u{1F3DB} Core (bonds, ETFs, index)", val: s.targetCore || 0 },
          { key: "targetFlash", label: "\u26A1 Flash (shares, crypto)", val: s.targetFlash || 0 },
          { key: "targetReserve", label: "\u{1F6E1} Reserve (deposits, cash)", val: s.targetReserve || 0 }
        ];
        const inputs = {};
        for (const f of fields) {
          const row = wrap.createDiv({ cls: "pc-strategy-row" });
          row.createEl("label", { cls: "pc-strategy-label", text: f.label });
          const inp = row.createEl("input", { cls: "pc-strategy-input", type: "number", attr: { min: "0", max: "100", step: "1" } });
          inp.value = String(f.val);
          killWheelChange(inp);
          inputs[f.key] = inp;
          row.createEl("span", { cls: "pc-strategy-pct", text: "%" });
        }
        const totalRow = wrap.createDiv({ cls: "pc-strategy-total-row" });
        totalRow.createEl("span", { text: "Total" });
        const totalVal = totalRow.createEl("span", { cls: "pc-strategy-total-val" });
        function updateTotal() {
          let sum = 0;
          for (const f of fields) sum += parseInt(inputs[f.key].value) || 0;
          totalVal.textContent = `${sum}%`;
          totalVal.classList.toggle("pc-chq-neg", sum !== 100 && sum !== 0);
          totalVal.classList.toggle("pc-chq-pos", sum === 100);
        }
        for (const f of fields) inputs[f.key].addEventListener("input", updateTotal);
        updateTotal();
        const alertWrap = wrap.createDiv({ cls: "pc-strategy-alerts" });
        const hasTargets = (s.targetCore || 0) + (s.targetFlash || 0) + (s.targetReserve || 0) > 0;
        if (hasTargets) {
          alertWrap.createEl("p", { cls: "pc-strategy-alert-title", text: "Current Alerts" });
          alertWrap.createEl("p", { cls: "pc-strategy-alert-note", text: "Refresh dashboard to see updated alerts after saving." });
        }
        const btnRow = wrap.createDiv({ cls: "pc-strategy-btn-row" });
        const clearBtn = btnRow.createEl("button", { cls: "pc-strategy-clear-btn", text: "Clear targets" });
        clearBtn.onclick = async () => {
          this.plugin.settings.targetCore = 0;
          this.plugin.settings.targetFlash = 0;
          this.plugin.settings.targetReserve = 0;
          this.plugin.settings.strategyEnabled = false;
          await this.plugin.saveSettings();
          showNotice2("Strategy targets cleared");
          this.close();
          if (this.onSave) this.onSave();
        };
        const saveBtn = btnRow.createEl("button", { cls: "mod-cta", text: "Save Strategy" });
        saveBtn.onclick = async () => {
          let anySet = false;
          for (const f of fields) {
            const v = parseInt(inputs[f.key].value) || 0;
            this.plugin.settings[f.key] = v;
            if (v > 0) anySet = true;
          }
          this.plugin.settings.strategyEnabled = anySet;
          await this.plugin.saveSettings();
          showNotice2("\u2713 Strategy targets saved");
          this.close();
          if (this.onSave) this.onSave();
        };
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    module2.exports = { StrategyModal };
  }
});

// src/ui/baskets.js
var require_baskets2 = __commonJS({
  "src/ui/baskets.js"(exports2, module2) {
    var { fmt } = require_utils();
    var { BASKET_META, buildBasketData } = require_baskets();
    function renderBaskets(container, assets, settings, sym, app, plugin, accounts, allLedger) {
      const { StrategyModal } = require_strategy();
      const { baskets, total } = buildBasketData(assets, settings, accounts, allLedger);
      const hasTargets = (settings.targetCore || 0) + (settings.targetFlash || 0) + (settings.targetReserve || 0) > 0;
      const wrap = container.createDiv({ cls: "pc-baskets" });
      const hdr = wrap.createDiv({ cls: "pc-baskets-header" });
      hdr.createEl("div", { cls: "pc-baskets-title", text: "Allocation" });
      const stratBtn = hdr.createEl("button", { cls: "pc-strategy-btn", text: "\u2699 Strategy" });
      stratBtn.onclick = () => new StrategyModal(app, plugin, () => {
      }).open();
      const grid = wrap.createDiv({ cls: "pc-baskets-grid" });
      for (const [key, meta] of Object.entries(BASKET_META)) {
        const bk = baskets[key];
        const onTarget = hasTargets && bk.target > 0 && Math.abs(bk.pct - bk.target) < 5;
        const over = hasTargets && bk.target > 0 && bk.pct > bk.target;
        const panel = grid.createDiv({ cls: "pc-basket-panel" });
        const phdr = panel.createDiv({ cls: "pc-basket-hdr" });
        phdr.createEl("span", { cls: "pc-basket-icon", text: meta.icon });
        phdr.createEl("span", { cls: "pc-basket-name", text: meta.label });
        const pctCls = hasTargets && bk.target > 0 ? onTarget ? "pc-basket-pct pc-basket-pct--ok" : over ? "pc-basket-pct pc-basket-pct--over" : "pc-basket-pct" : "pc-basket-pct";
        panel.createEl("div", { cls: pctCls, text: `${fmt(bk.pct, 1)}%` });
        if (hasTargets && bk.target > 0) {
          const barWrap = panel.createDiv({ cls: "pc-basket-bar-wrap" });
          const barFill = barWrap.createDiv({ cls: "pc-basket-bar-fill" });
          barFill.style.width = `${Math.min(bk.pct / bk.target * 100, 100)}%`;
          barFill.style.background = meta.color;
          barWrap.createDiv({ cls: "pc-basket-bar-marker" }).style.left = "100%";
        }
        const foot = panel.createDiv({ cls: "pc-basket-foot" });
        foot.createEl("span", { cls: "pc-basket-value", text: `${fmt(bk.value)} ${sym}` });
        if (hasTargets && bk.target > 0) {
          foot.createEl("span", { cls: "pc-basket-target", text: `/ ${bk.target}%` });
        }
        panel.createEl("div", { cls: "pc-basket-count", text: `${bk.assets.length} instrument${bk.assets.length !== 1 ? "s" : ""}` });
      }
    }
    module2.exports = { renderBaskets };
  }
});

// src/assets/parser.js
var require_parser = __commonJS({
  "src/assets/parser.js"(exports2, module2) {
    var { toNum } = require_utils();
    function parseAssetBody(bodyText) {
      const lines = bodyText.split("\n").map((l) => l.trim()).filter(Boolean);
      let currentQty = 0;
      let totalInvested = 0;
      let currentPrice = null;
      let passiveIncomeTot = 0;
      let initialDate = null;
      let lastUpdated = null;
      let lastDivDate = null;
      const chronoLines = [...lines].reverse();
      for (const line of chronoLines) {
        const parts = line.includes("|") ? line.split("|").map((p) => p.trim()) : line.split(/\s+/);
        if (parts.length < 4) continue;
        const dateStr = parts[0];
        const op = parts[1].toLowerCase();
        const qtyRaw = parts[2];
        const valRaw = parts[3];
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) continue;
        if (!initialDate || date < new Date(initialDate)) initialDate = dateStr;
        if (!lastUpdated || date > new Date(lastUpdated)) lastUpdated = dateStr;
        const qty = toNum(qtyRaw);
        const val = toNum(valRaw);
        if (op === "buy") {
          currentQty += qty;
          totalInvested += qty * val;
        } else if (op === "sell") {
          const costPerShare = currentQty > 0 ? totalInvested / currentQty : 0;
          currentQty -= qty;
          totalInvested -= qty * costPerShare;
          if (currentQty < 0) currentQty = 0;
          if (totalInvested < 0) totalInvested = 0;
        } else if (op === "div") {
          passiveIncomeTot += val;
          if (!lastDivDate || dateStr > lastDivDate) lastDivDate = dateStr;
        } else if (op === "capitalize") {
          totalInvested += val;
          passiveIncomeTot += val;
        } else if (op === "reinvest") {
          currentQty += qty;
          totalInvested += qty * val;
        } else if (op === "price") {
          currentPrice = val;
        }
      }
      const avgCost = currentQty > 0 ? totalInvested / currentQty : 0;
      const currentValue = currentPrice != null ? currentPrice * currentQty : totalInvested;
      const plAmount = currentValue - totalInvested;
      const plPct = totalInvested > 0 ? plAmount / totalInvested * 100 : 0;
      return {
        currentQty: parseFloat(currentQty.toFixed(6)),
        avgCost: parseFloat(avgCost.toFixed(4)),
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        currentPrice: currentPrice != null ? parseFloat(currentPrice.toFixed(4)) : null,
        currentValue: parseFloat(currentValue.toFixed(2)),
        plAmount: parseFloat(plAmount.toFixed(2)),
        plPct: parseFloat(plPct.toFixed(2)),
        passiveIncomeTot: parseFloat(passiveIncomeTot.toFixed(2)),
        initialDate,
        lastUpdated,
        lastDivDate
      };
    }
    module2.exports = { parseAssetBody };
  }
});

// src/assets/recalc.js
var require_recalc = __commonJS({
  "src/assets/recalc.js"(exports2, module2) {
    var { parseAssetBody } = require_parser();
    var { toNum } = require_utils();
    async function recalcAsset2(app, file) {
      const raw = await app.vault.read(file);
      const fmEnd = raw.indexOf("---", 3);
      if (fmEnd === -1) return null;
      const body = raw.slice(fmEnd + 3).replace(/^\n/, "");
      const stats = parseAssetBody(body);
      const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
      if (String(fm.type).toLowerCase() === "deposit" && toNum(fm.interest_rate) > 0) {
        const principal = stats.totalInvested;
        const rate = toNum(fm.interest_rate) / 100;
        const startDate = stats.lastDivDate || stats.initialDate || fm.initial_date;
        if (startDate && principal > 0) {
          const days = Math.max(0, Math.floor(
            (Date.now() - new Date(startDate).getTime()) / 864e5
          ));
          const accrued = principal * rate * (days / 365);
          stats.currentValue = parseFloat((principal + accrued).toFixed(2));
          stats.currentPrice = stats.currentQty > 0 ? parseFloat((stats.currentValue / stats.currentQty).toFixed(4)) : null;
          stats.plAmount = parseFloat(accrued.toFixed(2));
          stats.plPct = parseFloat((accrued / principal * 100).toFixed(2));
        }
      }
      await app.fileManager.processFrontMatter(file, (fm2) => {
        fm2.current_qty = stats.currentQty;
        fm2.avg_cost = stats.avgCost;
        fm2.total_invested = stats.totalInvested;
        fm2.current_price = stats.currentPrice ?? null;
        fm2.current_value = stats.currentValue;
        fm2.pl_amount = stats.plAmount;
        fm2.pl_pct = stats.plPct;
        fm2.passive_income_total = stats.passiveIncomeTot;
        if (stats.initialDate) fm2.initial_date = stats.initialDate;
        fm2.last_updated = stats.lastUpdated ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      });
      return stats;
    }
    module2.exports = { recalcAsset: recalcAsset2 };
  }
});

// src/assets/prices.js
var require_prices = __commonJS({
  "src/assets/prices.js"(exports2, module2) {
    var { requestUrl } = require("obsidian");
    var { toNum } = require_utils();
    var { recalcAsset: recalcAsset2 } = require_recalc();
    var { writeLedgerEntries } = require_io();
    function resolveApiTicker(fm, filename) {
      if (fm.ticker) return String(fm.ticker).trim();
      const name = String(fm.name || filename).trim();
      return name.replace(/@+$/, "");
    }
    async function moexDiscoverMarket(ticker) {
      const url = `https://iss.moex.com/iss/securities/${encodeURIComponent(ticker)}.json?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine,is_primary`;
      try {
        const resp = await requestUrl({ url, method: "GET" });
        const rows = resp.json?.boards?.data;
        if (!rows || rows.length === 0) return null;
        const primary = rows.find((r) => r[4] === 1) || rows[0];
        return { engine: primary[3], market: primary[2], board: primary[1] };
      } catch (e) {
        console.warn(`[PC] MOEX discover failed for ${ticker}:`, e);
        return null;
      }
    }
    async function moexGetFaceValue(ticker) {
      const url = `https://iss.moex.com/iss/securities/${encodeURIComponent(ticker)}.json?iss.meta=off&iss.only=description&description.columns=name,value`;
      try {
        const resp = await requestUrl({ url, method: "GET" });
        const rows = resp.json?.description?.data;
        if (!rows) return 1e3;
        const fv = rows.find((r) => r[0] === "FACEVALUE");
        return fv ? toNum(fv[1]) : 1e3;
      } catch (_) {
        return 1e3;
      }
    }
    async function fetchMoexPrices(ticker, fromDate, marketInfo) {
      if (!marketInfo) return [];
      const { engine, market, board } = marketInfo;
      const results = [];
      let start = 0;
      const from = fromDate || "2020-01-01";
      while (true) {
        const url = `https://iss.moex.com/iss/history/engines/${engine}/markets/${market}/boards/${board}/securities/${encodeURIComponent(ticker)}.json?from=${from}&till=2099-12-31&start=${start}&iss.meta=off&history.columns=TRADEDATE,CLOSE,NUMTRADES`;
        let data;
        try {
          const resp = await requestUrl({ url, method: "GET" });
          data = resp.json;
        } catch (e) {
          console.warn(`[PC] MOEX fetch failed for ${ticker}:`, e);
          break;
        }
        const rows = data?.history?.data;
        if (!rows || rows.length === 0) break;
        for (const row of rows) {
          const [date, close, numTrades] = row;
          if (close != null && close > 0) {
            results.push({ date, close });
          }
        }
        if (rows.length < 100) break;
        start += 100;
      }
      return results;
    }
    async function fetchMoexDividends(ticker, afterDate) {
      const url = `https://iss.moex.com/iss/securities/${encodeURIComponent(ticker)}/dividends.json?iss.meta=off`;
      try {
        const resp = await requestUrl({ url, method: "GET" });
        const rows = resp.json?.dividends?.data;
        if (!rows) return [];
        return rows.filter((r) => r[2] > afterDate && r[3] != null && r[3] > 0).map((r) => ({ date: r[2], perShare: r[3] }));
      } catch (e) {
        console.warn(`[PC] MOEX dividends failed for ${ticker}:`, e);
        return [];
      }
    }
    async function fetchMoexCoupons(ticker, afterDate) {
      const url = `https://iss.moex.com/iss/securities/${encodeURIComponent(ticker)}/bondization.json?iss.meta=off&iss.only=coupons&coupons.columns=coupondate,value_rub`;
      try {
        const resp = await requestUrl({ url, method: "GET" });
        const rows = resp.json?.coupons?.data;
        if (!rows) return [];
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        return rows.filter((r) => r[0] > afterDate && r[0] <= today && r[1] != null && r[1] > 0).map((r) => ({ date: r[0], perBond: r[1] }));
      } catch (e) {
        console.warn(`[PC] MOEX coupons failed for ${ticker}:`, e);
        return [];
      }
    }
    async function fetchYahooPrices(ticker, fromDate) {
      const from = fromDate ? Math.floor(new Date(fromDate).getTime() / 1e3) : 0;
      const to = Math.floor(Date.now() / 1e3);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${from}&period2=${to}&interval=1d&events=div`;
      let data;
      try {
        const resp = await requestUrl({ url, method: "GET" });
        data = resp.json;
      } catch (e) {
        console.warn(`[PC] Yahoo fetch failed for ${ticker}:`, e);
        return { prices: [], dividends: [] };
      }
      const result = data?.chart?.result?.[0];
      if (!result) return { prices: [], dividends: [] };
      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];
      const prices = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] == null) continue;
        const d = new Date(timestamps[i] * 1e3);
        const dateStr = d.toISOString().slice(0, 10);
        prices.push({ date: dateStr, close: parseFloat(closes[i].toFixed(4)) });
      }
      const dividends = [];
      const divEvents = result.events?.dividends;
      if (divEvents) {
        for (const key of Object.keys(divEvents)) {
          const ev = divEvents[key];
          const d = new Date(ev.date * 1e3);
          dividends.push({
            date: d.toISOString().slice(0, 10),
            perShare: parseFloat(ev.amount.toFixed(4))
          });
        }
      }
      return { prices, dividends };
    }
    function getAssetSource(currency, type, ticker) {
      if (String(type || "").toLowerCase() === "bond") return "moex";
      if (ticker && /^RU\d{3}[A-Z0-9]+$/i.test(String(ticker))) return "moex";
      return String(currency || "").toUpperCase() === "RUB" ? "moex" : "yahoo";
    }
    async function updateSingleAssetPrice(app, file, settings, statusCb) {
      const raw = await app.vault.read(file);
      const fmEnd = raw.indexOf("---", 3);
      if (fmEnd === -1) return { updated: false, ticker: file.basename, error: "no frontmatter" };
      const cache = app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter ?? {};
      const apiTicker = resolveApiTicker(fm, file.basename);
      const currency = String(fm.currency || "RUB").toUpperCase();
      const type = String(fm.type || "shares").toLowerCase();
      const lastUp = fm.last_updated || fm.initial_date || "2020-01-01";
      const qty = toNum(fm.current_qty);
      const faceValue = toNum(fm.face_value) || 1e3;
      const divPolicy = String(fm.dividend_policy || "cash").toLowerCase();
      const dividendAcct = fm.dividend_account ? String(fm.dividend_account) : null;
      const assetName = String(fm.name || file.basename);
      const nextDay = new Date(lastUp);
      nextDay.setDate(nextDay.getDate() + 1);
      const fromDate = nextDay.toISOString().slice(0, 10);
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      if (fromDate > today) {
        return { updated: false, ticker: apiTicker, error: "already up to date" };
      }
      if (statusCb) statusCb(apiTicker);
      const source = getAssetSource(currency, type, apiTicker);
      let latestPrice = null;
      let newDivs = [];
      let newPriceLine = null;
      let pricesSeries = [];
      if (source === "moex") {
        const marketInfo = await moexDiscoverMarket(apiTicker);
        if (!marketInfo) {
          return { updated: false, ticker: apiTicker, error: "not found on MOEX" };
        }
        if (type === "bond") {
          const coupons = await fetchMoexCoupons(apiTicker, lastUp);
          for (const c of coupons) {
            const total = parseFloat((c.perBond * qty).toFixed(2));
            newDivs.push({ date: c.date, total });
          }
        } else {
          const divs = await fetchMoexDividends(apiTicker, lastUp);
          for (const d of divs) {
            const total = parseFloat((d.perShare * qty).toFixed(2));
            newDivs.push({ date: d.date, total });
          }
        }
        pricesSeries = await fetchMoexPrices(apiTicker, fromDate, marketInfo);
        if (pricesSeries.length > 0) {
          const latest = pricesSeries[pricesSeries.length - 1];
          if (type === "bond") {
            latestPrice = parseFloat((latest.close / 100 * faceValue).toFixed(2));
          } else {
            latestPrice = latest.close;
          }
          newPriceLine = `${latest.date} | price | \u2014 | ${latestPrice}`;
        }
      } else {
        const { prices, dividends } = await fetchYahooPrices(apiTicker, fromDate);
        if (prices.length === 0 && dividends.length === 0) {
          return { updated: false, ticker: apiTicker, error: "no new Yahoo data" };
        }
        pricesSeries = prices;
        if (qty > 0) {
          for (const div of dividends) {
            const total = parseFloat((div.perShare * qty).toFixed(2));
            newDivs.push({ date: div.date, total });
          }
        }
        if (prices.length > 0) {
          const latest = prices[prices.length - 1];
          latestPrice = latest.close;
          newPriceLine = `${latest.date} | price | \u2014 | ${latestPrice}`;
        }
      }
      if (!newPriceLine && newDivs.length === 0) {
        return { updated: false, ticker: apiTicker, error: "no new data" };
      }
      const body = raw.slice(fmEnd + 3).replace(/^\n/, "");
      const existingLines = body.split("\n").filter((l) => l.trim());
      const existingSet = new Set(existingLines.map((l) => l.replace(/\s+/g, " ").trim()));
      const priceOnOrBefore = (targetDate) => {
        let chosen = null;
        for (const p of pricesSeries) {
          if (p.date <= targetDate) chosen = p.close;
          else break;
        }
        return chosen ?? latestPrice;
      };
      const linesToAdd = [];
      const ledgerEntriesToWrite = [];
      if (newPriceLine && !existingSet.has(newPriceLine.replace(/\s+/g, " ").trim())) {
        const priceDate = newPriceLine.split("|")[0].trim();
        const filtered = existingLines.filter((l) => {
          const parts = l.split("|").map((p) => p.trim());
          return !(parts[0] === priceDate && parts[1] === "price");
        });
        existingLines.length = 0;
        existingLines.push(...filtered);
        linesToAdd.push(newPriceLine);
      }
      newDivs.sort((a, b) => b.date.localeCompare(a.date));
      const effectivePolicy = type === "bond" || type === "deposit" ? "cash" : divPolicy;
      let divsAdded = 0;
      let reinvestsMade = 0;
      for (const d of newDivs) {
        const divLine = `${d.date} | div | \u2014 | ${d.total}`;
        const divKey = divLine.replace(/\s+/g, " ").trim();
        if (existingSet.has(divKey)) continue;
        if (effectivePolicy === "reinvest") {
          const priceOnDate = priceOnOrBefore(d.date);
          if (priceOnDate && priceOnDate > 0) {
            const rawQty = d.total / priceOnDate;
            const qtyReinvest = Math.floor(rawQty * 100) / 100;
            if (qtyReinvest > 0) {
              const gross = parseFloat((qtyReinvest * priceOnDate).toFixed(2));
              const remainder = parseFloat((d.total - gross).toFixed(2));
              const buyLine = `${d.date} | buy | ${qtyReinvest} | ${priceOnDate}`;
              const buyKey = buyLine.replace(/\s+/g, " ").trim();
              if (!existingSet.has(buyKey)) {
                linesToAdd.push(buyLine);
                ledgerEntriesToWrite.push({
                  d: d.date,
                  type: "buy",
                  asset: assetName,
                  qty: qtyReinvest,
                  price: priceOnDate,
                  amt: gross,
                  note: "reinvest: fetcher"
                });
                reinvestsMade += 1;
              }
              if (remainder > 5e-3 && dividendAcct) {
                ledgerEntriesToWrite.push({
                  d: d.date,
                  type: "dividend",
                  asset: assetName,
                  amt: remainder,
                  to: dividendAcct,
                  note: "reinvest remainder: fetcher"
                });
              }
              continue;
            }
          }
        }
        linesToAdd.push(divLine);
        divsAdded += 1;
        if (dividendAcct) {
          ledgerEntriesToWrite.push({
            d: d.date,
            type: "dividend",
            asset: assetName,
            amt: d.total,
            to: dividendAcct,
            note: "fetcher"
          });
        } else {
          console.warn(`[PC] ${apiTicker}: dividend skipped (no dividend_account configured)`);
        }
      }
      if (linesToAdd.length === 0) {
        return { updated: false, ticker: apiTicker, error: "already up to date" };
      }
      const allLines = [...linesToAdd, ...existingLines];
      const newBody = allLines.join("\n") + "\n";
      const fmSection = raw.slice(0, fmEnd + 3);
      await app.vault.modify(file, fmSection + "\n" + newBody);
      if (ledgerEntriesToWrite.length > 0 && settings) {
        try {
          await writeLedgerEntries(app, settings, ledgerEntriesToWrite);
        } catch (e) {
          console.warn(`[PC] ${apiTicker}: ledger write failed:`, e);
        }
      }
      await recalcAsset2(app, file);
      return {
        updated: true,
        ticker: apiTicker,
        newPrice: latestPrice,
        divsAdded: divsAdded + reinvestsMade
      };
    }
    async function updateAllAssetPrices2(app, settings, statusCb) {
      const folder = settings.assetsFolder.toLowerCase().replace(/\/$/, "");
      const files = app.vault.getMarkdownFiles().filter(
        (f) => f.path.toLowerCase().startsWith(folder + "/")
      );
      const results = [];
      for (const file of files) {
        try {
          const r = await updateSingleAssetPrice(app, file, settings, statusCb);
          results.push(r);
        } catch (e) {
          results.push({ updated: false, ticker: file.basename, error: String(e.message || e) });
        }
      }
      const updated = results.filter((r) => r.updated);
      const errors = results.filter((r) => !r.updated && r.error && r.error !== "already up to date");
      return { total: files.length, updated: updated.length, errors, results };
    }
    module2.exports = {
      resolveApiTicker,
      moexDiscoverMarket,
      moexGetFaceValue,
      fetchMoexPrices,
      fetchMoexDividends,
      fetchMoexCoupons,
      fetchYahooPrices,
      getAssetSource,
      updateSingleAssetPrice,
      updateAllAssetPrices: updateAllAssetPrices2
    };
  }
});

// src/assets/templates.js
var require_templates = __commonJS({
  "src/assets/templates.js"(exports2, module2) {
    var { toNum } = require_utils();
    var { writeLedgerEntries } = require_io();
    var { recalcAsset: recalcAsset2 } = require_recalc();
    var MAX_ITERS_PER_TEMPLATE = 500;
    function addDays(dateStr, days) {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    }
    async function applyTemplatesForFile(app, settings, file, today) {
      const cache = app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter ?? {};
      const tpl = fm.template;
      if (!tpl || typeof tpl !== "object") return null;
      const currentQty = toNum(fm.current_qty);
      if (currentQty <= 0) return null;
      const rate = toNum(tpl.rate);
      const freqDays = Math.max(1, Math.round(toNum(tpl.freq_days) || 30));
      const mode = String(tpl.mode || "cash").toLowerCase();
      const account = tpl.account ? String(tpl.account) : null;
      let nextDue = String(tpl.next_due || "").slice(0, 10);
      if (!nextDue || rate <= 0) return null;
      const raw = await app.vault.read(file);
      const fmEnd = raw.indexOf("---", 3);
      if (fmEnd === -1) return null;
      const body = raw.slice(fmEnd + 3).replace(/^\n/, "");
      const existingLines = body.split("\n").filter((l) => l.trim());
      const existingByDate = /* @__PURE__ */ new Map();
      for (const l of existingLines) {
        const parts = l.split("|").map((p) => p.trim());
        if (parts.length < 2) continue;
        const d = parts[0];
        const op = parts[1].toLowerCase();
        if (!existingByDate.has(d)) existingByDate.set(d, /* @__PURE__ */ new Set());
        existingByDate.get(d).add(op);
      }
      const newBodyLines = [];
      const newLedgerEntries = [];
      let principal = toNum(fm.total_invested);
      let opsApplied = 0;
      let iters = 0;
      while (nextDue <= today && iters < MAX_ITERS_PER_TEMPLATE) {
        iters += 1;
        const interest = parseFloat((principal * (rate / 100) * (freqDays / 365)).toFixed(2));
        if (interest <= 5e-3) {
          nextDue = addDays(nextDue, freqDays);
          continue;
        }
        const opName = mode === "capitalize" ? "capitalize" : "div";
        const existingOpsOnDate = existingByDate.get(nextDue);
        const hasConflict = existingOpsOnDate && (existingOpsOnDate.has("div") || existingOpsOnDate.has("capitalize") || existingOpsOnDate.has("reinvest"));
        if (!hasConflict) {
          const line = `${nextDue} | ${opName} | \u2014 | ${interest}`;
          newBodyLines.push(line);
          opsApplied += 1;
          if (mode === "cash" && account) {
            newLedgerEntries.push({
              d: nextDue,
              type: "dividend",
              asset: file.basename,
              amt: interest,
              to: account,
              note: "auto-log template"
            });
          }
        }
        if (mode === "capitalize") principal += interest;
        nextDue = addDays(nextDue, freqDays);
      }
      if (iters >= MAX_ITERS_PER_TEMPLATE) {
        console.warn(`[PC] template catch-up: hit iter limit for ${file.basename}, advancing next_due to today`);
        nextDue = today;
      }
      if (newBodyLines.length > 0) {
        const merged = [...newBodyLines, ...existingLines].join("\n") + "\n";
        const fmSection = raw.slice(0, fmEnd + 3);
        await app.vault.modify(file, fmSection + "\n" + merged);
      }
      await app.fileManager.processFrontMatter(file, (f) => {
        if (!f.template || typeof f.template !== "object") return;
        f.template.next_due = nextDue;
      });
      await recalcAsset2(app, file);
      return { opsApplied, ledgerEntries: newLedgerEntries };
    }
    async function applyTemplates(app, settings) {
      const folder = String(settings.assetsFolder || "").toLowerCase().replace(/\/$/, "");
      if (!folder) return { opsApplied: 0, depositsAffected: 0 };
      const files = app.vault.getMarkdownFiles().filter(
        (f) => f.path.toLowerCase().startsWith(folder + "/")
      );
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const allLedgerEntries = [];
      let opsApplied = 0;
      let depositsAffected = 0;
      for (const file of files) {
        try {
          const result = await applyTemplatesForFile(app, settings, file, today);
          if (!result) continue;
          if (result.opsApplied > 0) {
            depositsAffected += 1;
            opsApplied += result.opsApplied;
          }
          if (result.ledgerEntries.length > 0) {
            allLedgerEntries.push(...result.ledgerEntries);
          }
        } catch (e) {
          console.warn(`[PC] template catch-up failed for ${file.basename}:`, e);
        }
      }
      if (allLedgerEntries.length > 0) {
        try {
          await writeLedgerEntries(app, settings, allLedgerEntries);
        } catch (e) {
          console.warn("[PC] template catch-up: batched ledger write failed:", e);
        }
      }
      return { opsApplied, depositsAffected };
    }
    module2.exports = { applyTemplates };
  }
});

// src/modals/asset-pick.js
var require_asset_pick = __commonJS({
  "src/modals/asset-pick.js"(exports2, module2) {
    var { SuggestModal } = require("obsidian");
    var { fmt } = require_utils();
    var PickAssetModal2 = class extends SuggestModal {
      constructor(app, plugin, onPick) {
        super(app);
        this.plugin = plugin;
        this.onPick = onPick;
      }
      getSuggestions(query) {
        const folder = this.plugin.settings.assetsFolder.toLowerCase().replace(/\/$/, "");
        const q = query.toLowerCase();
        return this.app.vault.getMarkdownFiles().filter((f) => f.path.toLowerCase().startsWith(folder + "/") && f.basename.toLowerCase().includes(q));
      }
      renderSuggestion(item, el) {
        const cache = this.app.metadataCache.getFileCache(item);
        const fm = cache?.frontmatter ?? {};
        el.createEl("div", { text: item.basename });
        el.createEl("small", {
          text: `${fm.type ?? "?"} \xB7 ${fm.currency ?? "?"} \xB7 ${fmt(fm.current_value ?? 0, 2)} \xB7 ${fmt(fm.pl_pct ?? 0, 1)}%`
        });
      }
      onChooseSuggestion(item) {
        this.onPick(item);
      }
    };
    module2.exports = { PickAssetModal: PickAssetModal2 };
  }
});

// src/modals/asset-line.js
var require_asset_line = __commonJS({
  "src/modals/asset-line.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { toNum, showNotice: showNotice2, killWheelChange } = require_utils();
    var { recalcAsset: recalcAsset2 } = require_recalc();
    var { writeLedgerEntry } = require_io();
    var { readAccounts: readAccounts2 } = require_io2();
    var AddAssetLineModal2 = class extends Modal2 {
      constructor(app, file, plugin) {
        super(app);
        this.file = file;
        this.plugin = plugin;
      }
      onOpen() {
        const { contentEl, file } = this;
        contentEl.empty();
        const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
        const isDeposit = String(fm.type || "").toLowerCase() === "deposit";
        const principal = toNum(fm.total_invested);
        const expectedClose = toNum(fm.current_value) || principal;
        const depositQty = Math.max(1, toNum(fm.current_qty) || 1);
        contentEl.createEl("h2", { text: (isDeposit ? "Update deposit: " : "Update ") + file.basename });
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const form = contentEl.createDiv({ cls: "personal-capital-form" });
        const row = (label, input) => {
          const d = form.createDiv();
          d.createEl("label", { text: label });
          d.appendChild(input);
          return input;
        };
        const dateIn = row("Date", contentEl.createEl("input", { type: "date" }));
        dateIn.value = today;
        dateIn.addClass("personal-capital-input");
        const opIn = row("Operation", contentEl.createEl("select"));
        const opOptions = isDeposit ? [
          ["buy", "Top up deposit"],
          ["sell", "Close deposit"],
          ["div", "Interest paid to account"]
        ] : [
          ["buy", "Buy \u2014 purchase shares/units"],
          ["sell", "Sell \u2014 liquidate shares/units"],
          ["div", "Div \u2014 dividend / coupon / interest (cash received)"],
          ["reinvest", "Reinvest \u2014 auto-reinvested (no cash flow)"],
          ["price", "Price \u2014 update current price (no transaction)"]
        ];
        opOptions.forEach(([val, label]) => {
          const o = opIn.createEl("option", { text: label });
          o.value = val;
        });
        opIn.addClass("personal-capital-input");
        const qtyWrap = form.createDiv();
        qtyWrap.createEl("label", { text: "Quantity (units)" });
        const qtyIn = qtyWrap.createEl("input", { type: "number", step: "any" });
        qtyIn.placeholder = "e.g. 5";
        qtyIn.addClass("personal-capital-input");
        killWheelChange(qtyIn);
        const priceWrap = form.createDiv();
        priceWrap.createEl("label", { text: "Price per unit / total amount" });
        const priceIn = priceWrap.createEl("input", { type: "number", step: "any" });
        priceIn.placeholder = "e.g. 186.50";
        priceIn.addClass("personal-capital-input");
        killWheelChange(priceIn);
        const setCurrentPriceWrap = form.createDiv();
        const setCurrentPriceLabel = setCurrentPriceWrap.createEl("label");
        const setCurrentPriceIn = setCurrentPriceLabel.createEl("input", { type: "checkbox" });
        setCurrentPriceLabel.appendText(" Set as current price");
        const feeWrap = form.createDiv();
        feeWrap.createEl("label", { text: "Commission / fee (optional)" });
        const feeIn = feeWrap.createEl("input", { type: "number", step: "any" });
        feeIn.placeholder = "0";
        feeIn.addClass("personal-capital-input");
        killWheelChange(feeIn);
        const acctWrap = form.createDiv();
        acctWrap.createEl("label", { text: "Account" });
        const acctIn = acctWrap.createEl("select");
        acctIn.createEl("option", { text: "\u2014 none \u2014", value: "" });
        acctIn.addClass("personal-capital-input");
        readAccounts2(this.app, this.plugin.settings).then((accts) => {
          for (const a of accts) acctIn.createEl("option", { text: a.name, value: a.name });
        });
        const updateFields = () => {
          const op = opIn.value;
          qtyWrap.style.display = op === "div" || op === "price" || isDeposit && op === "sell" ? "none" : "";
          const priceLabel = priceWrap.querySelector("label");
          if (isDeposit) {
            priceLabel.textContent = op === "sell" ? "Actual amount received" : op === "div" ? "Interest amount" : op === "buy" ? "Top-up amount" : "Amount";
            priceIn.placeholder = op === "sell" && expectedClose > 0 ? `expected \u2248 ${expectedClose}` : op === "div" ? "e.g. 6250" : "e.g. 500000";
          } else {
            priceLabel.textContent = op === "div" ? "Total amount received" : op === "price" ? "Current price" : "Price per unit";
            priceIn.placeholder = "e.g. 186.50";
          }
          acctWrap.style.display = op === "price" || op === "reinvest" ? "none" : "";
          const acctLabel = acctWrap.querySelector("label");
          if (isDeposit) {
            acctLabel.textContent = op === "sell" ? "To account" : op === "div" ? "To account" : "From account";
          } else {
            acctLabel.textContent = op === "sell" || op === "div" ? "Destination account" : "Source account";
          }
          feeWrap.style.display = op === "buy" || op === "sell" ? "" : "none";
          setCurrentPriceWrap.style.display = !isDeposit && (op === "buy" || op === "sell" || op === "reinvest") ? "" : "none";
        };
        opIn.addEventListener("change", updateFields);
        updateFields();
        const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
        const addBtn = btns.createEl("button", { text: "Add", cls: "mod-cta" });
        const cancel = btns.createEl("button", { text: "Cancel" });
        cancel.onclick = () => this.close();
        addBtn.onclick = async () => {
          const date = dateIn.value || today;
          const op = opIn.value;
          let price = priceIn.value.trim();
          if (!price) {
            showNotice2("Price/amount is required");
            return;
          }
          if (isDeposit && op === "sell") {
            const total = toNum(price);
            const perUnit = total / depositQty;
            price = String(parseFloat(perUnit.toFixed(4)));
          }
          const qty = op === "div" || op === "price" ? "\u2014" : isDeposit && op === "sell" ? String(depositQty) : qtyIn.value.trim() || "1";
          const numFee = Math.max(0, toNum(feeIn.value));
          if (op !== "price") {
            const entry = { d: date, asset: file.basename };
            const numQty = toNum(qty);
            const numPrice = toNum(price);
            if (op === "buy" || op === "reinvest") {
              entry.type = "buy";
              entry.qty = numQty;
              entry.price = numPrice;
              entry.amt = numQty * numPrice + numFee;
              if (numFee > 0) entry.fee = numFee;
              if (op === "buy" && acctIn.value) entry.from = acctIn.value;
              if (op === "reinvest") entry.note = "reinvest";
            } else if (op === "sell") {
              entry.type = "sell";
              entry.qty = numQty;
              entry.price = numPrice;
              entry.amt = Math.max(0, numQty * numPrice - numFee);
              if (numFee > 0) entry.fee = numFee;
              if (acctIn.value) entry.to = acctIn.value;
            } else if (op === "div") {
              entry.type = "dividend";
              entry.amt = numPrice;
              if (acctIn.value) entry.to = acctIn.value;
            }
            await writeLedgerEntry(this.app, this.plugin.settings, entry);
          }
          const line = (op === "buy" || op === "sell") && numFee > 0 ? `${date} | ${op} | ${qty} | ${price} | fee=${numFee}` : `${date} | ${op} | ${qty} | ${price}`;
          const extraPriceLine = !isDeposit && setCurrentPriceIn.checked && (op === "buy" || op === "sell" || op === "reinvest") ? `${date} | price | \u2014 | ${price}` : null;
          const insertedLines = extraPriceLine ? `${line}
${extraPriceLine}` : line;
          const raw = await this.app.vault.read(file);
          const fmEnd = raw.indexOf("---", 3);
          let newContent;
          if (fmEnd === -1) {
            newContent = insertedLines + "\n" + raw.trimEnd() + "\n";
          } else {
            const afterFm = raw.slice(fmEnd + 3).replace(/^\n?/, "");
            newContent = raw.slice(0, fmEnd + 3) + "\n" + insertedLines + "\n" + afterFm;
          }
          await this.app.vault.modify(file, newContent);
          const stats = await recalcAsset2(this.app, file);
          showNotice2(`Added ${op} line to ${file.basename}`);
          if (op === "sell") {
            const updatedQty = stats ? stats.currentQty : 1;
            if (updatedQty <= 0) {
              const archiveModal = new Modal2(this.app);
              archiveModal.titleEl.setText(isDeposit ? "Deposit closed" : "Position closed");
              archiveModal.contentEl.createEl("p", {
                text: isDeposit ? `${file.basename} has been closed. Archive this deposit?` : `${file.basename} has 0 units remaining. Archive this position?`
              });
              const archBtns = archiveModal.contentEl.createDiv({ cls: "personal-capital-buttons" });
              const archBtn = archBtns.createEl("button", { text: "Archive", cls: "mod-cta" });
              archBtns.createEl("button", { text: "Keep" }).onclick = () => archiveModal.close();
              archBtn.onclick = async () => {
                await writeLedgerEntry(this.app, this.plugin.settings, {
                  d: date,
                  type: "close",
                  asset: file.basename,
                  amt: 0,
                  note: "position closed"
                });
                const archFolder = this.plugin.settings.archiveFolder || "finance/Data/archive";
                if (!this.app.vault.getAbstractFileByPath(archFolder)) {
                  await this.app.vault.createFolder(archFolder).catch(() => {
                  });
                }
                const newPath = `${archFolder}/${file.basename}.md`;
                await this.app.fileManager.renameFile(file, newPath);
                const archivedFile = this.app.vault.getAbstractFileByPath(newPath);
                if (archivedFile) {
                  await this.app.fileManager.processFrontMatter(archivedFile, (fm2) => {
                    fm2.status = "closed";
                    fm2.closed_date = date;
                    if (fm2.template) delete fm2.template;
                  });
                }
                showNotice2(`\u2713 ${file.basename} archived`);
                archiveModal.close();
              };
              archiveModal.open();
            }
          }
          this.close();
        };
      }
    };
    module2.exports = { AddAssetLineModal: AddAssetLineModal2 };
  }
});

// src/modals/asset-create.js
var require_asset_create = __commonJS({
  "src/modals/asset-create.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { ASSET_TYPES } = require_constants();
    var { toNum, showNotice: showNotice2, fmt, killWheelChange } = require_utils();
    var { recalcAsset: recalcAsset2 } = require_recalc();
    var { writeLedgerEntry } = require_io();
    var { readAccounts: readAccounts2 } = require_io2();
    var CreateAssetModal2 = class extends Modal2 {
      constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "Add new asset" });
        const form = contentEl.createDiv({ cls: "personal-capital-form" });
        const row = (label, input) => {
          const d = form.createDiv();
          d.createEl("label", { text: label });
          d.appendChild(input);
          return input;
        };
        const typeIn = row("Type", contentEl.createEl("select"));
        ASSET_TYPES.forEach((t) => {
          const o = typeIn.createEl("option", { text: t });
          o.value = t;
        });
        typeIn.addClass("personal-capital-input");
        const nameIn = row("Ticker / Name", contentEl.createEl("input", { type: "text" }));
        nameIn.placeholder = "e.g. SBER, AAPL, MyDeposit";
        nameIn.addClass("personal-capital-input");
        const tickerIn = row("Exchange ticker (optional)", contentEl.createEl("input", { type: "text" }));
        tickerIn.placeholder = "e.g. T for \u0422-\u0422\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u0438, SPBE for SPB Exchange";
        tickerIn.addClass("personal-capital-input");
        const currIn = row("Currency", contentEl.createEl("input", { type: "text" }));
        currIn.value = "RUB";
        currIn.addClass("personal-capital-input");
        const faceWrap = form.createDiv();
        faceWrap.createEl("label", { text: "Face value (bonds only)" });
        const faceIn = faceWrap.createEl("input", { type: "number", step: "any" });
        faceIn.placeholder = "1000 (default for Russian bonds)";
        faceIn.addClass("personal-capital-input");
        killWheelChange(faceIn);
        const priceIn = row("Initial price / value", contentEl.createEl("input", { type: "number", step: "any" }));
        priceIn.placeholder = "e.g. 185.50";
        priceIn.addClass("personal-capital-input");
        killWheelChange(priceIn);
        const qtyIn = row("Initial quantity", contentEl.createEl("input", { type: "number", step: "any" }));
        qtyIn.placeholder = "e.g. 10";
        qtyIn.addClass("personal-capital-input");
        killWheelChange(qtyIn);
        const feeIn = row("Commission / fee (optional)", contentEl.createEl("input", { type: "number", step: "any" }));
        feeIn.placeholder = "0";
        feeIn.addClass("personal-capital-input");
        killWheelChange(feeIn);
        const dateIn = row("Initial date", contentEl.createEl("input", { type: "date" }));
        dateIn.value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        dateIn.addClass("personal-capital-input");
        const srcWrap = form.createDiv();
        srcWrap.createEl("label", { text: "Source account" });
        const srcIn = srcWrap.createEl("select");
        srcIn.createEl("option", { text: "\u2014 none \u2014", value: "" });
        srcIn.addClass("personal-capital-input");
        const divPolicyWrap = form.createDiv();
        divPolicyWrap.createEl("label", { text: "Dividend policy" });
        const divPolicyIn = divPolicyWrap.createEl("select");
        [
          ["cash", "Cash \u2014 pay out to account"],
          ["reinvest", "Reinvest \u2014 auto-buy more units"]
        ].forEach(([val, label]) => {
          const o = divPolicyIn.createEl("option", { text: label });
          o.value = val;
        });
        divPolicyIn.addClass("personal-capital-input");
        const divAcctWrap = form.createDiv();
        divAcctWrap.createEl("label", { text: "Dividend account" });
        const divAcctIn = divAcctWrap.createEl("select");
        divAcctIn.createEl("option", { text: "\u2014 none \u2014", value: "" });
        divAcctIn.addClass("personal-capital-input");
        readAccounts2(this.app, this.plugin.settings).then((accts) => {
          for (const a of accts) {
            srcIn.createEl("option", { text: a.name, value: a.name });
            divAcctIn.createEl("option", { text: a.name, value: a.name });
          }
        });
        let divAcctTouched = false;
        divAcctIn.addEventListener("change", () => {
          divAcctTouched = true;
        });
        srcIn.addEventListener("change", () => {
          if (!divAcctTouched) divAcctIn.value = srcIn.value;
        });
        const tplWrap = form.createDiv({ cls: "pc-template-wrap" });
        const tplToggleBtn = tplWrap.createEl("button", {
          text: "+ Add auto-log template",
          cls: "pc-action-btn pc-template-toggle"
        });
        tplToggleBtn.type = "button";
        const tplFields = tplWrap.createDiv({ cls: "pc-template-fields" });
        tplFields.style.display = "none";
        tplFields.createEl("p", {
          text: "The plugin will auto-log interest payments each time you click \u201CUpdate prices\u201D. You can still record or override entries manually at any time.",
          cls: "pc-template-hint"
        });
        const tplRateRow = tplFields.createDiv();
        tplRateRow.createEl("label", { text: "Interest rate (% per year)" });
        const tplRateIn = tplRateRow.createEl("input", { type: "number", step: "any" });
        tplRateIn.placeholder = "e.g. 18.5";
        tplRateIn.addClass("personal-capital-input");
        killWheelChange(tplRateIn);
        const tplFreqRow = tplFields.createDiv();
        tplFreqRow.createEl("label", { text: "Payment every N days" });
        const tplFreqIn = tplFreqRow.createEl("input", { type: "number", step: "1" });
        tplFreqIn.placeholder = "30";
        tplFreqIn.addClass("personal-capital-input");
        killWheelChange(tplFreqIn);
        const tplModeRow = tplFields.createDiv();
        tplModeRow.createEl("label", { text: "Payout mode" });
        const tplModeIn = tplModeRow.createEl("select");
        [
          ["cash", "Paid to account (cash)"],
          ["capitalize", "Capitalized (added to deposit)"]
        ].forEach(([val, label]) => {
          const o = tplModeIn.createEl("option", { text: label });
          o.value = val;
        });
        tplModeIn.addClass("personal-capital-input");
        const tplFirstRow = tplFields.createDiv();
        tplFirstRow.createEl("label", { text: "First payment date" });
        const tplFirstIn = tplFirstRow.createEl("input", { type: "date" });
        tplFirstIn.addClass("personal-capital-input");
        let tplEnabled = false;
        tplToggleBtn.onclick = (e) => {
          e.preventDefault();
          tplEnabled = !tplEnabled;
          tplFields.style.display = tplEnabled ? "" : "none";
          tplToggleBtn.textContent = tplEnabled ? "\xD7 Remove auto-log template" : "+ Add auto-log template";
          if (tplEnabled && !tplFirstIn.value) {
            const startDate = dateIn.value || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
            const d = new Date(startDate);
            d.setDate(d.getDate() + 30);
            tplFirstIn.value = d.toISOString().slice(0, 10);
          }
          if (tplEnabled && !tplFreqIn.value) tplFreqIn.value = "30";
        };
        const updateTypeFields = () => {
          const t = typeIn.value;
          const isDeposit = t === "deposit";
          faceWrap.style.display = t === "bond" ? "" : "none";
          tplWrap.style.display = isDeposit ? "" : "none";
          divPolicyWrap.style.display = t === "bond" || isDeposit ? "none" : "";
          tickerIn.parentElement.style.display = isDeposit ? "none" : "";
          qtyIn.parentElement.style.display = isDeposit ? "none" : "";
          divAcctWrap.style.display = isDeposit ? "none" : "";
          nameIn.parentElement.querySelector("label").textContent = isDeposit ? "Deposit name" : "Ticker / Name";
          priceIn.parentElement.querySelector("label").textContent = isDeposit ? "Deposit amount" : "Initial price / value";
          nameIn.placeholder = isDeposit ? "e.g. Tinkoff \u0432\u043A\u043B\u0430\u0434" : "e.g. SBER, AAPL, MyDeposit";
          priceIn.placeholder = isDeposit ? "e.g. 500000" : "e.g. 185.50";
          if (create) create.textContent = isDeposit ? "Open deposit" : "Create";
        };
        typeIn.addEventListener("change", updateTypeFields);
        const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
        const create = btns.createEl("button", { text: "Create", cls: "mod-cta" });
        const cancel = btns.createEl("button", { text: "Cancel" });
        cancel.onclick = () => this.close();
        updateTypeFields();
        create.onclick = async () => {
          const name = nameIn.value.trim();
          if (!name) {
            showNotice2("Name is required");
            return;
          }
          const assetsFolder = this.plugin.settings.assetsFolder;
          const folderFile = this.app.vault.getAbstractFileByPath(assetsFolder);
          if (!folderFile) await this.app.vault.createFolder(assetsFolder);
          const path = `${assetsFolder}/${name}.md`;
          if (this.app.vault.getAbstractFileByPath(path)) {
            showNotice2("Asset already exists: " + name);
            return;
          }
          const assetType = typeIn.value;
          const qty = assetType === "deposit" ? "1" : qtyIn.value.trim();
          const price = priceIn.value.trim();
          const date = dateIn.value.trim();
          const tickerVal = tickerIn.value.trim();
          const faceVal = faceIn.value.trim();
          const fmLines = [
            "---",
            `name: ${name}`
          ];
          if (tickerVal) fmLines.push(`ticker: ${tickerVal}`);
          fmLines.push(
            `type: ${assetType}`,
            `currency: ${currIn.value.toUpperCase().trim() || "RUB"}`
          );
          if (assetType === "bond" && faceVal) fmLines.push(`face_value: ${faceVal}`);
          if (assetType !== "bond" && assetType !== "deposit") {
            fmLines.push(`dividend_policy: ${divPolicyIn.value}`);
          }
          const dividendAccount = divAcctIn.value || srcIn.value;
          if (dividendAccount) fmLines.push(`dividend_account: ${dividendAccount}`);
          if (assetType === "deposit" && tplEnabled) {
            const tplRate = toNum(tplRateIn.value);
            const tplFreq = Math.max(1, Math.round(toNum(tplFreqIn.value) || 30));
            const tplMode = tplModeIn.value;
            const tplFirst = tplFirstIn.value.trim();
            if (tplRate > 0 && tplFirst) {
              fmLines.push("template:");
              fmLines.push(`  rate: ${tplRate}`);
              fmLines.push(`  freq_days: ${tplFreq}`);
              fmLines.push(`  mode: ${tplMode}`);
              if (tplMode === "cash" && srcIn.value) fmLines.push(`  account: ${srcIn.value}`);
              fmLines.push(`  next_due: ${tplFirst}`);
            }
          }
          fmLines.push(
            "current_qty:",
            "avg_cost:",
            "total_invested:",
            "current_price:",
            "current_value:",
            "pl_amount:",
            "pl_pct:",
            "passive_income_total:",
            `initial_date: ${date}`,
            `last_updated: ${date}`,
            "---"
          );
          const fm = fmLines.join("\n");
          const feeNum = Math.max(0, toNum(feeIn.value));
          const logLine = qty && price ? feeNum > 0 ? `
${date} | buy | ${qty} | ${price} | fee=${feeNum}
` : `
${date} | buy | ${qty} | ${price}
` : "\n";
          await this.app.vault.create(path, fm + logLine);
          const newFile = this.app.vault.getAbstractFileByPath(path);
          if (newFile) await recalcAsset2(this.app, newFile);
          if (qty && price) {
            const q = parseFloat(qty), p = parseFloat(price);
            const entry = {
              d: date,
              type: "buy",
              asset: name,
              qty: q,
              price: p,
              amt: q * p + feeNum
            };
            if (feeNum > 0) entry.fee = feeNum;
            if (srcIn.value) entry.from = srcIn.value;
            await writeLedgerEntry(this.app, this.plugin.settings, entry);
          }
          showNotice2("Created: " + name);
          this.close();
        };
      }
    };
    module2.exports = { CreateAssetModal: CreateAssetModal2 };
  }
});

// src/ui/assets.js
var require_assets = __commonJS({
  "src/ui/assets.js"(exports2, module2) {
    var { fmt, fmtSigned, showNotice: showNotice2, makeInteractive } = require_utils();
    var { updateAllAssetPrices: updateAllAssetPrices2 } = require_prices();
    var { updateFxRates } = require_fx();
    var { applyTemplates } = require_templates();
    function computeAssetMetrics(a) {
      const invested = a.currentValue - a.plAmount;
      const totalReturn = invested > 0 ? (a.plAmount + a.passiveIncomeTot) / invested * 100 : 0;
      const yieldOnCost = invested > 0 ? a.passiveIncomeTot / invested * 100 : 0;
      let cagr = 0;
      if (a.initialDate && invested > 0) {
        const startDate = new Date(a.initialDate);
        const now = /* @__PURE__ */ new Date();
        const years = (now - startDate) / (365.25 * 24 * 3600 * 1e3);
        if (years >= 0.1) {
          const totalValue = a.currentValue + a.passiveIncomeTot;
          cagr = (Math.pow(totalValue / invested, 1 / years) - 1) * 100;
        }
      }
      return {
        totalReturn: parseFloat(totalReturn.toFixed(2)),
        yieldOnCost: parseFloat(yieldOnCost.toFixed(2)),
        cagr: parseFloat(cagr.toFixed(2)),
        invested: parseFloat(invested.toFixed(2))
      };
    }
    function renderAssetCards(container, assets, settings, app, plugin, dashContainer) {
      const { renderDashboard: renderDashboard2 } = require_dashboard();
      const { PickAssetModal: PickAssetModal2 } = require_asset_pick();
      const { AddAssetLineModal: AddAssetLineModal2 } = require_asset_line();
      const { CreateAssetModal: CreateAssetModal2 } = require_asset_create();
      if (assets.length === 0) {
        container.createEl("p", { cls: "pc-empty", text: "No assets yet." });
        return;
      }
      const instrHeader = container.createDiv({ cls: "pc-block-header" });
      instrHeader.createEl("div", { cls: "pc-block-title", text: "Instruments" });
      if (app && plugin && dashContainer) {
        const rerender = () => renderDashboard2(app, settings, dashContainer, plugin);
        const btnGroup = instrHeader.createDiv({ cls: "pc-block-header-actions" });
        const assetActionBtn = btnGroup.createEl("button", { cls: "pc-action-btn", text: "\u21BB Asset action" });
        assetActionBtn.onclick = () => {
          new PickAssetModal2(app, plugin, (file) => {
            const modal = new AddAssetLineModal2(app, file, plugin);
            const origClose = modal.onClose ? modal.onClose.bind(modal) : null;
            modal.onClose = function() {
              if (origClose) origClose();
              rerender();
            };
            modal.open();
          }).open();
        };
        const newAssetBtn = btnGroup.createEl("button", { cls: "pc-action-btn", text: "\uFF0B Asset" });
        newAssetBtn.onclick = () => {
          const modal = new CreateAssetModal2(app, plugin);
          const origClose = modal.onClose ? modal.onClose.bind(modal) : null;
          modal.onClose = function() {
            if (origClose) origClose();
            rerender();
          };
          modal.open();
        };
        const updateBtn = btnGroup.createEl("button", { cls: "pc-update-prices-btn", text: "\u21BB Update prices" });
        updateBtn.onclick = async () => {
          updateBtn.disabled = true;
          const notices = [];
          try {
            updateBtn.textContent = "FX\u2026";
            let fxResult = { updated: false };
            try {
              fxResult = await updateFxRates(settings);
              if (fxResult.updated) {
                await plugin.saveSettings();
                notices.push(`\u2713 FX ${fxResult.source}`);
              } else if (fxResult.error) {
                notices.push(`\u26A0 FX: ${fxResult.error}`);
              }
            } catch (e) {
              console.warn("[PC] FX update threw:", e);
              notices.push(`\u26A0 FX: ${e.message || e}`);
            }
            updateBtn.textContent = "Updating\u2026";
            const result = await updateAllAssetPrices2(app, settings, (ticker) => {
              updateBtn.textContent = `Fetching ${ticker}\u2026`;
            });
            if (result.updated > 0) {
              const divTotal = result.results.reduce((s, r) => s + (r.divsAdded || 0), 0);
              let msg = `\u2713 ${result.updated}/${result.total} asset(s)`;
              if (divTotal > 0) msg += `, ${divTotal} div(s)`;
              notices.push(msg);
              await renderDashboard2(app, settings, dashContainer, plugin);
            } else if (result.errors.length > 0) {
              console.warn("[PC] Price update issues:\n" + result.errors.map((e) => `${e.ticker}: ${e.error}`).join("\n"));
              notices.push("\u26A0 Prices: see console");
            } else {
              notices.push("Prices up to date");
              if (fxResult.updated) await renderDashboard2(app, settings, dashContainer, plugin);
            }
            updateBtn.textContent = "Templates\u2026";
            try {
              const tplResult = await applyTemplates(app, settings);
              if (tplResult.opsApplied > 0) {
                notices.push(`\u2713 ${tplResult.opsApplied} auto-op(s) / ${tplResult.depositsAffected} deposit(s)`);
                await renderDashboard2(app, settings, dashContainer, plugin);
              }
            } catch (e) {
              console.warn("[PC] template catch-up threw:", e);
              notices.push(`\u26A0 templates: ${e.message || e}`);
            }
            showNotice2(notices.join(" \xB7 "), 4500);
          } catch (e) {
            showNotice2("Update failed: " + (e.message || e), 4e3);
          }
          updateBtn.disabled = false;
          updateBtn.textContent = "\u21BB Update prices";
        };
      }
      const grid = container.createDiv({ cls: "pc-asset-grid" });
      let openAsset = null;
      let openAccordion = null;
      const cardEls = [];
      for (const a of assets) {
        const m = computeAssetMetrics(a);
        const positive = a.plAmount >= 0;
        const sym = a.currency;
        const card = grid.createDiv({ cls: `pc-asset-card ${positive ? "pc-asset-card--pos" : "pc-asset-card--neg"}` });
        makeInteractive(card);
        cardEls.push({ card, asset: a });
        const hdr = card.createDiv({ cls: "pc-asset-hdr" });
        const hdrLeft = hdr.createDiv({ cls: "pc-asset-hdr-left" });
        hdrLeft.createEl("div", { cls: "pc-asset-ticker", text: a.name });
        hdrLeft.createEl("span", {
          cls: "pc-asset-sub",
          text: `${a.type} \xB7 ${sym}` + (a.currentQty > 0 ? ` \xD7${a.currentQty}` : "")
        });
        if (Math.abs(m.cagr) > 0.01) {
          const cagrCls = m.cagr >= 0 ? "pc-pos" : "pc-neg";
          hdr.createEl("span", {
            cls: `pc-asset-cagr-badge ${cagrCls}`,
            text: `${m.cagr >= 0 ? "+" : ""}${fmt(m.cagr, 1)}% anum`
          });
        }
        card.createDiv({ cls: "pc-asset-spacer" });
        card.createEl("div", {
          cls: "pc-asset-value",
          text: `${fmt(a.currentValue, 0)} ${sym}`
        });
        const plArrow = positive ? "\u2191" : "\u2193";
        const plCls = positive ? "pc-pos" : "pc-neg";
        const plRow = card.createDiv({ cls: "pc-asset-pl-row" });
        plRow.createEl("span", {
          cls: `pc-asset-pl-amt ${plCls}`,
          text: `${fmtSigned(a.plAmount, 0)} ${sym}`
        });
        plRow.createEl("span", {
          cls: `pc-asset-pl-pct ${plCls}`,
          text: `${plArrow} ${fmt(Math.abs(a.plPct), 1)}%`
        });
        const accordion = grid.createDiv({ cls: "pc-asset-accordion" });
        accordion.style.display = "none";
        card.onclick = () => {
          const wasOpen = openAsset === a;
          cardEls.forEach((ce) => ce.card.classList.remove("pc-asset-card--open"));
          if (openAccordion) {
            openAccordion.style.display = "none";
            openAccordion = null;
          }
          if (wasOpen) {
            openAsset = null;
            return;
          }
          openAsset = a;
          openAccordion = accordion;
          card.classList.add("pc-asset-card--open");
          accordion.empty();
          accordion.style.display = "block";
          accordion.createEl("div", { cls: "pc-asset-detail-title", text: a.name });
          const metricsRow = accordion.createDiv({ cls: "pc-asset-metrics" });
          const metricItems = [
            { label: "Total Return", value: `${m.totalReturn >= 0 ? "+" : ""}${fmt(m.totalReturn, 1)}%`, cls: m.totalReturn >= 0 ? "pc-pos" : "pc-neg" },
            { label: "Yield on Cost", value: `${fmt(m.yieldOnCost, 2)}%`, cls: "pc-neutral" },
            { label: "CAGR", value: `${m.cagr >= 0 ? "+" : ""}${fmt(m.cagr, 1)}%`, cls: m.cagr >= 0 ? "pc-pos" : "pc-neg" },
            { label: "Income Total", value: `${fmt(a.passiveIncomeTot, 0)} ${sym}`, cls: "pc-neutral" }
          ];
          for (const mi of metricItems) {
            const item = metricsRow.createDiv({ cls: "pc-asset-metric" });
            item.createEl("div", { cls: `pc-asset-metric-val ${mi.cls}`, text: mi.value });
            item.createEl("div", { cls: "pc-asset-metric-label", text: mi.label });
          }
          const rows = [
            ["Current price", a.currentPrice != null ? `${a.currentPrice} ${sym}` : "\u2014"],
            ["Avg cost", a.currentQty > 0 ? `${fmt(m.invested / a.currentQty, 2)} ${sym}` : "\u2014"],
            ["Total invested", `${fmt(m.invested, 0)} ${sym}`],
            ["P&L (price)", `${fmtSigned(a.plAmount, 0)} ${sym}`],
            ["Passive income", `${fmt(a.passiveIncomeTot, 0)} ${sym}`],
            ["Since", a.initialDate ?? "\u2014"],
            ["Last updated", a.lastUpdated ?? "\u2014"]
          ];
          const detailGrid = accordion.createDiv({ cls: "pc-asset-detail-grid" });
          for (const [k, v] of rows) {
            const row = detailGrid.createDiv({ cls: "pc-asset-detail-row" });
            row.createEl("span", { cls: "pc-asset-detail-key", text: k });
            row.createEl("span", { cls: "pc-asset-detail-val", text: String(v) });
          }
        };
      }
    }
    module2.exports = { computeAssetMetrics, renderAssetCards };
  }
});

// src/wants-queue.js
var require_wants_queue = __commonJS({
  "src/wants-queue.js"(exports2, module2) {
    var { toNum, getCurrentMonthKey } = require_utils();
    var { enqueueWrite } = require_write_queue();
    async function readWantsQueue(app, settings) {
      const path = settings.wantsQueuePath;
      const file = app.vault.getAbstractFileByPath(path);
      if (!file) return [];
      const fm = app.metadataCache.getFileCache(file)?.frontmatter;
      if (!fm?.items || !Array.isArray(fm.items)) return [];
      return fm.items.map((it) => ({
        name: String(it.name ?? ""),
        cost: toNum(it.cost),
        done: it.done ?? null
      }));
    }
    async function writeWantsQueue(app, settings, items) {
      const path = settings.wantsQueuePath;
      return enqueueWrite(path, async () => {
        let file = app.vault.getAbstractFileByPath(path);
        if (!file) {
          const dir = path.split("/").slice(0, -1).join("/");
          if (dir && !app.vault.getAbstractFileByPath(dir)) {
            await app.vault.createFolder(dir).catch(() => {
            });
          }
          file = await app.vault.create(path, "---\nitems: []\n---\n");
        }
        await app.fileManager.processFrontMatter(file, (fm) => {
          fm.items = items.map((it) => {
            const o = { name: it.name, cost: it.cost };
            if (it.done) o.done = it.done;
            return o;
          });
        });
      });
    }
    function cleanupDoneItems(items) {
      const currentMk = getCurrentMonthKey();
      return items.filter((it) => !it.done || it.done === currentMk);
    }
    function getWantsQueueTotal(items) {
      return items.filter((it) => !it.done).reduce((s, it) => s + it.cost, 0);
    }
    module2.exports = { readWantsQueue, writeWantsQueue, cleanupDoneItems, getWantsQueueTotal };
  }
});

// src/ai/snapshot.js
var require_snapshot = __commonJS({
  "src/ai/snapshot.js"(exports2, module2) {
    var { MONTH_NAMES: MONTH_NAMES2 } = require_constants();
    var { fmt, fmtSigned, getCurrentMonthIdx, getCurrentYear: getCurrentYear2 } = require_utils();
    var { buildAssetFlowsAsync } = require_flows();
    var { buildCashflowRows: buildCashflowRows2 } = require_cashflow();
    var { buildBudgetSummary } = require_summary();
    var { readCapitalHistory } = require_timeline();
    var { getAccountBalance, getLiquidTotal } = require_balance();
    var { readWantsQueue } = require_wants_queue();
    async function buildDataSnapshot(app, settings) {
      const af = await buildAssetFlowsAsync(app, settings);
      const { passiveIncome, saves, assets, savesByMonthKey, accounts, allLedger } = af;
      const cfRows = buildCashflowRows2(app, settings, allLedger);
      const budget = buildBudgetSummary(cfRows, settings, af);
      const history = await readCapitalHistory(app, settings);
      const wqItems = await readWantsQueue(app, settings);
      const wqPending = wqItems.filter((it) => !it.done);
      const sym = settings.homeCurrencySymbol;
      const investedCapital = assets.reduce((s, a) => s + a.currentValueRub, 0);
      const liquidTotal = getLiquidTotal(settings, accounts, allLedger);
      const totalCapital = investedCapital + liquidTotal;
      const curMonth = MONTH_NAMES2[getCurrentMonthIdx()];
      const curYear = getCurrentYear2();
      const lines = [
        `## Current Period: ${curMonth} ${curYear}`,
        ``,
        `## Budget Summary`,
        `- Active Income:   ${fmt(budget.income)} ${sym}`,
        `- Passive Income:  ${fmt(budget.passiveIncome)} ${sym}`,
        `- Total Income:    ${fmt(budget.totalIncome)} ${sym}`,
        `- Needs:           ${fmt(budget.needs)} ${sym}  (${budget.totalIncome !== 0 ? Math.round(Math.abs(budget.needs) / budget.totalIncome * 100) : 0}% of income)`,
        `- Wants:           ${fmt(budget.wants)} ${sym}`,
        `- Saves (actual):  ${fmt(budget.saves)} ${sym}`,
        `- Saves (target):  ${fmt(budget.savesTarget)} ${sym}  (${settings.savesTargetPct}% of income)`,
        `- Left (liquid):   ${fmt(budget.left)} ${sym}`,
        ``,
        `## Cashflow Breakdown (${curMonth})`,
        `| Type | Category | Recurring | This Month | Projected Mo. |`,
        `|---|---|---|---|---|`,
        ...cfRows.map((r) => {
          const mk = require_utils().getCurrentMonthKey();
          const act = r.months[mk] != null ? fmt(r.months[mk]) : "\u2014";
          const prj = r.projected != null ? fmt(r.projected) : "\u2014";
          return `| ${r.type} | ${r.emoji} ${r.category} | ${r.recurring ? "\u2713" : ""} | ${act} | ${prj} |`;
        }),
        ``,
        `## Portfolio \u2014 Assets`,
        `| Ticker | Type | Ccy | Qty | Price | Value | P&L | P&L% | Div/Income |`,
        `|---|---|---|---|---|---|---|---|---|`,
        ...assets.map(
          (a) => `| ${a.name} | ${a.type} | ${a.currency} | ${a.currentQty} | ${a.currentPrice ?? "\u2014"} | ${fmt(a.currentValue, 2)} | ${fmtSigned(a.plAmount, 2)} | ${fmtSigned(a.plPct, 1)}% | ${fmt(a.passiveIncomeTot, 2)} |`
        ),
        ``,
        `## Accounts`,
        ...accounts && accounts.length > 0 ? [accounts.map((a) => `${a.name} ${fmt(getAccountBalance(a, allLedger))}${a.locked ? " \u{1F512}" : ""}`).join(", ") + ` \u2014 Total: ${fmt(liquidTotal)} ${sym}`] : [`Bank ${fmt(settings.liquidBank ?? 0)}${settings.liquidBankIsLiquid !== false ? "" : " \u{1F512}"}, Broker ${fmt(settings.liquidBrokerCash ?? 0)}${settings.liquidBrokerCashIsLiquid !== false ? "" : " \u{1F512}"}, Cash ${fmt(settings.liquidCash ?? 0)}${settings.liquidCashIsLiquid !== false ? "" : " \u{1F512}"}, Business ${fmt(settings.liquidBusiness ?? 0)}${settings.liquidBusinessIsLiquid ? "" : " \u{1F512}"} \u2014 Total: ${fmt(liquidTotal)} ${sym}`],
        ``,
        `## Total Capital`,
        `Invested: ${fmt(investedCapital)}, Liquid: ${fmt(liquidTotal)}, **Total: ${fmt(totalCapital)} ${sym}**`,
        ``,
        ``
      ];
      if (wqPending.length > 0) {
        lines.push(`## Wants Queue (planned purchases)`);
        lines.push(`| Item | Est. Cost |`);
        lines.push(`|---|---|`);
        for (const it of wqPending) {
          lines.push(`| ${it.name} | ${fmt(it.cost)} ${sym} |`);
        }
        lines.push(`- Queue total: ${fmt(wqPending.reduce((s, it) => s + it.cost, 0))} ${sym}`);
        lines.push(``);
      }
      return { lines, budget, assets, history, totalCapital, curMonth, curYear };
    }
    module2.exports = { buildDataSnapshot };
  }
});

// src/ai/prompts.js
var require_prompts = __commonJS({
  "src/ai/prompts.js"(exports2, module2) {
    var { fmt } = require_utils();
    var { getAccountBalance, getLiquidTotal } = require_balance();
    var { buildDataSnapshot } = require_snapshot();
    async function buildChatPrompt2(app, settings, qData) {
      const { lines, totalCapital, curMonth, curYear } = await buildDataSnapshot(app, settings);
      const sym = settings.homeCurrencySymbol;
      const personalCtx = (settings.personalContext ?? "").trim();
      let strategyText = "";
      const stratFile = app.vault.getAbstractFileByPath(settings.strategyPath);
      if (stratFile) strategyText = await app.vault.read(stratFile);
      const qLabels = { investExp: "Investing experience", goals: "Goals", obligations: "Obligations", concerns: "Concerns / risks" };
      const qLines = [];
      if (qData) {
        for (const [k, v] of Object.entries(qData)) {
          if (v && v.trim()) qLines.push(`- ${qLabels[k] || k}: ${v.trim()}`);
        }
      }
      const prompt = [
        `# Role`,
        `You are a personal finance advisor and capital growth consultant.`,
        ``,
        personalCtx ? `# User Profile
${personalCtx}
` : "",
        qLines.length > 0 ? `# Additional Context
${qLines.join("\n")}
` : "",
        strategyText ? `# Current Strategy
${strategyText}

---` : "",
        `# Financial Data \u2014 ${curMonth} ${curYear}`,
        ``,
        ...lines,
        `---`,
        ``,
        `Total capital: **${fmt(totalCapital)} ${sym}**`,
        ``,
        `Review the data above. Briefly summarize what you see \u2014 capital state, any notable changes or concerns. Then ask: "What would you like to focus on?"`,
        ``,
        `_Key files: strategy \u2192 \`${settings.strategyPath}\`_`
      ].filter(Boolean);
      return prompt.join("\n");
    }
    function buildAgentPrompt(settings, qData, accounts, allLedger) {
      const personalCtx = (settings.personalContext ?? "").trim();
      const sym = settings.homeCurrencySymbol;
      const liquidTotal = getLiquidTotal(settings, accounts, allLedger);
      const qLabels = { investExp: "Investing experience", goals: "Goals", obligations: "Obligations", concerns: "Concerns / risks" };
      const qLines = [];
      if (qData) {
        for (const [k, v] of Object.entries(qData)) {
          if (v && v.trim()) qLines.push(`- ${qLabels[k] || k}: ${v.trim()}`);
        }
      }
      const prompt = [
        `# Role`,
        `You are a personal finance advisor and capital growth consultant.`,
        `You have access to the user's Obsidian vault with financial data.`,
        ``,
        personalCtx ? `# User Profile
${personalCtx}
` : "",
        qLines.length > 0 ? `# Additional Context
${qLines.join("\n")}
` : "",
        `# Data Location`,
        `Read the following files to understand the user's financial position:`,
        ``,
        `- **Cashflow categories**: \`${settings.categoriesFolder}/\` \u2014 each .md file has YAML frontmatter with type (Income/Needs/Wants), monthly values (m01-m12)`,
        `- **Assets**: \`${settings.assetsFolder}/\` \u2014 each .md file has frontmatter (type, currency, qty, price) + log lines in body (YYYY-MM-DD | op | qty | price)`,
        `- **Strategy**: \`${settings.strategyPath}\` \u2014 current strategy document (may not exist yet)`,
        `- **Dashboard note**: \`${settings.dashboardPath}\``,
        ``,
        `# Accounts`,
        ...accounts && accounts.length > 0 ? [accounts.map((a) => `${a.name} ${fmt(getAccountBalance(a, allLedger || []))}${a.locked ? " \u{1F512}" : ""}`).join(", ") + ` \u2014 Total: ${fmt(liquidTotal)} ${sym}`] : [`Bank ${fmt(settings.liquidBank ?? 0)}, Broker ${fmt(settings.liquidBrokerCash ?? 0)}, Cash ${fmt(settings.liquidCash ?? 0)}, Business ${fmt(settings.liquidBusiness ?? 0)} \u2014 Total: ${fmt(liquidTotal)} ${sym}`],
        ``,
        `# Ledger`,
        `Financial transaction log: \`${settings.ledgerFolder || "finance/Data"}/ledger-*.jsonl\``,
        ``,
        `# Instructions`,
        `1. Read the asset files and category files to understand the current state`,
        `2. Consider BOTH invested assets AND liquid pools \u2014 total capital is assets + liquid`,
        `3. Summarize what you see \u2014 capital structure, cashflow health, portfolio status`,
        `4. Ask: "What would you like to focus on?"`,
        ``,
        `When making changes to files, follow the existing format exactly.`
      ].filter(Boolean);
      return prompt.join("\n");
    }
    module2.exports = { buildChatPrompt: buildChatPrompt2, buildAgentPrompt };
  }
});

// src/modals/insights.js
var require_insights = __commonJS({
  "src/modals/insights.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { readAccounts: readAccounts2 } = require_io2();
    var { readLedgerMultiYear: readLedgerMultiYear2 } = require_io();
    var { buildChatPrompt: buildChatPrompt2, buildAgentPrompt } = require_prompts();
    var InsightsModal = class extends Modal2 {
      constructor(app, settings) {
        super(app);
        this.settings = settings;
        this.qData = {};
        this.screen = 0;
      }
      onOpen() {
        this.render();
      }
      render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("pc-insights-modal");
        if (this.screen === 0) this.renderContextScreen(contentEl);
        else this.renderCardsScreen(contentEl);
      }
      // ── Screen 1: Optional context questionnaire ──
      renderContextScreen(el) {
        el.createEl("div", { cls: "pc-insights-title", text: "Prepare Analysis" });
        el.createEl("p", {
          cls: "pc-insights-desc",
          text: "Help the AI understand your situation better. Optional \u2014 skip if you prefer."
        });
        const form = el.createDiv({ cls: "pc-insights-context-form" });
        const questions = [
          ["investExp", "Investing experience?", "e.g. beginner, 3 years active"],
          ["goals", "What are your goals?", "e.g. passive income, early retirement"],
          ["obligations", "What are your obligations?", "e.g. mortgage 30k/mo, IP tax"],
          ["concerns", "Concerns / risks?", "e.g. inflation, job instability"]
        ];
        for (const [key, label, placeholder] of questions) {
          const row = form.createDiv({ cls: "pc-insights-q-row" });
          row.createEl("label", { cls: "pc-insights-q-label", text: label });
          const inp = row.createEl("input", { type: "text", placeholder, cls: "personal-capital-input" });
          if (this.qData[key]) inp.value = this.qData[key];
          inp.addEventListener("input", () => {
            this.qData[key] = inp.value;
          });
        }
        form.createEl("p", {
          cls: "pc-insights-q-hint",
          text: "These answers are added to the prompt only. Nothing is saved or shared."
        });
        const nav = el.createDiv({ cls: "pc-insights-nav" });
        const skipBtn = nav.createEl("button", { cls: "pc-insights-nav-btn", text: "Skip \u2192" });
        skipBtn.onclick = () => {
          this.screen = 1;
          this.render();
        };
        const nextBtn = nav.createEl("button", { cls: "pc-insights-nav-btn mod-cta", text: "Continue \u2192" });
        nextBtn.onclick = () => {
          this.screen = 1;
          this.render();
        };
      }
      // ── Screen 2: Chat / Agent cards ──
      renderCardsScreen(el) {
        el.createEl("div", { cls: "pc-insights-title", text: "Choose AI mode" });
        el.createEl("p", {
          cls: "pc-insights-desc",
          text: "No data is shared automatically."
        });
        const cards = el.createDiv({ cls: "pc-insights-cards" });
        const chatCard = cards.createDiv({ cls: "pc-insights-card" });
        chatCard.createEl("div", { cls: "pc-insights-card-icon", text: "\u{1F4AC}" });
        chatCard.createEl("div", { cls: "pc-insights-card-title", text: "AI Chat" });
        chatCard.createEl("p", {
          cls: "pc-insights-card-desc",
          text: "Copy prompt with all your data to paste into Claude, ChatGPT, or any AI chat."
        });
        const chatStatus = chatCard.createDiv({ cls: "pc-insights-card-status" });
        const chatBtn = chatCard.createEl("button", { cls: "pc-insights-card-btn mod-cta", text: "Copy prompt" });
        chatBtn.onclick = async () => {
          chatBtn.disabled = true;
          chatStatus.textContent = "Building\u2026";
          try {
            const ctx = await buildChatPrompt2(this.app, this.settings, this.qData);
            await navigator.clipboard.writeText(ctx);
            await this._savePrompt(ctx, "chat_prompt.md");
            chatStatus.textContent = "\u2713 Copied!";
            chatStatus.classList.add("pc-insights-status--ok");
            chatBtn.textContent = "\u2713 Copied";
            setTimeout(() => this.close(), 1200);
          } catch (e) {
            chatStatus.textContent = "Error: " + e.message;
            chatBtn.disabled = false;
          }
        };
        const agentCard = cards.createDiv({ cls: "pc-insights-card" });
        agentCard.createEl("div", { cls: "pc-insights-card-icon", text: "\u{1F916}" });
        agentCard.createEl("div", { cls: "pc-insights-card-title", text: "AI Agent" });
        agentCard.createEl("p", {
          cls: "pc-insights-card-desc",
          text: "Copy prompt with vault paths for Cursor, Claude Code, Copilot, or any agent with file access."
        });
        const agentStatus = agentCard.createDiv({ cls: "pc-insights-card-status" });
        const agentBtn = agentCard.createEl("button", { cls: "pc-insights-card-btn", text: "Copy prompt" });
        agentBtn.onclick = async () => {
          agentBtn.disabled = true;
          agentStatus.textContent = "Building\u2026";
          try {
            const accts = await readAccounts2(this.app, this.settings);
            const ledg = await readLedgerMultiYear2(this.app, this.settings, [(/* @__PURE__ */ new Date()).getFullYear()]);
            const ctx = buildAgentPrompt(this.settings, this.qData, accts, ledg);
            await navigator.clipboard.writeText(ctx);
            await this._savePrompt(ctx, "agent_prompt.md");
            agentStatus.textContent = "\u2713 Copied!";
            agentStatus.classList.add("pc-insights-status--ok");
            agentBtn.textContent = "\u2713 Copied";
            setTimeout(() => this.close(), 1200);
          } catch (e) {
            agentStatus.textContent = "Error: " + e.message;
            agentBtn.disabled = false;
          }
        };
        const nav = el.createDiv({ cls: "pc-insights-nav" });
        const backBtn = nav.createEl("button", { cls: "pc-insights-nav-btn", text: "\u2190 Back" });
        backBtn.onclick = () => {
          this.screen = 0;
          this.render();
        };
        const tips = el.createDiv({ cls: "pc-insights-tips" });
        tips.createEl("p", { text: "\u{1F4A1} Adjust the prompt as you like \u2014 ask anything about your finances." });
        tips.createEl("p", { text: "\u26A0\uFE0F AI may make mistakes. Don't follow recommendations blindly \u2014 it's always your call." });
      }
      async _savePrompt(ctx, fileName) {
        const aiDir = this.settings.categoriesFolder.replace(/categories\/?$/, "ai_context");
        if (!this.app.vault.getAbstractFileByPath(aiDir)) {
          await this.app.vault.createFolder(aiDir).catch(() => {
          });
        }
        const outPath = `${aiDir}/${fileName}`;
        const existing = this.app.vault.getAbstractFileByPath(outPath);
        if (existing) await this.app.vault.modify(existing, ctx);
        else await this.app.vault.create(outPath, ctx);
      }
    };
    module2.exports = { InsightsModal };
  }
});

// src/ui/analysis.js
var require_analysis = __commonJS({
  "src/ui/analysis.js"(exports2, module2) {
    function renderAnalysisBlock(container, app, settings) {
      const { InsightsModal } = require_insights();
      const desc = container.createEl("p", { cls: "pc-analysis-desc" });
      desc.textContent = "Need insights on your capital? Prepare a prompt for your AI.";
      const btnRow = container.createDiv({ cls: "pc-analysis-btn-row" });
      const btn = btnRow.createEl("button", {
        cls: "pc-analysis-btn",
        text: "Prepare Analysis"
      });
      btn.onclick = () => new InsightsModal(app, settings).open();
      const tip = container.createDiv({ cls: "pc-analysis-tip" });
      tip.createEl("span", { text: "Adjust the prompt as you like. This tool does not provide investment recommendations \u2014 always use your own judgment." });
    }
    module2.exports = { renderAnalysisBlock };
  }
});

// src/ui/wants.js
var require_wants = __commonJS({
  "src/ui/wants.js"(exports2, module2) {
    var { fmt, getCurrentMonthKey, makeInteractive, killWheelChange } = require_utils();
    var { readWantsQueue, writeWantsQueue, cleanupDoneItems } = require_wants_queue();
    function renderWantsQueue(container, app, settings, refreshDashboard) {
      let items = [];
      let saving = false;
      const wrap = container.createDiv({ cls: "pc-wq-wrap" });
      const save = async () => {
        if (saving) return;
        saving = true;
        await writeWantsQueue(app, settings, items);
        saving = false;
      };
      const rebuildList = () => {
        listEl.empty();
        const sym = settings.homeCurrencySymbol;
        const currentMk = getCurrentMonthKey();
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const isDone = !!it.done;
          const row = listEl.createDiv({ cls: `pc-wq-item ${isDone ? "pc-wq-item--done" : ""}` });
          const check = row.createEl("span", { cls: "pc-wq-check", text: isDone ? "\u2611" : "\u2610" });
          makeInteractive(check, "checkbox");
          check.onclick = async (e) => {
            e.stopPropagation();
            if (isDone) {
              it.done = null;
            } else {
              it.done = currentMk;
            }
            await save();
            rebuildList();
            updateFooter();
          };
          row.createEl("span", { cls: "pc-wq-name", text: it.name });
          row.createEl("span", { cls: "pc-wq-cost", text: `${fmt(it.cost)} ${sym}` });
          const rm = row.createEl("span", { cls: "pc-wq-rm", text: "\xD7" });
          makeInteractive(rm);
          rm.onclick = async (e) => {
            e.stopPropagation();
            items.splice(i, 1);
            await save();
            rebuildList();
            updateFooter();
          };
        }
        if (items.length === 0) {
          listEl.createEl("span", { cls: "pc-wq-empty", text: "No planned purchases" });
        }
      };
      const updateFooter = () => {
        const pending = items.filter((it) => !it.done);
        const total = pending.reduce((s, it) => s + it.cost, 0);
        const sym = settings.homeCurrencySymbol;
        footerEl.textContent = pending.length > 0 ? `${pending.length} item${pending.length > 1 ? "s" : ""} \xB7 ${fmt(total)} ${sym}` : "";
      };
      const hdr = wrap.createDiv({ cls: "pc-wq-header" });
      hdr.createEl("span", { cls: "pc-wq-title", text: "Wants Queue" });
      const addBtn = hdr.createEl("span", { cls: "pc-wq-add", text: "+" });
      makeInteractive(addBtn);
      const listEl = wrap.createDiv({ cls: "pc-wq-list" });
      const footerEl = wrap.createDiv({ cls: "pc-wq-footer" });
      let addRowEl = null;
      addBtn.onclick = () => {
        if (addRowEl) {
          addRowEl.remove();
          addRowEl = null;
          return;
        }
        addRowEl = wrap.createDiv({ cls: "pc-wq-add-row" });
        const nameIn = addRowEl.createEl("input", { type: "text", placeholder: "What do you want?", cls: "pc-wq-input" });
        const costIn = addRowEl.createEl("input", { type: "number", placeholder: "Cost", cls: "pc-wq-input pc-wq-input--cost" });
        killWheelChange(costIn);
        const okBtn = addRowEl.createEl("button", { text: "Add", cls: "pc-wq-ok" });
        const doAdd = async () => {
          const name = nameIn.value.trim();
          const cost = parseFloat(costIn.value) || 0;
          if (!name || cost <= 0) return;
          items.push({ name, cost, done: null });
          await save();
          addRowEl.remove();
          addRowEl = null;
          rebuildList();
          updateFooter();
        };
        okBtn.onclick = doAdd;
        costIn.onkeydown = (e) => {
          if (e.key === "Enter") doAdd();
        };
        nameIn.onkeydown = (e) => {
          if (e.key === "Enter") costIn.focus();
        };
        wrap.insertBefore(addRowEl, footerEl);
        nameIn.focus();
      };
      readWantsQueue(app, settings).then((loaded) => {
        items = cleanupDoneItems(loaded);
        if (items.length !== loaded.length) save();
        rebuildList();
        updateFooter();
      });
    }
    module2.exports = { renderWantsQueue };
  }
});

// src/modals/onboarding.js
var require_onboarding = __commonJS({
  "src/modals/onboarding.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { fmt, showNotice: showNotice2, killWheelChange } = require_utils();
    var { readAccounts: readAccounts2 } = require_io2();
    var COUNTRY_CURRENCY = {
      "Russia": { code: "RUB", symbol: "\u20BD" },
      "USA": { code: "USD", symbol: "$" },
      "UK": { code: "GBP", symbol: "\xA3" },
      "Japan": { code: "JPY", symbol: "\xA5" },
      "China": { code: "CNY", symbol: "\xA5" },
      "EU": { code: "EUR", symbol: "\u20AC" },
      "Germany": { code: "EUR", symbol: "\u20AC" },
      "France": { code: "EUR", symbol: "\u20AC" },
      "Italy": { code: "EUR", symbol: "\u20AC" },
      "Spain": { code: "EUR", symbol: "\u20AC" },
      "Netherlands": { code: "EUR", symbol: "\u20AC" },
      "Canada": { code: "CAD", symbol: "C$" },
      "Australia": { code: "AUD", symbol: "A$" },
      "India": { code: "INR", symbol: "\u20B9" },
      "Brazil": { code: "BRL", symbol: "R$" },
      "Turkey": { code: "TRY", symbol: "\u20BA" },
      "South Korea": { code: "KRW", symbol: "\u20A9" },
      "Switzerland": { code: "CHF", symbol: "CHF" },
      "Israel": { code: "ILS", symbol: "\u20AA" },
      "UAE": { code: "AED", symbol: "AED" }
    };
    var COUNTRY_LIST = Object.keys(COUNTRY_CURRENCY);
    var OnboardingModal2 = class extends Modal2 {
      constructor(app, plugin, onDone) {
        super(app);
        this.plugin = plugin;
        this.onDone = onDone;
        this.step = 0;
        this.data = {
          liquidBank: plugin.settings.liquidBank || 0,
          liquidBrokerCash: plugin.settings.liquidBrokerCash || 0,
          liquidCash: plugin.settings.liquidCash || 0,
          liquidBusiness: plugin.settings.liquidBusiness || 0,
          country: "",
          broker: ""
        };
      }
      onOpen() {
        this.render();
      }
      render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("pc-onboard-wizard");
        const steps = [
          () => this.renderStepSetup(contentEl),
          () => this.renderStepMoney(contentEl),
          () => this.renderStepOverview(contentEl)
        ];
        this.totalSteps = steps.length;
        steps[this.step]();
      }
      // ── Step 1: Country + Broker ──
      renderStepSetup(el) {
        el.createDiv({ cls: "pc-onboard-step-indicator", text: `1 / ${this.totalSteps}` });
        el.createEl("div", { cls: "pc-onboard-title", text: "Setup" });
        el.createEl("p", {
          cls: "pc-onboard-desc",
          text: "Select your country to set the default currency."
        });
        const countryRow = el.createDiv({ cls: "pc-onboard-row" });
        countryRow.createEl("label", { text: "\u{1F30D}  Country" });
        const countrySelect = countryRow.createEl("select", { cls: "personal-capital-input" });
        countrySelect.createEl("option", { text: "Select\u2026", value: "" });
        for (const c of COUNTRY_LIST) {
          const opt = countrySelect.createEl("option", { text: c, value: c });
          if (this.data.country === c) opt.selected = true;
        }
        countrySelect.addEventListener("change", () => {
          this.data.country = countrySelect.value;
        });
        const brokerRow = el.createDiv({ cls: "pc-onboard-row" });
        brokerRow.createEl("label", { text: "\u{1F4CA}  Broker" });
        const brokerInp = brokerRow.createEl("input", {
          type: "text",
          placeholder: "e.g. T-Bank, Interactive Brokers",
          cls: "personal-capital-input"
        });
        brokerInp.value = this.data.broker || "";
        brokerInp.addEventListener("input", () => {
          this.data.broker = brokerInp.value;
        });
        this.renderNav(el, { back: false });
      }
      // ── Step 2: Count your money ──
      renderStepMoney(el) {
        const cur = COUNTRY_CURRENCY[this.data.country];
        const sym = cur ? cur.symbol : this.plugin.settings.homeCurrencySymbol ?? "\u20BD";
        el.createDiv({ cls: "pc-onboard-step-indicator", text: `2 / ${this.totalSteps}` });
        el.createEl("div", { cls: "pc-onboard-title", text: "Count your money" });
        el.createEl("p", {
          cls: "pc-onboard-desc",
          text: "Sum up what you have right now. This is your starting capital position."
        });
        const pools = [
          ["liquidBank", "\u{1F4B3}  Bank accounts", "All bank accounts total"],
          ["liquidBrokerCash", "\u{1F4CA}  Broker free cash", "Uninvested cash on broker"],
          ["liquidCash", "\u{1F4B5}  Physical cash", "Cash at hand"],
          ["liquidBusiness", "\u{1F3E2}  Business account", "Optional \u2014 leave 0 if none"]
        ];
        const inputs = {};
        for (const [key, label, placeholder] of pools) {
          const row = el.createDiv({ cls: "pc-onboard-row" });
          row.createEl("label", { text: label });
          const inp = row.createEl("input", {
            type: "number",
            placeholder,
            cls: "personal-capital-input"
          });
          inp.value = this.data[key] || "";
          killWheelChange(inp);
          inputs[key] = inp;
          inp.addEventListener("input", () => {
            this.data[key] = parseFloat(inp.value) || 0;
            updateTotal();
          });
        }
        const totalEl = el.createDiv({ cls: "pc-onboard-total" });
        const updateTotal = () => {
          const sum = pools.reduce((s, [k]) => s + (this.data[k] || 0), 0);
          totalEl.textContent = `Total: ${fmt(sum)} ${sym}`;
        };
        updateTotal();
        this.renderNav(el, {});
      }
      // ── Step 3: Overview ──
      renderStepOverview(el) {
        const cur = COUNTRY_CURRENCY[this.data.country];
        const sym = cur ? cur.symbol : this.plugin.settings.homeCurrencySymbol ?? "\u20BD";
        el.createDiv({ cls: "pc-onboard-step-indicator", text: `${this.totalSteps} / ${this.totalSteps}` });
        el.createEl("div", { cls: "pc-onboard-title", text: "Overview" });
        el.createEl("p", {
          cls: "pc-onboard-desc",
          text: "Review your setup. Everything stays local. Editable in Settings."
        });
        const setupSection = el.createDiv({ cls: "pc-onboard-summary-section" });
        setupSection.createEl("div", { cls: "pc-onboard-summary-label", text: "Setup" });
        if (this.data.country) {
          const cRow = setupSection.createDiv({ cls: "pc-onboard-summary-row" });
          cRow.createEl("span", { text: "Country" });
          cRow.createEl("span", { cls: "pc-onboard-summary-val", text: `${this.data.country} (${cur ? cur.symbol : "?"})` });
        }
        if (this.data.broker) {
          const bRow = setupSection.createDiv({ cls: "pc-onboard-summary-row" });
          bRow.createEl("span", { text: "Broker" });
          bRow.createEl("span", { cls: "pc-onboard-summary-val", text: this.data.broker });
        }
        const poolsSection = el.createDiv({ cls: "pc-onboard-summary-section" });
        poolsSection.createEl("div", { cls: "pc-onboard-summary-label", text: "Liquid capital" });
        const poolItems = [
          ["Bank accounts", this.data.liquidBank],
          ["Broker free cash", this.data.liquidBrokerCash],
          ["Physical cash", this.data.liquidCash],
          ["Business account", this.data.liquidBusiness]
        ];
        let poolTotal = 0;
        for (const [name, val] of poolItems) {
          if (!val) continue;
          poolTotal += val;
          const row = poolsSection.createDiv({ cls: "pc-onboard-summary-row pc-onboard-summary-row--money" });
          row.createEl("span", { text: name });
          row.createEl("span", { cls: "pc-onboard-summary-val", text: `${fmt(val)} ${sym}` });
        }
        const totalRow = poolsSection.createDiv({ cls: "pc-onboard-summary-row pc-onboard-summary-row--money pc-onboard-summary-total" });
        totalRow.createEl("span", { text: "Total" });
        totalRow.createEl("span", { cls: "pc-onboard-summary-val", text: `${fmt(poolTotal)} ${sym}` });
        this.renderNav(el, { next: false, done: true });
      }
      // ── Navigation bar ──
      renderNav(el, opts = {}) {
        const nav = el.createDiv({ cls: "pc-onboard-nav" });
        if (opts.back !== false && this.step > 0) {
          const backBtn = nav.createEl("button", { text: "\u2190 Back", cls: "pc-onboard-nav-btn" });
          backBtn.onclick = () => {
            this.step--;
            this.render();
          };
        } else {
          nav.createDiv();
        }
        if (opts.done) {
          const doneBtn = nav.createEl("button", { text: "Done \u2014 open dashboard", cls: "mod-cta pc-onboard-nav-btn" });
          doneBtn.onclick = () => this.finish();
        } else if (opts.next !== false) {
          const nextBtn = nav.createEl("button", { text: "Next \u2192", cls: "mod-cta pc-onboard-nav-btn" });
          nextBtn.onclick = () => {
            this.step++;
            this.render();
          };
        }
        const skip = nav.createEl("div", { cls: "pc-onboard-skip", text: "skip for now" });
        skip.onclick = () => this.close();
      }
      async finish() {
        this.plugin.settings.liquidBank = this.data.liquidBank;
        this.plugin.settings.liquidBrokerCash = this.data.liquidBrokerCash;
        this.plugin.settings.liquidCash = this.data.liquidCash;
        this.plugin.settings.liquidBusiness = this.data.liquidBusiness;
        const cur = COUNTRY_CURRENCY[this.data.country];
        if (cur) {
          this.plugin.settings.homeCurrency = cur.code;
          this.plugin.settings.homeCurrencySymbol = cur.symbol;
        }
        let ctx = (this.plugin.settings.personalContext ?? "").trim();
        ctx = ctx.split("\n").filter((l) => !l.startsWith("Country:") && !l.startsWith("Broker:")).join("\n").trim();
        const ctxParts = [];
        if (this.data.country) ctxParts.push(`Country: ${this.data.country}`);
        if (this.data.broker) ctxParts.push(`Broker: ${this.data.broker}`);
        if (ctxParts.length > 0) {
          this.plugin.settings.personalContext = ctx ? ctxParts.join("\n") + "\n" + ctx : ctxParts.join("\n");
        }
        this.plugin.settings.onboardingDone = true;
        await this.plugin.saveSettings();
        await this.plugin._scaffoldVault();
        const accountsFolder = this.plugin.settings.accountsFolder || "finance/Data/accounts";
        if (!this.app.vault.getAbstractFileByPath(accountsFolder)) {
          await this.app.vault.createFolder(accountsFolder).catch(() => {
          });
        }
        const acctCur = cur ? cur.code : this.plugin.settings.homeCurrency || "RUB";
        const poolDefs = [
          { val: this.data.liquidBank, name: "Bank", type: "bank", liquid: true },
          { val: this.data.liquidBrokerCash, name: "Broker Cash", type: "broker", liquid: true },
          { val: this.data.liquidCash, name: "Cash", type: "cash", liquid: true },
          { val: this.data.liquidBusiness, name: "Business", type: "business", liquid: false }
        ];
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        for (const pd of poolDefs) {
          if (pd.val <= 0) continue;
          const path = `${accountsFolder}/${pd.name}.md`;
          if (!this.app.vault.getAbstractFileByPath(path)) {
            const content = [
              "---",
              `name: "${pd.name}"`,
              `type: ${pd.type}`,
              `currency: ${acctCur}`,
              `liquid: ${pd.liquid}`,
              `locked: ${!pd.liquid}`,
              `initial_balance: ${pd.val}`,
              `last_reconciled: "${today}"`,
              "---",
              ""
            ].join("\n");
            await this.app.vault.create(path, content);
          }
        }
        this.plugin.settings.migrationDone = true;
        await this.plugin.saveSettings();
        this.close();
        if (this.onDone) {
          this.onDone();
        } else {
          this.plugin._openDashboardNote();
        }
      }
    };
    module2.exports = { OnboardingModal: OnboardingModal2, COUNTRY_CURRENCY, COUNTRY_LIST };
  }
});

// src/modals/transaction.js
var require_transaction = __commonJS({
  "src/modals/transaction.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { showNotice: showNotice2, fmt, killWheelChange } = require_utils();
    var { writeLedgerEntry } = require_io();
    var AddTransactionModal2 = class extends Modal2 {
      constructor(app, plugin, accounts, onDone) {
        super(app);
        this.plugin = plugin;
        this.accounts = accounts || [];
        this.onDone = onDone;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "Add Transaction" });
        const settings = this.plugin ? this.plugin.settings : {};
        const form = contentEl.createDiv({ cls: "personal-capital-form" });
        const row = (label, input) => {
          const d = form.createDiv();
          d.createEl("label", { text: label });
          d.appendChild(input);
          return input;
        };
        const typeIn = row("Type", contentEl.createEl("select"));
        [
          ["expense", "Expense \u2014 money out"],
          ["income", "Income \u2014 money in"],
          ["transfer", "Transfer \u2014 between accounts"]
        ].forEach(([val, label]) => {
          const o = typeIn.createEl("option", { text: label });
          o.value = val;
        });
        typeIn.addClass("personal-capital-input");
        const dateIn = row("Date", contentEl.createEl("input", { type: "date" }));
        dateIn.value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        dateIn.addClass("personal-capital-input");
        const amtIn = row("Amount", contentEl.createEl("input", { type: "number", step: "any" }));
        amtIn.placeholder = "e.g. 5000";
        amtIn.addClass("personal-capital-input");
        killWheelChange(amtIn);
        const catWrap = form.createDiv();
        catWrap.createEl("label", { text: "Category" });
        const catIn = catWrap.createEl("input", { type: "text", placeholder: "e.g. Groceries, Wages" });
        catIn.addClass("personal-capital-input");
        const fromWrap = form.createDiv();
        fromWrap.createEl("label", { text: "From account" });
        const fromIn = fromWrap.createEl("select");
        fromIn.createEl("option", { text: "\u2014 none \u2014", value: "" });
        for (const a of this.accounts) fromIn.createEl("option", { text: a.name, value: a.name });
        fromIn.addClass("personal-capital-input");
        const toWrap = form.createDiv();
        toWrap.createEl("label", { text: "To account" });
        const toIn = toWrap.createEl("select");
        toIn.createEl("option", { text: "\u2014 none \u2014", value: "" });
        for (const a of this.accounts) toIn.createEl("option", { text: a.name, value: a.name });
        toIn.addClass("personal-capital-input");
        const noteIn = row("Note (optional)", contentEl.createEl("input", { type: "text" }));
        noteIn.placeholder = "e.g. grocery store";
        noteIn.addClass("personal-capital-input");
        const updateFields = () => {
          const t = typeIn.value;
          catWrap.style.display = t === "transfer" ? "none" : "";
          fromWrap.style.display = t === "income" ? "none" : "";
          toWrap.style.display = t === "expense" ? "none" : "";
        };
        typeIn.addEventListener("change", updateFields);
        updateFields();
        const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
        const addBtn = btns.createEl("button", { text: "Add", cls: "mod-cta" });
        btns.createEl("button", { text: "Cancel" }).onclick = () => this.close();
        addBtn.onclick = async () => {
          const amt = parseFloat(amtIn.value) || 0;
          if (amt <= 0) {
            showNotice2("Amount is required");
            return;
          }
          const entry = {
            d: dateIn.value || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
            type: typeIn.value,
            amt
          };
          if (typeIn.value !== "transfer" && catIn.value.trim()) entry.cat = catIn.value.trim();
          if (fromIn.value) entry.from = fromIn.value;
          if (toIn.value) entry.to = toIn.value;
          if (noteIn.value.trim()) entry.note = noteIn.value.trim();
          const s = this.plugin ? this.plugin.settings : settings;
          await writeLedgerEntry(this.app, s, entry);
          showNotice2(`\u2713 Added ${entry.type}: ${fmt(amt)}`);
          this.close();
          if (this.onDone) this.onDone();
        };
      }
    };
    module2.exports = { AddTransactionModal: AddTransactionModal2 };
  }
});

// src/modals/reconcile.js
var require_reconcile = __commonJS({
  "src/modals/reconcile.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { toNum, fmt, showNotice: showNotice2, killWheelChange } = require_utils();
    var { readAllLedger, writeLedgerEntry } = require_io();
    var { readAccounts: readAccounts2, updateLastReconciled } = require_io2();
    var { getAccountBalance } = require_balance();
    var ReconcileAllModal = class extends Modal2 {
      constructor(app, plugin, onDone) {
        super(app);
        this.plugin = plugin;
        this.onDone = onDone;
        this.rows = [];
      }
      async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.titleEl.setText("Reconcile accounts");
        this.modalEl.addClass("pc-reconcile-modal");
        const intro = contentEl.createEl("p", { cls: "setting-item-description" });
        intro.textContent = "Type the balance you actually see on each account right now. Any mismatch between the ledger and reality is written as a single reconciliation adjustment. Leave a row blank to skip.";
        const dateRow = contentEl.createDiv({ cls: "pc-reconcile-date-row" });
        dateRow.createEl("label", { text: "Reconciliation date" });
        const dateIn = dateRow.createEl("input", { type: "date", cls: "personal-capital-input" });
        dateIn.value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        this.dateIn = dateIn;
        const table = contentEl.createEl("table", { cls: "pc-reconcile-table" });
        const thead = table.createEl("thead");
        const htr = thead.createEl("tr");
        ["Account", "Expected", "Actual", "Diff"].forEach((h) => htr.createEl("th", { text: h }));
        const tbody = table.createEl("tbody");
        let accounts = [], ledger = [];
        try {
          [accounts, ledger] = await Promise.all([
            readAccounts2(this.app, this.plugin.settings),
            readAllLedger(this.app, this.plugin.settings)
          ]);
        } catch (e) {
          console.error("[PC] reconcile: load failed:", e);
          contentEl.createEl("p", { text: "Failed to load accounts/ledger: " + (e.message || e) });
          return;
        }
        if (accounts.length === 0) {
          tbody.createEl("tr").createEl("td", { attr: { colspan: 4 }, text: "No accounts." });
        }
        const staleDays = Math.max(1, toNum(this.plugin.settings.reconcileStaleDays) || 30);
        const now = Date.now();
        accounts.sort((a, b) => {
          const pa = a.lastReconciled ? Math.max(0, Math.floor((now - Date.parse(a.lastReconciled)) / 864e5)) : Infinity;
          const pb = b.lastReconciled ? Math.max(0, Math.floor((now - Date.parse(b.lastReconciled)) / 864e5)) : Infinity;
          if (pa !== pb) return pb - pa;
          return a.name.localeCompare(b.name);
        });
        const summaryEl = contentEl.createDiv({ cls: "pc-reconcile-summary" });
        const updateSummary = () => {
          let filled = 0, diffTotal = 0, diffCount = 0;
          for (const r of this.rows) {
            if (!r.actualInput.value.trim()) continue;
            filled += 1;
            const actual = toNum(r.actualInput.value);
            const diff = actual - r.expected;
            if (Math.abs(diff) >= 5e-3) {
              diffCount += 1;
              diffTotal += diff;
            }
          }
          summaryEl.empty();
          if (filled === 0) {
            summaryEl.createEl("span", { cls: "pc-text-muted", text: "Fill in any row to reconcile." });
          } else if (diffCount === 0) {
            summaryEl.createEl("span", { cls: "pc-reconcile-diff--zero", text: `\u2713 ${filled} account(s) match the ledger.` });
          } else {
            const sign = diffTotal >= 0 ? "+" : "\u2212";
            const cls = diffTotal >= 0 ? "pc-reconcile-diff--pos" : "pc-reconcile-diff--neg";
            const lead = summaryEl.createEl("span", { cls });
            lead.textContent = `${diffCount} mismatch(es) \xB7 net ${sign}${fmt(Math.abs(diffTotal))}`;
            summaryEl.createEl("span", { cls: "pc-text-muted", text: ` across ${filled} account(s) checked` });
          }
        };
        for (const a of accounts) {
          const expected = getAccountBalance(a, ledger);
          const tr = tbody.createEl("tr");
          const nameTd = tr.createEl("td");
          nameTd.createEl("span", { text: a.name });
          if (!a.lastReconciled) {
            nameTd.createEl("span", { cls: "pc-reconcile-stale-badge", text: " never" });
          } else {
            const days = Math.floor((now - Date.parse(a.lastReconciled)) / 864e5);
            if (Number.isFinite(days) && days >= staleDays) {
              nameTd.createEl("span", { cls: "pc-reconcile-stale-badge", text: ` ${days}d` });
            }
          }
          const expTd = tr.createEl("td", { cls: "pc-reconcile-num" });
          expTd.textContent = `${fmt(expected)} ${a.currency}`;
          const actTd = tr.createEl("td");
          const actIn = actTd.createEl("input", { type: "number", cls: "personal-capital-input" });
          actIn.step = "0.01";
          actIn.placeholder = String(Math.round(expected));
          killWheelChange(actIn);
          const diffTd = tr.createEl("td", { cls: "pc-reconcile-num pc-reconcile-diff-cell" });
          diffTd.textContent = "\u2014";
          const updateDiff = () => {
            const raw = actIn.value.trim();
            if (!raw) {
              diffTd.textContent = "\u2014";
              diffTd.classList.remove("pc-reconcile-diff--zero", "pc-reconcile-diff--pos", "pc-reconcile-diff--neg");
              updateSummary();
              return;
            }
            const actual = toNum(raw);
            const diff = actual - expected;
            diffTd.classList.remove("pc-reconcile-diff--zero", "pc-reconcile-diff--pos", "pc-reconcile-diff--neg");
            if (Math.abs(diff) < 5e-3) {
              diffTd.textContent = `\u2713 match`;
              diffTd.classList.add("pc-reconcile-diff--zero");
            } else {
              diffTd.textContent = `${diff >= 0 ? "+" : "\u2212"} ${fmt(Math.abs(diff))}`;
              diffTd.classList.add(diff > 0 ? "pc-reconcile-diff--pos" : "pc-reconcile-diff--neg");
            }
            updateSummary();
          };
          actIn.oninput = updateDiff;
          this.rows.push({ account: a, expected, actualInput: actIn });
        }
        updateSummary();
        const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
        const okBtn = btns.createEl("button", { text: "Reconcile", cls: "mod-cta" });
        const cancelBtn = btns.createEl("button", { text: "Cancel" });
        okBtn.onclick = async () => {
          const d = this.dateIn.value || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          let wrote = 0, stamped = 0, errors = 0;
          okBtn.disabled = true;
          okBtn.textContent = "Reconciling\u2026";
          for (const r of this.rows) {
            const raw = r.actualInput.value.trim();
            if (!raw) continue;
            const actual = toNum(raw);
            const diff = actual - r.expected;
            try {
              if (Math.abs(diff) >= 5e-3) {
                const entry = {
                  d,
                  type: "reconciliation",
                  amt: Math.abs(diff),
                  cat: "Reconciliation",
                  note: `Auto-adjust ${r.account.name}: ${diff >= 0 ? "+" : "\u2212"}${fmt(Math.abs(diff))}`
                };
                if (diff > 0) entry.to = r.account.name;
                else entry.from = r.account.name;
                await writeLedgerEntry(this.app, this.plugin.settings, entry);
                wrote += 1;
              }
              await updateLastReconciled(this.app, r.account.file, d);
              stamped += 1;
            } catch (e) {
              console.error("[PC] reconcile row failed:", r.account.name, e);
              errors += 1;
            }
          }
          if (stamped === 0) {
            showNotice2("Nothing to reconcile \u2014 fill in at least one row.", 3e3);
            okBtn.disabled = false;
            okBtn.textContent = "Reconcile";
            return;
          }
          const msg = wrote === 0 ? `\u2713 Stamped ${stamped} account(s) \u2014 all matched` : `\u2713 Stamped ${stamped}, wrote ${wrote} adjustment(s)`;
          showNotice2(errors > 0 ? `${msg} \xB7 ${errors} failed` : msg, 4e3);
          this.close();
          if (this.onDone) await this.onDone();
        };
        cancelBtn.onclick = () => this.close();
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    module2.exports = { ReconcileAllModal };
  }
});

// src/ui/dashboard.js
var require_dashboard = __commonJS({
  "src/ui/dashboard.js"(exports2, module2) {
    var { MONTH_SHORT } = require_constants();
    var { fmt, showNotice: showNotice2, makeInteractive } = require_utils();
    var { buildAssetFlowsAsync } = require_flows();
    var { buildCashflowRows: buildCashflowRows2 } = require_cashflow();
    var { buildBudgetSummary, buildProjected } = require_summary();
    var { readCapitalHistory } = require_timeline();
    var { getLiquidTotal } = require_balance();
    var { generateMonthlyReport } = require_report();
    var { renderBudgetCards } = require_cards();
    var { renderProjected } = require_projected();
    var { renderCapitalChart } = require_chart();
    var { renderBaskets } = require_baskets2();
    var { renderAssetCards } = require_assets();
    var { renderAnalysisBlock } = require_analysis();
    var { renderWantsQueue } = require_wants();
    async function renderDashboard2(app, settings, container, plugin) {
      container.empty();
      container.addClass("pc-dashboard");
      if (!settings.onboardingDone) {
        const { OnboardingModal: OnboardingModal2 } = require_onboarding();
        const ph = container.createDiv({ cls: "pc-onboard-placeholder" });
        ph.createEl("div", { cls: "pc-onboard-placeholder-icon", text: "\u{1F4CA}" });
        ph.createEl("h2", { cls: "pc-onboard-placeholder-title", text: "Welcome to Personal Capital" });
        ph.createEl("p", {
          cls: "pc-onboard-placeholder-desc",
          text: "Let's set up your capital tracking. It takes 30 seconds \u2014 just count what you have."
        });
        const btn = ph.createEl("button", { cls: "pc-onboard-placeholder-btn mod-cta", text: "Start setup" });
        btn.onclick = () => {
          if (plugin) {
            new OnboardingModal2(app, plugin, () => {
              renderDashboard2(app, plugin.settings, container, plugin);
            }).open();
          }
        };
        return;
      }
      const af = await buildAssetFlowsAsync(app, settings);
      const { passiveIncome, saves, assets, savesByMonthKey, accounts, allLedger } = af;
      const cfRows = buildCashflowRows2(app, settings, allLedger);
      const budget = buildBudgetSummary(cfRows, settings, af);
      const proj = buildProjected(cfRows);
      const history = await readCapitalHistory(app, settings);
      const sym = settings.homeCurrencySymbol;
      const heroSection = container.createDiv({ cls: "pc-hero-section" });
      const investedCapital = assets.reduce((s, a) => s + a.currentValueRub, 0);
      const liquidTotal = getLiquidTotal(settings, accounts, allLedger);
      const totalCapital = investedCapital + liquidTotal;
      const heroLeft = heroSection.createDiv({ cls: "pc-hero-left" });
      heroLeft.createEl("div", { cls: "pc-hero-label", text: "Total Capital" });
      heroLeft.createEl("div", { cls: "pc-hero-value", text: `${fmt(totalCapital)} ${sym}` });
      const heroSub = heroLeft.createDiv({ cls: "pc-hero-sub" });
      heroSub.createEl("span", { text: `Invested ${fmt(investedCapital)} ${sym}` });
      heroSub.createEl("span", { text: " \xB7 " });
      heroSub.createEl("span", { text: `Accounts ${fmt(liquidTotal)} ${sym}` });
      const heroRight = heroSection.createDiv({ cls: "pc-hero-right" });
      const now = /* @__PURE__ */ new Date();
      const { AddTransactionModal: AddTransactionModal2 } = require_transaction();
      const PC_LEDGER_VIEW2 = "pc-ledger-view";
      const reportBtn = heroRight.createEl("button", { cls: "pc-action-btn", text: "\u{1F4CB} Report" });
      reportBtn.onclick = async () => {
        reportBtn.disabled = true;
        reportBtn.textContent = "Generating\u2026";
        try {
          const path = await generateMonthlyReport(app, settings, budget, assets, cfRows, sym);
          showNotice2(`\u2713 Report saved: ${path}`, 4e3);
        } catch (e) {
          showNotice2("Report failed: " + (e.message || e), 4e3);
        }
        reportBtn.disabled = false;
        reportBtn.textContent = "\u{1F4CB} Report";
      };
      const addTxBtn = heroRight.createEl("button", { cls: "pc-action-btn", text: "\uFF0B Transaction" });
      addTxBtn.onclick = () => new AddTransactionModal2(app, plugin, accounts).open();
      const ledgerBtn = heroRight.createEl("button", { cls: "pc-action-btn", text: "\u{1F4D2} Ledger" });
      ledgerBtn.onclick = async () => {
        const leaf = app.workspace.getLeaf("tab");
        await leaf.setViewState({ type: PC_LEDGER_VIEW2, active: true });
      };
      const { ReconcileAllModal } = require_reconcile();
      const reconcileBtn = heroRight.createEl("button", { cls: "pc-action-btn", text: "\u2696 Reconcile" });
      reconcileBtn.onclick = () => new ReconcileAllModal(app, plugin, () => renderDashboard2(app, settings, container, plugin)).open();
      const refreshBtn = heroRight.createEl("button", { cls: "pc-action-btn pc-action-btn--secondary", text: "\u21BB Refresh" });
      refreshBtn.onclick = () => renderDashboard2(app, settings, container, plugin);
      const b1 = container.createDiv({ cls: "pc-block" });
      b1.createEl("div", { cls: "pc-block-title", text: "Budget \xB7 " + MONTH_SHORT[now.getMonth()] });
      const b1body = b1.createDiv({ cls: "pc-block-body pc-cards-grid" });
      renderBudgetCards(b1body, budget, sym);
      const b1b = container.createDiv({ cls: "pc-block" });
      renderWantsQueue(b1b, app, settings);
      const b2 = container.createDiv({ cls: "pc-block" });
      b2.createEl("div", { cls: "pc-block-title", text: "Projected \xB7 " + MONTH_SHORT[(now.getMonth() + 1) % 12] });
      const b2body = b2.createDiv({ cls: "pc-block-body" });
      renderProjected(b2body, proj, sym, budget);
      const b3 = container.createDiv({ cls: "pc-block" });
      const b3header = b3.createDiv({ cls: "pc-block-header" });
      b3header.createEl("div", { cls: "pc-block-title", text: "Capital Growth" });
      const b3body = b3.createDiv({ cls: "pc-block-body" });
      renderCapitalChart(b3body, history, assets, settings, budget, accounts, allLedger);
      renderBaskets(b3body, assets, settings, sym, app, plugin, accounts, allLedger);
      renderAssetCards(b3body, assets, settings, app, plugin, container);
      const b4 = container.createDiv({ cls: "pc-block" });
      b4.createEl("div", { cls: "pc-block-title", text: "Analysis Session" });
      const b4body = b4.createDiv({ cls: "pc-block-body" });
      renderAnalysisBlock(b4body, app, settings);
      const settingsBtn = container.createDiv({ cls: "pc-settings-link" });
      makeInteractive(settingsBtn);
      settingsBtn.createEl("span", { text: "\u2699" });
      settingsBtn.createEl("span", { text: "Settings" });
      settingsBtn.onclick = () => {
        app.setting.open();
        app.setting.openTabById("personal-capital");
      };
    }
    module2.exports = { renderDashboard: renderDashboard2 };
  }
});

// src/modals/cashflow-cell.js
var require_cashflow_cell = __commonJS({
  "src/modals/cashflow-cell.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { MONTH_NAMES: MONTH_NAMES2, MONTH_KEYS: MONTH_KEYS2 } = require_constants();
    var { toNum, showNotice: showNotice2, fmt, killWheelChange } = require_utils();
    var { readLedger, writeLedgerEntry, deleteLedgerEntry } = require_io();
    var CashflowCellModal = class extends Modal2 {
      constructor(app, settings, opts) {
        super(app);
        this.settings = settings;
        this.year = opts.year;
        this.monthIdx = opts.monthIdx;
        this.category = opts.category;
        this.isIncome = !!opts.isIncome;
        this.accounts = opts.accounts || [];
        this.onSaved = opts.onSaved;
        this.rows = [];
      }
      async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        const monthName = MONTH_NAMES2[this.monthIdx];
        this.titleEl.setText(`${monthName} ${this.year} \xB7 ${this.category}`);
        const all = await readLedger(this.app, this.settings, this.year);
        const mm = String(this.monthIdx + 1).padStart(2, "0");
        const prefix = `${this.year}-${mm}`;
        const matching = all.filter(
          (e) => e && e.d && e.d.startsWith(prefix) && e.cat === this.category && (e.type === "expense" || e.type === "income")
        );
        for (const e of matching) {
          this.rows.push({
            entry: e,
            draft: {
              d: e.d,
              amt: Math.abs(toNum(e.amt)),
              acct: (this.isIncome ? e.to : e.from) || "",
              note: e.note || ""
            },
            deleted: false
          });
        }
        const tableWrap = contentEl.createDiv({ cls: "pc-cell-modal" });
        const table = tableWrap.createEl("table", { cls: "pc-cell-modal-table" });
        const thead = table.createEl("thead");
        const hr = thead.createEl("tr");
        ["Date", "Amount", this.isIncome ? "To account" : "From account", "Note", ""].forEach((h) => hr.createEl("th", { text: h }));
        const tbody = table.createEl("tbody");
        const renderRows = () => {
          tbody.empty();
          const visible = this.rows.filter((r) => !r.deleted);
          if (visible.length === 0) {
            const emptyTr = tbody.createEl("tr");
            emptyTr.createEl("td", { text: "No entries yet.", attr: { colspan: "5" }, cls: "pc-cell-modal-empty" });
          }
          this.rows.forEach((r, idx) => {
            if (r.deleted) return;
            const tr = tbody.createEl("tr", { cls: "pc-cell-modal-row" });
            const dateTd = tr.createEl("td");
            const dateIn = dateTd.createEl("input", { type: "date", cls: "personal-capital-input" });
            dateIn.value = r.draft.d;
            dateIn.onchange = () => {
              r.draft.d = dateIn.value;
            };
            const syncErr = () => tr.classList.toggle("pc-row-error", r.draft.amt > 0 && !r.draft.acct);
            const amtTd = tr.createEl("td");
            const amtIn = amtTd.createEl("input", { type: "number", cls: "personal-capital-input" });
            amtIn.step = "any";
            amtIn.value = r.draft.amt ? String(r.draft.amt) : "";
            killWheelChange(amtIn);
            amtIn.oninput = () => {
              r.draft.amt = parseFloat(amtIn.value) || 0;
              syncErr();
              updateSaveState();
            };
            const acctTd = tr.createEl("td");
            const acctSel = acctTd.createEl("select", { cls: "personal-capital-input" });
            acctSel.createEl("option", { text: "\u2014 select \u2014", value: "" });
            for (const a of this.accounts) acctSel.createEl("option", { text: a.name, value: a.name });
            acctSel.value = r.draft.acct;
            acctSel.onchange = () => {
              r.draft.acct = acctSel.value;
              syncErr();
              updateSaveState();
            };
            syncErr();
            const noteTd = tr.createEl("td");
            const noteIn = noteTd.createEl("input", { type: "text", cls: "personal-capital-input" });
            noteIn.value = r.draft.note || "";
            noteIn.oninput = () => {
              r.draft.note = noteIn.value;
            };
            const delTd = tr.createEl("td");
            const delBtn = delTd.createEl("button", { text: "\u2715", cls: "pc-cell-modal-del" });
            delBtn.onclick = () => {
              r.deleted = true;
              renderRows();
              updateSaveState();
            };
          });
          const addTr = tbody.createEl("tr", { cls: "pc-cell-modal-addrow" });
          const addTd = addTr.createEl("td", { text: "+ Add entry", attr: { colspan: "5" } });
          addTd.onclick = () => {
            const defaultDate = `${this.year}-${mm}-15`;
            this.rows.push({
              entry: null,
              draft: { d: defaultDate, amt: 0, acct: "", note: "" },
              deleted: false
            });
            renderRows();
            updateSaveState();
          };
        };
        const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
        const saveBtn = btns.createEl("button", { text: "Save", cls: "mod-cta" });
        const cancelBtn = btns.createEl("button", { text: "Cancel" });
        const updateSaveState = () => {
          const hasInvalid = this.rows.some((r) => !r.deleted && r.draft.amt > 0 && !r.draft.acct);
          saveBtn.disabled = hasInvalid;
          saveBtn.classList.toggle("is-disabled", hasInvalid);
        };
        saveBtn.onclick = async () => {
          saveBtn.disabled = true;
          for (const r of this.rows) {
            if (r.entry && r.deleted) {
              await deleteLedgerEntry(this.app, this.settings, r.entry);
              continue;
            }
            if (r.entry && !r.deleted) {
              const orig = r.entry;
              const origAcct = (this.isIncome ? orig.to : orig.from) || "";
              const changed = orig.d !== r.draft.d || Math.abs(toNum(orig.amt)) !== r.draft.amt || (orig.note || "") !== (r.draft.note || "") || origAcct !== r.draft.acct;
              if (!changed) continue;
              await deleteLedgerEntry(this.app, this.settings, orig);
              const entry = {
                d: r.draft.d,
                type: this.isIncome ? "income" : "expense",
                cat: this.category,
                amt: r.draft.amt
              };
              if (this.isIncome) entry.to = r.draft.acct;
              else entry.from = r.draft.acct;
              if (r.draft.note) entry.note = r.draft.note;
              await writeLedgerEntry(this.app, this.settings, entry);
              continue;
            }
            if (!r.entry && !r.deleted && r.draft.amt > 0 && r.draft.acct) {
              const entry = {
                d: r.draft.d,
                type: this.isIncome ? "income" : "expense",
                cat: this.category,
                amt: r.draft.amt
              };
              if (this.isIncome) entry.to = r.draft.acct;
              else entry.from = r.draft.acct;
              if (r.draft.note) entry.note = r.draft.note;
              await writeLedgerEntry(this.app, this.settings, entry);
            }
          }
          this.close();
          if (this.onSaved) await this.onSaved();
        };
        cancelBtn.onclick = () => this.close();
        renderRows();
        updateSaveState();
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    module2.exports = { CashflowCellModal };
  }
});

// src/modals/category.js
var require_category = __commonJS({
  "src/modals/category.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { showNotice: showNotice2 } = require_utils();
    var AddCategoryModal = class extends Modal2 {
      constructor(app, settings, onDone) {
        super(app);
        this.settings = settings;
        this.onDone = onDone;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.titleEl.setText("New category");
        const form = contentEl.createDiv({ cls: "personal-capital-form" });
        const nameWrap = form.createDiv();
        nameWrap.createEl("label", { text: "Name" });
        const nameIn = nameWrap.createEl("input", { type: "text", cls: "personal-capital-input" });
        nameIn.placeholder = "e.g. Groceries";
        const typeWrap = form.createDiv();
        typeWrap.createEl("label", { text: "Type" });
        const typeSel = typeWrap.createEl("select", { cls: "personal-capital-input" });
        for (const t of ["Income", "Needs", "Wants"]) {
          typeSel.createEl("option", { text: t, value: t });
        }
        typeSel.value = "Wants";
        const emojiWrap = form.createDiv();
        emojiWrap.createEl("label", { text: "Emoji" });
        const emojiIn = emojiWrap.createEl("input", { type: "text", cls: "personal-capital-input" });
        emojiIn.placeholder = "\u{1F6D2}";
        emojiIn.maxLength = 4;
        const recWrap = form.createDiv();
        const recLbl = recWrap.createEl("label", { text: "Recurring (feeds Projected section) " });
        const recIn = recLbl.createEl("input", { type: "checkbox" });
        const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
        const saveBtn = btns.createEl("button", { text: "Create", cls: "mod-cta" });
        const cancelBtn = btns.createEl("button", { text: "Cancel" });
        saveBtn.onclick = async () => {
          const name = nameIn.value.trim();
          if (!name) {
            showNotice2("Name is required");
            return;
          }
          if (/[\\/:*?"<>|]/.test(name)) {
            showNotice2("Invalid characters in name");
            return;
          }
          const folder = this.settings.categoriesFolder || "finance/Data/categories";
          const path = `${folder}/${name}.md`;
          if (this.app.vault.getAbstractFileByPath(path)) {
            showNotice2(`Category "${name}" already exists`);
            return;
          }
          if (!this.app.vault.getAbstractFileByPath(folder)) {
            await this.app.vault.createFolder(folder).catch(() => {
            });
          }
          const type = typeSel.value;
          const emoji = emojiIn.value.trim();
          const recurring = !!recIn.checked;
          const fm = [
            "---",
            `category: ${name}`,
            `type: ${type}`,
            `emoji: ${emoji}`,
            `recurring: ${recurring}`,
            "---",
            ""
          ].join("\n");
          await this.app.vault.create(path, fm);
          showNotice2(`\u2713 Created category "${name}"`);
          this.close();
          if (this.onDone) await this.onDone();
        };
        cancelBtn.onclick = () => this.close();
        nameIn.focus();
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    module2.exports = { AddCategoryModal };
  }
});

// src/ui/ledger-view.js
var require_ledger_view = __commonJS({
  "src/ui/ledger-view.js"(exports2, module2) {
    var { MONTH_KEYS: MONTH_KEYS2, MONTH_NAMES: MONTH_NAMES2, MONTH_SHORT } = require_constants();
    var { toNum, fmt, getCurrentYear: getCurrentYear2, getCurrentMonthKey, makeInteractive } = require_utils();
    var { readAllLedger, readLedgerMultiYear: readLedgerMultiYear2 } = require_io();
    var { readAccounts: readAccounts2 } = require_io2();
    var { getAccountBalance } = require_balance();
    var { buildCashflowRows: buildCashflowRows2 } = require_cashflow();
    async function renderLedgerClassic(app, settings, container, plugin, onChange) {
      container.empty();
      container.addClass("pc-ledger-view");
      const entries = await readAllLedger(app, settings);
      const accounts = await readAccounts2(app, settings);
      const sym = settings.homeCurrencySymbol;
      const filterBar = container.createDiv({ cls: "pc-ledger-filters" });
      let filterType = "";
      let filterAccount = "";
      const typeSelect = filterBar.createEl("select", { cls: "personal-capital-input pc-ledger-filter-select" });
      typeSelect.createEl("option", { text: "All types", value: "" });
      for (const t of ["buy", "sell", "dividend", "close", "expense", "income", "transfer", "reconciliation"]) {
        typeSelect.createEl("option", { text: t, value: t });
      }
      const acctBar = container.createDiv({ cls: "pc-ledger-accounts" });
      const allTag = acctBar.createDiv({ cls: "pc-ledger-acct-tag pc-ledger-acct-active" });
      allTag.createEl("span", { cls: "pc-ledger-acct-name", text: "All" });
      allTag.createEl("span", { cls: "pc-ledger-acct-bal", text: `${entries.length}` });
      const acctTags = [{ el: allTag, name: "" }];
      const staleDays = Math.max(1, toNum(settings.reconcileStaleDays) || 30);
      const nowMs = Date.now();
      for (const a of accounts) {
        const bal = getAccountBalance(a, entries);
        const tag = acctBar.createDiv({ cls: `pc-ledger-acct-tag ${a.locked ? "pc-ledger-acct-locked" : ""}` });
        const nameEl = tag.createEl("span", { cls: "pc-ledger-acct-name", text: a.name });
        let staleText = null;
        if (!a.lastReconciled) {
          staleText = "Never reconciled";
        } else {
          const days = Math.floor((nowMs - Date.parse(a.lastReconciled)) / 864e5);
          if (Number.isFinite(days) && days >= staleDays) staleText = `Last reconciled ${days}d ago`;
        }
        if (staleText) {
          const icon = nameEl.createEl("span", { cls: "pc-account-stale-icon", text: " \u27F3" });
          icon.title = staleText;
        }
        tag.createEl("span", { cls: "pc-ledger-acct-bal", text: `${fmt(bal)} ${sym}` });
        acctTags.push({ el: tag, name: a.name });
      }
      const unassignedCount = entries.filter((e) => !e.from && !e.to).length;
      if (unassignedCount > 0) {
        const uTag = acctBar.createDiv({ cls: "pc-ledger-acct-tag pc-ledger-acct-locked" });
        uTag.createEl("span", { cls: "pc-ledger-acct-name", text: "Unassigned" });
        uTag.createEl("span", { cls: "pc-ledger-acct-bal", text: `${unassignedCount}` });
        acctTags.push({ el: uTag, name: "__unassigned__" });
      }
      for (const at of acctTags) {
        makeInteractive(at.el);
        at.el.style.cursor = "pointer";
        at.el.onclick = () => {
          filterAccount = at.name;
          acctTags.forEach((t) => t.el.classList.toggle("pc-ledger-acct-active", t === at));
          renderTable(filterType, filterAccount);
        };
      }
      const table = container.createDiv({ cls: "pc-ledger-table" });
      function renderTable(typeFilter, acctFilter) {
        table.empty();
        let filtered = entries;
        if (typeFilter) filtered = filtered.filter((e) => e.type === typeFilter);
        if (acctFilter === "__unassigned__") {
          filtered = filtered.filter((e) => !e.from && !e.to);
        } else if (acctFilter) {
          filtered = filtered.filter((e) => e.from === acctFilter || e.to === acctFilter);
        }
        const sorted = [...filtered].sort((a, b) => b.d.localeCompare(a.d));
        const shown = sorted.slice(0, 100);
        if (shown.length === 0) {
          table.createEl("p", { cls: "pc-empty", text: "No transactions yet." });
          return;
        }
        const typeIcons = { buy: "\u{1F4C8}", sell: "\u{1F4C9}", dividend: "\u{1F4B0}", close: "\u{1F512}", expense: "\u{1F534}", income: "\u{1F7E2}", transfer: "\u21D4\uFE0F", reconciliation: "\u2696\uFE0F" };
        for (const e of shown) {
          const row = table.createDiv({ cls: "pc-ledger-row" });
          row.createEl("span", { cls: "pc-ledger-date", text: e.d });
          row.createEl("span", { cls: "pc-ledger-type", text: `${typeIcons[e.type] || "\xB7"} ${e.type}` });
          row.createEl("span", { cls: "pc-ledger-desc", text: e.asset || e.cat || e.note || "\u2014" });
          const amtCls = e.type === "income" || e.type === "sell" || e.type === "dividend" ? "pc-pos" : e.type === "expense" || e.type === "buy" ? "pc-neg" : "";
          const amt = toNum(e.amt);
          const amtDec = amt !== 0 && Math.abs(amt) < 10 ? 2 : 0;
          row.createEl("span", { cls: `pc-ledger-amt ${amtCls}`, text: `${fmt(amt, amtDec)} ${sym}` });
          const acctParts = [];
          if (e.from) acctParts.push(`\u2190 ${e.from}`);
          if (e.to) acctParts.push(`\u2192 ${e.to}`);
          row.createEl("span", { cls: "pc-ledger-acct", text: acctParts.join("  ") || "\u2014" });
        }
        if (sorted.length > 100) {
          table.createEl("p", { cls: "pc-empty", text: `Showing 100 of ${sorted.length} entries` });
        }
      }
      typeSelect.onchange = () => {
        filterType = typeSelect.value;
        renderTable(filterType, filterAccount);
      };
      renderTable("", "");
    }
    async function renderLedgerMonthly(app, settings, container, plugin, onChange) {
      const { CashflowCellModal } = require_cashflow_cell();
      const { AddCategoryModal } = require_category();
      container.empty();
      container.addClass("pc-cashflow-grid-view");
      const curYear = getCurrentYear2();
      const allLedger = await readLedgerMultiYear2(app, settings, [curYear]);
      const accounts = await readAccounts2(app, settings);
      const rows = buildCashflowRows2(app, settings, allLedger);
      const sym = settings.homeCurrencySymbol;
      const curMk = getCurrentMonthKey();
      const rerender = () => renderLedgerMonthly(app, settings, container, plugin, onChange);
      const tbl = container.createEl("table", { cls: "pc-cf-table" });
      const thead = tbl.createEl("thead");
      const hrow = thead.createEl("tr");
      hrow.createEl("th", { text: "Type" });
      hrow.createEl("th", { text: "Category" });
      for (const mn of MONTH_SHORT) hrow.createEl("th", { text: mn, cls: "pc-cf-month-th" });
      hrow.createEl("th", { text: "Total" });
      const tbody = tbl.createEl("tbody");
      let currentType = "";
      let typeIncome = 0, typeNeeds = 0, typeWants = 0;
      const monthTotals = {};
      MONTH_KEYS2.forEach((k) => {
        monthTotals[k] = 0;
      });
      let grandTotal = 0;
      for (const r of rows) {
        if (r.type !== currentType) {
          currentType = r.type;
          const sepRow = tbody.createEl("tr", { cls: "pc-cf-type-row" });
          sepRow.createEl("td", { text: r.type, attr: { colspan: String(MONTH_KEYS2.length + 3) } });
        }
        const tr = tbody.createEl("tr");
        tr.createEl("td", { cls: "pc-cf-type-cell", text: "" });
        tr.createEl("td", { cls: "pc-cf-cat-cell", text: `${r.emoji} ${r.category}` });
        for (let mi = 0; mi < MONTH_KEYS2.length; mi++) {
          const mk = MONTH_KEYS2[mi];
          const val = r.months[mk];
          const td = tr.createEl("td", { cls: `pc-cf-val-cell ${mk === curMk ? "pc-cf-current" : ""}` });
          if (val != null && val !== 0) {
            td.textContent = fmt(val);
            td.classList.add(val > 0 ? "pc-pos" : "pc-neg");
            monthTotals[mk] += val;
            grandTotal += val;
          } else {
            td.textContent = "\u2014";
            td.classList.add("pc-cf-empty");
          }
          td.classList.add("pc-cf-clickable");
          makeInteractive(td);
          td.onclick = () => {
            new CashflowCellModal(app, settings, {
              year: curYear,
              monthIdx: mi,
              category: r.category,
              isIncome: r.type === "Income",
              accounts,
              onSaved: rerender
            }).open();
          };
        }
        tr.createEl("td", { cls: `pc-cf-total-cell ${r.total >= 0 ? "pc-pos" : "pc-neg"}`, text: fmt(r.total) });
      }
      const addCatTr = tbody.createEl("tr", { cls: "pc-cf-addcat-row" });
      const addCatTd = addCatTr.createEl("td", {
        text: "+ Add category",
        attr: { colspan: String(MONTH_KEYS2.length + 3) }
      });
      makeInteractive(addCatTd);
      addCatTd.onclick = () => {
        new AddCategoryModal(app, settings, rerender).open();
      };
      const tfoot = tbl.createEl("tfoot");
      const frow = tfoot.createEl("tr");
      frow.createEl("td", { text: "" });
      frow.createEl("td", { text: "Total", cls: "pc-cf-total-label" });
      for (const mk of MONTH_KEYS2) {
        const v = monthTotals[mk];
        frow.createEl("td", { cls: `pc-cf-val-cell pc-cf-total-cell ${v >= 0 ? "pc-pos" : "pc-neg"}`, text: v !== 0 ? fmt(v) : "\u2014" });
      }
      frow.createEl("td", { cls: `pc-cf-total-cell ${grandTotal >= 0 ? "pc-pos" : "pc-neg"}`, text: fmt(grandTotal) });
    }
    async function renderUnifiedLedger2(app, settings, container, plugin) {
      const { AddTransactionModal: AddTransactionModal2 } = require_transaction();
      const { PickAssetModal: PickAssetModal2 } = require_asset_pick();
      const { AddAssetLineModal: AddAssetLineModal2 } = require_asset_line();
      const { CreateAssetModal: CreateAssetModal2 } = require_asset_create();
      container.empty();
      container.addClass("pc-dashboard-root");
      container.addClass("pc-ledger-unified");
      const accounts = await readAccounts2(app, settings);
      const topBar = container.createDiv({ cls: "pc-ledger-toggle-bar" });
      topBar.createEl("div", { cls: "pc-block-title", text: "Ledger" });
      const toggleWrap = topBar.createDiv({ cls: "pc-ledger-toggle" });
      toggleWrap.createDiv({ cls: "pc-ledger-toggle-thumb" });
      const classicBtn = toggleWrap.createEl("button", { cls: "pc-toggle-btn", text: "Classic" });
      const monthlyBtn = toggleWrap.createEl("button", { cls: "pc-toggle-btn", text: "Monthly" });
      const addTxBtn = topBar.createEl("button", { cls: "pc-action-btn", text: "\uFF0B Transaction" });
      addTxBtn.onclick = () => new AddTransactionModal2(app, plugin, accounts, () => {
        renderMode();
      }).open();
      const updAssetBtn = topBar.createEl("button", { cls: "pc-action-btn", text: "\u21BB Asset action" });
      updAssetBtn.onclick = () => {
        new PickAssetModal2(app, plugin, (file) => {
          const modal = new AddAssetLineModal2(app, file, plugin);
          const origClose = modal.onClose ? modal.onClose.bind(modal) : null;
          modal.onClose = function() {
            if (origClose) origClose();
            renderMode();
          };
          modal.open();
        }).open();
      };
      const newAssetBtn = topBar.createEl("button", { cls: "pc-action-btn", text: "\uFF0B Asset" });
      newAssetBtn.onclick = () => {
        const modal = new CreateAssetModal2(app, plugin);
        const origClose = modal.onClose ? modal.onClose.bind(modal) : null;
        modal.onClose = function() {
          if (origClose) origClose();
          renderMode();
        };
        modal.open();
      };
      const modeEl = container.createDiv({ cls: "pc-ledger-mode-content" });
      async function renderMode() {
        const mode = settings.ledgerViewMode === "monthly" ? "monthly" : "classic";
        toggleWrap.dataset.mode = mode;
        classicBtn.classList.toggle("pc-toggle-btn--on", mode === "classic");
        monthlyBtn.classList.toggle("pc-toggle-btn--on", mode === "monthly");
        modeEl.empty();
        if (mode === "classic") {
          await renderLedgerClassic(app, settings, modeEl, plugin, renderMode);
        } else {
          await renderLedgerMonthly(app, settings, modeEl, plugin, renderMode);
        }
      }
      classicBtn.onclick = async () => {
        if (settings.ledgerViewMode === "classic") return;
        settings.ledgerViewMode = "classic";
        if (plugin && plugin.saveSettings) await plugin.saveSettings();
        await renderMode();
      };
      monthlyBtn.onclick = async () => {
        if (settings.ledgerViewMode === "monthly") return;
        settings.ledgerViewMode = "monthly";
        if (plugin && plugin.saveSettings) await plugin.saveSettings();
        await renderMode();
      };
      await renderMode();
    }
    module2.exports = { renderLedgerClassic, renderLedgerMonthly, renderUnifiedLedger: renderUnifiedLedger2 };
  }
});

// src/views/ledger-tab.js
var require_ledger_tab = __commonJS({
  "src/views/ledger-tab.js"(exports2, module2) {
    var { ItemView } = require("obsidian");
    var { renderUnifiedLedger: renderUnifiedLedger2 } = require_ledger_view();
    var PC_LEDGER_VIEW2 = "pc-ledger-view";
    var PCLedgerView2 = class extends ItemView {
      constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
      }
      getViewType() {
        return PC_LEDGER_VIEW2;
      }
      getDisplayText() {
        return "Ledger";
      }
      getIcon() {
        return "book-open";
      }
      async onOpen() {
        await renderUnifiedLedger2(this.app, this.plugin.settings, this.contentEl, this.plugin);
      }
      async onClose() {
        this.contentEl.empty();
      }
    };
    module2.exports = { PC_LEDGER_VIEW: PC_LEDGER_VIEW2, PCLedgerView: PCLedgerView2 };
  }
});

// src/modals/account-create.js
var require_account_create = __commonJS({
  "src/modals/account-create.js"(exports2, module2) {
    var { Modal: Modal2 } = require("obsidian");
    var { toNum, showNotice: showNotice2, killWheelChange } = require_utils();
    var INVALID_PATH = /[\\/:*?"<>|]|\.\./;
    var CreateAccountModal = class extends Modal2 {
      constructor(app, plugin, onDone) {
        super(app);
        this.plugin = plugin;
        this.onDone = onDone;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.titleEl.setText("New account");
        const form = contentEl.createDiv({ cls: "personal-capital-form" });
        const nameWrap = form.createDiv();
        nameWrap.createEl("label", { text: "Name" });
        const nameIn = nameWrap.createEl("input", { type: "text", cls: "personal-capital-input" });
        nameIn.placeholder = "e.g. T-Bank Debit";
        const typeWrap = form.createDiv();
        typeWrap.createEl("label", { text: "Type" });
        const typeSel = typeWrap.createEl("select", { cls: "personal-capital-input" });
        for (const t of ["bank", "broker", "cash", "savings", "credit", "other"]) {
          typeSel.createEl("option", { text: t, value: t });
        }
        typeSel.value = "bank";
        const curWrap = form.createDiv();
        curWrap.createEl("label", { text: "Currency" });
        const curIn = curWrap.createEl("input", { type: "text", cls: "personal-capital-input" });
        curIn.value = this.plugin.settings.homeCurrency || "RUB";
        curIn.maxLength = 8;
        const balWrap = form.createDiv();
        balWrap.createEl("label", { text: "Initial balance" });
        const balIn = balWrap.createEl("input", { type: "number", cls: "personal-capital-input" });
        balIn.placeholder = "0";
        balIn.step = "0.01";
        killWheelChange(balIn);
        const liquidWrap = form.createDiv();
        const liquidLbl = liquidWrap.createEl("label", { text: "Liquid (counts toward available cash) " });
        const liquidIn = liquidLbl.createEl("input", { type: "checkbox" });
        liquidIn.checked = true;
        const lockedWrap = form.createDiv();
        const lockedLbl = lockedWrap.createEl("label", { text: "Locked (e.g. deposit/escrow) " });
        const lockedIn = lockedLbl.createEl("input", { type: "checkbox" });
        const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
        const saveBtn = btns.createEl("button", { text: "Create", cls: "mod-cta" });
        const cancelBtn = btns.createEl("button", { text: "Cancel" });
        saveBtn.onclick = async () => {
          const name = nameIn.value.trim();
          if (!name) {
            showNotice2("Name is required");
            return;
          }
          if (INVALID_PATH.test(name)) {
            showNotice2("Invalid account name \u2014 avoid special characters");
            return;
          }
          const folder = this.plugin.settings.accountsFolder || "finance/Data/accounts";
          const path = `${folder}/${name}.md`;
          if (this.app.vault.getAbstractFileByPath(path)) {
            showNotice2(`Account "${name}" already exists`);
            return;
          }
          if (!this.app.vault.getAbstractFileByPath(folder)) {
            await this.app.vault.createFolder(folder).catch(() => {
            });
          }
          const currency = (curIn.value.trim() || this.plugin.settings.homeCurrency || "RUB").toUpperCase();
          const balance = toNum(balIn.value) || 0;
          const liquid = !!liquidIn.checked;
          const locked = !!lockedIn.checked;
          const content = [
            "---",
            `name: "${name}"`,
            `type: ${typeSel.value}`,
            `currency: ${currency}`,
            `liquid: ${liquid}`,
            `locked: ${locked}`,
            `initial_balance: ${balance}`,
            `last_reconciled: "${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}"`,
            "---",
            ""
          ].join("\n");
          await this.app.vault.create(path, content);
          showNotice2(`\u2713 Created account "${name}"`);
          this.close();
          if (this.onDone) await this.onDone();
        };
        cancelBtn.onclick = () => this.close();
        nameIn.focus();
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    module2.exports = { CreateAccountModal };
  }
});

// src/settings.js
var require_settings = __commonJS({
  "src/settings.js"(exports2, module2) {
    var { PluginSettingTab, Setting } = require("obsidian");
    var { toNum, fmt, showNotice: showNotice2, killWheelChange } = require_utils();
    var { COUNTRY_CURRENCY, COUNTRY_LIST } = require_onboarding();
    var { CreateAccountModal } = require_account_create();
    var { ReconcileAllModal } = require_reconcile();
    var { readAccounts: readAccounts2 } = require_io2();
    var { readAllLedger } = require_io();
    var { getAccountBalance } = require_balance();
    var { updateFxRates } = require_fx();
    var PersonalCapitalSettingTab2 = class extends PluginSettingTab {
      constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
      }
      display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "Personal Capital Settings" });
        containerEl.createEl("h3", { text: "Folders" });
        const folders = [
          ["categoriesFolder", "Categories folder", "finance/Data/categories"],
          ["assetsFolder", "Assets folder", "finance/Data/assets"],
          ["archiveFolder", "Archive folder", "finance/Data/archive"],
          ["strategyPath", "Strategy file", "finance/strategy.md"],
          ["dashboardPath", "Dashboard note", "finance/Dashboard.md"]
        ];
        for (const [key, name, placeholder] of folders) {
          new Setting(containerEl).setName(name).addText(
            (t) => t.setPlaceholder(placeholder).setValue(this.plugin.settings[key] ?? "").onChange(async (v) => {
              this.plugin.settings[key] = v.trim() || placeholder;
              await this.plugin.saveSettings();
            })
          );
        }
        containerEl.createEl("h3", { text: "Currency" });
        new Setting(containerEl).setName("Country").setDesc("Sets the default home currency").addDropdown((d) => {
          d.addOption("", "Select\u2026");
          for (const c of COUNTRY_LIST) {
            const cur = COUNTRY_CURRENCY[c];
            d.addOption(c, `${c} (${cur.symbol})`);
          }
          const curSym = this.plugin.settings.homeCurrencySymbol ?? "\u20BD";
          const match = COUNTRY_LIST.find((c) => COUNTRY_CURRENCY[c].symbol === curSym);
          if (match) d.setValue(match);
          d.onChange(async (v) => {
            const cur = COUNTRY_CURRENCY[v];
            if (cur) {
              this.plugin.settings.homeCurrency = cur.code;
              this.plugin.settings.homeCurrencySymbol = cur.symbol;
              await this.plugin.saveSettings();
              this.display();
            }
          });
        });
        new Setting(containerEl).setName("Home currency symbol").setDesc("Override if needed").addText(
          (t) => t.setValue(this.plugin.settings.homeCurrencySymbol ?? "\u20BD").onChange(async (v) => {
            this.plugin.settings.homeCurrencySymbol = v;
            await this.plugin.saveSettings();
          })
        );
        containerEl.createEl("h4", { text: "FX rates \u2192 home currency" });
        new Setting(containerEl).setName("Auto-fetch FX rates").setDesc("On \u21BB Update prices: CBR for RUB home, Yahoo otherwise. Manual overrides always win.").addToggle(
          (t) => t.setValue(this.plugin.settings.fxAutoFetch !== false).onChange(async (v) => {
            this.plugin.settings.fxAutoFetch = v;
            await this.plugin.saveSettings();
          })
        );
        const fxStatus = containerEl.createDiv({ cls: "pc-settings-fx-status" });
        const renderFxStatus = () => {
          fxStatus.empty();
          const label = this.plugin.settings.fxSourceLabel || "\u2014";
          const updated = this.plugin.settings.fxRatesUpdated ? new Date(this.plugin.settings.fxRatesUpdated).toLocaleString() : "never";
          fxStatus.createEl("span", { cls: "pc-text-muted", text: `Source: ${label} \xB7 Updated: ${updated}` });
        };
        renderFxStatus();
        new Setting(containerEl).setName("Refresh FX now").addButton(
          (b) => b.setButtonText("\u21BB Refresh").onClick(async () => {
            b.setDisabled(true);
            b.setButtonText("Fetching\u2026");
            try {
              const r = await updateFxRates(this.plugin.settings);
              if (r.updated) {
                await this.plugin.saveSettings();
                showNotice2(`\u2713 FX ${r.source}`, 3e3);
                this.display();
                return;
              }
              showNotice2(r.error || r.reason || "No change", 3e3);
            } catch (e) {
              showNotice2("FX failed: " + (e.message || e), 3500);
            }
            b.setDisabled(false);
            b.setButtonText("\u21BB Refresh");
          })
        );
        containerEl.createEl("div", { cls: "pc-settings-fx-subhead", text: "Auto (read-only)" });
        const autoRates = this.plugin.settings.fxRatesAuto ?? {};
        const autoGrid = containerEl.createDiv({ cls: "pc-settings-fx-grid" });
        const home = String(this.plugin.settings.homeCurrency || "RUB").toUpperCase();
        const autoCodes = Object.keys(autoRates).filter((c) => c.toUpperCase() !== home).sort();
        if (autoCodes.length === 0) {
          autoGrid.createEl("span", { cls: "pc-text-muted", text: "No auto rates yet. Click Refresh or \u21BB Update prices." });
        } else {
          for (const code of autoCodes) {
            const row = autoGrid.createDiv({ cls: "pc-settings-fx-row" });
            row.createEl("span", { text: code });
            const val = row.createEl("span", { cls: "pc-text-muted" });
            val.textContent = String(autoRates[code]);
          }
        }
        containerEl.createEl("div", { cls: "pc-settings-fx-subhead", text: "Manual overrides" });
        const manualDesc = containerEl.createEl("p", {
          cls: "setting-item-description",
          text: "Set a number to override the auto rate. Leave empty to use auto."
        });
        void manualDesc;
        const manual = this.plugin.settings.fxRatesManual ?? {};
        const codesUnion = Array.from(/* @__PURE__ */ new Set([...Object.keys(autoRates), ...Object.keys(manual)])).map((c) => c.toUpperCase()).filter((c) => c !== home).sort();
        const manualGrid = containerEl.createDiv({ cls: "pc-settings-fx-grid" });
        for (const code of codesUnion) {
          const row = manualGrid.createDiv({ cls: "pc-settings-fx-row" });
          row.createEl("span", { text: code });
          const inp = row.createEl("input", { type: "number", step: "any" });
          inp.addClass("personal-capital-input");
          killWheelChange(inp);
          inp.placeholder = autoRates[code] != null ? String(autoRates[code]) : "";
          inp.value = manual[code] != null ? String(manual[code]) : "";
          inp.onchange = async () => {
            this.plugin.settings.fxRatesManual = this.plugin.settings.fxRatesManual ?? {};
            const v = parseFloat(inp.value);
            if (!Number.isFinite(v) || v <= 0) {
              delete this.plugin.settings.fxRatesManual[code];
            } else {
              this.plugin.settings.fxRatesManual[code] = v;
            }
            await this.plugin.saveSettings();
          };
        }
        new Setting(containerEl).setName("Add manual override").addText((t) => {
          t.setPlaceholder("e.g. AED");
          t.inputEl.addClass("pc-settings-fx-add-code");
          t.inputEl.dataset.role = "code";
        }).addText((t) => {
          t.setPlaceholder("rate");
          t.inputEl.type = "number";
          t.inputEl.step = "any";
          t.inputEl.dataset.role = "rate";
          killWheelChange(t.inputEl);
        }).addButton(
          (b) => b.setButtonText("Add").onClick(async () => {
            const row = b.buttonEl.closest(".setting-item");
            const codeEl = row?.querySelector('input[data-role="code"]');
            const rateEl = row?.querySelector('input[data-role="rate"]');
            const code = String(codeEl?.value || "").toUpperCase().trim();
            const rate = parseFloat(rateEl?.value || "");
            if (!code || !Number.isFinite(rate) || rate <= 0) {
              showNotice2("Code + positive rate required", 2500);
              return;
            }
            this.plugin.settings.fxRatesManual = this.plugin.settings.fxRatesManual ?? {};
            this.plugin.settings.fxRatesManual[code] = rate;
            await this.plugin.saveSettings();
            this.display();
          })
        );
        containerEl.createEl("h3", { text: "Accounts" });
        containerEl.createEl("p", {
          text: "Your cash accounts. Each is a .md file in the accounts folder. Balances are derived from the ledger.",
          cls: "setting-item-description"
        });
        const acctFolder = this.plugin.settings.accountsFolder || "finance/Data/accounts";
        const acctFiles = this.app.vault.getMarkdownFiles().filter(
          (f) => f.path.toLowerCase().startsWith(acctFolder.toLowerCase() + "/")
        );
        if (acctFiles.length > 0) {
          const acctList = containerEl.createDiv({ cls: "pc-settings-acct-list" });
          const rowsByName = /* @__PURE__ */ new Map();
          for (const f of acctFiles) {
            const cache = this.app.metadataCache.getFileCache(f);
            const fm = cache?.frontmatter ?? {};
            const name = fm.name || f.basename;
            const acctRow = acctList.createDiv({ cls: "pc-settings-acct-row" });
            const nameSpan = acctRow.createEl("span", { cls: "pc-settings-acct-name", text: name });
            const meta = acctRow.createEl("span", { cls: "pc-text-muted" });
            meta.textContent = ` \xB7 ${fm.type || "?"} \xB7 ${fm.liquid !== false ? "Liquid" : "Locked"} \xB7 Balance: ${fmt(toNum(fm.initial_balance))}`;
            const btnWrap = acctRow.createDiv({ cls: "pc-settings-acct-btns" });
            const openBtn = btnWrap.createEl("button", { text: "Open", cls: "pc-settings-acct-btn" });
            openBtn.onclick = () => {
              const leaf = this.app.workspace.getLeaf("tab");
              leaf.openFile(f);
            };
            rowsByName.set(name, { meta, nameSpan });
          }
          (async () => {
            try {
              const [accounts, ledger] = await Promise.all([
                readAccounts2(this.app, this.plugin.settings),
                readAllLedger(this.app, this.plugin.settings)
              ]);
              const staleDays = Math.max(1, toNum(this.plugin.settings.reconcileStaleDays) || 30);
              const now = Date.now();
              for (const a of accounts) {
                const entry = rowsByName.get(a.name);
                if (!entry) continue;
                const bal = getAccountBalance(a, ledger);
                entry.meta.textContent = ` \xB7 ${a.type} \xB7 ${a.liquid ? "Liquid" : "Locked"} \xB7 Balance: ${fmt(bal)} ${a.currency}`;
                if (a.lastReconciled) {
                  const days = Math.floor((now - Date.parse(a.lastReconciled)) / 864e5);
                  if (Number.isFinite(days)) {
                    if (days >= staleDays) {
                      const icon = entry.nameSpan.createEl("span", { cls: "pc-account-stale-icon", text: " \u27F3" });
                      icon.title = `Last reconciled ${days}d ago`;
                    }
                    entry.meta.textContent += ` \xB7 reconciled ${days}d ago`;
                  }
                } else {
                  const icon = entry.nameSpan.createEl("span", { cls: "pc-account-stale-icon", text: " \u27F3" });
                  icon.title = "Never reconciled";
                  entry.meta.textContent += " \xB7 never reconciled";
                }
              }
            } catch (e) {
              console.warn("[PC] settings account enrich failed:", e);
            }
          })();
        } else {
          containerEl.createEl("p", { text: "No account files found. Complete onboarding or create files in " + acctFolder, cls: "pc-text-muted" });
        }
        new Setting(containerEl).setName("Accounts actions").addButton(
          (b) => b.setButtonText("\u2696 Reconcile accounts").setCta().onClick(() => {
            new ReconcileAllModal(this.app, this.plugin, () => this.display()).open();
          })
        ).addButton(
          (b) => b.setButtonText("\uFF0B New account").onClick(() => {
            new CreateAccountModal(this.app, this.plugin, () => this.display()).open();
          })
        );
        new Setting(containerEl).setName("Accounts folder").addText(
          (t) => t.setPlaceholder("finance/Data/accounts").setValue(this.plugin.settings.accountsFolder ?? "").onChange(async (v) => {
            this.plugin.settings.accountsFolder = v.trim() || "finance/Data/accounts";
            await this.plugin.saveSettings();
          })
        );
        containerEl.createEl("h3", { text: "Views" });
        containerEl.createEl("p", {
          text: "Optional: create a standalone note page for the unified Ledger view (Classic \u2194 Monthly toggle). The dashboard button works without this note.",
          cls: "setting-item-description"
        });
        const ledgerPath = this.plugin.settings.ledgerNotePath || "finance/Ledger.md";
        const ledgerExists = !!this.app.vault.getAbstractFileByPath(ledgerPath);
        new Setting(containerEl).setName("Ledger view").setDesc(ledgerExists ? `\u2713 ${ledgerPath}` : "Not created yet").addText(
          (t) => t.setPlaceholder("finance/Ledger.md").setValue(this.plugin.settings.ledgerNotePath ?? "").onChange(async (v) => {
            this.plugin.settings.ledgerNotePath = v.trim();
            await this.plugin.saveSettings();
          })
        ).addButton(
          (b) => b.setButtonText(ledgerExists ? "Open" : "Create").setCta(!ledgerExists).onClick(async () => {
            const p = this.plugin.settings.ledgerNotePath || "finance/Ledger.md";
            let f = this.app.vault.getAbstractFileByPath(p);
            if (!f) {
              const dir = p.split("/").slice(0, -1).join("/");
              if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
                await this.app.vault.createFolder(dir).catch(() => {
                });
              }
              await this.app.vault.create(p, "---\ncssclasses: [pc-dashboard]\n---\n```personal-capital-ledger\n```\n");
              this.plugin.settings.ledgerNotePath = p;
              await this.plugin.saveSettings();
              showNotice2("Ledger note created");
              this.display();
              return;
            }
            const leaf = this.app.workspace.getLeaf("tab");
            await leaf.openFile(f, { state: { mode: "preview" } });
          })
        );
        containerEl.createEl("h3", { text: "Strategy defaults" });
        new Setting(containerEl).setName("Saves target % of income").addText(
          (t) => t.setValue(String(this.plugin.settings.savesTargetPct ?? 30)).onChange(async (v) => {
            this.plugin.settings.savesTargetPct = parseFloat(v) || 30;
            await this.plugin.saveSettings();
          })
        );
        new Setting(containerEl).setName("Comfort budget (Wants ceiling)").addText(
          (t) => t.setValue(String(this.plugin.settings.comfortBudget ?? 1e5)).onChange(async (v) => {
            this.plugin.settings.comfortBudget = parseFloat(v) || 1e5;
            await this.plugin.saveSettings();
          })
        );
        containerEl.createEl("h3", { text: "Personal context" });
        containerEl.createEl("p", {
          text: "Free text included in every AI analysis prompt. Describe your situation, constraints, goals.",
          cls: "setting-item-description"
        });
        const ctxArea = containerEl.createEl("textarea", {
          cls: "personal-capital-input",
          placeholder: "e.g. I have an IP with 4M idle. Transfer limit 400K/month. Income is irregular."
        });
        ctxArea.style.width = "100%";
        ctxArea.style.minHeight = "120px";
        ctxArea.style.resize = "vertical";
        ctxArea.value = this.plugin.settings.personalContext ?? "";
        ctxArea.onchange = async () => {
          this.plugin.settings.personalContext = ctxArea.value;
          await this.plugin.saveSettings();
        };
      }
    };
    module2.exports = { PersonalCapitalSettingTab: PersonalCapitalSettingTab2 };
  }
});

// src/migration.js
var require_migration = __commonJS({
  "src/migration.js"(exports2, module2) {
    var { MONTH_KEYS: MONTH_KEYS2 } = require_constants();
    var { toNum, showNotice: showNotice2 } = require_utils();
    var { writeLedgerEntries } = require_io();
    async function runMigration2(app, settings, plugin) {
      showNotice2("Migrating to ledger\u2026", 5e3);
      const entries = [];
      const assetFolder = settings.assetsFolder.toLowerCase().replace(/\/$/, "");
      const assetFiles = app.vault.getMarkdownFiles().filter(
        (f) => f.path.toLowerCase().startsWith(assetFolder + "/")
      );
      for (const file of assetFiles) {
        const raw = await app.vault.read(file);
        const fmEnd = raw.indexOf("---", 3);
        if (fmEnd === -1) continue;
        const body = raw.slice(fmEnd + 3);
        const assetName = file.basename;
        for (const line of body.split("\n")) {
          const parts = line.trim().includes("|") ? line.trim().split("|").map((p) => p.trim()) : line.trim().split(/\s+/);
          if (parts.length < 4) continue;
          const d = new Date(parts[0]);
          if (Number.isNaN(d.getTime())) continue;
          const op = parts[1].toLowerCase();
          const qty = toNum(parts[2]);
          const val = toNum(parts[3]);
          if (op === "price") continue;
          const entry = { d: parts[0], asset: assetName, migrated: true };
          if (op === "buy" || op === "reinvest") {
            entry.type = "buy";
            entry.qty = qty;
            entry.price = val;
            entry.amt = qty * val;
            if (op === "reinvest") entry.note = "reinvest";
          } else if (op === "sell") {
            entry.type = "sell";
            entry.qty = qty;
            entry.price = val;
            entry.amt = qty * val;
          } else if (op === "div") {
            entry.type = "dividend";
            entry.amt = val;
          } else {
            continue;
          }
          entries.push(entry);
        }
      }
      const accountsFolder = settings.accountsFolder || "finance/Data/accounts";
      if (!app.vault.getAbstractFileByPath(accountsFolder)) {
        await app.vault.createFolder(accountsFolder).catch(() => {
        });
      }
      const pools = [
        { key: "liquidBank", liq: "liquidBankIsLiquid", name: "Bank", type: "bank" },
        { key: "liquidBrokerCash", liq: "liquidBrokerCashIsLiquid", name: "Broker Cash", type: "broker" },
        { key: "liquidCash", liq: "liquidCashIsLiquid", name: "Cash", type: "cash" },
        { key: "liquidBusiness", liq: "liquidBusinessIsLiquid", name: "Business", type: "business" }
      ];
      for (const pm of pools) {
        const val = settings[pm.key] ?? 0;
        if (val === 0) continue;
        const path = `${accountsFolder}/${pm.name}.md`;
        if (!app.vault.getAbstractFileByPath(path)) {
          const content = [
            "---",
            `name: "${pm.name}"`,
            `type: ${pm.type}`,
            `currency: ${settings.homeCurrency || "RUB"}`,
            `liquid: ${settings[pm.liq] !== false}`,
            `locked: ${settings[pm.liq] === false}`,
            `initial_balance: ${val}`,
            `last_reconciled: "${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}"`,
            "---",
            ""
          ].join("\n");
          await app.vault.create(path, content);
        }
      }
      const catFolder = settings.categoriesFolder.toLowerCase().replace(/\/$/, "");
      const catFiles = app.vault.getMarkdownFiles().filter(
        (f) => f.path.toLowerCase().startsWith(catFolder + "/")
      );
      const curYear = (/* @__PURE__ */ new Date()).getFullYear();
      for (const file of catFiles) {
        const cache = app.metadataCache.getFileCache(file);
        const fm = cache?.frontmatter;
        if (!fm) continue;
        const catName = fm.category || file.basename;
        const catType = String(fm.type || "Wants");
        for (let mi = 0; mi < MONTH_KEYS2.length; mi++) {
          const val = fm[MONTH_KEYS2[mi]];
          if (val == null || val === "" || toNum(val) === 0) continue;
          const amt = toNum(val);
          const mm = String(mi + 1).padStart(2, "0");
          entries.push({
            d: `${curYear}-${mm}-15`,
            type: catType === "Income" ? "income" : "expense",
            cat: catName,
            amt: Math.abs(amt),
            migrated: true
          });
        }
      }
      if (entries.length > 0) {
        await writeLedgerEntries(app, settings, entries);
      }
      settings.migrationDone = true;
      await plugin.saveSettings();
      showNotice2(`\u2713 Migration complete: ${entries.length} ledger entries`, 4e3);
    }
    module2.exports = { runMigration: runMigration2 };
  }
});

// src/main.js
var { Plugin, Modal } = require("obsidian");
var { DEFAULT_SETTINGS, MONTH_KEYS, MONTH_NAMES } = require_constants();
var { showNotice, getCurrentYear } = require_utils();
var { renderDashboard } = require_dashboard();
var { renderUnifiedLedger } = require_ledger_view();
var { PC_LEDGER_VIEW, PCLedgerView } = require_ledger_tab();
var { PersonalCapitalSettingTab } = require_settings();
var { OnboardingModal } = require_onboarding();
var { CreateAssetModal } = require_asset_create();
var { PickAssetModal } = require_asset_pick();
var { AddAssetLineModal } = require_asset_line();
var { AddTransactionModal } = require_transaction();
var { runMigration } = require_migration();
var { recalcAsset } = require_recalc();
var { updateAllAssetPrices } = require_prices();
var { readAccounts } = require_io2();
var { buildChatPrompt } = require_prompts();
var { readLedgerMultiYear } = require_io();
var { buildCashflowRows } = require_cashflow();
var DASHBOARD_NOTE_CONTENT = `---
cssclasses:
  - pc-dashboard
---
\`\`\`personal-capital-dashboard
\`\`\`
`;
var STARTER_CATEGORIES = [
  // Income
  ["Wages", "Income", "\u{1F4BC}", true],
  ["Freelance", "Income", "\u{1F4BB}", false],
  ["Gifts & Bonus", "Income", "\u{1F381}", false],
  // Needs
  ["Rent", "Needs", "\u{1F3E0}", true],
  ["Groceries", "Needs", "\u{1F6D2}", true],
  ["Bills", "Needs", "\u{1F4C4}", true],
  ["Health", "Needs", "\u{1F48A}", false],
  ["Transport", "Needs", "\u{1F68C}", true],
  // Wants
  ["Eat Out", "Wants", "\u{1F354}", false],
  ["Entertainment", "Wants", "\u{1F3AE}", false],
  ["Clothing", "Wants", "\u{1F455}", false],
  ["Subscriptions", "Wants", "\u{1F4F1}", true],
  ["Vacation", "Wants", "\u2708\uFE0F", false]
];
module.exports = class PersonalCapitalPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.app.workspace.onLayoutReady(async () => {
      if (!this.settings.migrationDone && this.settings.onboardingDone) {
        await runMigration(this.app, this.settings, this);
      }
      const dashFile = this.app.vault.getAbstractFileByPath(this.settings.dashboardPath);
      if (!dashFile) {
        await this._scaffoldVault();
        await this._openDashboardNote();
      }
    });
    this.registerMarkdownCodeBlockProcessor(
      "personal-capital-dashboard",
      async (source, el, ctx) => {
        el.classList.add("pc-dashboard-root");
        await renderDashboard(this.app, this.settings, el, this);
      }
    );
    this.registerMarkdownCodeBlockProcessor(
      "personal-capital-ledger",
      async (source, el, ctx) => {
        await renderUnifiedLedger(this.app, this.settings, el, this);
      }
    );
    this.registerView(PC_LEDGER_VIEW, (leaf) => new PCLedgerView(leaf, this));
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (!leaf?.view?.file) return;
        if (leaf.view.file.path !== this.settings.dashboardPath) return;
        this._forceDashboardPreview();
      })
    );
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (!file || file.path !== this.settings.dashboardPath) return;
        this._forceDashboardPreview();
      })
    );
    this.addCommand({
      id: "pc-open-dashboard",
      name: "Open Dashboard",
      callback: () => this._openDashboardNote()
    });
    this.addCommand({
      id: "pc-setup",
      name: "Setup / Onboarding",
      callback: () => new OnboardingModal(this.app, this).open()
    });
    this.addCommand({
      id: "pc-add-new-asset",
      name: "Add new asset",
      callback: () => new CreateAssetModal(this.app, this).open()
    });
    this.addCommand({
      id: "pc-update-asset-pick",
      name: "Update asset (pick)",
      callback: () => new PickAssetModal(
        this.app,
        this,
        (file) => new AddAssetLineModal(this.app, file, this).open()
      ).open()
    });
    this.addCommand({
      id: "pc-recalc-all-assets",
      name: "Recalculate all assets",
      callback: async () => {
        const folder = this.settings.assetsFolder.toLowerCase().replace(/\/$/, "");
        const files = this.app.vault.getMarkdownFiles().filter((f) => f.path.toLowerCase().startsWith(folder + "/"));
        for (const f of files) await recalcAsset(this.app, f);
        showNotice(`Recalculated ${files.length} asset(s)`);
      }
    });
    this.addCommand({
      id: "pc-update-all-prices",
      name: "Update all asset prices",
      callback: async () => {
        showNotice("Fetching prices\u2026");
        const result = await updateAllAssetPrices(this.app, this.settings, (ticker) => {
          showNotice(`Fetching ${ticker}\u2026`);
        });
        if (result.updated > 0) {
          const divTotal = result.results.reduce((s, r) => s + (r.divsAdded || 0), 0);
          let msg = `\u2713 Updated ${result.updated}/${result.total} asset(s)`;
          if (divTotal > 0) msg += `, ${divTotal} dividend(s)`;
          showNotice(msg, 4e3);
        } else if (result.errors.length > 0) {
          showNotice("No updates. Check console for details.", 4e3);
          console.warn("[PC] Price update errors:", result.errors);
        } else {
          showNotice("All assets already up to date");
        }
      }
    });
    this.addCommand({
      id: "pc-add-transaction",
      name: "Add transaction",
      callback: async () => {
        const accounts = await readAccounts(this.app, this.settings);
        new AddTransactionModal(this.app, this, accounts).open();
      }
    });
    this.addCommand({
      id: "pc-cashflow-erase-and-archive",
      name: "Cashflow: Erase & archive",
      callback: () => this.confirmEraseAndArchive()
    });
    this.addCommand({
      id: "pc-copy-analysis-context",
      name: "Copy analysis context (for AI)",
      callback: async () => {
        showNotice("Building context\u2026");
        const ctx = await buildChatPrompt(this.app, this.settings);
        await navigator.clipboard.writeText(ctx);
        showNotice("\u2713 Analysis context copied to clipboard");
      }
    });
    this.addSettingTab(new PersonalCapitalSettingTab(this.app, this));
  }
  // ── Force preview + read-only on any leaf showing Dashboard.md ──
  _forceDashboardPreview() {
    const path = this.settings.dashboardPath;
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      if (leaf.view?.file?.path !== path) continue;
      const state = leaf.getViewState();
      if (state?.state?.mode === "preview") continue;
      state.state = state.state || {};
      state.state.mode = "preview";
      state.state.source = false;
      leaf.setViewState(state);
    }
  }
  // ── Open (or focus) the Dashboard.md note ──
  async _openDashboardNote() {
    await this._scaffoldVault();
    const path = this.settings.dashboardPath;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) return;
    for (const leaf2 of this.app.workspace.getLeavesOfType("markdown")) {
      if (leaf2.view?.file?.path === path) {
        this.app.workspace.setActiveLeaf(leaf2, { focus: true });
        this.app.workspace.revealLeaf(leaf2);
        this._forceDashboardPreview();
        return;
      }
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file, { state: { mode: "preview" } });
  }
  // ── Create finance folder structure + all starter files if missing ──
  async _scaffoldVault() {
    const folders = [
      this.settings.categoriesFolder,
      this.settings.assetsFolder,
      this.settings.archiveFolder,
      this.settings.accountsFolder || "finance/Data/accounts"
    ];
    for (const f of folders) {
      if (!this.app.vault.getAbstractFileByPath(f)) {
        await this.app.vault.createFolder(f).catch(() => {
        });
      }
    }
    for (const p of [this.settings.capitalHistoryPath, this.settings.strategyPath, this.settings.dashboardPath]) {
      const dir = p.split("/").slice(0, -1).join("/");
      if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
        await this.app.vault.createFolder(dir).catch(() => {
        });
      }
    }
    if (!this.app.vault.getAbstractFileByPath(this.settings.dashboardPath)) {
      await this.app.vault.create(this.settings.dashboardPath, DASHBOARD_NOTE_CONTENT);
    }
    const catFolder = this.settings.categoriesFolder.toLowerCase().replace(/\/$/, "");
    const existingCats = this.app.vault.getMarkdownFiles().filter((f) => f.path.toLowerCase().startsWith(catFolder + "/"));
    if (existingCats.length === 0) {
      for (const [name, type, emoji, recurring] of STARTER_CATEGORIES) {
        const path = `${this.settings.categoriesFolder}/${name}.md`;
        if (!this.app.vault.getAbstractFileByPath(path)) {
          const content = [
            "---",
            `type: ${type}`,
            `category: ${name}`,
            `emoji: ${emoji}`,
            `recurring: ${recurring}`,
            ...MONTH_KEYS.map((k) => `${k}:`),
            "---",
            ""
          ].join("\n");
          await this.app.vault.create(path, content);
        }
      }
    }
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (this.settings.fxRates && !this.settings.fxRatesUpdated) {
      this.settings.fxRatesAuto = Object.assign(
        {},
        DEFAULT_SETTINGS.fxRatesAuto,
        this.settings.fxRatesAuto ?? {},
        this.settings.fxRates
      );
      delete this.settings.fxRates;
    }
    this.settings.fxRatesManual = Object.assign({}, DEFAULT_SETTINGS.fxRatesManual, this.settings.fxRatesManual ?? {});
    this.settings.fxRatesAuto = Object.assign({}, DEFAULT_SETTINGS.fxRatesAuto, this.settings.fxRatesAuto ?? {});
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  // ── Cashflow archive ──
  confirmEraseAndArchive() {
    const modal = new Modal(this.app);
    modal.titleEl.setText("Erase & archive cashflow");
    modal.contentEl.createEl("p", { text: "Export current year to archive, then clear all monthly values?" });
    const btns = modal.contentEl.createDiv({ cls: "personal-capital-buttons" });
    const yes = btns.createEl("button", { text: "Archive & clear", cls: "mod-cta" });
    const no = btns.createEl("button", { text: "Cancel" });
    no.onclick = () => modal.close();
    yes.onclick = async () => {
      modal.close();
      await this.exportCashflowToArchive();
    };
    modal.open();
  }
  async exportCashflowToArchive() {
    const year = getCurrentYear();
    const ledger = await readLedgerMultiYear(this.app, this.settings, [year]);
    const rows = buildCashflowRows(this.app, this.settings, ledger);
    const header = ["Type", "Category", "Recurring", "Projected", "Total", ...MONTH_NAMES];
    const mdRows = [
      "| " + header.join(" | ") + " |",
      "|" + header.map(() => "---").join("|") + "|",
      ...rows.map((r) => {
        const cells = [
          r.type,
          (r.emoji ? r.emoji + " " : "") + r.category,
          r.recurring ? "\u2713" : "",
          r.projected != null ? String(r.projected) : "",
          String(r.total),
          ...MONTH_KEYS.map((k) => r.months[k] != null ? String(r.months[k]) : "")
        ];
        return "| " + cells.join(" | ") + " |";
      })
    ];
    const archiveDir = this.settings.archiveFolder;
    if (!this.app.vault.getAbstractFileByPath(archiveDir)) {
      await this.app.vault.createFolder(archiveDir);
    }
    const outPath = `${archiveDir}/${year}_cashflow.md`;
    const content = `# Cashflow ${year}

` + mdRows.join("\n") + "\n";
    const existing = this.app.vault.getAbstractFileByPath(outPath);
    existing ? await this.app.vault.modify(existing, content) : await this.app.vault.create(outPath, content);
    const folder = this.settings.categoriesFolder.toLowerCase().replace(/\/$/, "");
    const files = this.app.vault.getMarkdownFiles().filter((f) => f.path.toLowerCase().startsWith(folder + "/"));
    for (const f of files) {
      await this.app.fileManager.processFrontMatter(f, (fm) => {
        for (const k of MONTH_KEYS) fm[k] = null;
      });
    }
    showNotice(`Archived to ${outPath} and cleared.`);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2NvbnN0YW50cy5qcyIsICJzcmMvdXRpbHMuanMiLCAic3JjL2xlZGdlci93cml0ZS1xdWV1ZS5qcyIsICJzcmMvbGVkZ2VyL2NhY2hlLmpzIiwgInNyYy9sZWRnZXIvaW8uanMiLCAic3JjL2FjY291bnRzL2lvLmpzIiwgInNyYy9hc3NldHMvZnguanMiLCAic3JjL2Fzc2V0cy9mbG93cy5qcyIsICJzcmMvYnVkZ2V0L2Nhc2hmbG93LmpzIiwgInNyYy9hY2NvdW50cy9iYWxhbmNlLmpzIiwgInNyYy9idWRnZXQvc3VtbWFyeS5qcyIsICJzcmMvYnVkZ2V0L3RpbWVsaW5lLmpzIiwgInNyYy9idWRnZXQvYmFza2V0cy5qcyIsICJzcmMvcmVwb3J0LmpzIiwgInNyYy91aS9maXQtdGV4dC5qcyIsICJzcmMvdWkvY2FyZHMuanMiLCAic3JjL3VpL3Byb2plY3RlZC5qcyIsICJzcmMvdWkvY2hhcnQuanMiLCAic3JjL21vZGFscy9zdHJhdGVneS5qcyIsICJzcmMvdWkvYmFza2V0cy5qcyIsICJzcmMvYXNzZXRzL3BhcnNlci5qcyIsICJzcmMvYXNzZXRzL3JlY2FsYy5qcyIsICJzcmMvYXNzZXRzL3ByaWNlcy5qcyIsICJzcmMvYXNzZXRzL3RlbXBsYXRlcy5qcyIsICJzcmMvbW9kYWxzL2Fzc2V0LXBpY2suanMiLCAic3JjL21vZGFscy9hc3NldC1saW5lLmpzIiwgInNyYy9tb2RhbHMvYXNzZXQtY3JlYXRlLmpzIiwgInNyYy91aS9hc3NldHMuanMiLCAic3JjL3dhbnRzLXF1ZXVlLmpzIiwgInNyYy9haS9zbmFwc2hvdC5qcyIsICJzcmMvYWkvcHJvbXB0cy5qcyIsICJzcmMvbW9kYWxzL2luc2lnaHRzLmpzIiwgInNyYy91aS9hbmFseXNpcy5qcyIsICJzcmMvdWkvd2FudHMuanMiLCAic3JjL21vZGFscy9vbmJvYXJkaW5nLmpzIiwgInNyYy9tb2RhbHMvdHJhbnNhY3Rpb24uanMiLCAic3JjL21vZGFscy9yZWNvbmNpbGUuanMiLCAic3JjL3VpL2Rhc2hib2FyZC5qcyIsICJzcmMvbW9kYWxzL2Nhc2hmbG93LWNlbGwuanMiLCAic3JjL21vZGFscy9jYXRlZ29yeS5qcyIsICJzcmMvdWkvbGVkZ2VyLXZpZXcuanMiLCAic3JjL3ZpZXdzL2xlZGdlci10YWIuanMiLCAic3JjL21vZGFscy9hY2NvdW50LWNyZWF0ZS5qcyIsICJzcmMvc2V0dGluZ3MuanMiLCAic3JjL21pZ3JhdGlvbi5qcyIsICJzcmMvbWFpbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBDT05TVEFOVFNcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCBNT05USF9LRVlTICA9IFtcIm0wMVwiLFwibTAyXCIsXCJtMDNcIixcIm0wNFwiLFwibTA1XCIsXCJtMDZcIixcIm0wN1wiLFwibTA4XCIsXCJtMDlcIixcIm0xMFwiLFwibTExXCIsXCJtMTJcIl07XG5jb25zdCBNT05USF9OQU1FUyA9IFtcIkphbnVhcnlcIixcIkZlYnJ1YXJ5XCIsXCJNYXJjaFwiLFwiQXByaWxcIixcIk1heVwiLFwiSnVuZVwiLFwiSnVseVwiLFwiQXVndXN0XCIsXCJTZXB0ZW1iZXJcIixcIk9jdG9iZXJcIixcIk5vdmVtYmVyXCIsXCJEZWNlbWJlclwiXTtcbmNvbnN0IE1PTlRIX1NIT1JUID0gW1wiSmFuXCIsXCJGZWJcIixcIk1hclwiLFwiQXByXCIsXCJNYXlcIixcIkp1blwiLFwiSnVsXCIsXCJBdWdcIixcIlNlcFwiLFwiT2N0XCIsXCJOb3ZcIixcIkRlY1wiXTtcblxuY29uc3QgQVNTRVRfVFlQRVMgPSBbXCJzaGFyZXNcIixcImJvbmRcIixcImRlcG9zaXRcIixcIm1hdGVyaWFsXCIsXCJjcnlwdG9cIl07XG5cbmNvbnN0IFRZUEVfT1JERVIgPSB7IFwiSW5jb21lXCI6IDAsIFwiTmVlZHNcIjogMSwgXCJXYW50c1wiOiAyIH07XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1MgPSB7XG4gIGNhdGVnb3JpZXNGb2xkZXI6ICAgIFwiZmluYW5jZS9EYXRhL2NhdGVnb3JpZXNcIixcbiAgYXNzZXRzRm9sZGVyOiAgICAgICAgXCJmaW5hbmNlL0RhdGEvYXNzZXRzXCIsXG4gIGFyY2hpdmVGb2xkZXI6ICAgICAgIFwiZmluYW5jZS9EYXRhL2FyY2hpdmVcIixcbiAgYWNjb3VudHNGb2xkZXI6ICAgICAgXCJmaW5hbmNlL0RhdGEvYWNjb3VudHNcIixcbiAgbGVkZ2VyRm9sZGVyOiAgICAgICAgXCJmaW5hbmNlL0RhdGFcIixcbiAgY2FwaXRhbEhpc3RvcnlQYXRoOiAgXCJmaW5hbmNlL0RhdGEvY2FwaXRhbF9oaXN0b3J5Lm1kXCIsXG4gIHN0cmF0ZWd5UGF0aDogICAgICAgIFwiZmluYW5jZS9zdHJhdGVneS5tZFwiLFxuICBkYXNoYm9hcmRQYXRoOiAgICAgICBcImZpbmFuY2UvRGFzaGJvYXJkLm1kXCIsXG4gIGxlZGdlck5vdGVQYXRoOiAgICAgIFwiZmluYW5jZS9MZWRnZXIubWRcIixcbiAgd2FudHNRdWV1ZVBhdGg6ICAgICAgXCJmaW5hbmNlL0RhdGEvd2FudHNfcXVldWUubWRcIixcblxuICBsZWRnZXJWaWV3TW9kZTogICAgICBcImNsYXNzaWNcIixcblxuICBob21lQ3VycmVuY3k6ICAgICAgICBcIlJVQlwiLFxuICBob21lQ3VycmVuY3lTeW1ib2w6ICBcIlx1MjBCRFwiLFxuXG4gIC8vIEZYIHJhdGVzIFx1MjAxNCB0d28tbGF5ZXIgbW9kZWw6IG1hbnVhbCBvdmVycmlkZXMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgYXV0by1mZXRjaGVkLlxuICAvLyBLZXB0IGFzIHsgQ1VSUkVOQ1k6IHJhdGVUb0hvbWUgfS4gTWlzc2luZyBrZXkgPSBubyBzaWxlbnQgMS4wIGZhbGxiYWNrLlxuICBmeFJhdGVzTWFudWFsOiAgICAgICB7fSxcbiAgZnhSYXRlc0F1dG86ICAgICAgICAgeyBSVUI6IDEsIFVTRDogOTAsIEVVUjogOTgsIENOWTogMTIuNSB9LFxuICBmeFJhdGVzVXBkYXRlZDogICAgICBudWxsLFxuICBmeEF1dG9GZXRjaDogICAgICAgICB0cnVlLFxuICBmeFNvdXJjZUxhYmVsOiAgICAgICBcIlwiLFxuXG4gIC8vIFJlY29uY2lsaWF0aW9uIFx1MjAxNCBob3cgbWFueSBkYXlzIHVudGlsIGFuIGFjY291bnQgaXMgZmxhZ2dlZCBhcyBzdGFsZS5cbiAgcmVjb25jaWxlU3RhbGVEYXlzOiAgMzAsXG5cbiAgc2F2ZXNUYXJnZXRQY3Q6ICAzMCxcbiAgY29tZm9ydEJ1ZGdldDogICAxMDAwMDAsXG4gIG5lZWRzQnVkZ2V0OiAgICAgMCxcbiAgc2F2ZXNNb250aGx5OiAgICAwLFxuXG4gIGxpcXVpZEJhbms6ICAgICAgIDAsXG4gIGxpcXVpZEJyb2tlckNhc2g6IDAsXG4gIGxpcXVpZENhc2g6ICAgICAgIDAsXG4gIGxpcXVpZEJ1c2luZXNzOiAgIDAsXG4gIGxpcXVpZEJhbmtJc0xpcXVpZDogICAgICAgdHJ1ZSxcbiAgbGlxdWlkQnJva2VyQ2FzaElzTGlxdWlkOiB0cnVlLFxuICBsaXF1aWRDYXNoSXNMaXF1aWQ6ICAgICAgIHRydWUsXG4gIGxpcXVpZEJ1c2luZXNzSXNMaXF1aWQ6ICAgZmFsc2UsXG5cbiAgb25ib2FyZGluZ0RvbmU6ICAgZmFsc2UsXG4gIG1pZ3JhdGlvbkRvbmU6ICAgIGZhbHNlLFxuXG4gIHBlcnNvbmFsQ29udGV4dDogIFwiXCIsXG5cbiAgc3RyYXRlZ3lFbmFibGVkOiAgIGZhbHNlLFxuICB0YXJnZXRDb3JlOiAgICAgICAgMCxcbiAgdGFyZ2V0Rmxhc2g6ICAgICAgIDAsXG4gIHRhcmdldFJlc2VydmU6ICAgICAwLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIE1PTlRIX0tFWVMsIE1PTlRIX05BTUVTLCBNT05USF9TSE9SVCxcbiAgQVNTRVRfVFlQRVMsIFRZUEVfT1JERVIsIERFRkFVTFRfU0VUVElOR1MsXG59O1xuIiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gVVRJTElUSUVTXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgeyBOb3RpY2UgfSA9IHJlcXVpcmUoXCJvYnNpZGlhblwiKTtcbmNvbnN0IHsgTU9OVEhfS0VZUyB9ID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuXG5mdW5jdGlvbiBzaG93Tm90aWNlKG1zZywgZHVyYXRpb24gPSAyNTAwKSB7XG4gIGNvbnN0IG4gPSBuZXcgTm90aWNlKG1zZyk7XG4gIHNldFRpbWVvdXQoKCkgPT4geyB0cnkgeyBuLmhpZGUoKTsgfSBjYXRjaChfKSB7fSB9LCBkdXJhdGlvbik7XG59XG5cbmZ1bmN0aW9uIHRvTnVtKHgpIHtcbiAgaWYgKHR5cGVvZiB4ID09PSBcIm51bWJlclwiICYmICFOdW1iZXIuaXNOYU4oeCkpIHJldHVybiB4O1xuICBpZiAodHlwZW9mIHggPT09IFwic3RyaW5nXCIgJiYgeC50cmltKCkgIT09IFwiXCIgJiYgeC50cmltKCkgIT09IFwiXHUyMDE0XCIpIHtcbiAgICBjb25zdCBuID0gcGFyc2VGbG9hdCh4LnJlcGxhY2UoL1ssIF0vZywgXCJcIikpO1xuICAgIGlmICghTnVtYmVyLmlzTmFOKG4pKSByZXR1cm4gbjtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gZm10KG4sIGRlY2ltYWxzID0gMCkge1xuICBpZiAobiA9PSBudWxsIHx8IE51bWJlci5pc05hTihuKSkgcmV0dXJuIFwiXHUyMDE0XCI7XG4gIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoXCJydS1SVVwiLCB7XG4gICAgbWluaW11bUZyYWN0aW9uRGlnaXRzOiBkZWNpbWFscyxcbiAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IGRlY2ltYWxzLFxuICB9KS5mb3JtYXQobik7XG59XG5cbmZ1bmN0aW9uIGZtdFNpZ25lZChuLCBkZWNpbWFscyA9IDApIHtcbiAgaWYgKG4gPT0gbnVsbCB8fCBOdW1iZXIuaXNOYU4obikpIHJldHVybiBcIlx1MjAxNFwiO1xuICBjb25zdCBzID0gZm10KE1hdGguYWJzKG4pLCBkZWNpbWFscyk7XG4gIHJldHVybiBuID49IDAgPyBcIitcIiArIHMgOiBcIlx1MjIxMlwiICsgcztcbn1cblxuZnVuY3Rpb24gZ2V0Q3VycmVudE1vbnRoSWR4KCkge1xuICByZXR1cm4gbmV3IERhdGUoKS5nZXRNb250aCgpO1xufVxuXG5mdW5jdGlvbiBnZXRDdXJyZW50TW9udGhLZXkoKSB7XG4gIHJldHVybiBNT05USF9LRVlTW2dldEN1cnJlbnRNb250aElkeCgpXTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3VycmVudFllYXIoKSB7XG4gIHJldHVybiBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCk7XG59XG5cbi8qKiBNYWtlIGEgRE9NIGVsZW1lbnQga2V5Ym9hcmQtYWNjZXNzaWJsZSB3aXRoIEVudGVyL1NwYWNlIGFjdGl2YXRpb24gKi9cbmZ1bmN0aW9uIG1ha2VJbnRlcmFjdGl2ZShlbCwgcm9sZSA9IFwiYnV0dG9uXCIpIHtcbiAgZWwuc2V0QXR0cmlidXRlKFwicm9sZVwiLCByb2xlKTtcbiAgZWwuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCIwXCIpO1xuICBlbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZSkgPT4ge1xuICAgIGlmIChlLmtleSA9PT0gXCJFbnRlclwiIHx8IGUua2V5ID09PSBcIiBcIikgeyBlLnByZXZlbnREZWZhdWx0KCk7IGVsLmNsaWNrKCk7IH1cbiAgfSk7XG59XG5cbi8vIEJsb2NrIENocm9taXVtJ3Mgd2hlZWwtY2hhbmdlcy12YWx1ZSBxdWlyayBvbiA8aW5wdXQgdHlwZT1udW1iZXI+LlxuLy8gQXR0YWNoIG9uY2UgYXQgY3JlYXRpb247IGhhbmRsZXIgZGllcyB3aXRoIHRoZSBlbGVtZW50LCBubyBnbG9iYWwgc3RhdGUuXG4vLyBVc2UgaW4gcGxhY2Ugb2YgZWwuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIC4uLikgYm9pbGVycGxhdGUuXG5mdW5jdGlvbiBraWxsV2hlZWxDaGFuZ2UoaW5wdXRFbCkge1xuICBpZiAoIWlucHV0RWwpIHJldHVybiBpbnB1dEVsO1xuICBpbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCAoZSkgPT4ge1xuICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBpbnB1dEVsKSBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH0sIHsgcGFzc2l2ZTogZmFsc2UgfSk7XG4gIHJldHVybiBpbnB1dEVsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2hvd05vdGljZSwgdG9OdW0sIGZtdCwgZm10U2lnbmVkLFxuICBnZXRDdXJyZW50TW9udGhJZHgsIGdldEN1cnJlbnRNb250aEtleSwgZ2V0Q3VycmVudFllYXIsXG4gIG1ha2VJbnRlcmFjdGl2ZSwga2lsbFdoZWVsQ2hhbmdlLFxufTtcbiIsICIvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBXUklURSBRVUVVRSBcdTIwMTQgc2VyaWFsaXplIGFzeW5jIHJlYWQtbW9kaWZ5LXdyaXRlIHBlciBmaWxlIHBhdGhcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByZXZlbnRzIGNvbmN1cnJlbnQgd3JpdGVzIHRvIHRoZSBzYW1lIEpTT05MIChvciBhbnkpIGZpbGUgZnJvbVxuLy8gY2xvYmJlcmluZyBlYWNoIG90aGVyLiBFYWNoIGZpbGUgcGF0aCBnZXRzIGl0cyBvd24gUHJvbWlzZSBjaGFpbi5cblxuY29uc3QgX3F1ZXVlcyA9IG5ldyBNYXAoKTtcblxuZnVuY3Rpb24gZW5xdWV1ZVdyaXRlKHBhdGgsIGZuKSB7XG4gIGNvbnN0IHByZXYgPSBfcXVldWVzLmdldChwYXRoKSB8fCBQcm9taXNlLnJlc29sdmUoKTtcbiAgY29uc3QgbmV4dCA9IHByZXYudGhlbihmbiwgZm4pO1xuICBfcXVldWVzLnNldChwYXRoLCBuZXh0KTtcbiAgcmV0dXJuIG5leHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyBlbnF1ZXVlV3JpdGUgfTtcbiIsICIvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBMRURHRVIgQ0FDSEUgXHUyMDE0IHNpbXBsZSBUVEwgY2FjaGUgZm9yIEpTT05MIHJlYWRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBJbnZhbGlkYXRlZCBhdXRvbWF0aWNhbGx5IG9uIGFueSB3cml0ZSB2aWEgdGhlIHdyaXRlIHF1ZXVlLlxuXG5jb25zdCBUVExfTVMgPSA1MDAwOyAvLyA1IHNlY29uZHNcblxubGV0IF9jYWNoZSA9IG5ldyBNYXAoKTsgLy8gcGF0aCBcdTIxOTIgeyBkYXRhLCB0cyB9XG5cbmZ1bmN0aW9uIGdldENhY2hlZChwYXRoKSB7XG4gIGNvbnN0IGVudHJ5ID0gX2NhY2hlLmdldChwYXRoKTtcbiAgaWYgKCFlbnRyeSkgcmV0dXJuIG51bGw7XG4gIGlmIChEYXRlLm5vdygpIC0gZW50cnkudHMgPiBUVExfTVMpIHtcbiAgICBfY2FjaGUuZGVsZXRlKHBhdGgpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBlbnRyeS5kYXRhO1xufVxuXG5mdW5jdGlvbiBzZXRDYWNoZShwYXRoLCBkYXRhKSB7XG4gIF9jYWNoZS5zZXQocGF0aCwgeyBkYXRhLCB0czogRGF0ZS5ub3coKSB9KTtcbn1cblxuZnVuY3Rpb24gaW52YWxpZGF0ZShwYXRoKSB7XG4gIGlmIChwYXRoKSB7XG4gICAgX2NhY2hlLmRlbGV0ZShwYXRoKTtcbiAgfSBlbHNlIHtcbiAgICBfY2FjaGUuY2xlYXIoKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgZ2V0Q2FjaGVkLCBzZXRDYWNoZSwgaW52YWxpZGF0ZSB9O1xuIiwgIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIExFREdFUiBJL08gXHUyMDE0IHNpbmdsZSBzb3VyY2Ugb2YgdHJ1dGggZm9yIGFsbCBtb25leSBtb3ZlbWVudHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEpTT05MIGZvcm1hdDogb25lIEpTT04gb2JqZWN0IHBlciBsaW5lLCBvbmUgZmlsZSBwZXIgeWVhci5cbi8vIEVudHJ5OiB7IGlkLCBkLCB0eXBlLCBhbXQsIGFzc2V0PywgZnJvbT8sIHRvPywgcXR5PywgcHJpY2U/LCBjYXQ/LCBub3RlPywgbWlncmF0ZWQ/IH1cbi8vIFR5cGVzOiBidXksIHNlbGwsIGRpdmlkZW5kLCBjbG9zZSwgZXhwZW5zZSwgaW5jb21lLCB0cmFuc2ZlciwgcmVjb25jaWxpYXRpb25cblxuY29uc3QgeyBlbnF1ZXVlV3JpdGUgfSA9IHJlcXVpcmUoXCIuL3dyaXRlLXF1ZXVlXCIpO1xuY29uc3QgeyBnZXRDYWNoZWQsIHNldENhY2hlLCBpbnZhbGlkYXRlIH0gPSByZXF1aXJlKFwiLi9jYWNoZVwiKTtcblxuZnVuY3Rpb24gZ2V0TGVkZ2VyUGF0aChzZXR0aW5ncywgeWVhcikge1xuICB5ZWFyID0geWVhciB8fCBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCk7XG4gIHJldHVybiBgJHtzZXR0aW5ncy5sZWRnZXJGb2xkZXIgfHwgXCJmaW5hbmNlL0RhdGFcIn0vbGVkZ2VyLSR7eWVhcn0uanNvbmxgO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkTGVkZ2VyKGFwcCwgc2V0dGluZ3MsIHllYXIpIHtcbiAgY29uc3QgcGF0aCA9IGdldExlZGdlclBhdGgoc2V0dGluZ3MsIHllYXIpO1xuICBjb25zdCBjYWNoZWQgPSBnZXRDYWNoZWQocGF0aCk7XG4gIGlmIChjYWNoZWQpIHJldHVybiBjYWNoZWQ7XG4gIGNvbnN0IGZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICBpZiAoIWZpbGUpIHJldHVybiBbXTtcbiAgY29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICBjb25zdCBlbnRyaWVzID0gY29udGVudC5zcGxpdChcIlxcblwiKVxuICAgIC5maWx0ZXIobCA9PiBsLnRyaW0oKSlcbiAgICAubWFwKGwgPT4geyB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZShsKTsgfSBjYXRjaCAoXykgeyByZXR1cm4gbnVsbDsgfSB9KVxuICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gIHNldENhY2hlKHBhdGgsIGVudHJpZXMpO1xuICByZXR1cm4gZW50cmllcztcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZExlZGdlck11bHRpWWVhcihhcHAsIHNldHRpbmdzLCB5ZWFycykge1xuICBjb25zdCBhbGwgPSBbXTtcbiAgZm9yIChjb25zdCB5IG9mIHllYXJzKSB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHJlYWRMZWRnZXIoYXBwLCBzZXR0aW5ncywgeSk7XG4gICAgYWxsLnB1c2goLi4uZW50cmllcyk7XG4gIH1cbiAgcmV0dXJuIGFsbDtcbn1cblxuLyoqIERpc2NvdmVyIGFsbCBsZWRnZXItWVlZWS5qc29ubCBmaWxlcyBhbmQgcmVhZCB0aGVtIGFsbCAqL1xuYXN5bmMgZnVuY3Rpb24gcmVhZEFsbExlZGdlcihhcHAsIHNldHRpbmdzKSB7XG4gIGNvbnN0IGZvbGRlciA9IHNldHRpbmdzLmxlZGdlckZvbGRlciB8fCBcImZpbmFuY2UvRGF0YVwiO1xuICBjb25zdCBhbGwgPSBbXTtcbiAgZm9yIChjb25zdCBmIG9mIGFwcC52YXVsdC5nZXRGaWxlcygpKSB7XG4gICAgaWYgKGYucGF0aC5zdGFydHNXaXRoKGZvbGRlciArIFwiL1wiKSAmJiBmLm5hbWUuc3RhcnRzV2l0aChcImxlZGdlci1cIikgJiYgZi5uYW1lLmVuZHNXaXRoKFwiLmpzb25sXCIpKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZik7XG4gICAgICBjb25zdCBlbnRyaWVzID0gY29udGVudC5zcGxpdChcIlxcblwiKVxuICAgICAgICAuZmlsdGVyKGwgPT4gbC50cmltKCkpXG4gICAgICAgIC5tYXAobCA9PiB7IHRyeSB7IHJldHVybiBKU09OLnBhcnNlKGwpOyB9IGNhdGNoIChfKSB7IHJldHVybiBudWxsOyB9IH0pXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgICBhbGwucHVzaCguLi5lbnRyaWVzKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFsbDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gd3JpdGVMZWRnZXJFbnRyeShhcHAsIHNldHRpbmdzLCBlbnRyeSkge1xuICBlbnRyeS5pZCA9IGVudHJ5LmlkIHx8IGNyeXB0by5yYW5kb21VVUlEKCk7XG4gIGNvbnN0IHllYXIgPSBlbnRyeS5kID8gcGFyc2VJbnQoZW50cnkuZC5zbGljZSgwLCA0KSkgOiBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCk7XG4gIGNvbnN0IHBhdGggPSBnZXRMZWRnZXJQYXRoKHNldHRpbmdzLCB5ZWFyKTtcbiAgcmV0dXJuIGVucXVldWVXcml0ZShwYXRoLCBhc3luYyAoKSA9PiB7XG4gICAgaW52YWxpZGF0ZShwYXRoKTtcbiAgICBjb25zdCBsaW5lID0gSlNPTi5zdHJpbmdpZnkoZW50cnkpO1xuICAgIGNvbnN0IGZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmIChmaWxlKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIGNvbnRlbnQudHJpbUVuZCgpICsgXCJcXG5cIiArIGxpbmUgKyBcIlxcblwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZGlyID0gcGF0aC5zcGxpdChcIi9cIikuc2xpY2UoMCwgLTEpLmpvaW4oXCIvXCIpO1xuICAgICAgaWYgKGRpciAmJiAhYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChkaXIpKSB7XG4gICAgICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZGlyKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICB9XG4gICAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKHBhdGgsIGxpbmUgKyBcIlxcblwiKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIERlbGV0ZSBhIGxlZGdlciBlbnRyeS4gTWF0Y2hlcyBieSBgaWRgIHdoZW4gcHJlc2VudC5cbiAqIEZhbGxiYWNrIGZvciBsZWdhY3kgZW50cmllczogZmllbGQgbWF0Y2hpbmcgd2l0aCBlcHNpbG9uIGZvciBudW1lcmljcy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZGVsZXRlTGVkZ2VyRW50cnkoYXBwLCBzZXR0aW5ncywgZW50cnkpIHtcbiAgaWYgKCFlbnRyeSB8fCAhZW50cnkuZCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB5ZWFyID0gcGFyc2VJbnQoZW50cnkuZC5zbGljZSgwLCA0KSk7XG4gIGNvbnN0IHBhdGggPSBnZXRMZWRnZXJQYXRoKHNldHRpbmdzLCB5ZWFyKTtcbiAgcmV0dXJuIGVucXVldWVXcml0ZShwYXRoLCBhc3luYyAoKSA9PiB7XG4gICAgaW52YWxpZGF0ZShwYXRoKTtcbiAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcbiAgICBpZiAoIWZpbGUpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xuICAgIGNvbnN0IHN0cktleXMgPSBbXCJkXCIsIFwidHlwZVwiLCBcImNhdFwiLCBcImFzc2V0XCIsIFwiZnJvbVwiLCBcInRvXCIsIFwibm90ZVwiXTtcbiAgICBjb25zdCBudW1LZXlzID0gW1wiYW10XCIsIFwicXR5XCIsIFwicHJpY2VcIl07XG4gICAgbGV0IHJlbW92ZWQgPSBmYWxzZTtcbiAgICBjb25zdCBvdXQgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgIGlmICghbGluZS50cmltKCkgfHwgcmVtb3ZlZCkgeyBvdXQucHVzaChsaW5lKTsgY29udGludWU7IH1cbiAgICAgIGxldCBwYXJzZWQ7XG4gICAgICB0cnkgeyBwYXJzZWQgPSBKU09OLnBhcnNlKGxpbmUpOyB9IGNhdGNoIChfKSB7IG91dC5wdXNoKGxpbmUpOyBjb250aW51ZTsgfVxuXG4gICAgICAvLyBQcmVmZXIgSUQgbWF0Y2hcbiAgICAgIGlmIChlbnRyeS5pZCAmJiBwYXJzZWQuaWQgJiYgZW50cnkuaWQgPT09IHBhcnNlZC5pZCkge1xuICAgICAgICByZW1vdmVkID0gdHJ1ZTsgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEZhbGxiYWNrOiBmaWVsZCBtYXRjaGluZyB3aXRoIGVwc2lsb24gZm9yIG51bWVyaWNzXG4gICAgICBpZiAoIWVudHJ5LmlkIHx8ICFwYXJzZWQuaWQpIHtcbiAgICAgICAgbGV0IG1hdGNoID0gdHJ1ZTtcbiAgICAgICAgZm9yIChjb25zdCBrIG9mIHN0cktleXMpIHtcbiAgICAgICAgICBjb25zdCBhID0gcGFyc2VkW2tdID09IG51bGwgPyB1bmRlZmluZWQgOiBwYXJzZWRba107XG4gICAgICAgICAgY29uc3QgYiA9IGVudHJ5W2tdID09IG51bGwgPyB1bmRlZmluZWQgOiBlbnRyeVtrXTtcbiAgICAgICAgICBpZiAoYSAhPT0gYikgeyBtYXRjaCA9IGZhbHNlOyBicmVhazsgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIGZvciAoY29uc3QgayBvZiBudW1LZXlzKSB7XG4gICAgICAgICAgICBjb25zdCBhID0gcGFyc2VkW2tdID09IG51bGwgPyB1bmRlZmluZWQgOiBwYXJzZWRba107XG4gICAgICAgICAgICBjb25zdCBiID0gZW50cnlba10gPT0gbnVsbCA/IHVuZGVmaW5lZCA6IGVudHJ5W2tdO1xuICAgICAgICAgICAgaWYgKGEgPT09IHVuZGVmaW5lZCAmJiBiID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYgKGEgPT09IHVuZGVmaW5lZCB8fCBiID09PSB1bmRlZmluZWQpIHsgbWF0Y2ggPSBmYWxzZTsgYnJlYWs7IH1cbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhhIC0gYikgPj0gMC4wMDUpIHsgbWF0Y2ggPSBmYWxzZTsgYnJlYWs7IH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hdGNoKSB7IHJlbW92ZWQgPSB0cnVlOyBjb250aW51ZTsgfVxuICAgICAgfVxuXG4gICAgICBvdXQucHVzaChsaW5lKTtcbiAgICB9XG4gICAgaWYgKCFyZW1vdmVkKSByZXR1cm4gZmFsc2U7XG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBvdXQuam9pbihcIlxcblwiKS5yZXBsYWNlKC9cXG4rJC8sIFwiXFxuXCIpKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHdyaXRlTGVkZ2VyRW50cmllcyhhcHAsIHNldHRpbmdzLCBlbnRyaWVzKSB7XG4gIGZvciAoY29uc3QgZSBvZiBlbnRyaWVzKSB7XG4gICAgZS5pZCA9IGUuaWQgfHwgY3J5cHRvLnJhbmRvbVVVSUQoKTtcbiAgfVxuICBjb25zdCBieVllYXIgPSB7fTtcbiAgZm9yIChjb25zdCBlIG9mIGVudHJpZXMpIHtcbiAgICBjb25zdCB5ZWFyID0gZS5kID8gcGFyc2VJbnQoZS5kLnNsaWNlKDAsIDQpKSA6IG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKTtcbiAgICAoYnlZZWFyW3llYXJdID0gYnlZZWFyW3llYXJdIHx8IFtdKS5wdXNoKGUpO1xuICB9XG4gIGZvciAoY29uc3QgW3llYXIsIHllYXJFbnRyaWVzXSBvZiBPYmplY3QuZW50cmllcyhieVllYXIpKSB7XG4gICAgY29uc3QgcGF0aCA9IGdldExlZGdlclBhdGgoc2V0dGluZ3MsIHBhcnNlSW50KHllYXIpKTtcbiAgICBhd2FpdCBlbnF1ZXVlV3JpdGUocGF0aCwgYXN5bmMgKCkgPT4ge1xuICAgICAgaW52YWxpZGF0ZShwYXRoKTtcbiAgICAgIGNvbnN0IGxpbmVzID0geWVhckVudHJpZXMubWFwKGUgPT4gSlNPTi5zdHJpbmdpZnkoZSkpLmpvaW4oXCJcXG5cIikgKyBcIlxcblwiO1xuICAgICAgY29uc3QgZmlsZSA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gICAgICBpZiAoZmlsZSkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICAgIGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgY29udGVudC50cmltRW5kKCkgKyBcIlxcblwiICsgbGluZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZGlyID0gcGF0aC5zcGxpdChcIi9cIikuc2xpY2UoMCwgLTEpLmpvaW4oXCIvXCIpO1xuICAgICAgICBpZiAoZGlyICYmICFhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGRpcikpIHtcbiAgICAgICAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlRm9sZGVyKGRpcikuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGUocGF0aCwgbGluZXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRMZWRnZXJQYXRoLCByZWFkTGVkZ2VyLCByZWFkTGVkZ2VyTXVsdGlZZWFyLCByZWFkQWxsTGVkZ2VyLFxuICB3cml0ZUxlZGdlckVudHJ5LCBkZWxldGVMZWRnZXJFbnRyeSwgd3JpdGVMZWRnZXJFbnRyaWVzLFxufTtcbiIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIEFDQ09VTlRTIEkvTyBcdTIwMTQgcmVhZCBhY2NvdW50IGZpbGVzIGZyb20gdmF1bHRcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCB7IHRvTnVtIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRBY2NvdW50cyhhcHAsIHNldHRpbmdzKSB7XG4gIGNvbnN0IGZvbGRlciA9IChzZXR0aW5ncy5hY2NvdW50c0ZvbGRlciB8fCBcImZpbmFuY2UvRGF0YS9hY2NvdW50c1wiKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcbiAgY29uc3QgZmlsZXMgPSBhcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpLmZpbHRlcihcbiAgICBmID0+IGYucGF0aC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoZm9sZGVyICsgXCIvXCIpXG4gICk7XG4gIGNvbnN0IGFjY291bnRzID0gW107XG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGNvbnN0IGNhY2hlID0gYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgIGNvbnN0IGZtID0gY2FjaGU/LmZyb250bWF0dGVyID8/IHt9O1xuICAgIGFjY291bnRzLnB1c2goe1xuICAgICAgbmFtZTogZm0ubmFtZSB8fCBmaWxlLmJhc2VuYW1lLFxuICAgICAgdHlwZTogZm0udHlwZSB8fCBcImJhbmtcIixcbiAgICAgIGJhbms6IGZtLmJhbmsgfHwgXCJcIixcbiAgICAgIGN1cnJlbmN5OiBmbS5jdXJyZW5jeSB8fCBzZXR0aW5ncy5ob21lQ3VycmVuY3kgfHwgXCJSVUJcIixcbiAgICAgIGxpcXVpZDogZm0ubGlxdWlkICE9PSBmYWxzZSxcbiAgICAgIGxvY2tlZDogZm0ubG9ja2VkID09PSB0cnVlLFxuICAgICAgaW5pdGlhbEJhbGFuY2U6IHRvTnVtKGZtLmluaXRpYWxfYmFsYW5jZSksXG4gICAgICBsYXN0UmVjb25jaWxlZDogZm0ubGFzdF9yZWNvbmNpbGVkIHx8IG51bGwsXG4gICAgICBmaWxlLFxuICAgIH0pO1xuICB9XG4gIHJldHVybiBhY2NvdW50cztcbn1cblxuLy8gVXBkYXRlIGZyb250bWF0dGVyIGZpZWxkcyBvbiBhbiBhY2NvdW50IGZpbGUuIFVzZXMgcHJvY2Vzc0Zyb250TWF0dGVyIHdoZW5cbi8vIGF2YWlsYWJsZSAoZmFzdCwgcHJlc2VydmVzIHJlc3Qgb2YgZmlsZSkgYW5kIGZhbGxzIGJhY2sgdG8gYSBtYW51YWwgc3BsaWNlXG4vLyB0aGF0IGtlZXBzIFlBTUwgaW50YWN0LlxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlQWNjb3VudEZpZWxkcyhhcHAsIGZpbGUsIGZpZWxkcykge1xuICBpZiAoIWZpbGUpIHJldHVybjtcbiAgaWYgKHR5cGVvZiBhcHAuZmlsZU1hbmFnZXI/LnByb2Nlc3NGcm9udE1hdHRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgYXdhaXQgYXBwLmZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcihmaWxlLCBmbSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpKSB7XG4gICAgICAgIGlmICh2ID09PSBudWxsIHx8IHYgPT09IHVuZGVmaW5lZCkgZGVsZXRlIGZtW2tdO1xuICAgICAgICBlbHNlIGZtW2tdID0gdjtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcmF3ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gIGlmICghcmF3LnN0YXJ0c1dpdGgoXCItLS1cIikpIHJldHVybjtcbiAgY29uc3QgZW5kID0gcmF3LmluZGV4T2YoXCJcXG4tLS1cIiwgMyk7XG4gIGlmIChlbmQgPT09IC0xKSByZXR1cm47XG4gIGxldCBoZWFkID0gcmF3LnNsaWNlKDQsIGVuZCk7XG4gIGxldCBib2R5ID0gcmF3LnNsaWNlKGVuZCk7XG4gIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGZpZWxkcykpIHtcbiAgICBjb25zdCBsaW5lID0gdiA9PSBudWxsID8gXCJcIiA6IGAke2t9OiAke3R5cGVvZiB2ID09PSBcInN0cmluZ1wiID8gYFwiJHt2fVwiYCA6IHZ9YDtcbiAgICBjb25zdCByZSA9IG5ldyBSZWdFeHAoYF4ke2t9Oi4qJGAsIFwibVwiKTtcbiAgICBpZiAocmUudGVzdChoZWFkKSkge1xuICAgICAgaGVhZCA9IHYgPT0gbnVsbCA/IGhlYWQucmVwbGFjZShyZSwgXCJcIikucmVwbGFjZSgvXFxuXFxuKy9nLCBcIlxcblwiKSA6IGhlYWQucmVwbGFjZShyZSwgbGluZSk7XG4gICAgfSBlbHNlIGlmICh2ICE9IG51bGwpIHtcbiAgICAgIGhlYWQgPSBoZWFkLnJlcGxhY2UoL1xcbj8kLywgXCJcXG5cIikgKyBsaW5lO1xuICAgIH1cbiAgfVxuICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIGAtLS1cXG4ke2hlYWQucmVwbGFjZSgvXFxuKyQvLFwiXCIpfVxcbiR7Ym9keX1gKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlTGFzdFJlY29uY2lsZWQoYXBwLCBmaWxlLCBkYXRlU3RyKSB7XG4gIGF3YWl0IHVwZGF0ZUFjY291bnRGaWVsZHMoYXBwLCBmaWxlLCB7IGxhc3RfcmVjb25jaWxlZDogZGF0ZVN0ciB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHJlYWRBY2NvdW50cywgdXBkYXRlQWNjb3VudEZpZWxkcywgdXBkYXRlTGFzdFJlY29uY2lsZWQgfTtcbiIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIEZYIFJBVEVTIFx1MjAxNCBDQlIgKFJVQiBob21lKSArIFlhaG9vIHY4L2NoYXJ0IChhbGwgb3RoZXJzKSArIG1hbnVhbCBvdmVycmlkZVxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBTdG9yYWdlIHNoYXBlIChvbiBzZXR0aW5ncyk6XG4vLyAgIGZ4UmF0ZXNNYW51YWw6ICB7IFVTRDogMTAwIH0gICAgICAgICAgIFx1MjE5MCB1c2VyIG92ZXJyaWRlcywgYWx3YXlzIHdpblxuLy8gICBmeFJhdGVzQXV0bzogICAgeyBVU0Q6IDkyLjE1LCBFVVI6IFx1MjAyNiB9IFx1MjE5MCBmZXRjaGVkIGJ5IHVwZGF0ZUZ4UmF0ZXMoKVxuLy8gICBmeFJhdGVzVXBkYXRlZDogXCIyMDI2LTA0LTE4VDEwOjAwOjAwWlwiXG4vLyAgIGZ4U291cmNlTGFiZWw6ICBcIkNCUiBcdTAwQjcgMTguMDQuMjAyNlwiXG4vL1xuLy8gQWxsIHJhdGVzIGFyZSBzdG9yZWQgYXMge0NVUlJFTkNZOiByYXRlVG9Ib21lfS4gaG9tZT09PVwiUlVCXCIgXHUyMTkyIFJVQjoxIGV0Yy5cbi8vIElmIGhvbWVDdXJyZW5jeSBjaGFuZ2VzLCBjYWxsZXJzIHNob3VsZCB0cmlnZ2VyIGEgZnJlc2ggdXBkYXRlRnhSYXRlcygpLlxuXG5jb25zdCB7IHJlcXVlc3RVcmwgfSA9IHJlcXVpcmUoXCJvYnNpZGlhblwiKTtcblxuZnVuY3Rpb24gcmVzb2x2ZUZ4UmF0ZShjdXJyZW5jeSwgc2V0dGluZ3MpIHtcbiAgY29uc3QgYyA9IFN0cmluZyhjdXJyZW5jeSB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBob21lID0gU3RyaW5nKHNldHRpbmdzLmhvbWVDdXJyZW5jeSB8fCBcIlJVQlwiKS50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWMpIHJldHVybiBudWxsO1xuICBpZiAoYyA9PT0gaG9tZSkgcmV0dXJuIDE7XG4gIGNvbnN0IG1hbnVhbCA9IHNldHRpbmdzLmZ4UmF0ZXNNYW51YWw/LltjXTtcbiAgaWYgKG1hbnVhbCAhPSBudWxsICYmIG1hbnVhbCA+IDApIHJldHVybiBtYW51YWw7XG4gIGNvbnN0IGF1dG8gPSBzZXR0aW5ncy5meFJhdGVzQXV0bz8uW2NdO1xuICBpZiAoYXV0byAhPSBudWxsICYmIGF1dG8gPiAwKSByZXR1cm4gYXV0bztcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBDQlIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoQ2JyUmF0ZXMoKSB7XG4gIGNvbnN0IHVybCA9IFwiaHR0cHM6Ly93d3cuY2JyLnJ1L3NjcmlwdHMvWE1MX2RhaWx5LmFzcFwiO1xuICBjb25zdCByZXNwID0gYXdhaXQgcmVxdWVzdFVybCh7IHVybCwgbWV0aG9kOiBcIkdFVFwiIH0pO1xuXG4gIC8vIENCUiBzZXJ2ZXMgWE1MIGRlY2xhcmVkIGFzIHdpbmRvd3MtMTI1MS4gT2JzaWRpYW4ncyByZXF1ZXN0VXJsIGdpdmVzIHVzXG4gIC8vIGFycmF5QnVmZmVyIGFuZCBhIChwb3NzaWJseSBtaXMtZGVjb2RlZCkgLnRleHQuIFByZWZlciBhcnJheUJ1ZmZlciArXG4gIC8vIFRleHREZWNvZGVyIHNvIEN5cmlsbGljIDxOYW1lPiBkb2Vzbid0IG1vamliYWtlLiBOdW1lcmljIGZpZWxkcyBhcmVcbiAgLy8gQVNDSUkgc28gdGhleSBzdXJ2aXZlIGVpdGhlciBwYXRoLlxuICBsZXQgdGV4dDtcbiAgaWYgKHJlc3AuYXJyYXlCdWZmZXIpIHtcbiAgICB0cnkge1xuICAgICAgdGV4dCA9IG5ldyBUZXh0RGVjb2RlcihcIndpbmRvd3MtMTI1MVwiKS5kZWNvZGUocmVzcC5hcnJheUJ1ZmZlcik7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgdGV4dCA9IHJlc3AudGV4dDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGV4dCA9IHJlc3AudGV4dDtcbiAgfVxuXG4gIGNvbnN0IGRvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcodGV4dCwgXCJ0ZXh0L3htbFwiKTtcbiAgY29uc3QgcmF0ZXMgPSB7IFJVQjogMSB9O1xuICBjb25zdCB2YWx1dGVzID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiVmFsdXRlXCIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2ID0gdmFsdXRlc1tpXTtcbiAgICBjb25zdCBjb2RlID0gdi5nZXRFbGVtZW50c0J5VGFnTmFtZShcIkNoYXJDb2RlXCIpWzBdPy50ZXh0Q29udGVudD8udHJpbSgpO1xuICAgIGNvbnN0IHZSYXRlID0gdi5nZXRFbGVtZW50c0J5VGFnTmFtZShcIlZ1bml0UmF0ZVwiKVswXT8udGV4dENvbnRlbnQ/LnRyaW0oKTtcbiAgICBpZiAoIWNvZGUgfHwgIXZSYXRlKSBjb250aW51ZTtcbiAgICBjb25zdCBudW0gPSBwYXJzZUZsb2F0KHZSYXRlLnJlcGxhY2UoXCIsXCIsIFwiLlwiKSk7XG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobnVtKSB8fCBudW0gPD0gMCkgY29udGludWU7XG4gICAgcmF0ZXNbY29kZS50b1VwcGVyQ2FzZSgpXSA9IG51bTtcbiAgfVxuICBjb25zdCByb290ID0gZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiVmFsQ3Vyc1wiKVswXTtcbiAgY29uc3QgcHViRGF0ZSA9IHJvb3Q/LmdldEF0dHJpYnV0ZShcIkRhdGVcIikgfHwgbnVsbDtcbiAgcmV0dXJuIHsgcmF0ZXMsIHNvdXJjZTogXCJDQlJcIiwgcHViRGF0ZSB9O1xufVxuXG4vLyBcdTI1MDBcdTI1MDAgWWFob28gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoWWFob29SYXRlKHBhaXJTeW1ib2wpIHtcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vcXVlcnkxLmZpbmFuY2UueWFob28uY29tL3Y4L2ZpbmFuY2UvY2hhcnQvJHtlbmNvZGVVUklDb21wb25lbnQocGFpclN5bWJvbCl9YDtcbiAgY29uc3QgcmVzcCA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcbiAgY29uc3QgcHJpY2UgPSByZXNwLmpzb24/LmNoYXJ0Py5yZXN1bHQ/LlswXT8ubWV0YT8ucmVndWxhck1hcmtldFByaWNlO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShwcmljZSkgfHwgcHJpY2UgPD0gMCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBwcmljZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hZYWhvb1JhdGVzKGhvbWVDdXJyZW5jeSwgd2FudGVkQ3VycmVuY2llcykge1xuICBjb25zdCBob21lID0gaG9tZUN1cnJlbmN5LnRvVXBwZXJDYXNlKCk7XG4gIGNvbnN0IHJhdGVzID0geyBbaG9tZV06IDEgfTtcbiAgY29uc3QgcGFpcnMgPSB3YW50ZWRDdXJyZW5jaWVzXG4gICAgLm1hcChjID0+IGMudG9VcHBlckNhc2UoKSlcbiAgICAuZmlsdGVyKGMgPT4gYyAmJiBjICE9PSBob21lKTtcblxuICBhd2FpdCBQcm9taXNlLmFsbChwYWlycy5tYXAoYXN5bmMgKGMpID0+IHtcbiAgICAvLyBUcnkgQkFTRStIT01FPVggZmlyc3QgKGUuZy4gVVNEUlVCPVggXHUyMTkyIFJVQiBwZXIgVVNEKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwID0gYXdhaXQgZmV0Y2hZYWhvb1JhdGUoYCR7Y30ke2hvbWV9PVhgKTtcbiAgICAgIGlmIChwICE9IG51bGwpIHsgcmF0ZXNbY10gPSBwOyByZXR1cm47IH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFtQQ10gWWFob28gRlggJHtjfSR7aG9tZX09WCBmYWlsZWQ6YCwgZS5tZXNzYWdlIHx8IGUpO1xuICAgIH1cbiAgICAvLyBGYWxsYmFjazogSE9NRStCQVNFPVggcmVjaXByb2NhbCAoZS5nLiBSVUJVU0Q9WCBcdTIxOTIgMS9yZXN1bHQpXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHAgPSBhd2FpdCBmZXRjaFlhaG9vUmF0ZShgJHtob21lfSR7Y309WGApO1xuICAgICAgaWYgKHAgIT0gbnVsbCAmJiBwID4gMCkgeyByYXRlc1tjXSA9IDEgLyBwOyByZXR1cm47IH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFtQQ10gWWFob28gRlggJHtob21lfSR7Y309WCBmYWlsZWQ6YCwgZS5tZXNzYWdlIHx8IGUpO1xuICAgIH1cbiAgfSkpO1xuXG4gIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgcmV0dXJuIHsgcmF0ZXMsIHNvdXJjZTogXCJZYWhvb1wiLCBwdWJEYXRlOiB0b2RheSB9O1xufVxuXG4vLyBcdTI1MDBcdTI1MDAgT3JjaGVzdHJhdG9yIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVGeFJhdGVzKHNldHRpbmdzKSB7XG4gIGlmICghc2V0dGluZ3MuZnhBdXRvRmV0Y2gpIHtcbiAgICByZXR1cm4geyB1cGRhdGVkOiBmYWxzZSwgcmVhc29uOiBcImF1dG8tZmV0Y2ggZGlzYWJsZWRcIiB9O1xuICB9XG4gIGNvbnN0IGhvbWUgPSBTdHJpbmcoc2V0dGluZ3MuaG9tZUN1cnJlbmN5IHx8IFwiUlVCXCIpLnRvVXBwZXJDYXNlKCk7XG4gIHRyeSB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBpZiAoaG9tZSA9PT0gXCJSVUJcIikge1xuICAgICAgcmVzdWx0ID0gYXdhaXQgZmV0Y2hDYnJSYXRlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjdXJyZW5jaWVzID0gQXJyYXkuZnJvbShuZXcgU2V0KFtcbiAgICAgICAgLi4uT2JqZWN0LmtleXMoc2V0dGluZ3MuZnhSYXRlc0F1dG8gfHwge30pLFxuICAgICAgICAuLi5PYmplY3Qua2V5cyhzZXR0aW5ncy5meFJhdGVzTWFudWFsIHx8IHt9KSxcbiAgICAgICAgXCJVU0RcIiwgXCJFVVJcIiwgXCJSVUJcIiwgXCJDTllcIiwgXCJHQlBcIiwgXCJKUFlcIixcbiAgICAgIF0pKS5tYXAoYyA9PiBjLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgcmVzdWx0ID0gYXdhaXQgZmV0Y2hZYWhvb1JhdGVzKGhvbWUsIGN1cnJlbmNpZXMpO1xuICAgIH1cbiAgICBpZiAoIXJlc3VsdC5yYXRlcyB8fCBPYmplY3Qua2V5cyhyZXN1bHQucmF0ZXMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgdXBkYXRlZDogZmFsc2UsIGVycm9yOiBcIm5vIHJhdGVzIHJldHVybmVkXCIgfTtcbiAgICB9XG4gICAgc2V0dGluZ3MuZnhSYXRlc0F1dG8gPSBPYmplY3QuYXNzaWduKHt9LCBzZXR0aW5ncy5meFJhdGVzQXV0bywgcmVzdWx0LnJhdGVzKTtcbiAgICBzZXR0aW5ncy5meFJhdGVzVXBkYXRlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICBzZXR0aW5ncy5meFNvdXJjZUxhYmVsID0gYCR7cmVzdWx0LnNvdXJjZX0gXHUwMEI3ICR7cmVzdWx0LnB1YkRhdGUgPz8gXCJub3dcIn1gO1xuICAgIHJldHVybiB7IHVwZGF0ZWQ6IHRydWUsIHNvdXJjZTogcmVzdWx0LnNvdXJjZSwgcHViRGF0ZTogcmVzdWx0LnB1YkRhdGUsIHJhdGVzOiByZXN1bHQucmF0ZXMgfTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUud2FybihcIltQQ10gRlggdXBkYXRlIGZhaWxlZDpcIiwgZSk7XG4gICAgcmV0dXJuIHsgdXBkYXRlZDogZmFsc2UsIGVycm9yOiBlLm1lc3NhZ2UgfHwgU3RyaW5nKGUpIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHJlc29sdmVGeFJhdGUsIHVwZGF0ZUZ4UmF0ZXMsIGZldGNoQ2JyUmF0ZXMsIGZldGNoWWFob29SYXRlcyB9O1xuIiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gQVNTRVQgRkxPV1MgIChmb3IgY3VycmVudCBtb250aClcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCB7IE1PTlRIX0tFWVMgfSA9IHJlcXVpcmUoXCIuLi9jb25zdGFudHNcIik7XG5jb25zdCB7IHRvTnVtLCBnZXRDdXJyZW50TW9udGhJZHgsIGdldEN1cnJlbnRZZWFyIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5jb25zdCB7IHJlYWRBbGxMZWRnZXIgfSA9IHJlcXVpcmUoXCIuLi9sZWRnZXIvaW9cIik7XG5jb25zdCB7IHJlYWRBY2NvdW50cyB9ID0gcmVxdWlyZShcIi4uL2FjY291bnRzL2lvXCIpO1xuY29uc3QgeyByZXNvbHZlRnhSYXRlIH0gPSByZXF1aXJlKFwiLi9meFwiKTtcblxuYXN5bmMgZnVuY3Rpb24gYnVpbGRBc3NldEZsb3dzQXN5bmMoYXBwLCBzZXR0aW5ncykge1xuICBjb25zdCBmb2xkZXIgPSBzZXR0aW5ncy5hc3NldHNGb2xkZXIudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gIGNvbnN0IGZpbGVzICA9IGFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCkuZmlsdGVyKFxuICAgIGYgPT4gZi5wYXRoLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChmb2xkZXIgKyBcIi9cIilcbiAgKTtcbiAgY29uc3QgY3VyTW9udGggPSBnZXRDdXJyZW50TW9udGhJZHgoKSArIDE7XG4gIGNvbnN0IGN1clllYXIgID0gZ2V0Q3VycmVudFllYXIoKTtcblxuICBjb25zdCBhbGxMZWRnZXIgPSBhd2FpdCByZWFkQWxsTGVkZ2VyKGFwcCwgc2V0dGluZ3MpO1xuICBjb25zdCBhY2NvdW50cyA9IGF3YWl0IHJlYWRBY2NvdW50cyhhcHAsIHNldHRpbmdzKTtcblxuICBsZXQgcGFzc2l2ZUluY29tZSA9IDA7XG4gIGxldCBzYXZlcyAgICAgICAgID0gMDtcbiAgY29uc3QgYXNzZXRzICAgICAgPSBbXTtcbiAgY29uc3Qgc2F2ZXNCeU1vbnRoS2V5ID0ge307XG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgcmF3ICAgID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgY29uc3QgZm1FbmQgID0gcmF3LmluZGV4T2YoXCItLS1cIiwgMyk7XG4gICAgY29uc3QgYm9keSAgID0gZm1FbmQgIT09IC0xID8gcmF3LnNsaWNlKGZtRW5kICsgMykgOiByYXc7XG4gICAgY29uc3QgY2FjaGUgID0gYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgIGNvbnN0IGZtICAgICA9IGNhY2hlPy5mcm9udG1hdHRlciA/PyB7fTtcbiAgICBjb25zdCBhc3NldE5hbWUgPSBmaWxlLmJhc2VuYW1lO1xuICAgIGNvbnN0IGN1cnJlbmN5ID0gU3RyaW5nKGZtLmN1cnJlbmN5IHx8IFwiUlVCXCIpLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3QgZnhSYXcgICAgPSByZXNvbHZlRnhSYXRlKGN1cnJlbmN5LCBzZXR0aW5ncyk7XG4gICAgY29uc3QgZnggICAgICAgPSBmeFJhdyA/PyAwO1xuICAgIGNvbnN0IGZ4TWlzc2luZyA9IGZ4UmF3ID09IG51bGw7XG4gICAgY29uc3QgdHlwZSAgICAgPSBTdHJpbmcoZm0udHlwZSB8fCBcInNoYXJlc1wiKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgY29uc3QgYXNzZXRFbnRyaWVzID0gYWxsTGVkZ2VyLmZpbHRlcihlID0+IGUuYXNzZXQgPT09IGFzc2V0TmFtZSk7XG4gICAgY29uc3Qgc29ydGVkID0gWy4uLmFzc2V0RW50cmllc10uc29ydCgoYSwgYikgPT4gYS5kLmxvY2FsZUNvbXBhcmUoYi5kKSk7XG5cbiAgICBsZXQgY3VycmVudFF0eSA9IDAsIHRvdGFsSW52ZXN0ZWQgPSAwLCBwYXNzaXZlSW5jb21lVG90ID0gMDtcbiAgICBsZXQgaW5pdGlhbERhdGUgPSBudWxsLCBsYXN0VXBkYXRlZCA9IG51bGw7XG4gICAgY29uc3QgbG9nRXZlbnRzID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGUgb2Ygc29ydGVkKSB7XG4gICAgICBpZiAoIWluaXRpYWxEYXRlIHx8IGUuZCA8IGluaXRpYWxEYXRlKSBpbml0aWFsRGF0ZSA9IGUuZDtcbiAgICAgIGlmICghbGFzdFVwZGF0ZWQgfHwgZS5kID4gbGFzdFVwZGF0ZWQpIGxhc3RVcGRhdGVkID0gZS5kO1xuICAgICAgaWYgKGUudHlwZSA9PT0gXCJidXlcIikge1xuICAgICAgICBjb25zdCBxdHlOdW0gPSB0b051bShlLnF0eSk7XG4gICAgICAgIGNvbnN0IHByaWNlTnVtID0gdG9OdW0oZS5wcmljZSB8fCAodG9OdW0oZS5hbXQpIC8gKHF0eU51bSB8fCAxKSkpO1xuICAgICAgICBjdXJyZW50UXR5ICs9IHF0eU51bTtcbiAgICAgICAgLy8gQ29zdCBiYXNpcyA9IHF0eSAqIHByaWNlIChmZWUgbGl2ZXMgaW4gZS5hbXQgLyBlLmZlZSBhbmQgaGl0cyBjYXNoLCBub3QgYmFzaXMpLlxuICAgICAgICB0b3RhbEludmVzdGVkICs9IHF0eU51bSAqIHByaWNlTnVtO1xuICAgICAgICBsb2dFdmVudHMucHVzaCh7IGRhdGU6IGUuZCwgb3A6IFwiYnV5XCIsIHF0eTogcXR5TnVtLCB2YWw6IHByaWNlTnVtIH0pO1xuICAgICAgfSBlbHNlIGlmIChlLnR5cGUgPT09IFwic2VsbFwiKSB7XG4gICAgICAgIGNvbnN0IGNvc3RQZXJTaGFyZSA9IGN1cnJlbnRRdHkgPiAwID8gdG90YWxJbnZlc3RlZCAvIGN1cnJlbnRRdHkgOiAwO1xuICAgICAgICBjb25zdCBzb2xkUXR5ID0gdG9OdW0oZS5xdHkpO1xuICAgICAgICBjdXJyZW50UXR5IC09IHNvbGRRdHk7XG4gICAgICAgIHRvdGFsSW52ZXN0ZWQgLT0gc29sZFF0eSAqIGNvc3RQZXJTaGFyZTtcbiAgICAgICAgaWYgKGN1cnJlbnRRdHkgPCAwKSBjdXJyZW50UXR5ID0gMDtcbiAgICAgICAgaWYgKHRvdGFsSW52ZXN0ZWQgPCAwKSB0b3RhbEludmVzdGVkID0gMDtcbiAgICAgICAgbG9nRXZlbnRzLnB1c2goeyBkYXRlOiBlLmQsIG9wOiBcInNlbGxcIiwgcXR5OiBzb2xkUXR5LCB2YWw6IHRvTnVtKGUucHJpY2UgfHwgKHRvTnVtKGUuYW10KSAvIHNvbGRRdHkpKSB9KTtcbiAgICAgIH0gZWxzZSBpZiAoZS50eXBlID09PSBcImRpdmlkZW5kXCIpIHtcbiAgICAgICAgcGFzc2l2ZUluY29tZVRvdCArPSB0b051bShlLmFtdCk7XG4gICAgICAgIGxvZ0V2ZW50cy5wdXNoKHsgZGF0ZTogZS5kLCBvcDogXCJkaXZcIiwgcXR5OiAwLCB2YWw6IHRvTnVtKGUuYW10KSB9KTtcbiAgICAgIH0gZWxzZSBpZiAoZS50eXBlID09PSBcImNsb3NlXCIpIHtcbiAgICAgICAgbG9nRXZlbnRzLnB1c2goeyBkYXRlOiBlLmQsIG9wOiBcImNsb3NlXCIsIHF0eTogY3VycmVudFF0eSwgdmFsOiB0b051bShlLmFtdCkgfSk7XG4gICAgICAgIGN1cnJlbnRRdHkgPSAwO1xuICAgICAgICB0b3RhbEludmVzdGVkID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBtb250aFByZWZpeCA9IGAke2N1clllYXJ9LSR7U3RyaW5nKGN1ck1vbnRoKS5wYWRTdGFydCgyLCBcIjBcIil9YDtcbiAgICBmb3IgKGNvbnN0IGUgb2YgYXNzZXRFbnRyaWVzKSB7XG4gICAgICBpZiAoIWUuZCB8fCAhZS5kLnN0YXJ0c1dpdGgobW9udGhQcmVmaXgpKSBjb250aW51ZTtcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiZGl2aWRlbmRcIikgcGFzc2l2ZUluY29tZSArPSB0b051bShlLmFtdCkgKiBmeDtcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiYnV5XCIpIHNhdmVzICs9IHRvTnVtKGUuYW10KSAqIGZ4O1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgZSBvZiBhc3NldEVudHJpZXMpIHtcbiAgICAgIGlmICghZS5kIHx8ICFlLmQuc3RhcnRzV2l0aChTdHJpbmcoY3VyWWVhcikpKSBjb250aW51ZTtcbiAgICAgIGlmIChlLnR5cGUgPT09IFwiYnV5XCIpIHtcbiAgICAgICAgY29uc3QgbWsgPSBNT05USF9LRVlTW3BhcnNlSW50KGUuZC5zbGljZSg1LCA3KSkgLSAxXTtcbiAgICAgICAgc2F2ZXNCeU1vbnRoS2V5W21rXSA9IChzYXZlc0J5TW9udGhLZXlbbWtdID8/IDApICsgdG9OdW0oZS5hbXQpICogZng7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcHJpY2VIaXN0b3J5ID0gW107XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGJvZHkuc3BsaXQoXCJcXG5cIikpIHtcbiAgICAgIGNvbnN0IHBhcnRzID0gbGluZS50cmltKCkuaW5jbHVkZXMoXCJ8XCIpXG4gICAgICAgID8gbGluZS50cmltKCkuc3BsaXQoXCJ8XCIpLm1hcChwID0+IHAudHJpbSgpKVxuICAgICAgICA6IGxpbmUudHJpbSgpLnNwbGl0KC9cXHMrLyk7XG4gICAgICBpZiAocGFydHMubGVuZ3RoIDwgNCkgY29udGludWU7XG4gICAgICBjb25zdCBkID0gbmV3IERhdGUocGFydHNbMF0pO1xuICAgICAgaWYgKE51bWJlci5pc05hTihkLmdldFRpbWUoKSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgb3AgPSBwYXJ0c1sxXS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3QgdmFsID0gdG9OdW0ocGFydHNbM10pO1xuICAgICAgaWYgKChvcCA9PT0gXCJidXlcIiB8fCBvcCA9PT0gXCJyZWludmVzdFwiIHx8IG9wID09PSBcInByaWNlXCIpICYmIHZhbCA+IDApIHtcbiAgICAgICAgcHJpY2VIaXN0b3J5LnB1c2goeyBkYXRlOiBwYXJ0c1swXSwgcHJpY2U6IHZhbCB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcHJpY2VIaXN0b3J5LnNvcnQoKGEsIGIpID0+IGEuZGF0ZS5sb2NhbGVDb21wYXJlKGIuZGF0ZSkpO1xuICAgIGxvZ0V2ZW50cy5zb3J0KChhLCBiKSA9PiBhLmRhdGUubG9jYWxlQ29tcGFyZShiLmRhdGUpKTtcblxuICAgIGNvbnN0IGN1cnJlbnRQcmljZSA9IGZtLmN1cnJlbnRfcHJpY2UgPz8gbnVsbDtcbiAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBjdXJyZW50UHJpY2UgIT0gbnVsbCA/IGN1cnJlbnRQcmljZSAqIGN1cnJlbnRRdHkgOiB0b3RhbEludmVzdGVkO1xuICAgIGNvbnN0IHBsQW1vdW50ICAgICA9IGN1cnJlbnRWYWx1ZSAtIHRvdGFsSW52ZXN0ZWQ7XG4gICAgY29uc3QgcGxQY3QgICAgICAgID0gdG90YWxJbnZlc3RlZCA+IDAgPyAocGxBbW91bnQgLyB0b3RhbEludmVzdGVkKSAqIDEwMCA6IDA7XG5cbiAgICBhc3NldHMucHVzaCh7XG4gICAgICBuYW1lOiAgICAgICAgICAgICBhc3NldE5hbWUsXG4gICAgICB0eXBlLFxuICAgICAgY3VycmVuY3ksXG4gICAgICBmeCxcbiAgICAgIGZ4TWlzc2luZyxcbiAgICAgIGN1cnJlbnRRdHk6ICAgICAgIHBhcnNlRmxvYXQoY3VycmVudFF0eS50b0ZpeGVkKDYpKSxcbiAgICAgIGN1cnJlbnRQcmljZSxcbiAgICAgIGN1cnJlbnRWYWx1ZTogICAgIHBhcnNlRmxvYXQoY3VycmVudFZhbHVlLnRvRml4ZWQoMikpLFxuICAgICAgY3VycmVudFZhbHVlUnViOiAgcGFyc2VGbG9hdChjdXJyZW50VmFsdWUudG9GaXhlZCgyKSkgKiBmeCxcbiAgICAgIHBsQW1vdW50OiAgICAgICAgIHBhcnNlRmxvYXQocGxBbW91bnQudG9GaXhlZCgyKSksXG4gICAgICBwbFBjdDogICAgICAgICAgICBwYXJzZUZsb2F0KHBsUGN0LnRvRml4ZWQoMikpLFxuICAgICAgcGFzc2l2ZUluY29tZVRvdDogcGFyc2VGbG9hdChwYXNzaXZlSW5jb21lVG90LnRvRml4ZWQoMikpLFxuICAgICAgaW5pdGlhbERhdGU6ICAgICAgaW5pdGlhbERhdGUgPz8gZm0uaW5pdGlhbF9kYXRlID8/IG51bGwsXG4gICAgICBsYXN0VXBkYXRlZDogICAgICBsYXN0VXBkYXRlZCA/PyBmbS5sYXN0X3VwZGF0ZWQgPz8gbnVsbCxcbiAgICAgIGJhc2tldDogICAgICAgICAgIGZtLmJhc2tldCA/PyBudWxsLFxuICAgICAgcHJpY2VIaXN0b3J5LFxuICAgICAgbG9nRXZlbnRzLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHsgcGFzc2l2ZUluY29tZSwgc2F2ZXMsIGFzc2V0cywgc2F2ZXNCeU1vbnRoS2V5LCBhY2NvdW50cywgYWxsTGVkZ2VyIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyBidWlsZEFzc2V0Rmxvd3NBc3luYyB9O1xuIiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gQ0FTSEZMT1cgQlVJTERFUlxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmNvbnN0IHsgTU9OVEhfS0VZUywgVFlQRV9PUkRFUiB9ID0gcmVxdWlyZShcIi4uL2NvbnN0YW50c1wiKTtcbmNvbnN0IHsgdG9OdW0sIGdldEN1cnJlbnRZZWFyIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbmZ1bmN0aW9uIGJ1aWxkQ2FzaGZsb3dSb3dzKGFwcCwgc2V0dGluZ3MsIGxlZGdlckVudHJpZXMpIHtcbiAgY29uc3QgZm9sZGVyID0gc2V0dGluZ3MuY2F0ZWdvcmllc0ZvbGRlci50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcbiAgY29uc3QgZmlsZXMgID0gYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKS5maWx0ZXIoXG4gICAgZiA9PiBmLnBhdGgudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKGZvbGRlciArIFwiL1wiKVxuICApO1xuICBjb25zdCBjdXJZZWFyID0gZ2V0Q3VycmVudFllYXIoKTtcbiAgY29uc3Qgcm93cyA9IFtdO1xuXG4gIGNvbnN0IGxlZGdlckJ5Q2F0TW9udGggPSB7fTtcbiAgaWYgKGxlZGdlckVudHJpZXMgJiYgbGVkZ2VyRW50cmllcy5sZW5ndGggPiAwKSB7XG4gICAgZm9yIChjb25zdCBlIG9mIGxlZGdlckVudHJpZXMpIHtcbiAgICAgIGlmICghZS5jYXQgfHwgIWUuZCB8fCAhZS5kLnN0YXJ0c1dpdGgoU3RyaW5nKGN1clllYXIpKSkgY29udGludWU7XG4gICAgICBpZiAoZS50eXBlICE9PSBcImV4cGVuc2VcIiAmJiBlLnR5cGUgIT09IFwiaW5jb21lXCIpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgbWkgPSBwYXJzZUludChlLmQuc2xpY2UoNSwgNykpIC0gMTtcbiAgICAgIGNvbnN0IG1rID0gTU9OVEhfS0VZU1ttaV07XG4gICAgICBjb25zdCBrZXkgPSBgJHtlLmNhdH18JHtta31gO1xuICAgICAgbGVkZ2VyQnlDYXRNb250aFtrZXldID0gKGxlZGdlckJ5Q2F0TW9udGhba2V5XSB8fCAwKSArIChlLnR5cGUgPT09IFwiaW5jb21lXCIgPyB0b051bShlLmFtdCkgOiAtdG9OdW0oZS5hbXQpKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgdXNlTGVkZ2VyID0gbGVkZ2VyRW50cmllcyAmJiBsZWRnZXJFbnRyaWVzLmxlbmd0aCA+IDAgJiZcbiAgICBPYmplY3Qua2V5cyhsZWRnZXJCeUNhdE1vbnRoKS5sZW5ndGggPiAwO1xuXG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGNvbnN0IGNhY2hlID0gYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgIGNvbnN0IGZtICAgID0gY2FjaGU/LmZyb250bWF0dGVyO1xuICAgIGlmICghZm0pIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbW9udGhzID0ge307XG4gICAgbGV0IHRvdGFsID0gMCwgZmlsbGVkU3VtID0gMCwgZmlsbGVkQ291bnQgPSAwO1xuICAgIGNvbnN0IGNhdGVnb3J5ID0gU3RyaW5nKGZtLmNhdGVnb3J5ID8/IGZpbGUuYmFzZW5hbWUpO1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgTU9OVEhfS0VZUykge1xuICAgICAgbGV0IHY7XG4gICAgICBpZiAodXNlTGVkZ2VyKSB7XG4gICAgICAgIGNvbnN0IGxrID0gYCR7Y2F0ZWdvcnl9fCR7a2V5fWA7XG4gICAgICAgIHYgPSBsZWRnZXJCeUNhdE1vbnRoW2xrXSA/PyBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdiA9IGZtW2tleV07XG4gICAgICB9XG4gICAgICBpZiAodiA9PSBudWxsIHx8IHYgPT09IFwiXCIpIHtcbiAgICAgICAgbW9udGhzW2tleV0gPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbiA9IHRvTnVtKHYpO1xuICAgICAgICBtb250aHNba2V5XSA9IG47XG4gICAgICAgIHRvdGFsICs9IG47XG4gICAgICAgIGlmIChuICE9PSAwKSB7IGZpbGxlZFN1bSArPSBuOyBmaWxsZWRDb3VudCsrOyB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcmVjdXJyaW5nICA9ICEhZm0ucmVjdXJyaW5nO1xuICAgIGNvbnN0IHByb2plY3RlZCAgPSByZWN1cnJpbmcgJiYgZmlsbGVkQ291bnQgPiAwXG4gICAgICA/IHBhcnNlRmxvYXQoKGZpbGxlZFN1bSAvIGZpbGxlZENvdW50KS50b0ZpeGVkKDApKVxuICAgICAgOiBudWxsO1xuICAgIGNvbnN0IHR5cGUgICAgICAgPSBTdHJpbmcoZm0udHlwZSA/PyBcIldhbnRzXCIpO1xuICAgIGNvbnN0IGVtb2ppICAgICAgPSBTdHJpbmcoZm0uZW1vamkgPz8gXCJcIik7XG5cbiAgICByb3dzLnB1c2goeyBmaWxlLCB0eXBlLCBjYXRlZ29yeSwgZW1vamksIHJlY3VycmluZywgdG90YWwsIHByb2plY3RlZCwgbW9udGhzIH0pO1xuICB9XG5cbiAgcm93cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgY29uc3Qgb2EgPSBUWVBFX09SREVSW2EudHlwZV0gPz8gOTk7XG4gICAgY29uc3Qgb2IgPSBUWVBFX09SREVSW2IudHlwZV0gPz8gOTk7XG4gICAgcmV0dXJuIG9hICE9PSBvYiA/IG9hIC0gb2IgOiBhLmNhdGVnb3J5LmxvY2FsZUNvbXBhcmUoYi5jYXRlZ29yeSk7XG4gIH0pO1xuXG4gIHJldHVybiByb3dzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgYnVpbGRDYXNoZmxvd1Jvd3MgfTtcbiIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIEFDQ09VTlQgQkFMQU5DRVMgXHUyMDE0IGRlcml2ZSBiYWxhbmNlcyBmcm9tIGxlZGdlciBlbnRyaWVzXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgeyB0b051bSB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuXG5mdW5jdGlvbiBnZXRBY2NvdW50QmFsYW5jZShhY2NvdW50LCBsZWRnZXJFbnRyaWVzKSB7XG4gIGxldCBiYWxhbmNlID0gYWNjb3VudC5pbml0aWFsQmFsYW5jZTtcbiAgZm9yIChjb25zdCBlIG9mIGxlZGdlckVudHJpZXMpIHtcbiAgICBpZiAoZS50byA9PT0gYWNjb3VudC5uYW1lKSBiYWxhbmNlICs9IHRvTnVtKGUuYW10KTtcbiAgICBpZiAoZS5mcm9tID09PSBhY2NvdW50Lm5hbWUpIGJhbGFuY2UgLT0gdG9OdW0oZS5hbXQpO1xuICB9XG4gIHJldHVybiBiYWxhbmNlO1xufVxuXG5mdW5jdGlvbiBnZXRBY2NvdW50c1dpdGhCYWxhbmNlcyhhY2NvdW50cywgbGVkZ2VyRW50cmllcykge1xuICByZXR1cm4gYWNjb3VudHMubWFwKGEgPT4gKHsgLi4uYSwgYmFsYW5jZTogZ2V0QWNjb3VudEJhbGFuY2UoYSwgbGVkZ2VyRW50cmllcykgfSkpO1xufVxuXG5mdW5jdGlvbiBnZXRBY2NvdW50c1RvdGFsKGFjY291bnRzLCBsZWRnZXJFbnRyaWVzKSB7XG4gIHJldHVybiBhY2NvdW50cy5yZWR1Y2UoKHMsIGEpID0+IHMgKyBnZXRBY2NvdW50QmFsYW5jZShhLCBsZWRnZXJFbnRyaWVzKSwgMCk7XG59XG5cbmZ1bmN0aW9uIGdldExpcXVpZEFjY291bnRzVG90YWwoYWNjb3VudHMsIGxlZGdlckVudHJpZXMpIHtcbiAgcmV0dXJuIGFjY291bnRzLmZpbHRlcihhID0+IGEubGlxdWlkICYmICFhLmxvY2tlZClcbiAgICAucmVkdWNlKChzLCBhKSA9PiBzICsgZ2V0QWNjb3VudEJhbGFuY2UoYSwgbGVkZ2VyRW50cmllcyksIDApO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIExJUVVJRCBQT09MUyBIRUxQRVJTIChsZWdhY3kgZmFsbGJhY2sgKyBuZXcgYWNjb3VudC1iYXNlZClcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBnZXRMaXF1aWRBdmFpbGFibGVMZWdhY3koc2V0dGluZ3MpIHtcbiAgbGV0IHN1bSA9IDA7XG4gIGlmIChzZXR0aW5ncy5saXF1aWRCYW5rSXNMaXF1aWQpICAgICAgIHN1bSArPSBzZXR0aW5ncy5saXF1aWRCYW5rID8/IDA7XG4gIGlmIChzZXR0aW5ncy5saXF1aWRCcm9rZXJDYXNoSXNMaXF1aWQpIHN1bSArPSBzZXR0aW5ncy5saXF1aWRCcm9rZXJDYXNoID8/IDA7XG4gIGlmIChzZXR0aW5ncy5saXF1aWRDYXNoSXNMaXF1aWQpICAgICAgIHN1bSArPSBzZXR0aW5ncy5saXF1aWRDYXNoID8/IDA7XG4gIGlmIChzZXR0aW5ncy5saXF1aWRCdXNpbmVzc0lzTGlxdWlkKSAgIHN1bSArPSBzZXR0aW5ncy5saXF1aWRCdXNpbmVzcyA/PyAwO1xuICByZXR1cm4gc3VtO1xufVxuXG5mdW5jdGlvbiBnZXRMaXF1aWRUb3RhbExlZ2FjeShzZXR0aW5ncykge1xuICByZXR1cm4gKHNldHRpbmdzLmxpcXVpZEJhbmsgPz8gMClcbiAgICAgICArIChzZXR0aW5ncy5saXF1aWRCcm9rZXJDYXNoID8/IDApXG4gICAgICAgKyAoc2V0dGluZ3MubGlxdWlkQ2FzaCA/PyAwKVxuICAgICAgICsgKHNldHRpbmdzLmxpcXVpZEJ1c2luZXNzID8/IDApO1xufVxuXG4vLyBXcmFwcGVycyB1c2VkIGV2ZXJ5d2hlcmUgXHUyMDE0IGNoZWNrIGlmIGFjY291bnRzIGV4aXN0LCBlbHNlIGxlZ2FjeVxuZnVuY3Rpb24gZ2V0TGlxdWlkQXZhaWxhYmxlKHNldHRpbmdzLCBhY2NvdW50cywgbGVkZ2VyRW50cmllcykge1xuICBpZiAoYWNjb3VudHMgJiYgYWNjb3VudHMubGVuZ3RoID4gMCkgcmV0dXJuIGdldExpcXVpZEFjY291bnRzVG90YWwoYWNjb3VudHMsIGxlZGdlckVudHJpZXMgfHwgW10pO1xuICByZXR1cm4gZ2V0TGlxdWlkQXZhaWxhYmxlTGVnYWN5KHNldHRpbmdzKTtcbn1cblxuZnVuY3Rpb24gZ2V0TGlxdWlkVG90YWwoc2V0dGluZ3MsIGFjY291bnRzLCBsZWRnZXJFbnRyaWVzKSB7XG4gIGlmIChhY2NvdW50cyAmJiBhY2NvdW50cy5sZW5ndGggPiAwKSByZXR1cm4gZ2V0QWNjb3VudHNUb3RhbChhY2NvdW50cywgbGVkZ2VyRW50cmllcyB8fCBbXSk7XG4gIHJldHVybiBnZXRMaXF1aWRUb3RhbExlZ2FjeShzZXR0aW5ncyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRBY2NvdW50QmFsYW5jZSwgZ2V0QWNjb3VudHNXaXRoQmFsYW5jZXMsIGdldEFjY291bnRzVG90YWwsXG4gIGdldExpcXVpZEFjY291bnRzVG90YWwsIGdldExpcXVpZEF2YWlsYWJsZUxlZ2FjeSwgZ2V0TGlxdWlkVG90YWxMZWdhY3ksXG4gIGdldExpcXVpZEF2YWlsYWJsZSwgZ2V0TGlxdWlkVG90YWwsXG59O1xuIiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gQlVER0VUIFNVTU1BUllcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCB7IE1PTlRIX0tFWVMgfSA9IHJlcXVpcmUoXCIuLi9jb25zdGFudHNcIik7XG5jb25zdCB7IGdldEN1cnJlbnRNb250aEtleSB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuY29uc3QgeyBnZXRMaXF1aWRBdmFpbGFibGUgfSA9IHJlcXVpcmUoXCIuLi9hY2NvdW50cy9iYWxhbmNlXCIpO1xuXG5mdW5jdGlvbiBidWlsZEJ1ZGdldFN1bW1hcnkocm93cywgc2V0dGluZ3MsIGFzc2V0Rmxvd3MpIHtcbiAgY29uc3QgY3VycmVudE1rICAgID0gZ2V0Q3VycmVudE1vbnRoS2V5KCk7XG4gIGNvbnN0IGN1cnJlbnRJZHggICA9IE1PTlRIX0tFWVMuaW5kZXhPZihjdXJyZW50TWspO1xuICBjb25zdCBzYXZlc0J5TWsgICAgPSBhc3NldEZsb3dzLnNhdmVzQnlNb250aEtleSA/PyB7fTtcbiAgY29uc3QgcGFzc2l2ZUluY29tZSA9IGFzc2V0Rmxvd3MucGFzc2l2ZUluY29tZSA/PyAwO1xuICBjb25zdCBjb21mb3J0QnVkZ2V0ID0gc2V0dGluZ3MuY29tZm9ydEJ1ZGdldCA/PyAwO1xuXG4gIGxldCByb2xsaW5nTGVmdCAgICAgID0gZ2V0TGlxdWlkQXZhaWxhYmxlKHNldHRpbmdzLCBhc3NldEZsb3dzLmFjY291bnRzLCBhc3NldEZsb3dzLmFsbExlZGdlcik7XG4gIGxldCBwcmV2VW5zcGVudFdhbnRzID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8PSBjdXJyZW50SWR4OyBpKyspIHtcbiAgICBjb25zdCBtayA9IE1PTlRIX0tFWVNbaV07XG4gICAgbGV0IGluY29tZSA9IDAsIG5lZWRzID0gMCwgd2FudHMgPSAwO1xuXG4gICAgZm9yIChjb25zdCByIG9mIHJvd3MpIHtcbiAgICAgIGNvbnN0IHYgPSByLm1vbnRoc1tta10gPz8gMDtcbiAgICAgIGlmIChyLnR5cGUgPT09IFwiSW5jb21lXCIpIGluY29tZSArPSB2O1xuICAgICAgaWYgKHIudHlwZSA9PT0gXCJOZWVkc1wiKSAgbmVlZHMgICs9IHY7XG4gICAgICBpZiAoci50eXBlID09PSBcIldhbnRzXCIpICB3YW50cyAgKz0gdjtcbiAgICB9XG5cbiAgICBjb25zdCBzYXZlcyAgICAgICA9IHNhdmVzQnlNa1tta10gPz8gMDtcbiAgICBjb25zdCB0b3RhbEluY29tZSA9IGluY29tZSArIChpID09PSBjdXJyZW50SWR4ID8gcGFzc2l2ZUluY29tZSA6IDApO1xuXG4gICAgY29uc3QgbW9udGhMZWZ0ID0gdG90YWxJbmNvbWUgKyBuZWVkcyArIHdhbnRzIC0gc2F2ZXMgKyByb2xsaW5nTGVmdCArIHByZXZVbnNwZW50V2FudHM7XG5cbiAgICBpZiAoaSA9PT0gY3VycmVudElkeCkge1xuICAgICAgY29uc3Qgc2F2ZXNUYXJnZXRQY3QgPSBzZXR0aW5ncy5zYXZlc1RhcmdldFBjdCA/PyAwO1xuICAgICAgY29uc3Qgc2F2ZXNUYXJnZXQgICAgPSBzYXZlc1RhcmdldFBjdCA+IDBcbiAgICAgICAgPyB0b3RhbEluY29tZSAqIChzYXZlc1RhcmdldFBjdCAvIDEwMClcbiAgICAgICAgOiAoc2V0dGluZ3Muc2F2ZXNNb250aGx5ID8/IDApO1xuICAgICAgY29uc3Qgc2F2ZXNSYXRlICAgID0gdG90YWxJbmNvbWUgPiAwID8gKHNhdmVzIC8gdG90YWxJbmNvbWUpICogMTAwIDogMDtcbiAgICAgIGNvbnN0IHNhdmVzT25UcmFjayA9IHNhdmVzVGFyZ2V0UGN0ID4gMFxuICAgICAgICA/IHNhdmVzUmF0ZSA+PSBzYXZlc1RhcmdldFBjdFxuICAgICAgICA6IHNhdmVzID49IHNhdmVzVGFyZ2V0O1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpbmNvbWUsIHBhc3NpdmVJbmNvbWUsIHRvdGFsSW5jb21lLFxuICAgICAgICBuZWVkcywgd2FudHMsIHNhdmVzLFxuICAgICAgICBsZWZ0OiBnZXRMaXF1aWRBdmFpbGFibGUoc2V0dGluZ3MsIGFzc2V0Rmxvd3MuYWNjb3VudHMsIGFzc2V0Rmxvd3MuYWxsTGVkZ2VyKSxcbiAgICAgICAgc2F2ZXNUYXJnZXQsIHNhdmVzUmF0ZSwgc2F2ZXNPblRyYWNrLFxuICAgICAgICBjb21mb3J0QnVkZ2V0LFxuICAgICAgICBuZWVkc0J1ZGdldDogc2V0dGluZ3MubmVlZHNCdWRnZXQgPz8gMCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcm9sbGluZ0xlZnQgICAgICA9IG1vbnRoTGVmdDtcbiAgICBwcmV2VW5zcGVudFdhbnRzID0gTWF0aC5tYXgoMCwgY29tZm9ydEJ1ZGdldCArIHdhbnRzKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgaW5jb21lOiAwLCBwYXNzaXZlSW5jb21lLCB0b3RhbEluY29tZTogcGFzc2l2ZUluY29tZSxcbiAgICBuZWVkczogMCwgd2FudHM6IDAsIHNhdmVzOiAwLCBsZWZ0OiAwLFxuICAgIHNhdmVzVGFyZ2V0OiAwLCBzYXZlc1JhdGU6IDAsIHNhdmVzT25UcmFjazogZmFsc2UsXG4gICAgY29tZm9ydEJ1ZGdldCwgbmVlZHNCdWRnZXQ6IHNldHRpbmdzLm5lZWRzQnVkZ2V0ID8/IDAsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkUHJvamVjdGVkKHJvd3MpIHtcbiAgcmV0dXJuIHJvd3NcbiAgICAuZmlsdGVyKHIgPT4gci5yZWN1cnJpbmcgJiYgci5wcm9qZWN0ZWQgIT0gbnVsbClcbiAgICAubWFwKHIgPT4gKHsgdHlwZTogci50eXBlLCBjYXRlZ29yeTogci5jYXRlZ29yeSwgZW1vamk6IHIuZW1vamksIHByb2plY3RlZDogci5wcm9qZWN0ZWQgfSkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgYnVpbGRCdWRnZXRTdW1tYXJ5LCBidWlsZFByb2plY3RlZCB9O1xuIiwgIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENBUElUQUwgSElTVE9SWSArIFRJTUVMSU5FXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IHsgdG9OdW0gfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxuYXN5bmMgZnVuY3Rpb24gcmVhZENhcGl0YWxIaXN0b3J5KGFwcCwgc2V0dGluZ3MpIHtcbiAgY29uc3QgcGF0aCA9IHNldHRpbmdzLmNhcGl0YWxIaXN0b3J5UGF0aDtcbiAgY29uc3QgZmlsZSA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gIGlmICghZmlsZSkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IGNhY2hlID0gYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICBjb25zdCBmbSAgICA9IGNhY2hlPy5mcm9udG1hdHRlcjtcbiAgaWYgKCFmbT8uc25hcHNob3RzIHx8ICFBcnJheS5pc0FycmF5KGZtLnNuYXBzaG90cykpIHJldHVybiBbXTtcblxuICByZXR1cm4gZm0uc25hcHNob3RzXG4gICAgLmZpbHRlcihzID0+IHMuZGF0ZSAmJiBzLnZhbHVlICE9IG51bGwpXG4gICAgLm1hcChzID0+ICh7IGRhdGU6IFN0cmluZyhzLmRhdGUpLCB2YWx1ZTogdG9OdW0ocy52YWx1ZSkgfSkpXG4gICAgLnNvcnQoKGEsIGIpID0+IGEuZGF0ZS5sb2NhbGVDb21wYXJlKGIuZGF0ZSkpO1xufVxuXG4vKipcbiAqIEJ1aWxkIGNhcGl0YWwgdGltZWxpbmUgZnJvbSBhc3NldCBsb2cgZXZlbnRzLlxuICogTyhFIGxvZyBFKSBtZXJnZS1zb3J0ICsgTyhFKSBsaW5lYXIgd2FsayBcdTIwMTQgcmVwbGFjZXMgdGhlIG9sZCBPKEEqRCkgbmVzdGVkIGxvb3AuXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkQ2FwaXRhbFRpbWVsaW5lKGFzc2V0cywgc2V0dGluZ3MpIHtcbiAgLy8gMS4gQ29sbGVjdCBhbGwgZXZlbnRzIHdpdGggYXNzZXQgaW5kZXggaW50byBhIGZsYXQgYXJyYXlcbiAgY29uc3QgYWxsRXZlbnRzID0gW107XG4gIGZvciAobGV0IGFpID0gMDsgYWkgPCBhc3NldHMubGVuZ3RoOyBhaSsrKSB7XG4gICAgY29uc3QgYSA9IGFzc2V0c1thaV07XG4gICAgZm9yIChjb25zdCBldiBvZiAoYS5sb2dFdmVudHMgfHwgW10pKSB7XG4gICAgICBhbGxFdmVudHMucHVzaCh7IGRhdGU6IGV2LmRhdGUsIG9wOiBldi5vcCwgcXR5OiBldi5xdHksIHZhbDogZXYudmFsLCBhaSwgZng6IGEuZnggfSk7XG4gICAgfVxuICB9XG4gIGlmIChhbGxFdmVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG5cbiAgLy8gMi4gU29ydCBhbGwgZXZlbnRzIGJ5IGRhdGUgKE8oRSBsb2cgRSkpXG4gIGFsbEV2ZW50cy5zb3J0KChhLCBiKSA9PiBhLmRhdGUubG9jYWxlQ29tcGFyZShiLmRhdGUpKTtcblxuICAvLyAzLiBMaW5lYXIgd2FsazogbWFpbnRhaW4gcnVubmluZyBwZXItYXNzZXQgc3RhdGVcbiAgY29uc3QgYXNzZXRTdGF0ZSA9IGFzc2V0cy5tYXAoKCkgPT4gKHsgcXR5OiAwLCBsYXN0UHJpY2U6IDAgfSkpO1xuICBsZXQgcnVubmluZ1RvdGFsID0gMDtcbiAgY29uc3QgZGF0ZVZhbHVlcyA9IG5ldyBNYXAoKTtcblxuICBmb3IgKGNvbnN0IGV2IG9mIGFsbEV2ZW50cykge1xuICAgIGNvbnN0IHN0ID0gYXNzZXRTdGF0ZVtldi5haV07XG4gICAgY29uc3Qgb2xkQ29udHJpYiA9IHN0LnF0eSAqIHN0Lmxhc3RQcmljZSAqIGV2LmZ4O1xuXG4gICAgaWYgKGV2Lm9wID09PSBcImJ1eVwiIHx8IGV2Lm9wID09PSBcInJlaW52ZXN0XCIpIHtcbiAgICAgIHN0LnF0eSArPSBldi5xdHk7XG4gICAgICBzdC5sYXN0UHJpY2UgPSBldi52YWw7XG4gICAgfSBlbHNlIGlmIChldi5vcCA9PT0gXCJzZWxsXCIpIHtcbiAgICAgIHN0LnF0eSA9IE1hdGgubWF4KDAsIHN0LnF0eSAtIGV2LnF0eSk7XG4gICAgfSBlbHNlIGlmIChldi5vcCA9PT0gXCJwcmljZVwiKSB7XG4gICAgICBzdC5sYXN0UHJpY2UgPSBldi52YWw7XG4gICAgfVxuICAgIC8vIGRpdiBkb2Vzbid0IGNoYW5nZSBwb3NpdGlvblxuXG4gICAgY29uc3QgbmV3Q29udHJpYiA9IHN0LnF0eSAqIHN0Lmxhc3RQcmljZSAqIGV2LmZ4O1xuICAgIHJ1bm5pbmdUb3RhbCArPSBuZXdDb250cmliIC0gb2xkQ29udHJpYjtcblxuICAgIGRhdGVWYWx1ZXMuc2V0KGV2LmRhdGUsIHJ1bm5pbmdUb3RhbCk7XG4gIH1cblxuICAvLyA0LiBCdWlsZCB0aW1lbGluZSBmcm9tIHVuaXF1ZSBkYXRlc1xuICBjb25zdCB0aW1lbGluZSA9IFtdO1xuICBmb3IgKGNvbnN0IFtkYXRlLCB2YWx1ZV0gb2YgZGF0ZVZhbHVlcykge1xuICAgIHRpbWVsaW5lLnB1c2goeyBkYXRlLCB2YWx1ZSB9KTtcbiAgfVxuXG4gIC8vIDUuIENvbGxhcHNlIHRvIG1vbnRobHkgYW5kIGZpbGwgZ2Fwc1xuICBjb25zdCBieU1vbnRoID0ge307XG4gIGZvciAoY29uc3QgcHQgb2YgdGltZWxpbmUpIHtcbiAgICBjb25zdCBtayA9IHB0LmRhdGUuc2xpY2UoMCwgNyk7XG4gICAgYnlNb250aFtta10gPSBwdDtcbiAgfVxuXG4gIGNvbnN0IG1vbnRocyA9IE9iamVjdC5rZXlzKGJ5TW9udGgpLnNvcnQoKTtcbiAgaWYgKG1vbnRocy5sZW5ndGggPj0gMikge1xuICAgIGNvbnN0IFtzdGFydFksIHN0YXJ0TV0gPSBtb250aHNbMF0uc3BsaXQoXCItXCIpLm1hcChOdW1iZXIpO1xuICAgIGNvbnN0IFtlbmRZLCBlbmRNXSAgICAgPSBtb250aHNbbW9udGhzLmxlbmd0aCAtIDFdLnNwbGl0KFwiLVwiKS5tYXAoTnVtYmVyKTtcbiAgICBsZXQgeSA9IHN0YXJ0WSwgbSA9IHN0YXJ0TTtcbiAgICBsZXQgbGFzdFZhbCA9IGJ5TW9udGhbbW9udGhzWzBdXS52YWx1ZTtcblxuICAgIHdoaWxlICh5IDwgZW5kWSB8fCAoeSA9PT0gZW5kWSAmJiBtIDw9IGVuZE0pKSB7XG4gICAgICBjb25zdCBtayA9IGAke3l9LSR7U3RyaW5nKG0pLnBhZFN0YXJ0KDIsIFwiMFwiKX1gO1xuICAgICAgaWYgKGJ5TW9udGhbbWtdKSB7XG4gICAgICAgIGxhc3RWYWwgPSBieU1vbnRoW21rXS52YWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJ5TW9udGhbbWtdID0geyBkYXRlOiBgJHtta30tMTVgLCB2YWx1ZTogbGFzdFZhbCB9O1xuICAgICAgfVxuICAgICAgbSsrO1xuICAgICAgaWYgKG0gPiAxMikgeyBtID0gMTsgeSsrOyB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIE9iamVjdC52YWx1ZXMoYnlNb250aCkuc29ydCgoYSwgYikgPT4gYS5kYXRlLmxvY2FsZUNvbXBhcmUoYi5kYXRlKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyByZWFkQ2FwaXRhbEhpc3RvcnksIGJ1aWxkQ2FwaXRhbFRpbWVsaW5lIH07XG4iLCAiLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBCQVNLRVQgQ0xBU1NJRklDQVRJT05cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCB7IGZtdCB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuY29uc3QgeyBnZXRMaXF1aWRUb3RhbCB9ID0gcmVxdWlyZShcIi4uL2FjY291bnRzL2JhbGFuY2VcIik7XG5cbmNvbnN0IEJBU0tFVF9NRVRBID0ge1xuICBjb3JlOiAgICB7IGxhYmVsOiBcIkNvcmVcIiwgICAgY29sb3I6IFwiIzYzNjZmMVwiLCBpY29uOiBcIlx1RDgzQ1x1REZEQlwiIH0sXG4gIGZsYXNoOiAgIHsgbGFiZWw6IFwiRmxhc2hcIiwgICBjb2xvcjogXCIjZjU5ZTBiXCIsIGljb246IFwiXHUyNkExXCIgfSxcbiAgcmVzZXJ2ZTogeyBsYWJlbDogXCJSZXNlcnZlXCIsIGNvbG9yOiBcIiMzNGQzOTlcIiwgaWNvbjogXCJcdUQ4M0RcdURFRTFcIiB9LFxufTtcblxuZnVuY3Rpb24gY2xhc3NpZnlBc3NldEJhc2tldChhc3NldCkge1xuICBpZiAoYXNzZXQuYmFza2V0KSByZXR1cm4gYXNzZXQuYmFza2V0O1xuICBjb25zdCB0ID0gKGFzc2V0LmFzc2V0VHlwZSB8fCBhc3NldC50eXBlIHx8IFwic2hhcmVzXCIpLnRvTG93ZXJDYXNlKCk7XG5cbiAgaWYgKHQgPT09IFwiYm9uZFwiIHx8IHQgPT09IFwiZGVwb3NpdFwiKSByZXR1cm4gXCJjb3JlXCI7XG4gIGlmICh0ID09PSBcImV0ZlwiIHx8IHQgPT09IFwiZnVuZFwiIHx8IHQgPT09IFwiaW5kZXhcIikgcmV0dXJuIFwiY29yZVwiO1xuXG4gIGNvbnN0IG5hbWUgPSAoYXNzZXQubmFtZSB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCB0aWNrZXIgPSAoYXNzZXQudGlja2VyIHx8IGFzc2V0Lm5hbWUgfHwgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgaWYgKG5hbWUuZW5kc1dpdGgoXCJAXCIpIHx8IHRpY2tlci5lbmRzV2l0aChcIkBcIikpIHJldHVybiBcImNvcmVcIjtcbiAgaWYgKC9cXGJFVEZcXGJ8XFxiSU5ERVhcXGJ8XFxiXHUwNDI0XHUwNDFFXHUwNDFEXHUwNDE0XFxifFxcYlx1MDQxOFx1MDQxRFx1MDQxNFx1MDQxNVx1MDQxQVx1MDQyMVxcYi9pLnRlc3QobmFtZSkpIHJldHVybiBcImNvcmVcIjtcbiAgaWYgKC9eUlVcXGR7M31bQS1aXVxcZC8udGVzdCh0aWNrZXIpKSByZXR1cm4gXCJjb3JlXCI7XG5cbiAgaWYgKHQgPT09IFwibWF0ZXJpYWxcIikgcmV0dXJuIG51bGw7XG4gIGlmICh0ID09PSBcImNyeXB0b1wiKSByZXR1cm4gXCJmbGFzaFwiO1xuXG4gIHJldHVybiBcImZsYXNoXCI7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQmFza2V0RGF0YShhc3NldHMsIHNldHRpbmdzLCBhY2NvdW50cywgYWxsTGVkZ2VyKSB7XG4gIGNvbnN0IGJhc2tldHMgPSB7XG4gICAgY29yZTogICAgeyB2YWx1ZTogMCwgYXNzZXRzOiBbXSwgdGFyZ2V0OiBzZXR0aW5ncy50YXJnZXRDb3JlICAgIHx8IDAgfSxcbiAgICBmbGFzaDogICB7IHZhbHVlOiAwLCBhc3NldHM6IFtdLCB0YXJnZXQ6IHNldHRpbmdzLnRhcmdldEZsYXNoICAgfHwgMCB9LFxuICAgIHJlc2VydmU6IHsgdmFsdWU6IDAsIGFzc2V0czogW10sIHRhcmdldDogc2V0dGluZ3MudGFyZ2V0UmVzZXJ2ZSB8fCAwIH0sXG4gIH07XG4gIGZvciAoY29uc3QgYSBvZiBhc3NldHMpIHtcbiAgICBjb25zdCBiayA9IGNsYXNzaWZ5QXNzZXRCYXNrZXQoYSk7XG4gICAgaWYgKGJrICYmIGJhc2tldHNbYmtdKSB7IGJhc2tldHNbYmtdLnZhbHVlICs9IGEuY3VycmVudFZhbHVlUnViOyBiYXNrZXRzW2JrXS5hc3NldHMucHVzaChhKTsgfVxuICB9XG4gIGNvbnN0IGxpcSA9IGdldExpcXVpZFRvdGFsKHNldHRpbmdzLCBhY2NvdW50cywgYWxsTGVkZ2VyKTtcbiAgaWYgKGxpcSA+IDApIGJhc2tldHMucmVzZXJ2ZS52YWx1ZSArPSBsaXE7XG4gIGNvbnN0IHRvdGFsID0gYmFza2V0cy5jb3JlLnZhbHVlICsgYmFza2V0cy5mbGFzaC52YWx1ZSArIGJhc2tldHMucmVzZXJ2ZS52YWx1ZTtcbiAgZm9yIChjb25zdCBiayBvZiBPYmplY3QudmFsdWVzKGJhc2tldHMpKSBiay5wY3QgPSB0b3RhbCA+IDAgPyAoYmsudmFsdWUgLyB0b3RhbCkgKiAxMDAgOiAwO1xuICByZXR1cm4geyBiYXNrZXRzLCB0b3RhbCB9O1xufVxuXG5mdW5jdGlvbiBjaGVja0Jhc2tldFRyaWdnZXJzKGJhc2tldHMsIHNldHRpbmdzKSB7XG4gIGNvbnN0IGFsZXJ0cyA9IFtdO1xuICBjb25zdCBoYXNUYXJnZXRzID0gKHNldHRpbmdzLnRhcmdldENvcmUgfHwgMCkgKyAoc2V0dGluZ3MudGFyZ2V0Rmxhc2ggfHwgMCkgKyAoc2V0dGluZ3MudGFyZ2V0UmVzZXJ2ZSB8fCAwKSA+IDA7XG4gIGlmICghaGFzVGFyZ2V0cykgcmV0dXJuIGFsZXJ0cztcblxuICBjb25zdCBUSFJFU0hPTEQgPSA1O1xuICBmb3IgKGNvbnN0IFtrZXksIG1ldGFdIG9mIE9iamVjdC5lbnRyaWVzKEJBU0tFVF9NRVRBKSkge1xuICAgIGNvbnN0IGJrID0gYmFza2V0c1trZXldO1xuICAgIGlmICghYmsudGFyZ2V0IHx8IGJrLnRhcmdldCA8PSAwKSBjb250aW51ZTtcbiAgICBjb25zdCBkaWZmID0gYmsucGN0IC0gYmsudGFyZ2V0O1xuICAgIGlmIChNYXRoLmFicyhkaWZmKSA+PSBUSFJFU0hPTEQpIHtcbiAgICAgIGNvbnN0IGRpciA9IGRpZmYgPiAwID8gXCJvdmVyd2VpZ2h0XCIgOiBcInVuZGVyd2VpZ2h0XCI7XG4gICAgICBhbGVydHMucHVzaChgJHttZXRhLmljb259ICR7bWV0YS5sYWJlbH06ICR7ZGlyfSBieSAke2ZtdChNYXRoLmFicyhkaWZmKSwgMSl9JSAoJHtmbXQoYmsucGN0LCAxKX0lIHZzICR7YmsudGFyZ2V0fSUgdGFyZ2V0KWApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYWxlcnRzO1xufVxuXG5mdW5jdGlvbiBjaGVja0luc3RydW1lbnRUcmlnZ2Vycyhhc3NldHMpIHtcbiAgY29uc3QgYWxlcnRzID0gW107XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG5cbiAgZm9yIChjb25zdCBhIG9mIGFzc2V0cykge1xuICAgIGNvbnN0IGludmVzdGVkID0gYS5jdXJyZW50VmFsdWUgLSBhLnBsQW1vdW50O1xuICAgIGNvbnN0IHRvdGFsUmV0UGN0ID0gaW52ZXN0ZWQgPiAwID8gKChhLnBsQW1vdW50ICsgYS5wYXNzaXZlSW5jb21lVG90KSAvIGludmVzdGVkKSAqIDEwMCA6IDA7XG4gICAgY29uc3QgaG9sZE1vbnRocyA9IGEuaW5pdGlhbERhdGVcbiAgICAgID8gKG5vdyAtIG5ldyBEYXRlKGEuaW5pdGlhbERhdGUpKSAvICgzMC40NCAqIDI0ICogMzYwMCAqIDEwMDApXG4gICAgICA6IDA7XG5cbiAgICBjb25zdCB0ID0gKGEuYXNzZXRUeXBlIHx8IGEudHlwZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKGhvbGRNb250aHMgPj0gMTIgJiYgdG90YWxSZXRQY3QgPCAwKSB7XG4gICAgICBhbGVydHMucHVzaCh7IHR5cGU6IFwidW5kZXJwZXJmb3JtZXJcIiwgaWNvbjogXCJcdUQ4M0RcdURDQzlcIiwgYXNzZXQ6IGEubmFtZSxcbiAgICAgICAgdGV4dDogYCR7YS5uYW1lfTogdG90YWwgcmV0dXJuICR7Zm10KHRvdGFsUmV0UGN0LCAxKX0lIGFmdGVyICR7TWF0aC5mbG9vcihob2xkTW9udGhzKX0gbW9udGhzYCB9KTtcbiAgICB9XG5cbiAgICBpZiAoKHQgPT09IFwiYm9uZFwiIHx8IHQgPT09IFwiZGVwb3NpdFwiKSAmJiBob2xkTW9udGhzID49IDYpIHtcbiAgICAgIGNvbnN0IHlvYyA9IGludmVzdGVkID4gMCA/IChhLnBhc3NpdmVJbmNvbWVUb3QgLyBpbnZlc3RlZCkgKiAxMDAgOiAwO1xuICAgICAgaWYgKHlvYyA8IDIpIHtcbiAgICAgICAgYWxlcnRzLnB1c2goeyB0eXBlOiBcImRpdmlkZW5kX2RyeVwiLCBpY29uOiBcIlx1RDgzRFx1RENBN1wiLCBhc3NldDogYS5uYW1lLFxuICAgICAgICAgIHRleHQ6IGAke2EubmFtZX06IHlpZWxkIG9uIGNvc3Qgb25seSAke2ZtdCh5b2MsIDEpfSUgXHUyMDE0IGxvdyBmb3IgZml4ZWQgaW5jb21lYCB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodG90YWxSZXRQY3QgPiA1MCAmJiBob2xkTW9udGhzID49IDEpIHtcbiAgICAgIGNvbnN0IGFubnVhbGl6ZWQgPSBob2xkTW9udGhzID4gMCA/ICh0b3RhbFJldFBjdCAvIGhvbGRNb250aHMpICogMTIgOiB0b3RhbFJldFBjdDtcbiAgICAgIGlmIChhbm51YWxpemVkID4gMTAwKSB7XG4gICAgICAgIGFsZXJ0cy5wdXNoKHsgdHlwZTogXCJ3aW5uZXJcIiwgaWNvbjogXCJcdUQ4M0NcdURGQzZcIiwgYXNzZXQ6IGEubmFtZSxcbiAgICAgICAgICB0ZXh0OiBgJHthLm5hbWV9OiB1cCAke2ZtdCh0b3RhbFJldFBjdCwgMSl9JSBpbiAke01hdGguZmxvb3IoaG9sZE1vbnRocyl9IG1vIFx1MjAxNCByYXBpZCBzcGlrZSwgY29uc2lkZXIgbG9ja2luZyBwcm9maXRgIH0pO1xuICAgICAgfSBlbHNlIGlmIChob2xkTW9udGhzIDwgMyAmJiB0b3RhbFJldFBjdCA+IDMwKSB7XG4gICAgICAgIGFsZXJ0cy5wdXNoKHsgdHlwZTogXCJ3aW5uZXJcIiwgaWNvbjogXCJcdUQ4M0NcdURGQzZcIiwgYXNzZXQ6IGEubmFtZSxcbiAgICAgICAgICB0ZXh0OiBgJHthLm5hbWV9OiB1cCAke2ZtdCh0b3RhbFJldFBjdCwgMSl9JSBpbiAke01hdGguZmxvb3IoaG9sZE1vbnRocyl9IG1vIFx1MjAxNCBzaG9ydC10ZXJtIG9wcG9ydHVuaXR5YCB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gYWxlcnRzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgQkFTS0VUX01FVEEsIGNsYXNzaWZ5QXNzZXRCYXNrZXQsIGJ1aWxkQmFza2V0RGF0YSxcbiAgY2hlY2tCYXNrZXRUcmlnZ2VycywgY2hlY2tJbnN0cnVtZW50VHJpZ2dlcnMsXG59O1xuIiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gTU9OVEhMWSBSRVBPUlQgXHUyMDE0IHJpY2ggbWFya2Rvd24gbm90ZVxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmNvbnN0IHsgTU9OVEhfTkFNRVMsIE1PTlRIX0tFWVMgfSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbmNvbnN0IHsgdG9OdW0sIGZtdCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5jb25zdCB7IHJlYWRBY2NvdW50cyB9ID0gcmVxdWlyZShcIi4vYWNjb3VudHMvaW9cIik7XG5jb25zdCB7IGdldExpcXVpZFRvdGFsIH0gPSByZXF1aXJlKFwiLi9hY2NvdW50cy9iYWxhbmNlXCIpO1xuY29uc3QgeyByZWFkQWxsTGVkZ2VyIH0gPSByZXF1aXJlKFwiLi9sZWRnZXIvaW9cIik7XG5jb25zdCB7IGJ1aWxkQmFza2V0RGF0YSwgY2hlY2tCYXNrZXRUcmlnZ2VycywgY2hlY2tJbnN0cnVtZW50VHJpZ2dlcnMgfSA9IHJlcXVpcmUoXCIuL2J1ZGdldC9iYXNrZXRzXCIpO1xuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZU1vbnRobHlSZXBvcnQoYXBwLCBzZXR0aW5ncywgYnVkZ2V0LCBhc3NldHMsIGNmUm93cywgc3ltKSB7XG4gIGNvbnN0IG5vdyAgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCB5eXl5ID0gbm93LmdldEZ1bGxZZWFyKCk7XG4gIGNvbnN0IG1tICAgPSBTdHJpbmcobm93LmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIGNvbnN0IG1vbnRoTmFtZSA9IE1PTlRIX05BTUVTW25vdy5nZXRNb250aCgpXTtcbiAgY29uc3QgZGF5ICA9IFN0cmluZyhub3cuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCBcIjBcIik7XG5cbiAgY29uc3QgbWsgPSBNT05USF9LRVlTW25vdy5nZXRNb250aCgpXTtcbiAgbGV0IHRvdGFsVmFsdWUgPSAwLCB0b3RhbFBMID0gMCwgdG90YWxEaXYgPSAwLCBwZXJpb2REaXYgPSAwO1xuICBmb3IgKGNvbnN0IGEgb2YgYXNzZXRzKSB7XG4gICAgdG90YWxWYWx1ZSArPSBhLmN1cnJlbnRWYWx1ZVJ1YjtcbiAgICB0b3RhbFBMICAgICs9IHRvTnVtKGEucGxBbW91bnQpICogYS5meDtcbiAgICB0b3RhbERpdiAgICs9IHRvTnVtKGEucGFzc2l2ZUluY29tZVRvdCkgKiBhLmZ4O1xuICAgIGlmIChhLmxvZ0V2ZW50cykge1xuICAgICAgZm9yIChjb25zdCBldiBvZiBhLmxvZ0V2ZW50cykge1xuICAgICAgICBpZiAoZXYub3AgPT09IFwiZGl2XCIgJiYgZXYuZGF0ZSAmJiBldi5kYXRlLnN0YXJ0c1dpdGgoYCR7eXl5eX0tJHttbX1gKSkge1xuICAgICAgICAgIHBlcmlvZERpdiArPSB0b051bShldi52YWwpICogYS5meDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBsZXQgYWNjb3VudHNfciwgYWxsTGVkZ2VyX3I7XG4gIHRyeSB7XG4gICAgYWNjb3VudHNfciA9IGF3YWl0IHJlYWRBY2NvdW50cyhhcHAsIHNldHRpbmdzKTtcbiAgICBhbGxMZWRnZXJfciA9IGF3YWl0IHJlYWRBbGxMZWRnZXIoYXBwLCBzZXR0aW5ncyk7XG4gIH0gY2F0Y2ggKF8pIHsgYWNjb3VudHNfciA9IFtdOyBhbGxMZWRnZXJfciA9IFtdOyB9XG4gIGNvbnN0IGxpcXVpZFRvdGFsID0gZ2V0TGlxdWlkVG90YWwoc2V0dGluZ3MsIGFjY291bnRzX3IsIGFsbExlZGdlcl9yKTtcbiAgY29uc3QgbmV0V29ydGggPSB0b3RhbFZhbHVlICsgbGlxdWlkVG90YWw7XG4gIGNvbnN0IGludmVzdGVkQmFzaXMgPSB0b3RhbFZhbHVlIC0gdG90YWxQTDtcbiAgY29uc3QgcmV0dXJuUGN0ID0gaW52ZXN0ZWRCYXNpcyA+IDAgPyAodG90YWxQTCAvIGludmVzdGVkQmFzaXMpICogMTAwIDogMDtcbiAgY29uc3QgdG90YWxSZXR1cm4gPSB0b3RhbFBMICsgdG90YWxEaXY7XG4gIGNvbnN0IHRvdGFsUmV0UGN0ID0gaW52ZXN0ZWRCYXNpcyA+IDAgPyAodG90YWxSZXR1cm4gLyBpbnZlc3RlZEJhc2lzKSAqIDEwMCA6IDA7XG5cbiAgY29uc3Qgc3YgPSAodikgPT4gdiA+PSAwID8gYCsgJHtmbXQoTWF0aC5hYnModikpfWAgOiBgXHUyMjEyICR7Zm10KE1hdGguYWJzKHYpKX1gO1xuXG4gIGxldCBhbGxBbGVydHMgPSBbXTtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IGJhc2tldHMgfSA9IGJ1aWxkQmFza2V0RGF0YShhc3NldHMsIHNldHRpbmdzLCBudWxsLCBudWxsKTtcbiAgICBjb25zdCBoYXNTdHJhdGVneSA9IChzZXR0aW5ncy50YXJnZXRDb3JlIHx8IDApICsgKHNldHRpbmdzLnRhcmdldEZsYXNoIHx8IDApICsgKHNldHRpbmdzLnRhcmdldFJlc2VydmUgfHwgMCkgPiAwO1xuICAgIGNvbnN0IGJhc2tldEFsZXJ0cyA9IGhhc1N0cmF0ZWd5ID8gY2hlY2tCYXNrZXRUcmlnZ2VycyhiYXNrZXRzLCBzZXR0aW5ncykgOiBbXTtcbiAgICBjb25zdCBpbnN0ckFsZXJ0cyAgPSBjaGVja0luc3RydW1lbnRUcmlnZ2Vycyhhc3NldHMpO1xuICAgIGFsbEFsZXJ0cyA9IFsuLi5iYXNrZXRBbGVydHMsIC4uLmluc3RyQWxlcnRzLm1hcCh0ID0+IGAke3QuaWNvbn0gJHt0LnRleHR9YCldO1xuICB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoXCJSZXBvcnQgc2lnbmFscyBlcnJvcjpcIiwgZSk7IH1cblxuICBjb25zdCBtb250aFByZWZpeCA9IGAke3l5eXl9LSR7bW19YDtcbiAgbGV0IHBlcmlvZEJ1eXMgPSAwLCBwZXJpb2RTZWxscyA9IDAsIHBlcmlvZERpdnMgPSAwO1xuICBjb25zdCBwZXJpb2RCeUFzc2V0ID0ge307XG4gIGZvciAoY29uc3QgYSBvZiBhc3NldHMpIHtcbiAgICBmb3IgKGNvbnN0IGV2IG9mIChhLmxvZ0V2ZW50cyB8fCBbXSkpIHtcbiAgICAgIGlmICghZXYuZGF0ZSB8fCAhZXYuZGF0ZS5zdGFydHNXaXRoKG1vbnRoUHJlZml4KSkgY29udGludWU7XG4gICAgICBjb25zdCBhbXQgPSBNYXRoLmFicyh0b051bShldi5xdHkpICogdG9OdW0oZXYudmFsKSkgKiBhLmZ4O1xuICAgICAgaWYgKGV2Lm9wID09PSBcImJ1eVwiIHx8IGV2Lm9wID09PSBcInJlaW52ZXN0XCIpIHtcbiAgICAgICAgcGVyaW9kQnV5cyArPSBhbXQ7XG4gICAgICAgIGlmICghcGVyaW9kQnlBc3NldFthLm5hbWVdKSBwZXJpb2RCeUFzc2V0W2EubmFtZV0gPSB7IGJ1eXM6IDAsIHNlbGxzOiAwLCBkaXZzOiAwIH07XG4gICAgICAgIHBlcmlvZEJ5QXNzZXRbYS5uYW1lXS5idXlzICs9IGFtdDtcbiAgICAgIH0gZWxzZSBpZiAoZXYub3AgPT09IFwic2VsbFwiKSB7XG4gICAgICAgIHBlcmlvZFNlbGxzICs9IGFtdDtcbiAgICAgICAgaWYgKCFwZXJpb2RCeUFzc2V0W2EubmFtZV0pIHBlcmlvZEJ5QXNzZXRbYS5uYW1lXSA9IHsgYnV5czogMCwgc2VsbHM6IDAsIGRpdnM6IDAgfTtcbiAgICAgICAgcGVyaW9kQnlBc3NldFthLm5hbWVdLnNlbGxzICs9IGFtdDtcbiAgICAgIH0gZWxzZSBpZiAoZXYub3AgPT09IFwiZGl2XCIpIHtcbiAgICAgICAgY29uc3QgZEFtdCA9IE1hdGguYWJzKHRvTnVtKGV2LnF0eSB8fCBldi52YWwpKSAqIGEuZng7XG4gICAgICAgIHBlcmlvZERpdnMgKz0gZEFtdDtcbiAgICAgICAgaWYgKCFwZXJpb2RCeUFzc2V0W2EubmFtZV0pIHBlcmlvZEJ5QXNzZXRbYS5uYW1lXSA9IHsgYnV5czogMCwgc2VsbHM6IDAsIGRpdnM6IDAgfTtcbiAgICAgICAgcGVyaW9kQnlBc3NldFthLm5hbWVdLmRpdnMgKz0gZEFtdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY29uc3QgcGVyaW9kTmV0ID0gcGVyaW9kRGl2cyArIHBlcmlvZFNlbGxzIC0gcGVyaW9kQnV5cztcblxuICBjb25zdCBwZXJpb2RBY3RpdmUgPSBPYmplY3QuZW50cmllcyhwZXJpb2RCeUFzc2V0KVxuICAgIC5tYXAoKFtuYW1lLCBkXSkgPT4gKHsgbmFtZSwgbmV0OiBkLmRpdnMgKyBkLnNlbGxzIC0gZC5idXlzLCAuLi5kIH0pKVxuICAgIC5maWx0ZXIoYSA9PiBNYXRoLmFicyhhLm5ldCkgPiAwKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLm5ldCAtIGEubmV0KTtcbiAgY29uc3QgcGVyaW9kVG9wID0gcGVyaW9kQWN0aXZlLmZpbHRlcihhID0+IGEubmV0ID4gMCkuc2xpY2UoMCwgMyk7XG4gIGNvbnN0IHBlcmlvZEJvdCA9IHBlcmlvZEFjdGl2ZS5maWx0ZXIoYSA9PiBhLm5ldCA8IDApLnNsaWNlKC0zKS5yZXZlcnNlKCk7XG5cbiAgY29uc3Qgcm93ID0gKGxhYmVsLCB2YWx1ZSkgPT5cbiAgICBgPGRpdiBjbGFzcz1cImNyLXJvd1wiPjxzcGFuIGNsYXNzPVwiY3ItbmFtZVwiPiR7bGFiZWx9PC9zcGFuPjxzcGFuIGNsYXNzPVwiY3ItdmFsXCI+JHt2YWx1ZX08L3NwYW4+PC9kaXY+YDtcblxuICBjb25zdCBIID0gW107XG4gIEgucHVzaChgPGRpdiBjbGFzcz1cImNyLXRpY2tldFwiPmApO1xuICBILnB1c2goYDxkaXYgY2xhc3M9XCJjci1oZWFkZXJcIj48c3BhbiBjbGFzcz1cImNyLXRpdGxlXCI+Q2FwaXRhbCBTdGF0ZW1lbnQ8L3NwYW4+PHNwYW4gY2xhc3M9XCJjci1wZXJpb2RcIj4ke21vbnRoTmFtZS5zbGljZSgwLDMpfSAwMSBcdTIwMTMgJHttb250aE5hbWUuc2xpY2UoMCwzKX0gJHtkYXl9LCAke3l5eXl9PC9zcGFuPjwvZGl2PmApO1xuXG4gIEgucHVzaChgPGRpdiBjbGFzcz1cImNyLWdyb3VwLWxhYmVsIGNyLWZpcnN0XCI+UG9ydGZvbGlvPC9kaXY+YCk7XG4gIEgucHVzaChyb3coXCJOZXQgV29ydGhcIiwgYCR7Zm10KG5ldFdvcnRoKX0gJHtzeW19YCkpO1xuICBjb25zdCByZXRQY3RTdHIgPSBgJHt0b3RhbFJldFBjdCA+PSAwID8gXCJcdTI1QjJcIiA6IFwiXHUyNUJDXCJ9ICR7Zm10KE1hdGguYWJzKHRvdGFsUmV0UGN0KSwgMSl9JWA7XG4gIEgucHVzaChyb3coXCJVbnJlYWxpemVkIFAmTFwiLCBgPHNwYW4gY2xhc3M9XCIke3RvdGFsUmV0dXJuID49IDAgPyBcImNyLXBvc1wiIDogXCJjci1uZWdcIn1cIj4ke3N2KHRvdGFsUmV0dXJuKX0gJHtzeW19PC9zcGFuPiA8c3BhbiBjbGFzcz1cImNyLWJhZGdlXCI+JHtyZXRQY3RTdHJ9PC9zcGFuPmApKTtcblxuICBILnB1c2goYDxkaXYgY2xhc3M9XCJjci1ncm91cC1sYWJlbFwiPlRoaXMgcGVyaW9kPC9kaXY+YCk7XG4gIGlmIChwZXJpb2RCdXlzID4gMCkgIEgucHVzaChyb3coXCJJbnZlc3RlZFwiLCBgPHNwYW4gY2xhc3M9XCJjci1uZWdcIj5cdTIyMTIgJHtmbXQocGVyaW9kQnV5cyl9ICR7c3ltfTwvc3Bhbj5gKSk7XG4gIGlmIChwZXJpb2RTZWxscyA+IDApIEgucHVzaChyb3coXCJTb2xkXCIsIGA8c3BhbiBjbGFzcz1cImNyLXBvc1wiPisgJHtmbXQocGVyaW9kU2VsbHMpfSAke3N5bX08L3NwYW4+YCkpO1xuICBpZiAocGVyaW9kRGl2cyA+IDApICBILnB1c2gocm93KFwiRGl2aWRlbmRzICYgQ291cG9uc1wiLCBgPHNwYW4gY2xhc3M9XCJjci1wb3NcIj4rICR7Zm10KHBlcmlvZERpdnMpfSAke3N5bX08L3NwYW4+YCkpO1xuICBpZiAocGVyaW9kQnV5cyA9PT0gMCAmJiBwZXJpb2RTZWxscyA9PT0gMCAmJiBwZXJpb2REaXZzID09PSAwKSB7XG4gICAgSC5wdXNoKHJvdyhcIkFjdGl2aXR5XCIsIGA8c3BhbiBjbGFzcz1cImNyLW11dGVkXCI+XHUyMDE0PC9zcGFuPmApKTtcbiAgfVxuXG4gIEgucHVzaChgPGRpdiBjbGFzcz1cImNyLXRlYXJcIj48L2Rpdj5gKTtcbiAgSC5wdXNoKGA8ZGl2IGNsYXNzPVwiY3ItdG90YWwtcm93XCI+PHNwYW4gY2xhc3M9XCJjci10b3RhbC1sYWJlbFwiPlBlcmlvZCBuZXQ8L3NwYW4+PHNwYW4gY2xhc3M9XCJjci10b3RhbC12YWx1ZSAke3BlcmlvZE5ldCA+PSAwID8gXCJjci1wb3NcIiA6IFwiY3ItbmVnXCJ9XCI+JHtzdihwZXJpb2ROZXQpfSAke3N5bX08L3NwYW4+PC9kaXY+YCk7XG5cbiAgaWYgKHBlcmlvZFRvcC5sZW5ndGggPiAwIHx8IHBlcmlvZEJvdC5sZW5ndGggPiAwKSB7XG4gICAgSC5wdXNoKGA8ZGl2IGNsYXNzPVwiY3ItZ3JvdXAtbGFiZWxcIj5QZXJpb2QgcGVyZm9ybWVyczwvZGl2PmApO1xuICAgIGZvciAoY29uc3QgYSBvZiBwZXJpb2RUb3ApIEgucHVzaChyb3coYS5uYW1lLCBgPHNwYW4gY2xhc3M9XCJjci1wb3NcIj4rICR7Zm10KGEubmV0KX0gJHtzeW19PC9zcGFuPmApKTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgcGVyaW9kQm90KSBILnB1c2gocm93KGEubmFtZSwgYDxzcGFuIGNsYXNzPVwiY3ItbmVnXCI+XHUyMjEyICR7Zm10KE1hdGguYWJzKGEubmV0KSl9ICR7c3ltfTwvc3Bhbj5gKSk7XG4gIH1cblxuICBILnB1c2goYDxkaXYgY2xhc3M9XCJjci1ncm91cC1sYWJlbFwiPlNpZ25hbHM8L2Rpdj5gKTtcbiAgZm9yIChjb25zdCBhIG9mIGFsbEFsZXJ0cykgSC5wdXNoKGA8ZGl2IGNsYXNzPVwiY3Itc2lnbmFsXCI+JHthfTwvZGl2PmApO1xuXG4gIEgucHVzaChgPGRpdiBjbGFzcz1cImNyLWZvb3RlclwiPlN0YXRlbWVudCBnZW5lcmF0ZWQgYXV0b21hdGljYWxseTwvZGl2PmApO1xuICBILnB1c2goYDwvZGl2PmApO1xuXG4gIGNvbnN0IEwgPSBbXTtcbiAgTC5wdXNoKGAtLS1gKTtcbiAgTC5wdXNoKGBjc3NjbGFzc2VzOiBbcGMtcmVwb3J0XWApO1xuICBMLnB1c2goYHJlcG9ydF9tb250aDogXCIke3l5eXl9LSR7bW19XCJgKTtcbiAgTC5wdXNoKGBnZW5lcmF0ZWQ6IFwiJHt5eXl5fS0ke21tfS0ke2RheX1cImApO1xuICBMLnB1c2goYG5ldF93b3J0aDogJHtNYXRoLnJvdW5kKG5ldFdvcnRoKX1gKTtcbiAgTC5wdXNoKGAtLS1gKTtcbiAgTC5wdXNoKFwiXCIpO1xuICBMLnB1c2goSC5qb2luKFwiXFxuXCIpKTtcblxuICBjb25zdCBjb250ZW50ID0gTC5qb2luKFwiXFxuXCIpO1xuICBjb25zdCBmb2xkZXJQYXRoID0gXCJmaW5hbmNlL0RhdGEvcmVwb3J0c1wiO1xuXG4gIGNvbnN0IGZQYXJ0cyA9IGZvbGRlclBhdGguc3BsaXQoXCIvXCIpO1xuICBsZXQgY3VyID0gXCJcIjtcbiAgZm9yIChjb25zdCBwIG9mIGZQYXJ0cykge1xuICAgIGN1ciA9IGN1ciA/IGAke2N1cn0vJHtwfWAgOiBwO1xuICAgIGlmICghYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXIpKSB7XG4gICAgICB0cnkgeyBhd2FpdCBhcHAudmF1bHQuY3JlYXRlRm9sZGVyKGN1cik7IH0gY2F0Y2ggKF8pIHt9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgYmFzZU5hbWUgPSBgJHt5eXl5fS0ke21tfS0ke2RheX1gO1xuICBsZXQgZmlsZVBhdGggPSBgJHtmb2xkZXJQYXRofS8ke2Jhc2VOYW1lfS5tZGA7XG4gIGNvbnN0IGV4aXN0aW5nRmlsZSA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZmlsZVBhdGgpO1xuICBpZiAoZXhpc3RpbmdGaWxlKSB7XG4gICAgY29uc3Qgb3BlbkZpbGVzID0gYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoXCJtYXJrZG93blwiKVxuICAgICAgLm1hcChsID0+IGwudmlldz8uZmlsZT8ucGF0aCkuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGlmIChvcGVuRmlsZXMuaW5jbHVkZXMoZmlsZVBhdGgpKSB7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nRmlsZSwgY29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBuID0gMjtcbiAgICAgIHdoaWxlIChhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGAke2ZvbGRlclBhdGh9LyR7YmFzZU5hbWV9XyR7bn0ubWRgKSkgbisrO1xuICAgICAgZmlsZVBhdGggPSBgJHtmb2xkZXJQYXRofS8ke2Jhc2VOYW1lfV8ke259Lm1kYDtcbiAgICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGUoZmlsZVBhdGgsIGNvbnRlbnQpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKGZpbGVQYXRoLCBjb250ZW50KTtcbiAgfVxuXG4gIGNvbnN0IGZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVQYXRoKTtcbiAgaWYgKGZpbGUpIHtcbiAgICBjb25zdCBsZWFmID0gYXBwLndvcmtzcGFjZS5nZXRMZWFmKGZhbHNlKTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpO1xuICAgIGNvbnN0IHZpZXdTdGF0ZSA9IGxlYWYuZ2V0Vmlld1N0YXRlKCk7XG4gICAgdmlld1N0YXRlLnN0YXRlID0gdmlld1N0YXRlLnN0YXRlIHx8IHt9O1xuICAgIHZpZXdTdGF0ZS5zdGF0ZS5tb2RlID0gXCJwcmV2aWV3XCI7XG4gICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUodmlld1N0YXRlKTtcbiAgfVxuXG4gIHJldHVybiBmaWxlUGF0aDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IGdlbmVyYXRlTW9udGhseVJlcG9ydCB9O1xuIiwgImZ1bmN0aW9uIGZpdENhcmRUZXh0KGVsKSB7XG4gIGVsLnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGlmIChlbC5zY3JvbGxXaWR0aCA8PSBlbC5vZmZzZXRXaWR0aCkgcmV0dXJuO1xuICAgIC8vIFN0YXJ0IGZyb20gQ1NTLWRlZmluZWQgc2l6ZSwgc3RlcCBkb3duIHVudGlsIGl0IGZpdHNcbiAgICBsZXQgc2l6ZVB4ID0gcGFyc2VGbG9hdChnZXRDb21wdXRlZFN0eWxlKGVsKS5mb250U2l6ZSk7XG4gICAgY29uc3QgbWluUHggPSAxMDtcbiAgICB3aGlsZSAoZWwuc2Nyb2xsV2lkdGggPiBlbC5vZmZzZXRXaWR0aCAmJiBzaXplUHggPiBtaW5QeCkge1xuICAgICAgc2l6ZVB4IC09IDE7XG4gICAgICBlbC5zdHlsZS5mb250U2l6ZSA9IHNpemVQeCArIFwicHhcIjtcbiAgICB9XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgZml0Q2FyZFRleHQgfTtcbiIsICJjb25zdCB7IGZtdCB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuY29uc3QgeyBmaXRDYXJkVGV4dCB9ID0gcmVxdWlyZShcIi4vZml0LXRleHRcIik7XG5cbmZ1bmN0aW9uIHJlbmRlckJ1ZGdldENhcmRzKGNvbnRhaW5lciwgYnVkZ2V0LCBzeW0pIHtcbiAgY29uc3QgbmVlZHNQY3QgPSBidWRnZXQudG90YWxJbmNvbWUgPiAwID8gKE1hdGguYWJzKGJ1ZGdldC5uZWVkcykgLyBidWRnZXQudG90YWxJbmNvbWUpICogMTAwIDogMDtcbiAgY29uc3Qgc2F2ZXNQY3QgPSBidWRnZXQuc2F2ZXNSYXRlID8/IDA7ICAvLyBzYXZpbmdzIHJhdGUgPSBzYXZlcyAvIHRvdGFsSW5jb21lXG4gIGNvbnN0IGxpcXVpZE9rID0gYnVkZ2V0LmxlZnQgPj0gMDtcblxuICBjb25zdCBTRUdTICAgICAgPSAyMjtcbiAgY29uc3Qgd2FudHNBYnMgID0gTWF0aC5hYnMoYnVkZ2V0LndhbnRzKTtcbiAgY29uc3Qgd2FudHNPdmVyID0gd2FudHNBYnMgPiBidWRnZXQuY29tZm9ydEJ1ZGdldDtcbiAgY29uc3Qgd2FudHNGaWxsZWQgPSBidWRnZXQuY29tZm9ydEJ1ZGdldCA+IDBcbiAgICA/IE1hdGgubWluKFNFR1MsIE1hdGgucm91bmQoKHdhbnRzQWJzIC8gYnVkZ2V0LmNvbWZvcnRCdWRnZXQpICogU0VHUykpXG4gICAgOiAwO1xuXG4gIGNvbnN0IGNhcmRzID0gW1xuICAgIHtcbiAgICAgIGlkOiAgICAgXCJuZWVkc1wiLFxuICAgICAgbGFiZWw6ICBcIk5lZWRzXCIsXG4gICAgICBpY29uOiAgIFwiXHVEODNDXHVERkUwXCIsXG4gICAgICBtYWluOiAgIGAke2ZtdChuZWVkc1BjdCwgMCl9JWAsXG4gICAgICBzdWI6ICAgIFwib2YgaW5jb21lXCIsXG4gICAgICBzdGF0dXM6IGxpcXVpZE9rID8gXCJva1wiIDogXCJvdmVyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICBpZDogICAgIFwic2F2ZXNcIixcbiAgICAgIGxhYmVsOiAgXCJTYXZlc1wiLFxuICAgICAgaWNvbjogICBcIlx1RDgzRFx1RENDOFwiLFxuICAgICAgbWFpbjogICBgJHtmbXQoc2F2ZXNQY3QsIDApfSVgLFxuICAgICAgc3ViOiAgICBgJHtmbXQoTWF0aC5hYnMoYnVkZ2V0LnNhdmVzKSl9ICR7c3ltfSBpbnZlc3RlZGAsXG4gICAgICBzdGF0dXM6IGJ1ZGdldC5zYXZlc09uVHJhY2sgPyBcIm9rXCIgOiAoYnVkZ2V0LnNhdmVzID4gMCA/IFwicGFydGlhbFwiIDogXCJlbXB0eVwiKSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGlkOiAgICAgXCJ3YW50c1wiLFxuICAgICAgbGFiZWw6ICBcIldhbnRzXCIsXG4gICAgICBpY29uOiAgIFwiXHUyNzI4XCIsXG4gICAgICBzdGF0dXM6IHdhbnRzT3ZlciA/IFwib3ZlclwiIDogXCJva1wiLFxuICAgICAgc2VnYmFyOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICAgICAgXCJsZWZ0XCIsXG4gICAgICBsYWJlbDogICBcIkxlZnRcIixcbiAgICAgIGljb246ICAgIFwiXHVEODNEXHVEQ0IwXCIsXG4gICAgICBtYWluOiAgICBgJHtmbXQoYnVkZ2V0LmxlZnQpfSAke3N5bX1gLFxuICAgICAgZml0VGV4dDogdHJ1ZSxcbiAgICAgIG5vQmFkZ2U6IHRydWUsXG4gICAgICBsZWZ0Q2FyZDogdHJ1ZSxcbiAgICAgIHN0YXR1czogIGJ1ZGdldC5sZWZ0ID49IDAgPyBcIm9rXCIgOiBcIm92ZXJcIixcbiAgICB9LFxuICBdO1xuXG4gIGNvbnN0IGJhZGdlVGV4dCA9IHsgb2s6IFwiT24gdHJhY2tcIiwgb3ZlcjogXCJPdmVyIGJ1ZGdldFwiLCBwYXJ0aWFsOiBcIkJlaGluZFwiLCBuZXV0cmFsOiBcIlx1MjAxNFwiLCBlbXB0eTogXCJObyBkYXRhXCIgfTtcblxuICBmb3IgKGNvbnN0IGNhcmQgb2YgY2FyZHMpIHtcbiAgICBjb25zdCBlbCAgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBgcGMtY2FyZCBwYy1jYXJkLS0ke2NhcmQuaWR9YCB9KTtcblxuICAgIC8vIFRvcCByb3dcbiAgICBjb25zdCB0b3AgICAgICA9IGVsLmNyZWF0ZURpdih7IGNsczogXCJwYy1jYXJkLXRvcFwiIH0pO1xuICAgIGNvbnN0IGxhYmVsUm93ID0gdG9wLmNyZWF0ZURpdih7IGNsczogXCJwYy1jYXJkLWxhYmVsLXJvd1wiIH0pO1xuICAgIGxhYmVsUm93LmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1jYXJkLWljb25cIiwgIHRleHQ6IGNhcmQuaWNvbiAgfSk7XG4gICAgbGFiZWxSb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLWNhcmQtbGFiZWxcIiwgdGV4dDogY2FyZC5sYWJlbCB9KTtcbiAgICBpZiAoIWNhcmQubm9CYWRnZSkge1xuICAgICAgdG9wLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgIGNsczogIGBwYy1jYXJkLWJhZGdlIHBjLWJhZGdlLS0ke2NhcmQuc3RhdHVzfWAsXG4gICAgICAgIHRleHQ6IGJhZGdlVGV4dFtjYXJkLnN0YXR1c10gPz8gXCJcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChjYXJkLnNlZ2Jhcikge1xuICAgICAgLy8gV2FudHM6IHNlZ21lbnRlZCBiYXIgKyB4L3kgbnVtYmVyc1xuICAgICAgY29uc3QgYm9keSA9IGVsLmNyZWF0ZURpdih7IGNsczogXCJwYy1jYXJkLWJvZHkgcGMtY2FyZC1ib2R5LS1iYXJcIiB9KTtcbiAgICAgIGNvbnN0IGJhciAgPSBib2R5LmNyZWF0ZURpdih7IGNsczogXCJwYy1zZWdiYXJcIiB9KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgU0VHUzsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGxpdCA9IGkgPCB3YW50c0ZpbGxlZDtcbiAgICAgICAgYmFyLmNyZWF0ZURpdih7IGNsczogYHBjLXNlZyAke2xpdCA/ICh3YW50c092ZXIgPyBcInBjLXNlZy0tb3ZlclwiIDogXCJwYy1zZWctLW9uXCIpIDogXCJwYy1zZWctLW9mZlwifWAgfSk7XG4gICAgICB9XG4gICAgICBjb25zdCBudW1zID0gYm9keS5jcmVhdGVEaXYoeyBjbHM6IFwicGMtc2VnYmFyLW51bXNcIiB9KTtcbiAgICAgIG51bXMuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiB3YW50c092ZXIgPyBcInBjLXNlZ2Jhci1vdmVyXCIgOiBcInBjLXNlZ2Jhci12YWxcIiwgdGV4dDogZm10KHdhbnRzQWJzKSB9KTtcbiAgICAgIG51bXMuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogYCAvICR7Zm10KGJ1ZGdldC5jb21mb3J0QnVkZ2V0KX0gJHtzeW19YCB9KTtcbiAgICB9IGVsc2UgaWYgKGNhcmQubGVmdENhcmQpIHtcbiAgICAgIC8vIExlZnQ6IFwiQXZhaWxhYmxlIGxpcXVpZGl0eVwiIHRpdGxlICsgbnVtYmVyXG4gICAgICBjb25zdCBib2R5ID0gZWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWNhcmQtYm9keSBwYy1jYXJkLWJvZHktLWxlZnRcIiB9KTtcbiAgICAgIGJvZHkuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLWNhcmQtbGlxdWlkaXR5LWxhYmVsXCIsIHRleHQ6IFwiQXZhaWxhYmxlIGxpcXVpZGl0eVwiIH0pO1xuICAgICAgY29uc3QgbWFpbkVsID0gYm9keS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1jYXJkLW1haW5cIiwgdGV4dDogY2FyZC5tYWluIH0pO1xuICAgICAgaWYgKGNhcmQuZml0VGV4dCkgZml0Q2FyZFRleHQobWFpbkVsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU3RhbmRhcmQ6IGJpZyBjZW50cmVkIGhlcm8gKyBvcHRpb25hbCBzdWIgbGluZVxuICAgICAgY29uc3QgYm9keSAgID0gZWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWNhcmQtYm9keVwiIH0pO1xuICAgICAgY29uc3QgbWFpbkVsID0gYm9keS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1jYXJkLW1haW5cIiwgdGV4dDogY2FyZC5tYWluIH0pO1xuICAgICAgaWYgKGNhcmQuZml0VGV4dCkgZml0Q2FyZFRleHQobWFpbkVsKTtcbiAgICAgIGlmIChjYXJkLnN1YikgYm9keS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1jYXJkLXN1YlwiLCB0ZXh0OiBjYXJkLnN1YiB9KTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHJlbmRlckJ1ZGdldENhcmRzIH07XG4iLCAiY29uc3QgeyBmbXQgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxuZnVuY3Rpb24gcmVuZGVyUHJvamVjdGVkKGNvbnRhaW5lciwgcHJvaiwgc3ltLCBidWRnZXQpIHtcbiAgaWYgKHByb2oubGVuZ3RoID09PSAwKSB7XG4gICAgY29udGFpbmVyLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJwYy1lbXB0eVwiLCB0ZXh0OiBcIk5vIHJlY3VycmluZyBjYXRlZ29yaWVzIHNldC4gTWFyayBjYXRlZ29yaWVzIGFzIHJlY3VycmluZyBpbiBjYXNoZmxvdy5cIiB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBUaWNrZXQgY2FyZCB3cmFwcGVyXG4gIGNvbnN0IHRpY2tldCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwicGMtcHJvai10aWNrZXRcIiB9KTtcblxuICAvLyBIZWFkZXIgcm93XG4gIGNvbnN0IGhkciA9IHRpY2tldC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtcHJvai10aWNrZXQtaGVhZGVyXCIgfSk7XG4gIGhkci5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtcHJvai10aWNrZXQtdGl0bGVcIiwgIHRleHQ6IFwiUHJvamVjdGVkXCIgfSk7XG4gIGhkci5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtcHJvai10aWNrZXQtcGVyaW9kXCIsIHRleHQ6IFwibmV4dCBtb250aFwiIH0pO1xuXG4gIGNvbnN0IGxpc3QgPSB0aWNrZXQuY3JlYXRlRWwoXCJ1bFwiLCB7IGNsczogXCJwYy1wcm9qZWN0ZWQtbGlzdFwiIH0pO1xuXG4gIC8vIEdyb3VwIGJ5IHR5cGVcbiAgY29uc3QgZ3JvdXBlZCA9IHt9O1xuICBmb3IgKGNvbnN0IHAgb2YgcHJvaikge1xuICAgIChncm91cGVkW3AudHlwZV0gPSBncm91cGVkW3AudHlwZV0gfHwgW10pLnB1c2gocCk7XG4gIH1cblxuICBjb25zdCB0eXBlTGFiZWwgPSB7IEluY29tZTogXCJJbmNvbWVcIiwgTmVlZHM6IFwiTmVlZHNcIiwgV2FudHM6IFwiV2FudHNcIiwgU2F2ZXM6IFwiU2F2ZXNcIiB9O1xuXG4gIGZvciAoY29uc3QgdHlwZSBvZiBbXCJJbmNvbWVcIiwgXCJOZWVkc1wiLCBcIldhbnRzXCJdKSB7XG4gICAgY29uc3QgaXRlbXMgPSBncm91cGVkW3R5cGVdO1xuICAgIGlmICghaXRlbXMpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgZ3JvdXBFbCA9IGxpc3QuY3JlYXRlRWwoXCJsaVwiLCB7IGNsczogXCJwYy1wcm9qLWdyb3VwXCIgfSk7XG4gICAgZ3JvdXBFbC5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IGBwYy1wcm9qLWdyb3VwLWxhYmVsIHBjLXByb2otZ3JvdXAtLSR7dHlwZS50b0xvd2VyQ2FzZSgpfWAsIHRleHQ6IHR5cGVMYWJlbFt0eXBlXSB9KTtcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgY29uc3Qgcm93ID0gZ3JvdXBFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1wcm9qLXJvd1wiIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1wcm9qLW5hbWVcIiwgdGV4dDogaXRlbS5jYXRlZ29yeSB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtcHJvai12YWx1ZVwiLCB0ZXh0OiBgJHtmbXQoaXRlbS5wcm9qZWN0ZWQpfSAke3N5bX1gIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNhdmVzIChjb21wdXRlZCBmcm9tIHN0cmF0ZWd5KVxuICBjb25zdCBzYXZlc0VsID0gbGlzdC5jcmVhdGVFbChcImxpXCIsIHsgY2xzOiBcInBjLXByb2otZ3JvdXBcIiB9KTtcbiAgc2F2ZXNFbC5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtcHJvai1ncm91cC1sYWJlbCBwYy1wcm9qLWdyb3VwLS1zYXZlc1wiLCB0ZXh0OiBcIlNhdmVzXCIgfSk7XG4gIGNvbnN0IHNhdmVzUm93ID0gc2F2ZXNFbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1wcm9qLXJvd1wiIH0pO1xuICBzYXZlc1Jvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtcHJvai1uYW1lXCIsIHRleHQ6IFwiSW52ZXN0bWVudHMgKHRhcmdldClcIiB9KTtcbiAgc2F2ZXNSb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLXByb2otdmFsdWVcIiwgdGV4dDogYCR7Zm10KGJ1ZGdldC5zYXZlc1RhcmdldCl9ICR7c3ltfWAgfSk7XG5cbiAgLy8gRGl2aWRlciArIHRvdGFsIGluc2lkZSB0aWNrZXRcbiAgdGlja2V0LmNyZWF0ZURpdih7IGNsczogXCJwYy1wcm9qLXRlYXJcIiB9KTtcbiAgbGV0IHByb2pUb3RhbCA9IDA7XG4gIGZvciAoY29uc3QgcCBvZiBwcm9qKSBwcm9qVG90YWwgKz0gcC5wcm9qZWN0ZWQ7XG4gIHByb2pUb3RhbCAtPSBidWRnZXQuc2F2ZXNUYXJnZXQ7XG4gIGNvbnN0IHRvdGFsUm93ID0gdGlja2V0LmNyZWF0ZURpdih7IGNsczogXCJwYy1wcm9qLXRvdGFsLXJvd1wiIH0pO1xuICB0b3RhbFJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtcHJvai10b3RhbC1sYWJlbFwiLCB0ZXh0OiBcIk5ldCBwcm9qZWN0ZWRcIiB9KTtcbiAgdG90YWxSb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBgcGMtcHJvai10b3RhbC12YWx1ZSAke3Byb2pUb3RhbCA+PSAwID8gXCJwYy1wb3NcIiA6IFwicGMtbmVnXCJ9YCwgdGV4dDogYCR7Zm10KHByb2pUb3RhbCl9ICR7c3ltfWAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyByZW5kZXJQcm9qZWN0ZWQgfTtcbiIsICJjb25zdCB7IHRvTnVtLCBmbXQsIGZtdFNpZ25lZCB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuY29uc3QgeyBnZXRMaXF1aWRUb3RhbCB9ID0gcmVxdWlyZShcIi4uL2FjY291bnRzL2JhbGFuY2VcIik7XG5jb25zdCB7IGJ1aWxkQ2FwaXRhbFRpbWVsaW5lIH0gPSByZXF1aXJlKFwiLi4vYnVkZ2V0L3RpbWVsaW5lXCIpO1xuXG4vLyBcdTI1MDBcdTI1MDAgR3JhaW4gY2FudmFzIFx1MjAxNCBwaXhlbC1sZXZlbCBub2lzZSAocG9ydGVkIGZyb20gUmVhY3QgR3JhaW5DYW52YXMpIFx1MjUwMFx1MjUwMFxuZnVuY3Rpb24gcGFpbnRHcmFpbkNhbnZhcyhjb250YWluZXIsIHcsIGgpIHtcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgY2FudmFzLmNsYXNzTmFtZSA9IFwicGMtZ3JhaW4tY2FudmFzXCI7XG4gIGNhbnZhcy53aWR0aCAgPSB3ICogMjsgIC8vIDJ4IGZvciByZXRpbmFcbiAgY2FudmFzLmhlaWdodCA9IGggKiAyO1xuICBjYW52YXMuc3R5bGUud2lkdGggID0gdyArIFwicHhcIjtcbiAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGggKyBcInB4XCI7XG5cbiAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgaWYgKCFjdHgpIHJldHVybjtcblxuICBjb25zdCBjdyA9IGNhbnZhcy53aWR0aCwgY2ggPSBjYW52YXMuaGVpZ2h0O1xuICBjb25zdCBpbWFnZURhdGEgPSBjdHguY3JlYXRlSW1hZ2VEYXRhKGN3LCBjaCk7XG4gIGNvbnN0IGQgPSBpbWFnZURhdGEuZGF0YTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGQubGVuZ3RoOyBpICs9IDQpIHtcbiAgICBjb25zdCBweSA9IE1hdGguZmxvb3IoaSAvIDQgLyBjdyk7XG4gICAgY29uc3QgcHggPSAoaSAvIDQpICUgY3c7XG4gICAgY29uc3QgbnkgPSBweSAvIGNoO1xuXG4gICAgLy8gR3JhaW4gZmFkZXMgaW4gZnJvbSAzMCUgaGVpZ2h0IGFuZCBmYWRlcyBvdXQgYXQgODUlXG4gICAgY29uc3QgZmFkZUluICA9IE1hdGgubWF4KDAsIChueSAtIDAuMykgLyAwLjUpO1xuICAgIGNvbnN0IGZhZGVPdXQgPSBNYXRoLm1heCgwLCAxIC0gKG55IC0gMC44NSkgLyAwLjE1KTtcbiAgICBjb25zdCBncmFpblN0cmVuZ3RoID0gTWF0aC5taW4oZmFkZUluLCBmYWRlT3V0KTtcblxuICAgIGlmIChncmFpblN0cmVuZ3RoID4gMCAmJiBNYXRoLnJhbmRvbSgpIDwgZ3JhaW5TdHJlbmd0aCAqIDAuMjUpIHtcbiAgICAgIGNvbnN0IGJyaWdodG5lc3MgPSBNYXRoLnJhbmRvbSgpICogMTQwICsgNjA7XG4gICAgICBjb25zdCBpc1RpbnRlZCA9IE1hdGgucmFuZG9tKCkgPiAwLjQ7XG4gICAgICBpZiAoaXNUaW50ZWQpIHtcbiAgICAgICAgLy8gVGVhbC1ncmVlbiB0aW50ZWQgcGFydGljbGVcbiAgICAgICAgZFtpXSAgICAgPSBicmlnaHRuZXNzICogMC4zO1xuICAgICAgICBkW2kgKyAxXSA9IGJyaWdodG5lc3MgKiAwLjc7XG4gICAgICAgIGRbaSArIDJdID0gYnJpZ2h0bmVzcyAqIDAuNDtcbiAgICAgICAgZFtpICsgM10gPSBNYXRoLmZsb29yKGdyYWluU3RyZW5ndGggKiAoMjUgKyBNYXRoLnJhbmRvbSgpICogNDApKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5ldXRyYWwgd2FybSBwYXJ0aWNsZVxuICAgICAgICBkW2ldICAgICA9IGJyaWdodG5lc3MgKiAwLjU7XG4gICAgICAgIGRbaSArIDFdID0gYnJpZ2h0bmVzcyAqIDAuNztcbiAgICAgICAgZFtpICsgMl0gPSBicmlnaHRuZXNzICogMC41NTtcbiAgICAgICAgZFtpICsgM10gPSBNYXRoLmZsb29yKGdyYWluU3RyZW5ndGggKiAoMTIgKyBNYXRoLnJhbmRvbSgpICogMjUpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTdWJ0bGUgZm9sZCBoaWdobGlnaHRzIGZvciBleHRyYSBkZXB0aFxuICAgIGNvbnN0IGZvbGQxQ2VudGVyID0gMC41NTtcbiAgICBjb25zdCBmb2xkMSA9IE1hdGgubWF4KDAsIDEgLSBNYXRoLmFicyhueSAtIGZvbGQxQ2VudGVyKSAvIDAuMDQpO1xuICAgIGNvbnN0IGZvbGQxWCA9IHB4IC8gY3c7XG4gICAgY29uc3QgZm9sZDFYRmFkZSA9IGZvbGQxWCA+IDAuMTUgJiYgZm9sZDFYIDwgMC41XG4gICAgICA/IE1hdGguc2luKChmb2xkMVggLSAwLjE1KSAvIDAuMzUgKiBNYXRoLlBJKSA6IDA7XG4gICAgY29uc3QgZm9sZDJDZW50ZXIgPSAwLjc7XG4gICAgY29uc3QgZm9sZDIgPSBNYXRoLm1heCgwLCAxIC0gTWF0aC5hYnMobnkgLSBmb2xkMkNlbnRlcikgLyAwLjAzKTtcbiAgICBjb25zdCBmb2xkMlhGYWRlID0gZm9sZDFYID4gMC4zICYmIGZvbGQxWCA8IDAuN1xuICAgICAgPyBNYXRoLnNpbigoZm9sZDFYIC0gMC4zKSAvIDAuNCAqIE1hdGguUEkpIDogMDtcbiAgICBjb25zdCBmb2xkSW50ZW5zaXR5ID0gZm9sZDEgKiBmb2xkMVhGYWRlICogMC4xOCArIGZvbGQyICogZm9sZDJYRmFkZSAqIDAuMTQ7XG5cbiAgICBpZiAoZm9sZEludGVuc2l0eSA+IDAuMDEpIHtcbiAgICAgIGRbaV0gICAgID0gTWF0aC5taW4oMjU1LCBkW2ldICsgMTIwICogZm9sZEludGVuc2l0eSk7XG4gICAgICBkW2kgKyAxXSA9IE1hdGgubWluKDI1NSwgZFtpICsgMV0gKyAxODAgKiBmb2xkSW50ZW5zaXR5KTtcbiAgICAgIGRbaSArIDJdID0gTWF0aC5taW4oMjU1LCBkW2kgKyAyXSArIDEzMCAqIGZvbGRJbnRlbnNpdHkpO1xuICAgICAgZFtpICsgM10gPSBNYXRoLm1heChkW2kgKyAzXSwgTWF0aC5mbG9vcihmb2xkSW50ZW5zaXR5ICogMjU1KSk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FudmFzKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwIEludGVycG9sYXRlIHNwYXJzZSBkYXRhIGludG8gc21vb3RoIGN1cnZlIChjbGVhbiBsaW5lYXIsIG5vIHN5bnRoZXRpYyBub2lzZSkgXHUyNTAwXHUyNTAwXG5mdW5jdGlvbiBpbnRlcnBvbGF0ZVNtb290aChwb2ludHMpIHtcbiAgaWYgKHBvaW50cy5sZW5ndGggPCAyKSByZXR1cm4gcG9pbnRzLm1hcCgocCwgaSkgPT4gKHtcbiAgICAuLi5wLCBpc1JlYWw6IHRydWUsIHJlYWxJZHg6IGksIHJlYWxEYXRlOiBwLmRhdGUsIHJlYWxWYWx1ZTogcC52YWx1ZVxuICB9KSk7XG5cbiAgY29uc3QgdG90YWxTdGVwcyA9IDEyMDtcbiAgY29uc3Qgb3V0ID0gW107XG5cbiAgZm9yIChsZXQgcyA9IDA7IHMgPD0gdG90YWxTdGVwczsgcysrKSB7XG4gICAgY29uc3QgdCA9IHMgLyB0b3RhbFN0ZXBzO1xuICAgIGNvbnN0IHJlYWxUID0gdCAqIChwb2ludHMubGVuZ3RoIC0gMSk7XG4gICAgY29uc3QgaWR4MCA9IE1hdGgubWluKE1hdGguZmxvb3IocmVhbFQpLCBwb2ludHMubGVuZ3RoIC0gMik7XG4gICAgY29uc3QgZnJhYyA9IHJlYWxUIC0gaWR4MDtcbiAgICBjb25zdCB2YWx1ZSA9IHBvaW50c1tpZHgwXS52YWx1ZSArIChwb2ludHNbaWR4MCArIDFdLnZhbHVlIC0gcG9pbnRzW2lkeDBdLnZhbHVlKSAqIGZyYWM7XG5cbiAgICBjb25zdCBuZWFyZXN0UmVhbCA9IE1hdGgucm91bmQocmVhbFQpO1xuICAgIGNvbnN0IGlzT25SZWFsID0gTWF0aC5hYnMocmVhbFQgLSBuZWFyZXN0UmVhbCkgPCAwLjUgLyAocG9pbnRzLmxlbmd0aCAtIDEpO1xuICAgIGNvbnN0IHJwID0gaXNPblJlYWwgPyBwb2ludHNbbmVhcmVzdFJlYWxdIDogbnVsbDtcblxuICAgIG91dC5wdXNoKHtcbiAgICAgIGRhdGU6IHJwID8gcnAuZGF0ZSA6IHBvaW50c1tpZHgwXS5kYXRlLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgaXNSZWFsOiAhIXJwLFxuICAgICAgcmVhbElkeDogcnAgPyBuZWFyZXN0UmVhbCA6IC0xLFxuICAgICAgcmVhbERhdGU6IHJwID8gcnAuZGF0ZSA6IG51bGwsXG4gICAgICByZWFsVmFsdWU6IHJwID8gcnAudmFsdWUgOiBudWxsLFxuICAgIH0pO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBHcm93dGggY2hhcnQgXHUyMDE0IGFyZWEgZ3JhZGllbnQgKyBncmFpbiBjYW52YXMgKyB0aGluIGxpbmUgXHUyNTAwXHUyNTAwXG5mdW5jdGlvbiByZW5kZXJHcm93dGhDaGFydChjb250YWluZXIsIHBvaW50cywgc3ltLCBwZXJpb2RNb250aHMpIHtcbiAgY29uc3QgVyA9IDgwMCwgSCA9IDI1NjtcbiAgY29uc3QgUEFEID0geyB0b3A6IDEwLCByaWdodDogMCwgYm90dG9tOiAzNiwgbGVmdDogMCB9O1xuICBjb25zdCBjVyA9IFc7XG4gIGNvbnN0IGNIID0gSCAtIFBBRC50b3AgLSBQQUQuYm90dG9tO1xuICBjb25zdCBucyA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcbiAgY29uc3QgdWlkID0gRGF0ZS5ub3coKTtcblxuICAvLyBJbnRlcnBvbGF0ZSBpbnRvIHNtb290aCBmbHVpZCB3YXZlXG4gIGNvbnN0IHdhdmUgPSBpbnRlcnBvbGF0ZVNtb290aChwb2ludHMpO1xuXG4gIGNvbnN0IHZhbHMgPSB3YXZlLm1hcChwID0+IHAudmFsdWUpO1xuICBjb25zdCBkYXRhTWluID0gTWF0aC5taW4oLi4udmFscyk7XG4gIGNvbnN0IGRhdGFNYXggPSBNYXRoLm1heCguLi52YWxzKTtcbiAgY29uc3QgZGF0YVJhbmdlID0gZGF0YU1heCAtIGRhdGFNaW4gfHwgZGF0YU1heCAqIDAuMSB8fCAxO1xuICAvLyBQb3NpdGlvbiB3YXZlIHNvIGl0IG9jY3VwaWVzIHJvdWdobHkgdGhlIHRvcCA0MC02MCUgb2YgY2hhcnQgaGVpZ2h0XG4gIC8vIFRoaXMgbGVhdmVzIHZpc2libGUgZ3JhZGllbnQgZmlsbCBiZWxvdyBhbmQgc3BhY2UgYWJvdmUgcGVha3NcbiAgY29uc3QgbWluViA9IGRhdGFNaW4gLSBkYXRhUmFuZ2UgKiAxLjI7ICAvLyBwdXNoIGZsb29yIHdlbGwgYmVsb3cgZGF0YVxuICBjb25zdCBtYXhWID0gZGF0YU1heCArIGRhdGFSYW5nZSAqIDAuMzsgIC8vIHNtYWxsIGhlYWRyb29tIGFib3ZlXG4gIGNvbnN0IHJhbmdlID0gbWF4ViAtIG1pblYgfHwgMTtcblxuICBjb25zdCB4T2YgPSAoaSkgPT4gKGkgLyBNYXRoLm1heCh3YXZlLmxlbmd0aCAtIDEsIDEpKSAqIGNXO1xuICBjb25zdCB5T2YgPSAodikgPT4gUEFELnRvcCArIGNIIC0gKCh2IC0gbWluVikgLyByYW5nZSkgKiBjSDtcbiAgY29uc3QgYm90dG9tWSA9IEg7XG5cbiAgLy8gQnVpbGQgQ2F0bXVsbC1Sb20gc3BsaW5lIFx1MjE5MiBjdWJpYyBiZXppZXIgZm9yIHBlcmZlY3RseSBzbW9vdGggY3VydmVcbiAgLy8gQ2F0bXVsbC1Sb20gZ3VhcmFudGVlcyBDMSBjb250aW51aXR5IChubyBraW5rcyBhdCBqdW5jdGlvbnMpXG4gIGNvbnN0IHd4ID0gd2F2ZS5tYXAoKF8sIGkpID0+IHhPZihpKSk7XG4gIGNvbnN0IHd5ID0gd2F2ZS5tYXAocCA9PiB5T2YocC52YWx1ZSkpO1xuICBjb25zdCBuID0gd2F2ZS5sZW5ndGg7XG4gIGNvbnN0IGFscGhhID0gMSAvIDY7IC8vIHRlbnNpb24gZmFjdG9yXG5cbiAgbGV0IGxpbmVEID0gYE0ke3d4WzBdfSwke3d5WzBdfWA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbiAtIDE7IGkrKykge1xuICAgIGNvbnN0IHAwID0gaSA+IDAgPyBpIC0gMSA6IDA7XG4gICAgY29uc3QgcDMgPSBpICsgMiA8IG4gPyBpICsgMiA6IG4gLSAxO1xuXG4gICAgY29uc3QgY3AxeCA9IHd4W2ldICAgICArICh3eFtpICsgMV0gLSB3eFtwMF0pICogYWxwaGE7XG4gICAgY29uc3QgY3AxeSA9IHd5W2ldICAgICArICh3eVtpICsgMV0gLSB3eVtwMF0pICogYWxwaGE7XG4gICAgY29uc3QgY3AyeCA9IHd4W2kgKyAxXSAtICh3eFtwM10gICAgLSB3eFtpXSkgICAqIGFscGhhO1xuICAgIGNvbnN0IGNwMnkgPSB3eVtpICsgMV0gLSAod3lbcDNdICAgIC0gd3lbaV0pICAgKiBhbHBoYTtcblxuICAgIGxpbmVEICs9IGAgQyR7Y3AxeH0sJHtjcDF5fSAke2NwMnh9LCR7Y3AyeX0gJHt3eFtpKzFdfSwke3d5W2krMV19YDtcbiAgfVxuICBjb25zdCBhcmVhRCA9IGxpbmVEICsgYCBMJHtjV30sJHtib3R0b21ZfSBMMCwke2JvdHRvbVl9IFpgO1xuXG4gIC8vIFNWRyBcdTIwMTQgc3RyZXRjaGVzIHRvIGZpbGwgY29udGFpbmVyIChubyBhc3BlY3QgcmF0aW8gY29uc3RyYWludHMpXG4gIGNvbnN0IHN2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucywgXCJzdmdcIik7XG4gIHN2Zy5zZXRBdHRyaWJ1dGUoXCJ2aWV3Qm94XCIsIGAwIDAgJHtXfSAke0h9YCk7XG4gIHN2Zy5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInBjLWdyb3d0aC1zdmdcIik7XG4gIHN2Zy5zZXRBdHRyaWJ1dGUoXCJwcmVzZXJ2ZUFzcGVjdFJhdGlvXCIsIFwibm9uZVwiKTtcblxuICAvLyBBcmVhIGdyYWRpZW50XG4gIGNvbnN0IGRlZnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsIFwiZGVmc1wiKTtcbiAgY29uc3QgZ3JhZElkID0gXCJhZ1wiICsgdWlkO1xuICBjb25zdCBncmFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLCBcImxpbmVhckdyYWRpZW50XCIpO1xuICBncmFkLnNldEF0dHJpYnV0ZShcImlkXCIsIGdyYWRJZCk7XG4gIGdyYWQuc2V0QXR0cmlidXRlKFwieDFcIiwgXCIwXCIpOyBncmFkLnNldEF0dHJpYnV0ZShcInkxXCIsIFwiMFwiKTtcbiAgZ3JhZC5zZXRBdHRyaWJ1dGUoXCJ4MlwiLCBcIjBcIik7IGdyYWQuc2V0QXR0cmlidXRlKFwieTJcIiwgXCIxXCIpO1xuICBjb25zdCBzdG9wcyA9IFtcbiAgICBbXCIwJVwiLCAgIFwiaHNsKDE1NSwgMzUlLCA0NSUpXCIsIFwiMC41NVwiXSxcbiAgICBbXCIzNSVcIiwgIFwiaHNsKDE1NSwgMjglLCAzMCUpXCIsIFwiMC4zMFwiXSxcbiAgICBbXCI3MCVcIiwgIFwiaHNsKDE1NSwgMjAlLCAxOCUpXCIsIFwiMC4xMFwiXSxcbiAgICBbXCIxMDAlXCIsIFwiaHNsKDI0MCwgMTUlLCA0JSlcIiwgIFwiMFwiXSxcbiAgXTtcbiAgZm9yIChjb25zdCBbb2ZmLCBjb2xvciwgb3BdIG9mIHN0b3BzKSB7XG4gICAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucywgXCJzdG9wXCIpO1xuICAgIHMuc2V0QXR0cmlidXRlKFwib2Zmc2V0XCIsIG9mZik7XG4gICAgcy5zZXRBdHRyaWJ1dGUoXCJzdG9wLWNvbG9yXCIsIGNvbG9yKTtcbiAgICBzLnNldEF0dHJpYnV0ZShcInN0b3Atb3BhY2l0eVwiLCBvcCk7XG4gICAgZ3JhZC5hcHBlbmRDaGlsZChzKTtcbiAgfVxuICBkZWZzLmFwcGVuZENoaWxkKGdyYWQpO1xuICBzdmcuYXBwZW5kQ2hpbGQoZGVmcyk7XG5cbiAgLy8gQXJlYSBmaWxsXG4gIGNvbnN0IGFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsIFwicGF0aFwiKTtcbiAgYXJlYS5zZXRBdHRyaWJ1dGUoXCJkXCIsIGFyZWFEKTtcbiAgYXJlYS5zZXRBdHRyaWJ1dGUoXCJmaWxsXCIsIGB1cmwoIyR7Z3JhZElkfSlgKTtcbiAgYXJlYS5zZXRBdHRyaWJ1dGUoXCJzdHJva2VcIiwgXCJub25lXCIpO1xuICBzdmcuYXBwZW5kQ2hpbGQoYXJlYSk7XG5cbiAgLy8gTGluZSBcdTIwMTQgdGhpbiBlZGdlXG4gIGNvbnN0IGxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsIFwicGF0aFwiKTtcbiAgbGluZS5zZXRBdHRyaWJ1dGUoXCJkXCIsIGxpbmVEKTtcbiAgbGluZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInBjLWdyb3d0aC1saW5lXCIpO1xuICBzdmcuYXBwZW5kQ2hpbGQobGluZSk7XG5cbiAgLy8gWC1heGlzIGxhYmVscyBcdTIwMTQgZXZlbmx5IHNwYWNlZCwgZml4ZWRcbiAgLy8gMTJNIG1vZGU6IGFsbCAxMiBtb250aHMgSkFOLi5ERUNcbiAgLy8gQUxMIG1vZGU6IHllYXIgbGFiZWxzICgyMDI0LCAyMDI1LCAyMDI2Li4uKVxuICBjb25zdCBNTkFNRVMgPSBbXCJKQU5cIixcIkZFQlwiLFwiTUFSXCIsXCJBUFJcIixcIk1BWVwiLFwiSlVOXCIsXCJKVUxcIixcIkFVR1wiLFwiU0VQXCIsXCJPQ1RcIixcIk5PVlwiLFwiREVDXCJdO1xuICBjb25zdCBsYWJlbFBhZCA9IDMwOyAvLyBweCBmcm9tIGVkZ2VzXG4gIGlmIChwZXJpb2RNb250aHMgPiAwKSB7XG4gICAgLy8gTW9udGggdmlldyBcdTIwMTQgc2hvdyBhbGwgMTIgbW9udGhzIGV2ZW5seSBzcGFjZWRcbiAgICBmb3IgKGxldCBtID0gMDsgbSA8IDEyOyBtKyspIHtcbiAgICAgIGNvbnN0IHggPSBsYWJlbFBhZCArIChtIC8gMTEpICogKGNXIC0gbGFiZWxQYWQgKiAyKTtcbiAgICAgIGNvbnN0IGxibCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucywgXCJ0ZXh0XCIpO1xuICAgICAgbGJsLnNldEF0dHJpYnV0ZShcInhcIiwgeCk7XG4gICAgICBsYmwuc2V0QXR0cmlidXRlKFwieVwiLCBIIC0gMTIpO1xuICAgICAgbGJsLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwicGMtZ3Jvd3RoLW1vbnRoLWxhYmVsXCIpO1xuICAgICAgbGJsLnRleHRDb250ZW50ID0gTU5BTUVTW21dO1xuICAgICAgc3ZnLmFwcGVuZENoaWxkKGxibCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIEFMTCBtb2RlIFx1MjAxNCBzaG93IHllYXIgbGFiZWxzXG4gICAgY29uc3QgZmlyc3REYXRlID0gcG9pbnRzWzBdLmRhdGU7XG4gICAgY29uc3QgbGFzdERhdGUgID0gcG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXS5kYXRlO1xuICAgIGNvbnN0IGZpcnN0WWVhciA9IHBhcnNlSW50KGZpcnN0RGF0ZS5zbGljZSgwLCA0KSk7XG4gICAgY29uc3QgbGFzdFllYXIgID0gcGFyc2VJbnQobGFzdERhdGUuc2xpY2UoMCwgNCkpO1xuICAgIGNvbnN0IHllYXJzID0gW107XG4gICAgZm9yIChsZXQgeSA9IGZpcnN0WWVhcjsgeSA8PSBsYXN0WWVhcjsgeSsrKSB5ZWFycy5wdXNoKHkpO1xuICAgIGlmICh5ZWFycy5sZW5ndGggPCAyKSB5ZWFycy5wdXNoKGxhc3RZZWFyKTsgLy8gYXQgbGVhc3QgMiBsYWJlbHNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHllYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB4ID0gbGFiZWxQYWQgKyAoaSAvIE1hdGgubWF4KHllYXJzLmxlbmd0aCAtIDEsIDEpKSAqIChjVyAtIGxhYmVsUGFkICogMik7XG4gICAgICBjb25zdCBsYmwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsIFwidGV4dFwiKTtcbiAgICAgIGxibC5zZXRBdHRyaWJ1dGUoXCJ4XCIsIHgpO1xuICAgICAgbGJsLnNldEF0dHJpYnV0ZShcInlcIiwgSCAtIDEyKTtcbiAgICAgIGxibC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInBjLWdyb3d0aC1tb250aC1sYWJlbFwiKTtcbiAgICAgIGxibC50ZXh0Q29udGVudCA9IFN0cmluZyh5ZWFyc1tpXSk7XG4gICAgICBzdmcuYXBwZW5kQ2hpbGQobGJsKTtcbiAgICB9XG4gIH1cblxuICAvLyBEb3QgKG5vIHZlcnRpY2FsIGxpbmUgXHUyMDE0IHJlZmVyZW5jZSBkb2Vzbid0IGhhdmUgb25lKVxuICBjb25zdCBkb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsIFwiY2lyY2xlXCIpO1xuICBkb3Quc2V0QXR0cmlidXRlKFwiclwiLCBcIjRcIik7XG4gIGRvdC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcInBjLWdyb3d0aC1kb3RcIik7XG4gIGRvdC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIHN2Zy5hcHBlbmRDaGlsZChkb3QpO1xuXG4gIC8vIEhpdCBhcmVhXG4gIGNvbnN0IGhpdEFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsIFwicmVjdFwiKTtcbiAgaGl0QXJlYS5zZXRBdHRyaWJ1dGUoXCJ4XCIsIFwiMFwiKTsgaGl0QXJlYS5zZXRBdHRyaWJ1dGUoXCJ5XCIsIFwiMFwiKTtcbiAgaGl0QXJlYS5zZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiLCBXKTsgaGl0QXJlYS5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgSCk7XG4gIGhpdEFyZWEuc2V0QXR0cmlidXRlKFwiZmlsbFwiLCBcInRyYW5zcGFyZW50XCIpO1xuICBoaXRBcmVhLnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xuICBzdmcuYXBwZW5kQ2hpbGQoaGl0QXJlYSk7XG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHN2Zyk7XG5cbiAgLy8gR3JhaW4gY2FudmFzXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgY29uc3QgcmVjdCA9IHN2Zy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBpZiAocmVjdC53aWR0aCA+IDAgJiYgcmVjdC5oZWlnaHQgPiAwKSB7XG4gICAgICBwYWludEdyYWluQ2FudmFzKGNvbnRhaW5lciwgTWF0aC5yb3VuZChyZWN0LndpZHRoKSwgTWF0aC5yb3VuZChyZWN0LmhlaWdodCkpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gVG9vbHRpcFxuICBjb25zdCB0b29sdGlwID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1ncm93dGgtdG9vbHRpcFwiIH0pO1xuICB0b29sdGlwLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblxuICBjb25zdCBmbXRWYWwgPSAodikgPT4gdiA+PSAxMDAwMDAwID8gYCR7Zm10KHYgLyAxMDAwMDAwLCAyKX1NYCA6IGZtdCh2KTtcbiAgY29uc3QgZm10RCA9IChkKSA9PiB7XG4gICAgY29uc3QgcGFydHMgPSBkLnNwbGl0KFwiLVwiKTtcbiAgICBpZiAocGFydHMubGVuZ3RoIDwgMykgcmV0dXJuIGQ7XG4gICAgY29uc3QgbW9udGhzID0gW1wiSkFOXCIsXCJGRUJcIixcIk1BUlwiLFwiQVBSXCIsXCJNQVlcIixcIkpVTlwiLFwiSlVMXCIsXCJBVUdcIixcIlNFUFwiLFwiT0NUXCIsXCJOT1ZcIixcIkRFQ1wiXTtcbiAgICByZXR1cm4gbW9udGhzW3BhcnNlSW50KHBhcnRzWzFdKSAtIDFdO1xuICB9O1xuXG4gIC8vIFByZWNvbXB1dGUgY29vcmRpbmF0ZXMgZm9yIHdhdmUgcG9pbnRzXG4gIGNvbnN0IHdhdmVDb29yZHMgPSB3YXZlLm1hcCgocCwgaSkgPT4gKHsgeDogeE9mKGkpLCB5OiB5T2YocC52YWx1ZSkgfSkpO1xuICBjb25zdCBQUk9YID0gMjA7XG5cbiAgZnVuY3Rpb24gbmVhcmVzdElkeChtb3VzZVgpIHtcbiAgICBjb25zdCBzdmdSZWN0ID0gc3ZnLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHNjYWxlWCA9IFcgLyBzdmdSZWN0LndpZHRoO1xuICAgIGNvbnN0IHN2Z1ggPSAobW91c2VYIC0gc3ZnUmVjdC5sZWZ0KSAqIHNjYWxlWDtcbiAgICBsZXQgYmVzdCA9IDAsIGJlc3REaXN0ID0gSW5maW5pdHk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3YXZlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZCA9IE1hdGguYWJzKHdhdmVDb29yZHNbaV0ueCAtIHN2Z1gpO1xuICAgICAgaWYgKGRkIDwgYmVzdERpc3QpIHsgYmVzdERpc3QgPSBkZDsgYmVzdCA9IGk7IH1cbiAgICB9XG4gICAgcmV0dXJuIGJlc3Q7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93RG90KGlkeCkge1xuICAgIGNvbnN0IGN4ID0gd2F2ZUNvb3Jkc1tpZHhdLngsIGN5ID0gd2F2ZUNvb3Jkc1tpZHhdLnk7XG4gICAgY29uc3Qgd3AgPSB3YXZlW2lkeF07XG4gICAgLy8gU2hvdyByZWFsIHZhbHVlIGlmIHRoaXMgaXMgYSByZWFsIHBvaW50LCBvdGhlcndpc2Ugc2hvdyBpbnRlcnBvbGF0ZWRcbiAgICBjb25zdCBkaXNwVmFsID0gd3AucmVhbFZhbHVlICE9IG51bGwgPyB3cC5yZWFsVmFsdWUgOiB3cC52YWx1ZTtcbiAgICBjb25zdCBkaXNwRGF0ZSA9IHdwLnJlYWxEYXRlIHx8IHdwLmRhdGU7XG5cbiAgICBkb3Quc2V0QXR0cmlidXRlKFwiY3hcIiwgY3gpOyBkb3Quc2V0QXR0cmlidXRlKFwiY3lcIiwgY3kpO1xuICAgIGRvdC5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcblxuICAgIHRvb2x0aXAuZW1wdHkoKTtcbiAgICB0b29sdGlwLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJwYy1ncm93dGgtdHQtZGF0ZVwiLCB0ZXh0OiBmbXREKGRpc3BEYXRlKSB9KTtcbiAgICB0b29sdGlwLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJwYy1ncm93dGgtdHQtdmFsXCIsIHRleHQ6IGAke3N5bX0ke2ZtdFZhbChkaXNwVmFsKX1gIH0pO1xuICAgIHRvb2x0aXAuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblxuICAgIGNvbnN0IHN2Z1JlY3QgPSBzdmcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgY29udGFpbmVyUmVjdCA9IGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBkb3RTY3JlZW5YID0gc3ZnUmVjdC5sZWZ0ICsgKGN4IC8gVykgKiBzdmdSZWN0LndpZHRoIC0gY29udGFpbmVyUmVjdC5sZWZ0O1xuICAgIGNvbnN0IGRvdFNjcmVlblkgPSBzdmdSZWN0LnRvcCArIChjeSAvIEgpICogc3ZnUmVjdC5oZWlnaHQgLSBjb250YWluZXJSZWN0LnRvcDtcblxuICAgIGxldCB0eCA9IGRvdFNjcmVlblggKyAxNDtcbiAgICBsZXQgdHkgPSBkb3RTY3JlZW5ZIC0gNTA7XG4gICAgaWYgKHR4ICsgMTQwID4gY29udGFpbmVyUmVjdC53aWR0aCkgdHggPSBkb3RTY3JlZW5YIC0gMTUwO1xuICAgIGlmICh0eSA8IDApIHR5ID0gZG90U2NyZWVuWSArIDIwO1xuICAgIHRvb2x0aXAuc3R5bGUubGVmdCA9IHR4ICsgXCJweFwiO1xuICAgIHRvb2x0aXAuc3R5bGUudG9wICA9IHR5ICsgXCJweFwiO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZURvdCgpIHtcbiAgICBkb3Quc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIHRvb2x0aXAuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICB9XG5cbiAgaGl0QXJlYS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChlKSA9PiB7XG4gICAgY29uc3Qgc3ZnUmVjdCA9IHN2Zy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBzY2FsZVkgPSBIIC8gc3ZnUmVjdC5oZWlnaHQ7XG4gICAgY29uc3Qgc3ZnWSA9IChlLmNsaWVudFkgLSBzdmdSZWN0LnRvcCkgKiBzY2FsZVk7XG4gICAgY29uc3QgaWR4ID0gbmVhcmVzdElkeChlLmNsaWVudFgpO1xuICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMoc3ZnWSAtIHdhdmVDb29yZHNbaWR4XS55KTtcbiAgICBpZiAoZHkgPCBQUk9YKSB7XG4gICAgICBoaXRBcmVhLnN0eWxlLmN1cnNvciA9IFwiY3Jvc3NoYWlyXCI7XG4gICAgICBzaG93RG90KGlkeCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpdEFyZWEuc3R5bGUuY3Vyc29yID0gXCJkZWZhdWx0XCI7XG4gICAgICBoaWRlRG90KCk7XG4gICAgfVxuICB9KTtcbiAgaGl0QXJlYS5hZGRFdmVudExpc3RlbmVyKFwibW91c2VsZWF2ZVwiLCBoaWRlRG90KTtcbiAgaGl0QXJlYS5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChlLnRvdWNoZXNbMF0pIHNob3dEb3QobmVhcmVzdElkeChlLnRvdWNoZXNbMF0uY2xpZW50WCkpO1xuICB9KTtcbiAgaGl0QXJlYS5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgaGlkZURvdCk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNhcGl0YWxDaGFydChjb250YWluZXIsIGhpc3RvcnksIGFzc2V0cywgc2V0dGluZ3MsIGJ1ZGdldCwgYWNjb3VudHMsIGFsbExlZGdlcikge1xuICBjb25zdCBzeW0gPSBzZXR0aW5ncy5ob21lQ3VycmVuY3lTeW1ib2w7XG4gIGNvbnN0IGludmVzdGVkQ2FwaXRhbCA9IGFzc2V0cy5yZWR1Y2UoKHMsIGEpID0+IHMgKyBhLmN1cnJlbnRWYWx1ZVJ1YiwgMCk7XG4gIGNvbnN0IGxpcXVpZFRvdGFsID0gZ2V0TGlxdWlkVG90YWwoc2V0dGluZ3MsIGFjY291bnRzLCBhbGxMZWRnZXIpO1xuICBjb25zdCB0b3RhbENhcGl0YWwgPSBpbnZlc3RlZENhcGl0YWwgKyBsaXF1aWRUb3RhbDtcblxuICBsZXQgYWxsUG9pbnRzID0gaGlzdG9yeS5sZW5ndGggPj0gMiA/IFsuLi5oaXN0b3J5XSA6IGJ1aWxkQ2FwaXRhbFRpbWVsaW5lKGFzc2V0cywgc2V0dGluZ3MpO1xuXG4gIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcblxuICBpZiAoYWxsUG9pbnRzLmxlbmd0aCA8IDIgJiYgaW52ZXN0ZWRDYXBpdGFsID4gMCkge1xuICAgIGNvbnN0IGFnbyA9IG5ldyBEYXRlKCk7IGFnby5zZXRNb250aChhZ28uZ2V0TW9udGgoKSAtIDYpO1xuICAgIGFsbFBvaW50cyA9IFtcbiAgICAgIHsgZGF0ZTogYWdvLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApLCB2YWx1ZTogaW52ZXN0ZWRDYXBpdGFsICogMC45NSB9LFxuICAgICAgeyBkYXRlOiB0b2RheSwgdmFsdWU6IGludmVzdGVkQ2FwaXRhbCB9LFxuICAgIF07XG4gIH1cbiAgaWYgKGFsbFBvaW50cy5sZW5ndGggPCAyKSByZXR1cm47XG5cbiAgLy8gXHUyNTAwXHUyNTAwIENvbXB1dGUgcG9ydGZvbGlvIG1ldHJpY3MgXHUyNTAwXHUyNTAwXG4gIGNvbnN0IHBvcnRmb2xpb1ZhbHVlID0gaW52ZXN0ZWRDYXBpdGFsOyAvLyBvbmx5IGluc3RydW1lbnRzLCBubyBsaXF1aWRcbiAgY29uc3QgbmV0UHJvZml0ID0gYXNzZXRzLnJlZHVjZSgocywgYSkgPT4gcyArICh0b051bShhLnBsQW1vdW50KSAqIGEuZngpLCAwKTtcbiAgY29uc3QgcGFzc2l2ZVRvdGFsID0gYXNzZXRzLnJlZHVjZSgocywgYSkgPT4gcyArICh0b051bShhLnBhc3NpdmVJbmNvbWVUb3QpICogYS5meCksIDApO1xuICBjb25zdCB0b3RhbFJldHVybiA9IG5ldFByb2ZpdCArIHBhc3NpdmVUb3RhbDtcbiAgY29uc3QgdG90YWxJbnZCYXNpcyA9IGFzc2V0cy5yZWR1Y2UoKHMsIGEpID0+IHtcbiAgICBjb25zdCBiYXNpcyA9IGEuY3VycmVudFZhbHVlUnViIC0gKHRvTnVtKGEucGxBbW91bnQpICogYS5meCk7XG4gICAgcmV0dXJuIHMgKyBNYXRoLm1heChiYXNpcywgMCk7XG4gIH0sIDApO1xuICBjb25zdCByZXR1cm5QY3QgPSB0b3RhbEludkJhc2lzID4gMCA/ICh0b3RhbFJldHVybiAvIHRvdGFsSW52QmFzaXMpICogMTAwIDogMDtcblxuICAvLyBVc2Ugb25seSBpbnZlc3RlZCBjYXBpdGFsIGZvciB0aW1lbGluZSAobm90IGxpcXVpZCBwb29scylcbiAgaWYgKGludmVzdGVkQ2FwaXRhbCA+IDApIHtcbiAgICBjb25zdCB0b2RheU1vbnRoID0gdG9kYXkuc2xpY2UoMCwgNyk7XG4gICAgY29uc3QgdGlkeCA9IGFsbFBvaW50cy5maW5kSW5kZXgocCA9PiBwLmRhdGUuc3RhcnRzV2l0aCh0b2RheU1vbnRoKSk7XG4gICAgaWYgKHRpZHggPj0gMCkgYWxsUG9pbnRzW3RpZHhdID0geyBkYXRlOiB0b2RheSwgdmFsdWU6IGludmVzdGVkQ2FwaXRhbCB9O1xuICAgIGVsc2UgYWxsUG9pbnRzLnB1c2goeyBkYXRlOiB0b2RheSwgdmFsdWU6IGludmVzdGVkQ2FwaXRhbCB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBHbGFzcyBjYXJkIFx1MjUwMFx1MjUwMFxuICBjb25zdCBjYXJkID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1jYXAtY2FyZFwiIH0pO1xuXG4gIC8vIEhlcm8gc2VjdGlvblxuICBjb25zdCBoZXJvID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtY2FwLWhlcm9cIiB9KTtcbiAgaGVyby5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwicGMtY2FwLWhlcm8tbGFiZWxcIiwgdGV4dDogXCJQT1JURk9MSU9cIiB9KTtcblxuICAvLyBQb3J0Zm9saW8gdmFsdWVcbiAgY29uc3QgdmFsRGl2ID0gaGVyby5jcmVhdGVEaXYoeyBjbHM6IFwicGMtY2FwLWhlcm8tcm93XCIgfSk7XG4gIHZhbERpdi5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtY2FwLWhlcm8tdmFsdWVcIiwgdGV4dDogYCR7c3ltfSR7Zm10KHBvcnRmb2xpb1ZhbHVlLCAwKX1gIH0pO1xuXG4gIC8vIE1ldHJpY3Mgcm93OiByZXR1cm4gKyBwYXNzaXZlIGluY29tZVxuICBjb25zdCBtZXRyaWNzUm93ID0gaGVyby5jcmVhdGVEaXYoeyBjbHM6IFwicGMtY2FwLW1ldHJpY3NcIiB9KTtcbiAgY29uc3QgYXJyb3cgPSB0b3RhbFJldHVybiA+PSAwID8gXCJcXHUyMTk3XCIgOiBcIlxcdTIxOThcIjtcbiAgbWV0cmljc1Jvdy5jcmVhdGVFbChcInNwYW5cIiwge1xuICAgIGNsczogYHBjLWNhcC1tZXRyaWMtcmV0dXJuICR7dG90YWxSZXR1cm4gPj0gMCA/IFwicGMtcG9zXCIgOiBcInBjLW5lZ1wifWAsXG4gICAgdGV4dDogYCR7YXJyb3d9ICR7dG90YWxSZXR1cm4gPj0gMCA/IFwiK1wiIDogXCJcIn0ke2ZtdCh0b3RhbFJldHVybiwgMCl9ICR7c3ltfSAgKCR7cmV0dXJuUGN0ID49IDAgPyBcIitcIiA6IFwiXCJ9JHtmbXQocmV0dXJuUGN0LCAxKX0lKWAsXG4gIH0pO1xuICBpZiAocGFzc2l2ZVRvdGFsID4gMCkge1xuICAgIG1ldHJpY3NSb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgIGNsczogXCJwYy1jYXAtbWV0cmljLXBhc3NpdmVcIixcbiAgICAgIHRleHQ6IGBcXHVEODNEXFx1RENCMCAke2ZtdChwYXNzaXZlVG90YWwsIDApfSAke3N5bX0gaW5jb21lYCxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFBlcmlvZCBidXR0b25zXG4gIGNvbnN0IHBlcmlvZEJhciA9IGhlcm8uY3JlYXRlRGl2KHsgY2xzOiBcInBjLXBlcmlvZC1iYXJcIiB9KTtcbiAgY29uc3QgcGVyaW9kcyA9IFtcbiAgICB7IGxhYmVsOiBcIjEyTVwiLCBtb250aHM6IDEyIH0sXG4gICAgeyBsYWJlbDogXCJBTExcIiwgbW9udGhzOiAwIH0sXG4gIF07XG4gIGxldCBhY3RpdmVQZXJpb2QgPSBcIkFMTFwiO1xuXG4gIC8vIENoYXJ0IGFyZWEgKHJlbGF0aXZlIGNvbnRhaW5lciBmb3IgU1ZHICsgZ3JhaW4gY2FudmFzICsgdG9vbHRpcClcbiAgY29uc3QgY2hhcnRBcmVhID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtY2hhcnQtYXJlYVwiIH0pO1xuXG4gIGZ1bmN0aW9uIGZpbHRlclBvaW50cyhtb250aHMpIHtcbiAgICBpZiAobW9udGhzID09PSAwKSByZXR1cm4gYWxsUG9pbnRzO1xuICAgIGNvbnN0IGN1dG9mZiA9IG5ldyBEYXRlKCk7XG4gICAgY3V0b2ZmLnNldE1vbnRoKGN1dG9mZi5nZXRNb250aCgpIC0gbW9udGhzKTtcbiAgICBjb25zdCBjdXRTdHIgPSBjdXRvZmYudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCk7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBhbGxQb2ludHMuZmlsdGVyKHAgPT4gcC5kYXRlID49IGN1dFN0cik7XG4gICAgcmV0dXJuIGZpbHRlcmVkLmxlbmd0aCA+PSAyID8gZmlsdGVyZWQgOiBhbGxQb2ludHM7XG4gIH1cblxuICBmdW5jdGlvbiBkcmF3KHBlcmlvZE1vbnRocykge1xuICAgIGNoYXJ0QXJlYS5lbXB0eSgpO1xuICAgIHJlbmRlckdyb3d0aENoYXJ0KGNoYXJ0QXJlYSwgZmlsdGVyUG9pbnRzKHBlcmlvZE1vbnRocyksIHN5bSwgcGVyaW9kTW9udGhzKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgcCBvZiBwZXJpb2RzKSB7XG4gICAgY29uc3QgYnRuID0gcGVyaW9kQmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIGNsczogYHBjLXBlcmlvZC1idG4gJHtwLmxhYmVsID09PSBhY3RpdmVQZXJpb2QgPyBcInBjLXBlcmlvZC1idG4tLWFjdGl2ZVwiIDogXCJcIn1gLFxuICAgICAgdGV4dDogcC5sYWJlbCxcbiAgICB9KTtcbiAgICBidG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIGFjdGl2ZVBlcmlvZCA9IHAubGFiZWw7XG4gICAgICBwZXJpb2RCYXIucXVlcnlTZWxlY3RvckFsbChcIi5wYy1wZXJpb2QtYnRuXCIpLmZvckVhY2goYiA9PiBiLmNsYXNzTGlzdC5yZW1vdmUoXCJwYy1wZXJpb2QtYnRuLS1hY3RpdmVcIikpO1xuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoXCJwYy1wZXJpb2QtYnRuLS1hY3RpdmVcIik7XG4gICAgICBkcmF3KHAubW9udGhzKTtcbiAgICB9O1xuICB9XG5cbiAgZHJhdygwKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHBhaW50R3JhaW5DYW52YXMsIGludGVycG9sYXRlU21vb3RoLCByZW5kZXJHcm93dGhDaGFydCwgcmVuZGVyQ2FwaXRhbENoYXJ0IH07XG4iLCAiY29uc3QgeyBNb2RhbCB9ID0gcmVxdWlyZShcIm9ic2lkaWFuXCIpO1xuY29uc3QgeyBzaG93Tm90aWNlLCBraWxsV2hlZWxDaGFuZ2UgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxuY2xhc3MgU3RyYXRlZ3lNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoYXBwLCBwbHVnaW4sIG9uU2F2ZSkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgdGhpcy5vblNhdmUgPSBvblNhdmU7XG4gIH1cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5hZGRDbGFzcyhcInBjLXN0cmF0ZWd5LW1vZGFsXCIpO1xuXG4gICAgY29uc3QgcyA9IHRoaXMucGx1Z2luLnNldHRpbmdzO1xuICAgIGNvbnN0IHdyYXAgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLXN0cmF0ZWd5LWZvcm1cIiB9KTtcbiAgICB3cmFwLmNyZWF0ZUVsKFwiaDJcIiwgeyBjbHM6IFwicGMtc3RyYXRlZ3ktdGl0bGVcIiwgdGV4dDogXCJTdHJhdGVneSBUYXJnZXRzXCIgfSk7XG4gICAgd3JhcC5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwicGMtc3RyYXRlZ3ktZGVzY1wiLCB0ZXh0OiBcIlNldCB0YXJnZXQgYWxsb2NhdGlvbiBmb3IgZWFjaCBiYXNrZXQuIExlYXZlIGF0IDAgdG8gc2tpcC4gQWxlcnRzIGFwcGVhciBoZXJlIGFuZCBpbiByZXBvcnRzIHdoZW4gYWxsb2NhdGlvbiBkcmlmdHMgbW9yZSB0aGFuIDUlIGZyb20gdGFyZ2V0LlwiIH0pO1xuXG4gICAgY29uc3QgZmllbGRzID0gW1xuICAgICAgeyBrZXk6IFwidGFyZ2V0Q29yZVwiLCAgICBsYWJlbDogXCJcdUQ4M0NcdURGREIgQ29yZSAoYm9uZHMsIEVURnMsIGluZGV4KVwiLCB2YWw6IHMudGFyZ2V0Q29yZSB8fCAwIH0sXG4gICAgICB7IGtleTogXCJ0YXJnZXRGbGFzaFwiLCAgIGxhYmVsOiBcIlx1MjZBMSBGbGFzaCAoc2hhcmVzLCBjcnlwdG8pXCIsIHZhbDogcy50YXJnZXRGbGFzaCB8fCAwIH0sXG4gICAgICB7IGtleTogXCJ0YXJnZXRSZXNlcnZlXCIsIGxhYmVsOiBcIlx1RDgzRFx1REVFMSBSZXNlcnZlIChkZXBvc2l0cywgY2FzaClcIiwgdmFsOiBzLnRhcmdldFJlc2VydmUgfHwgMCB9LFxuICAgIF07XG5cbiAgICBjb25zdCBpbnB1dHMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGYgb2YgZmllbGRzKSB7XG4gICAgICBjb25zdCByb3cgPSB3cmFwLmNyZWF0ZURpdih7IGNsczogXCJwYy1zdHJhdGVneS1yb3dcIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcInBjLXN0cmF0ZWd5LWxhYmVsXCIsIHRleHQ6IGYubGFiZWwgfSk7XG4gICAgICBjb25zdCBpbnAgPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IGNsczogXCJwYy1zdHJhdGVneS1pbnB1dFwiLCB0eXBlOiBcIm51bWJlclwiLCBhdHRyOiB7IG1pbjogXCIwXCIsIG1heDogXCIxMDBcIiwgc3RlcDogXCIxXCIgfSB9KTtcbiAgICAgIGlucC52YWx1ZSA9IFN0cmluZyhmLnZhbCk7XG4gICAgICBraWxsV2hlZWxDaGFuZ2UoaW5wKTtcbiAgICAgIGlucHV0c1tmLmtleV0gPSBpbnA7XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLXN0cmF0ZWd5LXBjdFwiLCB0ZXh0OiBcIiVcIiB9KTtcbiAgICB9XG5cbiAgICAvLyBUb3RhbCBpbmRpY2F0b3JcbiAgICBjb25zdCB0b3RhbFJvdyA9IHdyYXAuY3JlYXRlRGl2KHsgY2xzOiBcInBjLXN0cmF0ZWd5LXRvdGFsLXJvd1wiIH0pO1xuICAgIHRvdGFsUm93LmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiVG90YWxcIiB9KTtcbiAgICBjb25zdCB0b3RhbFZhbCA9IHRvdGFsUm93LmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1zdHJhdGVneS10b3RhbC12YWxcIiB9KTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVRvdGFsKCkge1xuICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICBmb3IgKGNvbnN0IGYgb2YgZmllbGRzKSBzdW0gKz0gcGFyc2VJbnQoaW5wdXRzW2Yua2V5XS52YWx1ZSkgfHwgMDtcbiAgICAgIHRvdGFsVmFsLnRleHRDb250ZW50ID0gYCR7c3VtfSVgO1xuICAgICAgdG90YWxWYWwuY2xhc3NMaXN0LnRvZ2dsZShcInBjLWNocS1uZWdcIiwgc3VtICE9PSAxMDAgJiYgc3VtICE9PSAwKTtcbiAgICAgIHRvdGFsVmFsLmNsYXNzTGlzdC50b2dnbGUoXCJwYy1jaHEtcG9zXCIsIHN1bSA9PT0gMTAwKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBmIG9mIGZpZWxkcykgaW5wdXRzW2Yua2V5XS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgdXBkYXRlVG90YWwpO1xuICAgIHVwZGF0ZVRvdGFsKCk7XG5cbiAgICAvLyBTaG93IGN1cnJlbnQgYWxlcnRzIGluc2lkZSBtb2RhbFxuICAgIGNvbnN0IGFsZXJ0V3JhcCA9IHdyYXAuY3JlYXRlRGl2KHsgY2xzOiBcInBjLXN0cmF0ZWd5LWFsZXJ0c1wiIH0pO1xuICAgIC8vIFdlIG5lZWQgY3VycmVudCBiYXNrZXQgZGF0YSBcdTIwMTQgcmVhZCBmcm9tIHNldHRpbmdzICsgYXBwcm94aW1hdGVcbiAgICBjb25zdCBoYXNUYXJnZXRzID0gKHMudGFyZ2V0Q29yZSB8fCAwKSArIChzLnRhcmdldEZsYXNoIHx8IDApICsgKHMudGFyZ2V0UmVzZXJ2ZSB8fCAwKSA+IDA7XG4gICAgaWYgKGhhc1RhcmdldHMpIHtcbiAgICAgIGFsZXJ0V3JhcC5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwicGMtc3RyYXRlZ3ktYWxlcnQtdGl0bGVcIiwgdGV4dDogXCJDdXJyZW50IEFsZXJ0c1wiIH0pO1xuICAgICAgYWxlcnRXcmFwLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJwYy1zdHJhdGVneS1hbGVydC1ub3RlXCIsIHRleHQ6IFwiUmVmcmVzaCBkYXNoYm9hcmQgdG8gc2VlIHVwZGF0ZWQgYWxlcnRzIGFmdGVyIHNhdmluZy5cIiB9KTtcbiAgICB9XG5cbiAgICAvLyBCdXR0b25zXG4gICAgY29uc3QgYnRuUm93ID0gd3JhcC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtc3RyYXRlZ3ktYnRuLXJvd1wiIH0pO1xuICAgIGNvbnN0IGNsZWFyQnRuID0gYnRuUm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcInBjLXN0cmF0ZWd5LWNsZWFyLWJ0blwiLCB0ZXh0OiBcIkNsZWFyIHRhcmdldHNcIiB9KTtcbiAgICBjbGVhckJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGFyZ2V0Q29yZSA9IDA7XG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXJnZXRGbGFzaCA9IDA7XG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50YXJnZXRSZXNlcnZlID0gMDtcbiAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0cmF0ZWd5RW5hYmxlZCA9IGZhbHNlO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICBzaG93Tm90aWNlKFwiU3RyYXRlZ3kgdGFyZ2V0cyBjbGVhcmVkXCIpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgaWYgKHRoaXMub25TYXZlKSB0aGlzLm9uU2F2ZSgpO1xuICAgIH07XG5cbiAgICBjb25zdCBzYXZlQnRuID0gYnRuUm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcIm1vZC1jdGFcIiwgdGV4dDogXCJTYXZlIFN0cmF0ZWd5XCIgfSk7XG4gICAgc2F2ZUJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgbGV0IGFueVNldCA9IGZhbHNlO1xuICAgICAgZm9yIChjb25zdCBmIG9mIGZpZWxkcykge1xuICAgICAgICBjb25zdCB2ID0gcGFyc2VJbnQoaW5wdXRzW2Yua2V5XS52YWx1ZSkgfHwgMDtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3NbZi5rZXldID0gdjtcbiAgICAgICAgaWYgKHYgPiAwKSBhbnlTZXQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3RyYXRlZ3lFbmFibGVkID0gYW55U2V0O1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICBzaG93Tm90aWNlKFwiXHUyNzEzIFN0cmF0ZWd5IHRhcmdldHMgc2F2ZWRcIik7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICBpZiAodGhpcy5vblNhdmUpIHRoaXMub25TYXZlKCk7XG4gICAgfTtcbiAgfVxuICBvbkNsb3NlKCkgeyB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpOyB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyBTdHJhdGVneU1vZGFsIH07XG4iLCAiY29uc3QgeyBmbXQgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcbmNvbnN0IHsgQkFTS0VUX01FVEEsIGJ1aWxkQmFza2V0RGF0YSB9ID0gcmVxdWlyZShcIi4uL2J1ZGdldC9iYXNrZXRzXCIpO1xuXG4vLyBcdTI1MDBcdTI1MDAgUmVuZGVyIEJhc2tldHMgXHUyMDE0IGNvbXBhY3QgMy1jb2x1bW4gXHUyNTAwXHUyNTAwXG5mdW5jdGlvbiByZW5kZXJCYXNrZXRzKGNvbnRhaW5lciwgYXNzZXRzLCBzZXR0aW5ncywgc3ltLCBhcHAsIHBsdWdpbiwgYWNjb3VudHMsIGFsbExlZGdlcikge1xuICAvLyBMYXp5IHJlcXVpcmUgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jeVxuICBjb25zdCB7IFN0cmF0ZWd5TW9kYWwgfSA9IHJlcXVpcmUoXCIuLi9tb2RhbHMvc3RyYXRlZ3lcIik7XG5cbiAgY29uc3QgeyBiYXNrZXRzLCB0b3RhbCB9ID0gYnVpbGRCYXNrZXREYXRhKGFzc2V0cywgc2V0dGluZ3MsIGFjY291bnRzLCBhbGxMZWRnZXIpO1xuICBjb25zdCBoYXNUYXJnZXRzID0gKHNldHRpbmdzLnRhcmdldENvcmUgfHwgMCkgKyAoc2V0dGluZ3MudGFyZ2V0Rmxhc2ggfHwgMCkgKyAoc2V0dGluZ3MudGFyZ2V0UmVzZXJ2ZSB8fCAwKSA+IDA7XG5cbiAgY29uc3Qgd3JhcCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYmFza2V0c1wiIH0pO1xuXG4gIC8vIEhlYWRlciByb3cgd2l0aCBzdHJhdGVneSBidXR0b25cbiAgY29uc3QgaGRyID0gd3JhcC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYmFza2V0cy1oZWFkZXJcIiB9KTtcbiAgaGRyLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLWJhc2tldHMtdGl0bGVcIiwgdGV4dDogXCJBbGxvY2F0aW9uXCIgfSk7XG4gIGNvbnN0IHN0cmF0QnRuID0gaGRyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcInBjLXN0cmF0ZWd5LWJ0blwiLCB0ZXh0OiBcIlxcdTI2OTkgU3RyYXRlZ3lcIiB9KTtcbiAgc3RyYXRCdG4ub25jbGljayA9ICgpID0+IG5ldyBTdHJhdGVneU1vZGFsKGFwcCwgcGx1Z2luLCAoKSA9PiB7fSkub3BlbigpO1xuXG4gIC8vIDMtY29sdW1uIGdyaWRcbiAgY29uc3QgZ3JpZCA9IHdyYXAuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWJhc2tldHMtZ3JpZFwiIH0pO1xuXG4gIGZvciAoY29uc3QgW2tleSwgbWV0YV0gb2YgT2JqZWN0LmVudHJpZXMoQkFTS0VUX01FVEEpKSB7XG4gICAgY29uc3QgYmsgPSBiYXNrZXRzW2tleV07XG4gICAgY29uc3Qgb25UYXJnZXQgPSBoYXNUYXJnZXRzICYmIGJrLnRhcmdldCA+IDAgJiYgTWF0aC5hYnMoYmsucGN0IC0gYmsudGFyZ2V0KSA8IDU7XG4gICAgY29uc3Qgb3ZlciAgICAgPSBoYXNUYXJnZXRzICYmIGJrLnRhcmdldCA+IDAgJiYgYmsucGN0ID4gYmsudGFyZ2V0O1xuXG4gICAgY29uc3QgcGFuZWwgPSBncmlkLmNyZWF0ZURpdih7IGNsczogXCJwYy1iYXNrZXQtcGFuZWxcIiB9KTtcblxuICAgIGNvbnN0IHBoZHIgPSBwYW5lbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYmFza2V0LWhkclwiIH0pO1xuICAgIHBoZHIuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLWJhc2tldC1pY29uXCIsIHRleHQ6IG1ldGEuaWNvbiB9KTtcbiAgICBwaGRyLmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1iYXNrZXQtbmFtZVwiLCB0ZXh0OiBtZXRhLmxhYmVsIH0pO1xuXG4gICAgY29uc3QgcGN0Q2xzID0gaGFzVGFyZ2V0cyAmJiBiay50YXJnZXQgPiAwXG4gICAgICA/IChvblRhcmdldCA/IFwicGMtYmFza2V0LXBjdCBwYy1iYXNrZXQtcGN0LS1va1wiIDogb3ZlciA/IFwicGMtYmFza2V0LXBjdCBwYy1iYXNrZXQtcGN0LS1vdmVyXCIgOiBcInBjLWJhc2tldC1wY3RcIilcbiAgICAgIDogXCJwYy1iYXNrZXQtcGN0XCI7XG4gICAgcGFuZWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IHBjdENscywgdGV4dDogYCR7Zm10KGJrLnBjdCwgMSl9JWAgfSk7XG5cbiAgICBpZiAoaGFzVGFyZ2V0cyAmJiBiay50YXJnZXQgPiAwKSB7XG4gICAgICBjb25zdCBiYXJXcmFwID0gcGFuZWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWJhc2tldC1iYXItd3JhcFwiIH0pO1xuICAgICAgY29uc3QgYmFyRmlsbCA9IGJhcldyYXAuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWJhc2tldC1iYXItZmlsbFwiIH0pO1xuICAgICAgYmFyRmlsbC5zdHlsZS53aWR0aCA9IGAke01hdGgubWluKChiay5wY3QgLyBiay50YXJnZXQpICogMTAwLCAxMDApfSVgO1xuICAgICAgYmFyRmlsbC5zdHlsZS5iYWNrZ3JvdW5kID0gbWV0YS5jb2xvcjtcbiAgICAgIGJhcldyYXAuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWJhc2tldC1iYXItbWFya2VyXCIgfSkuc3R5bGUubGVmdCA9IFwiMTAwJVwiO1xuICAgIH1cblxuICAgIGNvbnN0IGZvb3QgPSBwYW5lbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYmFza2V0LWZvb3RcIiB9KTtcbiAgICBmb290LmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1iYXNrZXQtdmFsdWVcIiwgdGV4dDogYCR7Zm10KGJrLnZhbHVlKX0gJHtzeW19YCB9KTtcbiAgICBpZiAoaGFzVGFyZ2V0cyAmJiBiay50YXJnZXQgPiAwKSB7XG4gICAgICBmb290LmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1iYXNrZXQtdGFyZ2V0XCIsIHRleHQ6IGAvICR7YmsudGFyZ2V0fSVgIH0pO1xuICAgIH1cblxuICAgIHBhbmVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLWJhc2tldC1jb3VudFwiLCB0ZXh0OiBgJHtiay5hc3NldHMubGVuZ3RofSBpbnN0cnVtZW50JHtiay5hc3NldHMubGVuZ3RoICE9PSAxID8gXCJzXCIgOiBcIlwifWAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHJlbmRlckJhc2tldHMgfTtcbiIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIEFTU0VUIFBBUlNFUlxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmNvbnN0IHsgdG9OdW0gfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxuZnVuY3Rpb24gcGFyc2VBc3NldEJvZHkoYm9keVRleHQpIHtcbiAgY29uc3QgbGluZXMgPSBib2R5VGV4dC5zcGxpdChcIlxcblwiKS5tYXAobCA9PiBsLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pO1xuXG4gIGxldCBjdXJyZW50UXR5ICAgICAgPSAwO1xuICBsZXQgdG90YWxJbnZlc3RlZCAgID0gMDtcbiAgLy8gY3VycmVudFByaWNlIGlzIHNldCBPTkxZIGJ5IGV4cGxpY2l0IGBwcmljZWAgb3BzIChNT0VYL1lhaG9vIGZldGNoZXIgb3JcbiAgLy8gbWFudWFsIG92ZXJyaWRlKS4gQnV5L3JlaW52ZXN0IHByaWNlcyBhcmUgdHJhbnNhY3Rpb24gcHJpY2VzLCBOT1QgbWFya2V0XG4gIC8vIHF1b3RlcyBcdTIwMTQgdXNpbmcgdGhlbSBhcyBcImN1cnJlbnQgcHJpY2VcIiB5aWVsZHMgbWlzbGVhZGluZyB2YWx1ZXMgd2hlbiB0aGVcbiAgLy8gdXNlciBoYXMgbWl4ZWQtcHJpY2UgZW50cmllcyAoZS5nLiA2N0AxMDYzICsgMUAxNDA3IFx1MjE5MiA2OFx1MDBENzE0MDcpLiBXaGVuIG5vXG4gIC8vIGBwcmljZWAgb3AgZXhpc3RzLCBjdXJyZW50UHJpY2Ugc3RheXMgbnVsbCBhbmQgY3VycmVudFZhbHVlIGZhbGxzIGJhY2sgdG9cbiAgLy8gdG90YWxJbnZlc3RlZCAoaS5lLiBcIndoYXQgeW91IHBhaWRcIiksIHdoaWNoIGlzIG5ldXRyYWwgYW5kIG5vbi1taXNsZWFkaW5nLlxuICBsZXQgY3VycmVudFByaWNlICAgID0gbnVsbDtcbiAgbGV0IHBhc3NpdmVJbmNvbWVUb3QgPSAwO1xuICBsZXQgaW5pdGlhbERhdGUgICAgID0gbnVsbDtcbiAgbGV0IGxhc3RVcGRhdGVkICAgICA9IG51bGw7XG4gIC8vIExhc3QgZGl2LW9wIGRhdGUgXHUyMDE0IHVzZWQgYnkgZGVwb3NpdCBhY2NydWFsIHRvIHN0YXJ0IFwidW5wYWlkIGludGVyZXN0XCJcbiAgLy8gY2xvY2sgZnJvbSB0aGUgbW9zdCByZWNlbnQgcGF5b3V0IGluc3RlYWQgb2YgaW5pdGlhbF9kYXRlLiBXaXRob3V0IHRoaXMsXG4gIC8vIHNpbXBsZS1pbnRlcmVzdCBkZXBvc2l0cyB3aG9zZSBiYW5rIHBheXMgbW9udGhseSB3b3VsZCBkb3VibGUtY291bnRcbiAgLy8gKGN1cnJlbnRWYWx1ZSBncm93cyBmcm9tIGRheSAwLCBidXQgaW50ZXJlc3QgYWxyZWFkeSBtb3ZlZCB0byBjYXJkKS5cbiAgbGV0IGxhc3REaXZEYXRlICAgICA9IG51bGw7XG5cbiAgY29uc3QgY2hyb25vTGluZXMgPSBbLi4ubGluZXNdLnJldmVyc2UoKTtcblxuICBmb3IgKGNvbnN0IGxpbmUgb2YgY2hyb25vTGluZXMpIHtcbiAgICBjb25zdCBwYXJ0cyA9IGxpbmUuaW5jbHVkZXMoXCJ8XCIpXG4gICAgICA/IGxpbmUuc3BsaXQoXCJ8XCIpLm1hcChwID0+IHAudHJpbSgpKVxuICAgICAgOiBsaW5lLnNwbGl0KC9cXHMrLyk7XG5cbiAgICBpZiAocGFydHMubGVuZ3RoIDwgNCkgY29udGludWU7XG5cbiAgICBjb25zdCBkYXRlU3RyID0gcGFydHNbMF07XG4gICAgY29uc3Qgb3AgICAgICA9IHBhcnRzWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgcXR5UmF3ICA9IHBhcnRzWzJdO1xuICAgIGNvbnN0IHZhbFJhdyAgPSBwYXJ0c1szXTtcblxuICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShkYXRlU3RyKTtcbiAgICBpZiAoTnVtYmVyLmlzTmFOKGRhdGUuZ2V0VGltZSgpKSkgY29udGludWU7XG5cbiAgICBpZiAoIWluaXRpYWxEYXRlIHx8IGRhdGUgPCBuZXcgRGF0ZShpbml0aWFsRGF0ZSkpIGluaXRpYWxEYXRlID0gZGF0ZVN0cjtcbiAgICBpZiAoIWxhc3RVcGRhdGVkIHx8IGRhdGUgPiBuZXcgRGF0ZShsYXN0VXBkYXRlZCkpICBsYXN0VXBkYXRlZCA9IGRhdGVTdHI7XG5cbiAgICBjb25zdCBxdHkgPSB0b051bShxdHlSYXcpO1xuICAgIGNvbnN0IHZhbCA9IHRvTnVtKHZhbFJhdyk7XG5cbiAgICBpZiAob3AgPT09IFwiYnV5XCIpIHtcbiAgICAgIGN1cnJlbnRRdHkgICAgKz0gcXR5O1xuICAgICAgdG90YWxJbnZlc3RlZCArPSBxdHkgKiB2YWw7XG4gICAgfSBlbHNlIGlmIChvcCA9PT0gXCJzZWxsXCIpIHtcbiAgICAgIGNvbnN0IGNvc3RQZXJTaGFyZSA9IGN1cnJlbnRRdHkgPiAwID8gdG90YWxJbnZlc3RlZCAvIGN1cnJlbnRRdHkgOiAwO1xuICAgICAgY3VycmVudFF0eSAgICAtPSBxdHk7XG4gICAgICB0b3RhbEludmVzdGVkIC09IHF0eSAqIGNvc3RQZXJTaGFyZTtcbiAgICAgIGlmIChjdXJyZW50UXR5IDwgMCkgY3VycmVudFF0eSA9IDA7XG4gICAgICBpZiAodG90YWxJbnZlc3RlZCA8IDApIHRvdGFsSW52ZXN0ZWQgPSAwO1xuICAgIH0gZWxzZSBpZiAob3AgPT09IFwiZGl2XCIpIHtcbiAgICAgIHBhc3NpdmVJbmNvbWVUb3QgKz0gdmFsO1xuICAgICAgaWYgKCFsYXN0RGl2RGF0ZSB8fCBkYXRlU3RyID4gbGFzdERpdkRhdGUpIGxhc3REaXZEYXRlID0gZGF0ZVN0cjtcbiAgICB9IGVsc2UgaWYgKG9wID09PSBcImNhcGl0YWxpemVcIikge1xuICAgICAgLy8gRGVwb3NpdCBpbnRlcmVzdCBjYXBpdGFsaXplZCBpbnRvIHByaW5jaXBhbCBcdTIwMTQgZ3Jvd3MgdG90YWxJbnZlc3RlZFxuICAgICAgLy8gKHNvIGZhbGxiYWNrIGN1cnJlbnRWYWx1ZSByaXNlcykgd2l0aG91dCB0b3VjaGluZyBxdHkuIENvdW50ZWQgYXNcbiAgICAgIC8vIHBhc3NpdmUgaW5jb21lOiBpdCBJUyBhIHBheW91dCwganVzdCByZWludmVzdGVkIGF1dG9tYXRpY2FsbHkuXG4gICAgICAvLyBObyBjYXNoIGZsb3cgXHUyMTkyIG5vIGxlZGdlciBlbnRyeSBmcm9tIHRoZSB0ZW1wbGF0ZSBlbmdpbmUuXG4gICAgICB0b3RhbEludmVzdGVkICs9IHZhbDtcbiAgICAgIHBhc3NpdmVJbmNvbWVUb3QgKz0gdmFsO1xuICAgIH0gZWxzZSBpZiAob3AgPT09IFwicmVpbnZlc3RcIikge1xuICAgICAgY3VycmVudFF0eSAgICArPSBxdHk7XG4gICAgICB0b3RhbEludmVzdGVkICs9IHF0eSAqIHZhbDtcbiAgICB9IGVsc2UgaWYgKG9wID09PSBcInByaWNlXCIpIHtcbiAgICAgIGN1cnJlbnRQcmljZSA9IHZhbDtcbiAgICB9XG4gIH1cblxuICBjb25zdCBhdmdDb3N0ICAgICAgPSBjdXJyZW50UXR5ID4gMCA/IHRvdGFsSW52ZXN0ZWQgLyBjdXJyZW50UXR5IDogMDtcbiAgY29uc3QgY3VycmVudFZhbHVlID0gY3VycmVudFByaWNlICE9IG51bGwgPyBjdXJyZW50UHJpY2UgKiBjdXJyZW50UXR5IDogdG90YWxJbnZlc3RlZDtcbiAgY29uc3QgcGxBbW91bnQgICAgID0gY3VycmVudFZhbHVlIC0gdG90YWxJbnZlc3RlZDtcbiAgY29uc3QgcGxQY3QgICAgICAgID0gdG90YWxJbnZlc3RlZCA+IDAgPyAocGxBbW91bnQgLyB0b3RhbEludmVzdGVkKSAqIDEwMCA6IDA7XG5cbiAgcmV0dXJuIHtcbiAgICBjdXJyZW50UXR5OiAgICAgICBwYXJzZUZsb2F0KGN1cnJlbnRRdHkudG9GaXhlZCg2KSksXG4gICAgYXZnQ29zdDogICAgICAgICAgcGFyc2VGbG9hdChhdmdDb3N0LnRvRml4ZWQoNCkpLFxuICAgIHRvdGFsSW52ZXN0ZWQ6ICAgIHBhcnNlRmxvYXQodG90YWxJbnZlc3RlZC50b0ZpeGVkKDIpKSxcbiAgICBjdXJyZW50UHJpY2U6ICAgICBjdXJyZW50UHJpY2UgIT0gbnVsbCA/IHBhcnNlRmxvYXQoY3VycmVudFByaWNlLnRvRml4ZWQoNCkpIDogbnVsbCxcbiAgICBjdXJyZW50VmFsdWU6ICAgICBwYXJzZUZsb2F0KGN1cnJlbnRWYWx1ZS50b0ZpeGVkKDIpKSxcbiAgICBwbEFtb3VudDogICAgICAgICBwYXJzZUZsb2F0KHBsQW1vdW50LnRvRml4ZWQoMikpLFxuICAgIHBsUGN0OiAgICAgICAgICAgIHBhcnNlRmxvYXQocGxQY3QudG9GaXhlZCgyKSksXG4gICAgcGFzc2l2ZUluY29tZVRvdDogcGFyc2VGbG9hdChwYXNzaXZlSW5jb21lVG90LnRvRml4ZWQoMikpLFxuICAgIGluaXRpYWxEYXRlLFxuICAgIGxhc3RVcGRhdGVkLFxuICAgIGxhc3REaXZEYXRlLFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgcGFyc2VBc3NldEJvZHkgfTtcbiIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIEFTU0VUIFJFQ0FMQyBcdTIwMTQgcmVjb21wdXRlIGZyb250bWF0dGVyIGZyb20gbG9nIGxpbmVzXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgeyBwYXJzZUFzc2V0Qm9keSB9ID0gcmVxdWlyZShcIi4vcGFyc2VyXCIpO1xuY29uc3QgeyB0b051bSB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuXG5hc3luYyBmdW5jdGlvbiByZWNhbGNBc3NldChhcHAsIGZpbGUpIHtcbiAgY29uc3QgcmF3ICAgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbiAgY29uc3QgZm1FbmQgPSByYXcuaW5kZXhPZihcIi0tLVwiLCAzKTtcbiAgaWYgKGZtRW5kID09PSAtMSkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgYm9keSAgPSByYXcuc2xpY2UoZm1FbmQgKyAzKS5yZXBsYWNlKC9eXFxuLywgXCJcIik7XG4gIGNvbnN0IHN0YXRzID0gcGFyc2VBc3NldEJvZHkoYm9keSk7XG4gIGNvbnN0IGZtICAgID0gYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpPy5mcm9udG1hdHRlciA/PyB7fTtcblxuICAvLyBEZXBvc2l0IGFjY3J1YWwgXHUyMDE0IHNpbXBsZSBpbnRlcmVzdCwgZGF5cy8zNjUuIE92ZXJyaWRlcyBjdXJyZW50VmFsdWUvUCZMLlxuICAvLyBObyBjb21wb3VuZGluZywgbm8gZnJlcSwgbm8gbWF0dXJpdHkuIFVzZXIgcmVjb3JkcyBhY3R1YWwgY291cG9uIHBheW91dHNcbiAgLy8gdmlhIG1hbnVhbCBkaXYgb3AgaWYgdGhlIGRlcG9zaXQgcGF5cyBtb250aGx5L3F1YXJ0ZXJseSB0byBhIGNhcmQuXG4gIGlmIChTdHJpbmcoZm0udHlwZSkudG9Mb3dlckNhc2UoKSA9PT0gXCJkZXBvc2l0XCIgJiYgdG9OdW0oZm0uaW50ZXJlc3RfcmF0ZSkgPiAwKSB7XG4gICAgY29uc3QgcHJpbmNpcGFsID0gc3RhdHMudG90YWxJbnZlc3RlZDtcbiAgICBjb25zdCByYXRlICAgICAgPSB0b051bShmbS5pbnRlcmVzdF9yYXRlKSAvIDEwMDtcbiAgICAvLyBTdGFydCBhY2NydWFsIGNsb2NrIGZyb20gbGFzdCBkaXYgcGF5b3V0IChiYW5rIHBhaWQgaW50ZXJlc3QgdG8gY2FyZCksXG4gICAgLy8gZWxzZSBmcm9tIGluaXRpYWxfZGF0ZS4gVGhpcyB3YXkgY29tcG91bmRlZCBkZXBvc2l0cyBncm93IGZyb20gZGF5IDAsXG4gICAgLy8gYW5kIHNpbXBsZS1wYXlvdXQgZGVwb3NpdHMgc2hvdyBvbmx5IFwidW5wYWlkIHlldFwiIGludGVyZXN0LlxuICAgIGNvbnN0IHN0YXJ0RGF0ZSA9IHN0YXRzLmxhc3REaXZEYXRlIHx8IHN0YXRzLmluaXRpYWxEYXRlIHx8IGZtLmluaXRpYWxfZGF0ZTtcbiAgICBpZiAoc3RhcnREYXRlICYmIHByaW5jaXBhbCA+IDApIHtcbiAgICAgIGNvbnN0IGRheXMgPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKFxuICAgICAgICAoRGF0ZS5ub3coKSAtIG5ldyBEYXRlKHN0YXJ0RGF0ZSkuZ2V0VGltZSgpKSAvIDg2NDAwMDAwXG4gICAgICApKTtcbiAgICAgIGNvbnN0IGFjY3J1ZWQgPSBwcmluY2lwYWwgKiByYXRlICogKGRheXMgLyAzNjUpO1xuICAgICAgc3RhdHMuY3VycmVudFZhbHVlID0gcGFyc2VGbG9hdCgocHJpbmNpcGFsICsgYWNjcnVlZCkudG9GaXhlZCgyKSk7XG4gICAgICBzdGF0cy5jdXJyZW50UHJpY2UgPSBzdGF0cy5jdXJyZW50UXR5ID4gMFxuICAgICAgICA/IHBhcnNlRmxvYXQoKHN0YXRzLmN1cnJlbnRWYWx1ZSAvIHN0YXRzLmN1cnJlbnRRdHkpLnRvRml4ZWQoNCkpXG4gICAgICAgIDogbnVsbDtcbiAgICAgIHN0YXRzLnBsQW1vdW50ID0gcGFyc2VGbG9hdChhY2NydWVkLnRvRml4ZWQoMikpO1xuICAgICAgc3RhdHMucGxQY3QgICAgPSBwYXJzZUZsb2F0KCgoYWNjcnVlZCAvIHByaW5jaXBhbCkgKiAxMDApLnRvRml4ZWQoMikpO1xuICAgIH1cbiAgfVxuXG4gIGF3YWl0IGFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIoZmlsZSwgKGZtKSA9PiB7XG4gICAgZm0uY3VycmVudF9xdHkgICAgICA9IHN0YXRzLmN1cnJlbnRRdHk7XG4gICAgZm0uYXZnX2Nvc3QgICAgICAgICA9IHN0YXRzLmF2Z0Nvc3Q7XG4gICAgZm0udG90YWxfaW52ZXN0ZWQgICA9IHN0YXRzLnRvdGFsSW52ZXN0ZWQ7XG4gICAgLy8gUGFyc2VyIGlzIHByaW1hcnkgc291cmNlIGZvciBjdXJyZW50UHJpY2UgKG9ubHkgYHByaWNlYCBvcHMgc2V0IGl0KS5cbiAgICAvLyBObyBmYWxsYmFjayB0byBleGlzdGluZyBmbS5jdXJyZW50X3ByaWNlIFx1MjAxNCB0aGUgb2xkIHBhcnNlciBpbmNvcnJlY3RseVxuICAgIC8vIGNvcGllZCBidXkvcmVpbnZlc3QgdHJhbnNhY3Rpb24gcHJpY2VzIGludG8gY3VycmVudF9wcmljZSwgcHJvZHVjaW5nXG4gICAgLy8gaW5mbGF0ZWQgY3VycmVudF92YWx1ZSBmb3IgYXNzZXRzIGxpa2UgYm9uZHMgd2hlcmUgdHJhbnNhY3Rpb24gcHJpY2VcbiAgICAvLyBcdTIyNjAgbWFya2V0IHF1b3RlLiBXaGVuIGJvZHkgaGFzIG5vIGBwcmljZWAgb3AsIGN1cnJlbnRfcHJpY2UgbXVzdCBiZVxuICAgIC8vIG51bGw7IGN1cnJlbnRWYWx1ZSB0aGVuIGZhbGxzIGJhY2sgdG8gdG90YWxJbnZlc3RlZCAobmV1dHJhbCkuIE5leHRcbiAgICAvLyBcIlVwZGF0ZSBwcmljZXNcIiBydW4gd3JpdGVzIGEgcmVhbCBtYXJrZXQgYHByaWNlYC1vcCBhbmQgZml4ZXMgaXQuXG4gICAgZm0uY3VycmVudF9wcmljZSAgICA9IHN0YXRzLmN1cnJlbnRQcmljZSA/PyBudWxsO1xuICAgIGZtLmN1cnJlbnRfdmFsdWUgICAgPSBzdGF0cy5jdXJyZW50VmFsdWU7XG4gICAgZm0ucGxfYW1vdW50ICAgICAgICA9IHN0YXRzLnBsQW1vdW50O1xuICAgIGZtLnBsX3BjdCAgICAgICAgICAgPSBzdGF0cy5wbFBjdDtcbiAgICBmbS5wYXNzaXZlX2luY29tZV90b3RhbCA9IHN0YXRzLnBhc3NpdmVJbmNvbWVUb3Q7XG4gICAgaWYgKHN0YXRzLmluaXRpYWxEYXRlKSBmbS5pbml0aWFsX2RhdGUgPSBzdGF0cy5pbml0aWFsRGF0ZTtcbiAgICBmbS5sYXN0X3VwZGF0ZWQgICAgID0gc3RhdHMubGFzdFVwZGF0ZWQgPz8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgfSk7XG4gIHJldHVybiBzdGF0cztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHJlY2FsY0Fzc2V0IH07XG4iLCAiLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBQUklDRSBGRVRDSEVSIFx1MjAxNCBNT0VYIChSVUIgYXNzZXRzKSArIFlhaG9vIEZpbmFuY2UgKGludGVybmF0aW9uYWwpXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgeyByZXF1ZXN0VXJsIH0gPSByZXF1aXJlKFwib2JzaWRpYW5cIik7XG5jb25zdCB7IHRvTnVtIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5jb25zdCB7IHJlY2FsY0Fzc2V0IH0gPSByZXF1aXJlKFwiLi9yZWNhbGNcIik7XG5jb25zdCB7IHdyaXRlTGVkZ2VyRW50cmllcyB9ID0gcmVxdWlyZShcIi4uL2xlZGdlci9pb1wiKTtcblxuZnVuY3Rpb24gcmVzb2x2ZUFwaVRpY2tlcihmbSwgZmlsZW5hbWUpIHtcbiAgaWYgKGZtLnRpY2tlcikgcmV0dXJuIFN0cmluZyhmbS50aWNrZXIpLnRyaW0oKTtcbiAgY29uc3QgbmFtZSA9IFN0cmluZyhmbS5uYW1lIHx8IGZpbGVuYW1lKS50cmltKCk7XG4gIHJldHVybiBuYW1lLnJlcGxhY2UoL0ArJC8sIFwiXCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBtb2V4RGlzY292ZXJNYXJrZXQodGlja2VyKSB7XG4gIGNvbnN0IHVybCA9IGBodHRwczovL2lzcy5tb2V4LmNvbS9pc3Mvc2VjdXJpdGllcy8ke2VuY29kZVVSSUNvbXBvbmVudCh0aWNrZXIpfS5qc29uYFxuICAgICsgYD9pc3MubWV0YT1vZmYmaXNzLm9ubHk9Ym9hcmRzJmJvYXJkcy5jb2x1bW5zPXNlY2lkLGJvYXJkaWQsbWFya2V0LGVuZ2luZSxpc19wcmltYXJ5YDtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgcmVxdWVzdFVybCh7IHVybCwgbWV0aG9kOiBcIkdFVFwiIH0pO1xuICAgIGNvbnN0IHJvd3MgPSByZXNwLmpzb24/LmJvYXJkcz8uZGF0YTtcbiAgICBpZiAoIXJvd3MgfHwgcm93cy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICAgIGNvbnN0IHByaW1hcnkgPSByb3dzLmZpbmQociA9PiByWzRdID09PSAxKSB8fCByb3dzWzBdO1xuICAgIHJldHVybiB7IGVuZ2luZTogcHJpbWFyeVszXSwgbWFya2V0OiBwcmltYXJ5WzJdLCBib2FyZDogcHJpbWFyeVsxXSB9O1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS53YXJuKGBbUENdIE1PRVggZGlzY292ZXIgZmFpbGVkIGZvciAke3RpY2tlcn06YCwgZSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbW9leEdldEZhY2VWYWx1ZSh0aWNrZXIpIHtcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vaXNzLm1vZXguY29tL2lzcy9zZWN1cml0aWVzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KHRpY2tlcil9Lmpzb25gXG4gICAgKyBgP2lzcy5tZXRhPW9mZiZpc3Mub25seT1kZXNjcmlwdGlvbiZkZXNjcmlwdGlvbi5jb2x1bW5zPW5hbWUsdmFsdWVgO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXF1ZXN0VXJsKHsgdXJsLCBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gICAgY29uc3Qgcm93cyA9IHJlc3AuanNvbj8uZGVzY3JpcHRpb24/LmRhdGE7XG4gICAgaWYgKCFyb3dzKSByZXR1cm4gMTAwMDtcbiAgICBjb25zdCBmdiA9IHJvd3MuZmluZChyID0+IHJbMF0gPT09IFwiRkFDRVZBTFVFXCIpO1xuICAgIHJldHVybiBmdiA/IHRvTnVtKGZ2WzFdKSA6IDEwMDA7XG4gIH0gY2F0Y2ggKF8pIHtcbiAgICByZXR1cm4gMTAwMDtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaE1vZXhQcmljZXModGlja2VyLCBmcm9tRGF0ZSwgbWFya2V0SW5mbykge1xuICBpZiAoIW1hcmtldEluZm8pIHJldHVybiBbXTtcbiAgY29uc3QgeyBlbmdpbmUsIG1hcmtldCwgYm9hcmQgfSA9IG1hcmtldEluZm87XG4gIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgY29uc3QgZnJvbSA9IGZyb21EYXRlIHx8IFwiMjAyMC0wMS0wMVwiO1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vaXNzLm1vZXguY29tL2lzcy9oaXN0b3J5L2VuZ2luZXMvJHtlbmdpbmV9L21hcmtldHMvJHttYXJrZXR9L2JvYXJkcy8ke2JvYXJkfS9zZWN1cml0aWVzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KHRpY2tlcil9Lmpzb25gXG4gICAgICArIGA/ZnJvbT0ke2Zyb219JnRpbGw9MjA5OS0xMi0zMSZzdGFydD0ke3N0YXJ0fSZpc3MubWV0YT1vZmYmaGlzdG9yeS5jb2x1bW5zPVRSQURFREFURSxDTE9TRSxOVU1UUkFERVNgO1xuXG4gICAgbGV0IGRhdGE7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXF1ZXN0VXJsKHsgdXJsLCBtZXRob2Q6IFwiR0VUXCIgfSk7XG4gICAgICBkYXRhID0gcmVzcC5qc29uO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybihgW1BDXSBNT0VYIGZldGNoIGZhaWxlZCBmb3IgJHt0aWNrZXJ9OmAsIGUpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3Qgcm93cyA9IGRhdGE/Lmhpc3Rvcnk/LmRhdGE7XG4gICAgaWYgKCFyb3dzIHx8IHJvd3MubGVuZ3RoID09PSAwKSBicmVhaztcblxuICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgIGNvbnN0IFtkYXRlLCBjbG9zZSwgbnVtVHJhZGVzXSA9IHJvdztcbiAgICAgIGlmIChjbG9zZSAhPSBudWxsICYmIGNsb3NlID4gMCkge1xuICAgICAgICByZXN1bHRzLnB1c2goeyBkYXRlLCBjbG9zZSB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocm93cy5sZW5ndGggPCAxMDApIGJyZWFrO1xuICAgIHN0YXJ0ICs9IDEwMDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaE1vZXhEaXZpZGVuZHModGlja2VyLCBhZnRlckRhdGUpIHtcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vaXNzLm1vZXguY29tL2lzcy9zZWN1cml0aWVzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KHRpY2tlcil9L2RpdmlkZW5kcy5qc29uP2lzcy5tZXRhPW9mZmA7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcbiAgICBjb25zdCByb3dzID0gcmVzcC5qc29uPy5kaXZpZGVuZHM/LmRhdGE7XG4gICAgaWYgKCFyb3dzKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHJvd3NcbiAgICAgIC5maWx0ZXIociA9PiByWzJdID4gYWZ0ZXJEYXRlICYmIHJbM10gIT0gbnVsbCAmJiByWzNdID4gMClcbiAgICAgIC5tYXAociA9PiAoeyBkYXRlOiByWzJdLCBwZXJTaGFyZTogclszXSB9KSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLndhcm4oYFtQQ10gTU9FWCBkaXZpZGVuZHMgZmFpbGVkIGZvciAke3RpY2tlcn06YCwgZSk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoTW9leENvdXBvbnModGlja2VyLCBhZnRlckRhdGUpIHtcbiAgY29uc3QgdXJsID0gYGh0dHBzOi8vaXNzLm1vZXguY29tL2lzcy9zZWN1cml0aWVzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KHRpY2tlcil9L2JvbmRpemF0aW9uLmpzb25gXG4gICAgKyBgP2lzcy5tZXRhPW9mZiZpc3Mub25seT1jb3Vwb25zJmNvdXBvbnMuY29sdW1ucz1jb3Vwb25kYXRlLHZhbHVlX3J1YmA7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcbiAgICBjb25zdCByb3dzID0gcmVzcC5qc29uPy5jb3Vwb25zPy5kYXRhO1xuICAgIGlmICghcm93cykgcmV0dXJuIFtdO1xuICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgICByZXR1cm4gcm93c1xuICAgICAgLmZpbHRlcihyID0+IHJbMF0gPiBhZnRlckRhdGUgJiYgclswXSA8PSB0b2RheSAmJiByWzFdICE9IG51bGwgJiYgclsxXSA+IDApXG4gICAgICAubWFwKHIgPT4gKHsgZGF0ZTogclswXSwgcGVyQm9uZDogclsxXSB9KSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLndhcm4oYFtQQ10gTU9FWCBjb3Vwb25zIGZhaWxlZCBmb3IgJHt0aWNrZXJ9OmAsIGUpO1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFlhaG9vUHJpY2VzKHRpY2tlciwgZnJvbURhdGUpIHtcbiAgY29uc3QgZnJvbSA9IGZyb21EYXRlID8gTWF0aC5mbG9vcihuZXcgRGF0ZShmcm9tRGF0ZSkuZ2V0VGltZSgpIC8gMTAwMCkgOiAwO1xuICBjb25zdCB0byAgID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG4gIGNvbnN0IHVybCAgPSBgaHR0cHM6Ly9xdWVyeTEuZmluYW5jZS55YWhvby5jb20vdjgvZmluYW5jZS9jaGFydC8ke2VuY29kZVVSSUNvbXBvbmVudCh0aWNrZXIpfWBcbiAgICArIGA/cGVyaW9kMT0ke2Zyb219JnBlcmlvZDI9JHt0b30maW50ZXJ2YWw9MWQmZXZlbnRzPWRpdmA7XG5cbiAgbGV0IGRhdGE7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHJlcXVlc3RVcmwoeyB1cmwsIG1ldGhvZDogXCJHRVRcIiB9KTtcbiAgICBkYXRhID0gcmVzcC5qc29uO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS53YXJuKGBbUENdIFlhaG9vIGZldGNoIGZhaWxlZCBmb3IgJHt0aWNrZXJ9OmAsIGUpO1xuICAgIHJldHVybiB7IHByaWNlczogW10sIGRpdmlkZW5kczogW10gfTtcbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGRhdGE/LmNoYXJ0Py5yZXN1bHQ/LlswXTtcbiAgaWYgKCFyZXN1bHQpIHJldHVybiB7IHByaWNlczogW10sIGRpdmlkZW5kczogW10gfTtcblxuICBjb25zdCB0aW1lc3RhbXBzID0gcmVzdWx0LnRpbWVzdGFtcCB8fCBbXTtcbiAgY29uc3QgY2xvc2VzICAgICA9IHJlc3VsdC5pbmRpY2F0b3JzPy5xdW90ZT8uWzBdPy5jbG9zZSB8fCBbXTtcbiAgY29uc3QgcHJpY2VzID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aW1lc3RhbXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNsb3Nlc1tpXSA9PSBudWxsKSBjb250aW51ZTtcbiAgICBjb25zdCBkID0gbmV3IERhdGUodGltZXN0YW1wc1tpXSAqIDEwMDApO1xuICAgIGNvbnN0IGRhdGVTdHIgPSBkLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApO1xuICAgIHByaWNlcy5wdXNoKHsgZGF0ZTogZGF0ZVN0ciwgY2xvc2U6IHBhcnNlRmxvYXQoY2xvc2VzW2ldLnRvRml4ZWQoNCkpIH0pO1xuICB9XG5cbiAgY29uc3QgZGl2aWRlbmRzID0gW107XG4gIGNvbnN0IGRpdkV2ZW50cyA9IHJlc3VsdC5ldmVudHM/LmRpdmlkZW5kcztcbiAgaWYgKGRpdkV2ZW50cykge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGRpdkV2ZW50cykpIHtcbiAgICAgIGNvbnN0IGV2ID0gZGl2RXZlbnRzW2tleV07XG4gICAgICBjb25zdCBkID0gbmV3IERhdGUoZXYuZGF0ZSAqIDEwMDApO1xuICAgICAgZGl2aWRlbmRzLnB1c2goe1xuICAgICAgICBkYXRlOiBkLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApLFxuICAgICAgICBwZXJTaGFyZTogcGFyc2VGbG9hdChldi5hbW91bnQudG9GaXhlZCg0KSksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4geyBwcmljZXMsIGRpdmlkZW5kcyB9O1xufVxuXG4vLyBSb3V0aW5nIHJ1bGU6XG4vLyAgIDEuIHR5cGUgPT09IFwiYm9uZFwiICAgICAgICAgICAgXHUyMTkyIE1PRVggIChjb3ZlcnMgXHUwNDM3XHUwNDMwXHUwNDNDXHUwNDM1XHUwNDQ5XHUwNDMwXHUwNDM5XHUwNDNBXHUwNDM4OiBVU0QgZmFjZSB2YWx1ZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUlVCIHNldHRsZW1lbnQsIE1PRVgtb25seSkuXG4vLyAgIDIuIHRpY2tlciBtYXRjaGVzIFJVIElTSU4gICAgIFx1MjE5MiBNT0VYICAoL15SVVxcZHszfVtBLVowLTldKyQvIFx1MjAxNCBnbG9iYWxseSB1bmlxdWUsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldmVyIGNvbGxpZGVzIHdpdGggWWFob28gdGlja2VycykuXG4vLyAgIDMuIGN1cnJlbmN5ID09PSBcIlJVQlwiICAgICAgICAgXHUyMTkyIE1PRVhcbi8vICAgNC4gb3RoZXJ3aXNlICAgICAgICAgICAgICAgICAgXHUyMTkyIFlhaG9vXG5mdW5jdGlvbiBnZXRBc3NldFNvdXJjZShjdXJyZW5jeSwgdHlwZSwgdGlja2VyKSB7XG4gIGlmIChTdHJpbmcodHlwZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpID09PSBcImJvbmRcIikgcmV0dXJuIFwibW9leFwiO1xuICBpZiAodGlja2VyICYmIC9eUlVcXGR7M31bQS1aMC05XSskL2kudGVzdChTdHJpbmcodGlja2VyKSkpIHJldHVybiBcIm1vZXhcIjtcbiAgcmV0dXJuIFN0cmluZyhjdXJyZW5jeSB8fCBcIlwiKS50b1VwcGVyQ2FzZSgpID09PSBcIlJVQlwiID8gXCJtb2V4XCIgOiBcInlhaG9vXCI7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVNpbmdsZUFzc2V0UHJpY2UoYXBwLCBmaWxlLCBzZXR0aW5ncywgc3RhdHVzQ2IpIHtcbiAgY29uc3QgcmF3ICAgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbiAgY29uc3QgZm1FbmQgPSByYXcuaW5kZXhPZihcIi0tLVwiLCAzKTtcbiAgaWYgKGZtRW5kID09PSAtMSkgcmV0dXJuIHsgdXBkYXRlZDogZmFsc2UsIHRpY2tlcjogZmlsZS5iYXNlbmFtZSwgZXJyb3I6IFwibm8gZnJvbnRtYXR0ZXJcIiB9O1xuXG4gIGNvbnN0IGNhY2hlICAgID0gYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICBjb25zdCBmbSAgICAgICA9IGNhY2hlPy5mcm9udG1hdHRlciA/PyB7fTtcbiAgY29uc3QgYXBpVGlja2VyID0gcmVzb2x2ZUFwaVRpY2tlcihmbSwgZmlsZS5iYXNlbmFtZSk7XG4gIGNvbnN0IGN1cnJlbmN5ID0gU3RyaW5nKGZtLmN1cnJlbmN5IHx8IFwiUlVCXCIpLnRvVXBwZXJDYXNlKCk7XG4gIGNvbnN0IHR5cGUgICAgID0gU3RyaW5nKGZtLnR5cGUgfHwgXCJzaGFyZXNcIikudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgbGFzdFVwICAgPSBmbS5sYXN0X3VwZGF0ZWQgfHwgZm0uaW5pdGlhbF9kYXRlIHx8IFwiMjAyMC0wMS0wMVwiO1xuICBjb25zdCBxdHkgICAgICA9IHRvTnVtKGZtLmN1cnJlbnRfcXR5KTtcbiAgY29uc3QgZmFjZVZhbHVlID0gdG9OdW0oZm0uZmFjZV92YWx1ZSkgfHwgMTAwMDtcbiAgLy8gRGl2aWRlbmQgcm91dGluZyBcdTIwMTQgc2VlIGFzc2V0LWNyZWF0ZSBtb2RhbC4gQm9uZHMvZGVwb3NpdHMgYWx3YXlzIGNhc2ggYnkgbmF0dXJlLlxuICBjb25zdCBkaXZQb2xpY3kgICAgID0gU3RyaW5nKGZtLmRpdmlkZW5kX3BvbGljeSB8fCBcImNhc2hcIikudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgZGl2aWRlbmRBY2N0ICA9IGZtLmRpdmlkZW5kX2FjY291bnQgPyBTdHJpbmcoZm0uZGl2aWRlbmRfYWNjb3VudCkgOiBudWxsO1xuICBjb25zdCBhc3NldE5hbWUgICAgID0gU3RyaW5nKGZtLm5hbWUgfHwgZmlsZS5iYXNlbmFtZSk7XG5cbiAgY29uc3QgbmV4dERheSA9IG5ldyBEYXRlKGxhc3RVcCk7XG4gIG5leHREYXkuc2V0RGF0ZShuZXh0RGF5LmdldERhdGUoKSArIDEpO1xuICBjb25zdCBmcm9tRGF0ZSA9IG5leHREYXkudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCk7XG4gIGNvbnN0IHRvZGF5ICAgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcblxuICBpZiAoZnJvbURhdGUgPiB0b2RheSkge1xuICAgIHJldHVybiB7IHVwZGF0ZWQ6IGZhbHNlLCB0aWNrZXI6IGFwaVRpY2tlciwgZXJyb3I6IFwiYWxyZWFkeSB1cCB0byBkYXRlXCIgfTtcbiAgfVxuXG4gIGlmIChzdGF0dXNDYikgc3RhdHVzQ2IoYXBpVGlja2VyKTtcblxuICBjb25zdCBzb3VyY2UgPSBnZXRBc3NldFNvdXJjZShjdXJyZW5jeSwgdHlwZSwgYXBpVGlja2VyKTtcbiAgbGV0IGxhdGVzdFByaWNlID0gbnVsbDtcbiAgLy8gUmljaCBkaXYgcmVjb3JkcyBcdTIwMTQga2VwdCBhcyB7ZGF0ZSx0b3RhbH0gc28gd2UgY2FuIHJvdXRlIHRvIGxlZGdlciBsYXRlci5cbiAgbGV0IG5ld0RpdnMgPSBbXTtcbiAgbGV0IG5ld1ByaWNlTGluZSA9IG51bGw7XG4gIC8vIFByaWNlIHNlcmllcyBmb3IgXCJwcmljZSBvbiBkaXZpZGVuZCBkYXRlXCIgbG9va3VwIGR1cmluZyByZWludmVzdC5cbiAgLy8gRm9yIGJvbmRzIGl0J3Mge2RhdGUsIGNsb3NlJX0gXHUyMDE0IGJ1dCByZWludmVzdCBpcyBibG9ja2VkIGZvciBib25kcyBzbyBub3QgdXNlZC5cbiAgLy8gRm9yIHNoYXJlcyAoTU9FWCArIFlhaG9vKSBpdCdzIHtkYXRlLCBjbG9zZX0gaW4gYXNzZXQgY3VycmVuY3kuXG4gIGxldCBwcmljZXNTZXJpZXMgPSBbXTtcblxuICBpZiAoc291cmNlID09PSBcIm1vZXhcIikge1xuICAgIGNvbnN0IG1hcmtldEluZm8gPSBhd2FpdCBtb2V4RGlzY292ZXJNYXJrZXQoYXBpVGlja2VyKTtcbiAgICBpZiAoIW1hcmtldEluZm8pIHtcbiAgICAgIHJldHVybiB7IHVwZGF0ZWQ6IGZhbHNlLCB0aWNrZXI6IGFwaVRpY2tlciwgZXJyb3I6IFwibm90IGZvdW5kIG9uIE1PRVhcIiB9O1xuICAgIH1cblxuICAgIGlmICh0eXBlID09PSBcImJvbmRcIikge1xuICAgICAgY29uc3QgY291cG9ucyA9IGF3YWl0IGZldGNoTW9leENvdXBvbnMoYXBpVGlja2VyLCBsYXN0VXApO1xuICAgICAgZm9yIChjb25zdCBjIG9mIGNvdXBvbnMpIHtcbiAgICAgICAgY29uc3QgdG90YWwgPSBwYXJzZUZsb2F0KChjLnBlckJvbmQgKiBxdHkpLnRvRml4ZWQoMikpO1xuICAgICAgICBuZXdEaXZzLnB1c2goeyBkYXRlOiBjLmRhdGUsIHRvdGFsIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBkaXZzID0gYXdhaXQgZmV0Y2hNb2V4RGl2aWRlbmRzKGFwaVRpY2tlciwgbGFzdFVwKTtcbiAgICAgIGZvciAoY29uc3QgZCBvZiBkaXZzKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsID0gcGFyc2VGbG9hdCgoZC5wZXJTaGFyZSAqIHF0eSkudG9GaXhlZCgyKSk7XG4gICAgICAgIG5ld0RpdnMucHVzaCh7IGRhdGU6IGQuZGF0ZSwgdG90YWwgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJpY2VzU2VyaWVzID0gYXdhaXQgZmV0Y2hNb2V4UHJpY2VzKGFwaVRpY2tlciwgZnJvbURhdGUsIG1hcmtldEluZm8pO1xuICAgIGlmIChwcmljZXNTZXJpZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbGF0ZXN0ID0gcHJpY2VzU2VyaWVzW3ByaWNlc1Nlcmllcy5sZW5ndGggLSAxXTtcbiAgICAgIGlmICh0eXBlID09PSBcImJvbmRcIikge1xuICAgICAgICBsYXRlc3RQcmljZSA9IHBhcnNlRmxvYXQoKChsYXRlc3QuY2xvc2UgLyAxMDApICogZmFjZVZhbHVlKS50b0ZpeGVkKDIpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxhdGVzdFByaWNlID0gbGF0ZXN0LmNsb3NlO1xuICAgICAgfVxuICAgICAgbmV3UHJpY2VMaW5lID0gYCR7bGF0ZXN0LmRhdGV9IHwgcHJpY2UgfCBcdTIwMTQgfCAke2xhdGVzdFByaWNlfWA7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHsgcHJpY2VzLCBkaXZpZGVuZHMgfSA9IGF3YWl0IGZldGNoWWFob29QcmljZXMoYXBpVGlja2VyLCBmcm9tRGF0ZSk7XG4gICAgaWYgKHByaWNlcy5sZW5ndGggPT09IDAgJiYgZGl2aWRlbmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHsgdXBkYXRlZDogZmFsc2UsIHRpY2tlcjogYXBpVGlja2VyLCBlcnJvcjogXCJubyBuZXcgWWFob28gZGF0YVwiIH07XG4gICAgfVxuICAgIHByaWNlc1NlcmllcyA9IHByaWNlcztcblxuICAgIGlmIChxdHkgPiAwKSB7XG4gICAgICBmb3IgKGNvbnN0IGRpdiBvZiBkaXZpZGVuZHMpIHtcbiAgICAgICAgY29uc3QgdG90YWwgPSBwYXJzZUZsb2F0KChkaXYucGVyU2hhcmUgKiBxdHkpLnRvRml4ZWQoMikpO1xuICAgICAgICBuZXdEaXZzLnB1c2goeyBkYXRlOiBkaXYuZGF0ZSwgdG90YWwgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHByaWNlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBsYXRlc3QgPSBwcmljZXNbcHJpY2VzLmxlbmd0aCAtIDFdO1xuICAgICAgbGF0ZXN0UHJpY2UgPSBsYXRlc3QuY2xvc2U7XG4gICAgICBuZXdQcmljZUxpbmUgPSBgJHtsYXRlc3QuZGF0ZX0gfCBwcmljZSB8IFx1MjAxNCB8ICR7bGF0ZXN0UHJpY2V9YDtcbiAgICB9XG4gIH1cblxuICBpZiAoIW5ld1ByaWNlTGluZSAmJiBuZXdEaXZzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7IHVwZGF0ZWQ6IGZhbHNlLCB0aWNrZXI6IGFwaVRpY2tlciwgZXJyb3I6IFwibm8gbmV3IGRhdGFcIiB9O1xuICB9XG5cbiAgY29uc3QgYm9keSA9IHJhdy5zbGljZShmbUVuZCArIDMpLnJlcGxhY2UoL15cXG4vLCBcIlwiKTtcbiAgY29uc3QgZXhpc3RpbmdMaW5lcyA9IGJvZHkuc3BsaXQoXCJcXG5cIikuZmlsdGVyKGwgPT4gbC50cmltKCkpO1xuICBjb25zdCBleGlzdGluZ1NldCA9IG5ldyBTZXQoZXhpc3RpbmdMaW5lcy5tYXAobCA9PiBsLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKSkpO1xuXG4gIC8vIFBpY2sgY2xvc2VzdCBwcmljZSBcdTIyNjQgdGFyZ2V0RGF0ZSBmcm9tIHByaWNlc1NlcmllczsgZmFsbGJhY2sgdG8gbGF0ZXN0UHJpY2UuXG4gIC8vIHByaWNlc1NlcmllcyBpcyBhc2NlbmRpbmcgYnkgZGF0ZSAoTU9FWCBwYWdpbmF0aW9uICYgWWFob28gbmF0dXJhbCBvcmRlcikuXG4gIGNvbnN0IHByaWNlT25PckJlZm9yZSA9ICh0YXJnZXREYXRlKSA9PiB7XG4gICAgbGV0IGNob3NlbiA9IG51bGw7XG4gICAgZm9yIChjb25zdCBwIG9mIHByaWNlc1Nlcmllcykge1xuICAgICAgaWYgKHAuZGF0ZSA8PSB0YXJnZXREYXRlKSBjaG9zZW4gPSBwLmNsb3NlO1xuICAgICAgZWxzZSBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGNob3NlbiA/PyBsYXRlc3RQcmljZTtcbiAgfTtcblxuICBjb25zdCBsaW5lc1RvQWRkID0gW107XG4gIGNvbnN0IGxlZGdlckVudHJpZXNUb1dyaXRlID0gW107XG5cbiAgaWYgKG5ld1ByaWNlTGluZSAmJiAhZXhpc3RpbmdTZXQuaGFzKG5ld1ByaWNlTGluZS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCkpKSB7XG4gICAgY29uc3QgcHJpY2VEYXRlID0gbmV3UHJpY2VMaW5lLnNwbGl0KFwifFwiKVswXS50cmltKCk7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBleGlzdGluZ0xpbmVzLmZpbHRlcihsID0+IHtcbiAgICAgIGNvbnN0IHBhcnRzID0gbC5zcGxpdChcInxcIikubWFwKHAgPT4gcC50cmltKCkpO1xuICAgICAgcmV0dXJuICEocGFydHNbMF0gPT09IHByaWNlRGF0ZSAmJiBwYXJ0c1sxXSA9PT0gXCJwcmljZVwiKTtcbiAgICB9KTtcbiAgICBleGlzdGluZ0xpbmVzLmxlbmd0aCA9IDA7XG4gICAgZXhpc3RpbmdMaW5lcy5wdXNoKC4uLmZpbHRlcmVkKTtcbiAgICBsaW5lc1RvQWRkLnB1c2gobmV3UHJpY2VMaW5lKTtcbiAgfVxuXG4gIC8vIFByb2Nlc3MgZGl2cyBuZXdlc3QtZmlyc3QgZm9yIHN0YWJsZSBib2R5IG9yZGVyaW5nLlxuICBuZXdEaXZzLnNvcnQoKGEsIGIpID0+IGIuZGF0ZS5sb2NhbGVDb21wYXJlKGEuZGF0ZSkpO1xuXG4gIC8vIFJlaW52ZXN0IGlzIG9ubHkgbWVhbmluZ2Z1bCBmb3Igbm9uLWJvbmQsIG5vbi1kZXBvc2l0IGFzc2V0cy4gQm9uZHMnIGNvdXBvbnNcbiAgLy8gYXJlIGFsd2F5cyBjYXNoIChjYW4ndCBwYXJ0aWFsbHkgcmVpbnZlc3QgaW50byB0aGUgc2FtZSBpc3N1ZSk7IGRlcG9zaXRzXG4gIC8vIGhhdmUgbm8gZGl2aWRlbmQgc3RyZWFtIGF0IGFsbC4gRm9yY2UgY2FzaCByb3V0aW5nIGZvciB0aG9zZSB0byBhdm9pZFxuICAvLyBhY2NpZGVudGFsbHkgYXBwbHlpbmcgc3RhbGUgcG9saWN5IG1ldGFkYXRhIGZyb20gYSBsZWdhY3kgZnJvbnRtYXR0ZXIuXG4gIGNvbnN0IGVmZmVjdGl2ZVBvbGljeSA9ICh0eXBlID09PSBcImJvbmRcIiB8fCB0eXBlID09PSBcImRlcG9zaXRcIikgPyBcImNhc2hcIiA6IGRpdlBvbGljeTtcblxuICBsZXQgZGl2c0FkZGVkID0gMDtcbiAgbGV0IHJlaW52ZXN0c01hZGUgPSAwO1xuXG4gIGZvciAoY29uc3QgZCBvZiBuZXdEaXZzKSB7XG4gICAgY29uc3QgZGl2TGluZSA9IGAke2QuZGF0ZX0gfCBkaXYgfCBcdTIwMTQgfCAke2QudG90YWx9YDtcbiAgICBjb25zdCBkaXZLZXkgID0gZGl2TGluZS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG4gICAgaWYgKGV4aXN0aW5nU2V0LmhhcyhkaXZLZXkpKSBjb250aW51ZTtcblxuICAgIGlmIChlZmZlY3RpdmVQb2xpY3kgPT09IFwicmVpbnZlc3RcIikge1xuICAgICAgY29uc3QgcHJpY2VPbkRhdGUgPSBwcmljZU9uT3JCZWZvcmUoZC5kYXRlKTtcbiAgICAgIGlmIChwcmljZU9uRGF0ZSAmJiBwcmljZU9uRGF0ZSA+IDApIHtcbiAgICAgICAgLy8gV2hvbGUta29wZWNrIHF0eSBzbyBib2R5IGxpbmUgc3RheXMgY2xlYW4gKDIgZGVjaW1hbHMgaW4gcXR5IGZpZWxkKS5cbiAgICAgICAgY29uc3QgcmF3UXR5ID0gZC50b3RhbCAvIHByaWNlT25EYXRlO1xuICAgICAgICBjb25zdCBxdHlSZWludmVzdCA9IE1hdGguZmxvb3IocmF3UXR5ICogMTAwKSAvIDEwMDtcbiAgICAgICAgaWYgKHF0eVJlaW52ZXN0ID4gMCkge1xuICAgICAgICAgIGNvbnN0IGdyb3NzID0gcGFyc2VGbG9hdCgocXR5UmVpbnZlc3QgKiBwcmljZU9uRGF0ZSkudG9GaXhlZCgyKSk7XG4gICAgICAgICAgY29uc3QgcmVtYWluZGVyID0gcGFyc2VGbG9hdCgoZC50b3RhbCAtIGdyb3NzKS50b0ZpeGVkKDIpKTtcbiAgICAgICAgICBjb25zdCBidXlMaW5lID0gYCR7ZC5kYXRlfSB8IGJ1eSB8ICR7cXR5UmVpbnZlc3R9IHwgJHtwcmljZU9uRGF0ZX1gO1xuICAgICAgICAgIGNvbnN0IGJ1eUtleSAgPSBidXlMaW5lLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbiAgICAgICAgICBpZiAoIWV4aXN0aW5nU2V0LmhhcyhidXlLZXkpKSB7XG4gICAgICAgICAgICBsaW5lc1RvQWRkLnB1c2goYnV5TGluZSk7XG4gICAgICAgICAgICBsZWRnZXJFbnRyaWVzVG9Xcml0ZS5wdXNoKHtcbiAgICAgICAgICAgICAgZDogZC5kYXRlLCB0eXBlOiBcImJ1eVwiLCBhc3NldDogYXNzZXROYW1lLFxuICAgICAgICAgICAgICBxdHk6IHF0eVJlaW52ZXN0LCBwcmljZTogcHJpY2VPbkRhdGUsIGFtdDogZ3Jvc3MsXG4gICAgICAgICAgICAgIG5vdGU6IFwicmVpbnZlc3Q6IGZldGNoZXJcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVpbnZlc3RzTWFkZSArPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBMZWZ0b3ZlciBrb3BlY2tzIFx1MjAxNCBib29rIGFzIHBhc3NpdmUgaW5jb21lIG9uIHRoZSBkaXZpZGVuZCBhY2NvdW50XG4gICAgICAgICAgLy8gaWYgb25lIGlzIGNvbmZpZ3VyZWQuIFdpdGhvdXQgYW4gYWNjb3VudCB3ZSdkIHBoYW50b20gdGhlIGNhc2gsXG4gICAgICAgICAgLy8gc28gZm9sZCByZW1haW5kZXIgaW50byB0aGUgYnV5IG5vdGUgYW5kIHNraXAgdGhlIGVudHJ5LlxuICAgICAgICAgIGlmIChyZW1haW5kZXIgPiAwLjAwNSAmJiBkaXZpZGVuZEFjY3QpIHtcbiAgICAgICAgICAgIGxlZGdlckVudHJpZXNUb1dyaXRlLnB1c2goe1xuICAgICAgICAgICAgICBkOiBkLmRhdGUsIHR5cGU6IFwiZGl2aWRlbmRcIiwgYXNzZXQ6IGFzc2V0TmFtZSxcbiAgICAgICAgICAgICAgYW10OiByZW1haW5kZXIsIHRvOiBkaXZpZGVuZEFjY3QsXG4gICAgICAgICAgICAgIG5vdGU6IFwicmVpbnZlc3QgcmVtYWluZGVyOiBmZXRjaGVyXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFByaWNlIGxvb2t1cCBmYWlsZWQgb3IgcXR5IHJvdW5kZWQgdG8gemVybyBcdTIwMTQgZmFsbCB0aHJvdWdoIHRvIGNhc2ggcGF0aFxuICAgICAgLy8gc28gdGhlIGRpdmlkZW5kIGlzbid0IGxvc3QuIFVzZXIgY2FuIHJlZGlzdHJpYnV0ZSBtYW51YWxseSBpZiBuZWVkZWQuXG4gICAgfVxuXG4gICAgLy8gQ2FzaCBwb2xpY3kgKG9yIHJlaW52ZXN0IGZhbGxiYWNrKToga2VlcCB0aGUgYm9keSBkaXYgbGluZS5cbiAgICBsaW5lc1RvQWRkLnB1c2goZGl2TGluZSk7XG4gICAgZGl2c0FkZGVkICs9IDE7XG4gICAgaWYgKGRpdmlkZW5kQWNjdCkge1xuICAgICAgbGVkZ2VyRW50cmllc1RvV3JpdGUucHVzaCh7XG4gICAgICAgIGQ6IGQuZGF0ZSwgdHlwZTogXCJkaXZpZGVuZFwiLCBhc3NldDogYXNzZXROYW1lLFxuICAgICAgICBhbXQ6IGQudG90YWwsIHRvOiBkaXZpZGVuZEFjY3QsXG4gICAgICAgIG5vdGU6IFwiZmV0Y2hlclwiLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNpbGVudCBjb21wYXQgd2l0aCBsZWdhY3kgYXNzZXRzIFx1MjAxNCBib2R5IGdyb3dzLCBsZWRnZXIgZG9lc24ndC5cbiAgICAgIGNvbnNvbGUud2FybihgW1BDXSAke2FwaVRpY2tlcn06IGRpdmlkZW5kIHNraXBwZWQgKG5vIGRpdmlkZW5kX2FjY291bnQgY29uZmlndXJlZClgKTtcbiAgICB9XG4gIH1cblxuICBpZiAobGluZXNUb0FkZC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4geyB1cGRhdGVkOiBmYWxzZSwgdGlja2VyOiBhcGlUaWNrZXIsIGVycm9yOiBcImFscmVhZHkgdXAgdG8gZGF0ZVwiIH07XG4gIH1cblxuICBjb25zdCBhbGxMaW5lcyA9IFsuLi5saW5lc1RvQWRkLCAuLi5leGlzdGluZ0xpbmVzXTtcbiAgY29uc3QgbmV3Qm9keSA9IGFsbExpbmVzLmpvaW4oXCJcXG5cIikgKyBcIlxcblwiO1xuXG4gIGNvbnN0IGZtU2VjdGlvbiA9IHJhdy5zbGljZSgwLCBmbUVuZCArIDMpO1xuICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIGZtU2VjdGlvbiArIFwiXFxuXCIgKyBuZXdCb2R5KTtcblxuICAvLyBMZWRnZXIgd3JpdGUgQUZURVIgYm9keSBsb2Nrc3RlcCBcdTIwMTQgaWYgdmF1bHQubW9kaWZ5IHRocm93cywgd2UgZG9uJ3QgbGVhdmVcbiAgLy8gb3JwaGFuIGxlZGdlciBlbnRyaWVzLiBJZiBsZWRnZXIgd3JpdGUgZmFpbHMsIGJvZHkgaXMgYWxyZWFkeSB1cGRhdGVkIHNvXG4gIC8vIHRoZSBuZXh0IGZldGNoZXIgcnVuIHdpbGwgc2tpcCB0aGUgZHVwIGRpdnMgYW5kIHVzZXIgY2FuIG1hbnVhbGx5IHJlY29uY2lsZS5cbiAgaWYgKGxlZGdlckVudHJpZXNUb1dyaXRlLmxlbmd0aCA+IDAgJiYgc2V0dGluZ3MpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgd3JpdGVMZWRnZXJFbnRyaWVzKGFwcCwgc2V0dGluZ3MsIGxlZGdlckVudHJpZXNUb1dyaXRlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oYFtQQ10gJHthcGlUaWNrZXJ9OiBsZWRnZXIgd3JpdGUgZmFpbGVkOmAsIGUpO1xuICAgIH1cbiAgfVxuXG4gIGF3YWl0IHJlY2FsY0Fzc2V0KGFwcCwgZmlsZSk7XG5cbiAgcmV0dXJuIHtcbiAgICB1cGRhdGVkOiB0cnVlLFxuICAgIHRpY2tlcjogYXBpVGlja2VyLFxuICAgIG5ld1ByaWNlOiBsYXRlc3RQcmljZSxcbiAgICBkaXZzQWRkZWQ6IGRpdnNBZGRlZCArIHJlaW52ZXN0c01hZGUsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUFsbEFzc2V0UHJpY2VzKGFwcCwgc2V0dGluZ3MsIHN0YXR1c0NiKSB7XG4gIGNvbnN0IGZvbGRlciA9IHNldHRpbmdzLmFzc2V0c0ZvbGRlci50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcbiAgY29uc3QgZmlsZXMgID0gYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKS5maWx0ZXIoXG4gICAgZiA9PiBmLnBhdGgudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKGZvbGRlciArIFwiL1wiKVxuICApO1xuXG4gIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCB1cGRhdGVTaW5nbGVBc3NldFByaWNlKGFwcCwgZmlsZSwgc2V0dGluZ3MsIHN0YXR1c0NiKTtcbiAgICAgIHJlc3VsdHMucHVzaChyKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXN1bHRzLnB1c2goeyB1cGRhdGVkOiBmYWxzZSwgdGlja2VyOiBmaWxlLmJhc2VuYW1lLCBlcnJvcjogU3RyaW5nKGUubWVzc2FnZSB8fCBlKSB9KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCB1cGRhdGVkID0gcmVzdWx0cy5maWx0ZXIociA9PiByLnVwZGF0ZWQpO1xuICBjb25zdCBlcnJvcnMgID0gcmVzdWx0cy5maWx0ZXIociA9PiAhci51cGRhdGVkICYmIHIuZXJyb3IgJiYgci5lcnJvciAhPT0gXCJhbHJlYWR5IHVwIHRvIGRhdGVcIik7XG5cbiAgcmV0dXJuIHsgdG90YWw6IGZpbGVzLmxlbmd0aCwgdXBkYXRlZDogdXBkYXRlZC5sZW5ndGgsIGVycm9ycywgcmVzdWx0cyB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcmVzb2x2ZUFwaVRpY2tlciwgbW9leERpc2NvdmVyTWFya2V0LCBtb2V4R2V0RmFjZVZhbHVlLFxuICBmZXRjaE1vZXhQcmljZXMsIGZldGNoTW9leERpdmlkZW5kcywgZmV0Y2hNb2V4Q291cG9ucyxcbiAgZmV0Y2hZYWhvb1ByaWNlcywgZ2V0QXNzZXRTb3VyY2UsXG4gIHVwZGF0ZVNpbmdsZUFzc2V0UHJpY2UsIHVwZGF0ZUFsbEFzc2V0UHJpY2VzLFxufTtcbiIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIFRFTVBMQVRFIENBVENILVVQIEVOR0lORVxuLy9cbi8vIFVzZXItdHJpZ2dlcmVkIChub3Qgb25sb2FkKSBcdTIwMTQgcnVucyBhcyBwYXJ0IG9mIHRoZSBcIlVwZGF0ZSBwcmljZXNcIlxuLy8gcGlwZWxpbmUuIEZvciBlYWNoIGFzc2V0IHdob3NlIGZyb250bWF0dGVyIGNhcnJpZXMgYSBgdGVtcGxhdGU6YCBibG9ja1xuLy8gKGN1cnJlbnRseSBvbmx5IGRlcG9zaXRzKSwgYWR2YW5jZXMgYG5leHRfZHVlYCB3aGlsZSBpdCdzIGluIHRoZSBwYXN0XG4vLyBhbmQgbG9ncyBhbiBvcCBwZXIgZWxhcHNlZCBwZXJpb2QuXG4vL1xuLy8gV3JpdGUgcGF0dGVybiBwZXIgaXRlcmF0aW9uOlxuLy8gICBcdTIwMjIgbW9kZSA9IFwiY2FzaFwiICAgICAgXHUyMTkyIGJvZHkgYGRpdmAgbGluZSArIGxlZGdlciBgZGl2aWRlbmRgIGVudHJ5IHRvIGFjY291bnRcbi8vICAgXHUyMDIyIG1vZGUgPSBcImNhcGl0YWxpemVcIlx1MjE5MiBib2R5IGBjYXBpdGFsaXplYCBsaW5lLCBubyBsZWRnZXIgZW50cnksIHByaW5jaXBhbFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvdW5kcyBmb3IgdGhlIG5leHQgaXRlcmF0aW9uXG4vL1xuLy8gSWRlbXBvdGVuY3k6IHNraXBzIGRhdGVzIHRoYXQgYWxyZWFkeSBoYXZlIGFuIG9wIHJlY29yZGVkIChib2R5IGRlZHVwKSxcbi8vIGFkdmFuY2VzIG5leHRfZHVlIHJlZ2FyZGxlc3Mgc28gYSBtYW51YWxseS1yZWNvcmRlZCBtb250aCBkb2Vzbid0IGxlYXZlXG4vLyB0aGUgc2NoZWR1bGUgc3R1Y2suIFBvc2l0aW9uLWNsb3NlZCBhc3NldHMgKGN1cnJlbnRfcXR5IDw9IDApIGFyZSBza2lwcGVkLlxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmNvbnN0IHsgdG9OdW0gfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcbmNvbnN0IHsgd3JpdGVMZWRnZXJFbnRyaWVzIH0gPSByZXF1aXJlKFwiLi4vbGVkZ2VyL2lvXCIpO1xuY29uc3QgeyByZWNhbGNBc3NldCB9ID0gcmVxdWlyZShcIi4vcmVjYWxjXCIpO1xuXG5jb25zdCBNQVhfSVRFUlNfUEVSX1RFTVBMQVRFID0gNTAwOyAvLyA1MDAgKiAzMGQgXHUyMjQ4IDQweSBcdTIwMTQgc2FmZXR5IGFnYWluc3QgcnVuYXdheSBsb29wc1xuXG5mdW5jdGlvbiBhZGREYXlzKGRhdGVTdHIsIGRheXMpIHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKGRhdGVTdHIpO1xuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkYXlzKTtcbiAgcmV0dXJuIGQudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFwcGx5VGVtcGxhdGVzRm9yRmlsZShhcHAsIHNldHRpbmdzLCBmaWxlLCB0b2RheSkge1xuICBjb25zdCBjYWNoZSA9IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgY29uc3QgZm0gPSBjYWNoZT8uZnJvbnRtYXR0ZXIgPz8ge307XG4gIGNvbnN0IHRwbCA9IGZtLnRlbXBsYXRlO1xuICBpZiAoIXRwbCB8fCB0eXBlb2YgdHBsICE9PSBcIm9iamVjdFwiKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBjdXJyZW50UXR5ID0gdG9OdW0oZm0uY3VycmVudF9xdHkpO1xuICBpZiAoY3VycmVudFF0eSA8PSAwKSByZXR1cm4gbnVsbDsgLy8gY2xvc2VkIHBvc2l0aW9uXG5cbiAgY29uc3QgcmF0ZSA9IHRvTnVtKHRwbC5yYXRlKTtcbiAgY29uc3QgZnJlcURheXMgPSBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKHRvTnVtKHRwbC5mcmVxX2RheXMpIHx8IDMwKSk7XG4gIGNvbnN0IG1vZGUgPSBTdHJpbmcodHBsLm1vZGUgfHwgXCJjYXNoXCIpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGFjY291bnQgPSB0cGwuYWNjb3VudCA/IFN0cmluZyh0cGwuYWNjb3VudCkgOiBudWxsO1xuICBsZXQgbmV4dER1ZSA9IFN0cmluZyh0cGwubmV4dF9kdWUgfHwgXCJcIikuc2xpY2UoMCwgMTApO1xuXG4gIGlmICghbmV4dER1ZSB8fCByYXRlIDw9IDApIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHJhdyA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICBjb25zdCBmbUVuZCA9IHJhdy5pbmRleE9mKFwiLS0tXCIsIDMpO1xuICBpZiAoZm1FbmQgPT09IC0xKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBib2R5ID0gcmF3LnNsaWNlKGZtRW5kICsgMykucmVwbGFjZSgvXlxcbi8sIFwiXCIpO1xuICBjb25zdCBleGlzdGluZ0xpbmVzID0gYm9keS5zcGxpdChcIlxcblwiKS5maWx0ZXIobCA9PiBsLnRyaW0oKSk7XG4gIGNvbnN0IGV4aXN0aW5nQnlEYXRlID0gbmV3IE1hcCgpOyAvLyBkYXRlIFx1MjE5MiBTZXQgb2YgKG9wIG5hbWVzKVxuICBmb3IgKGNvbnN0IGwgb2YgZXhpc3RpbmdMaW5lcykge1xuICAgIGNvbnN0IHBhcnRzID0gbC5zcGxpdChcInxcIikubWFwKHAgPT4gcC50cmltKCkpO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPCAyKSBjb250aW51ZTtcbiAgICBjb25zdCBkID0gcGFydHNbMF07XG4gICAgY29uc3Qgb3AgPSBwYXJ0c1sxXS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghZXhpc3RpbmdCeURhdGUuaGFzKGQpKSBleGlzdGluZ0J5RGF0ZS5zZXQoZCwgbmV3IFNldCgpKTtcbiAgICBleGlzdGluZ0J5RGF0ZS5nZXQoZCkuYWRkKG9wKTtcbiAgfVxuXG4gIGNvbnN0IG5ld0JvZHlMaW5lcyA9IFtdO1xuICBjb25zdCBuZXdMZWRnZXJFbnRyaWVzID0gW107XG4gIGxldCBwcmluY2lwYWwgPSB0b051bShmbS50b3RhbF9pbnZlc3RlZCk7XG4gIGxldCBvcHNBcHBsaWVkID0gMDtcbiAgbGV0IGl0ZXJzID0gMDtcblxuICB3aGlsZSAobmV4dER1ZSA8PSB0b2RheSAmJiBpdGVycyA8IE1BWF9JVEVSU19QRVJfVEVNUExBVEUpIHtcbiAgICBpdGVycyArPSAxO1xuICAgIGNvbnN0IGludGVyZXN0ID0gcGFyc2VGbG9hdCgocHJpbmNpcGFsICogKHJhdGUgLyAxMDApICogKGZyZXFEYXlzIC8gMzY1KSkudG9GaXhlZCgyKSk7XG4gICAgaWYgKGludGVyZXN0IDw9IDAuMDA1KSB7XG4gICAgICBuZXh0RHVlID0gYWRkRGF5cyhuZXh0RHVlLCBmcmVxRGF5cyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBvcE5hbWUgPSBtb2RlID09PSBcImNhcGl0YWxpemVcIiA/IFwiY2FwaXRhbGl6ZVwiIDogXCJkaXZcIjtcbiAgICBjb25zdCBleGlzdGluZ09wc09uRGF0ZSA9IGV4aXN0aW5nQnlEYXRlLmdldChuZXh0RHVlKTtcblxuICAgIC8vIERlZHVwOiBpZiB1c2VyIGFscmVhZHkgbG9nZ2VkIEFOWSBpbmNvbWUtbGlrZSBvcCBvbiB0aGlzIGRhdGUgKGRpdixcbiAgICAvLyBjYXBpdGFsaXplLCByZWludmVzdCksIGFzc3VtZSB0aGV5IGhhbmRsZWQgaXQgbWFudWFsbHkgXHUyMDE0IHNraXAgdGhlXG4gICAgLy8gYm9keSB3cml0ZSBidXQgc3RpbGwgYWR2YW5jZSB0aGUgY2xvY2sgYW5kLCBmb3IgY2FwaXRhbGl6ZSBtb2RlLFxuICAgIC8vIHJvbGwgcHJpbmNpcGFsIGZvcndhcmQgc28gc3Vic2VxdWVudCBpdGVyYXRpb25zIGNvbXBvdW5kIGNvcnJlY3RseS5cbiAgICBjb25zdCBoYXNDb25mbGljdCA9IGV4aXN0aW5nT3BzT25EYXRlICYmIChcbiAgICAgIGV4aXN0aW5nT3BzT25EYXRlLmhhcyhcImRpdlwiKVxuICAgICAgfHwgZXhpc3RpbmdPcHNPbkRhdGUuaGFzKFwiY2FwaXRhbGl6ZVwiKVxuICAgICAgfHwgZXhpc3RpbmdPcHNPbkRhdGUuaGFzKFwicmVpbnZlc3RcIilcbiAgICApO1xuXG4gICAgaWYgKCFoYXNDb25mbGljdCkge1xuICAgICAgY29uc3QgbGluZSA9IGAke25leHREdWV9IHwgJHtvcE5hbWV9IHwgXFx1MjAxNCB8ICR7aW50ZXJlc3R9YDtcbiAgICAgIG5ld0JvZHlMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgb3BzQXBwbGllZCArPSAxO1xuXG4gICAgICBpZiAobW9kZSA9PT0gXCJjYXNoXCIgJiYgYWNjb3VudCkge1xuICAgICAgICBuZXdMZWRnZXJFbnRyaWVzLnB1c2goe1xuICAgICAgICAgIGQ6IG5leHREdWUsXG4gICAgICAgICAgdHlwZTogXCJkaXZpZGVuZFwiLFxuICAgICAgICAgIGFzc2V0OiBmaWxlLmJhc2VuYW1lLFxuICAgICAgICAgIGFtdDogaW50ZXJlc3QsXG4gICAgICAgICAgdG86IGFjY291bnQsXG4gICAgICAgICAgbm90ZTogXCJhdXRvLWxvZyB0ZW1wbGF0ZVwiLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDYXBpdGFsaXplIGNvbXBvdW5kcyBcdTIwMTQgZ3JvdyBwcmluY2lwYWwgZXZlbiB3aGVuIHRoZSBib2R5IHdyaXRlIHdhc1xuICAgIC8vIHNraXBwZWQgKG1hbnVhbCBlbnRyeSBvbiB0aGF0IGRhdGUgY291bnRzIGFzIHRoZSBwYXlvdXQ7IG5leHQgcGVyaW9kXG4gICAgLy8gc2hvdWxkIHN0aWxsIGNvbXBvdW5kIG9uIHRoZSBncm93biBiYXNlKS5cbiAgICBpZiAobW9kZSA9PT0gXCJjYXBpdGFsaXplXCIpIHByaW5jaXBhbCArPSBpbnRlcmVzdDtcblxuICAgIG5leHREdWUgPSBhZGREYXlzKG5leHREdWUsIGZyZXFEYXlzKTtcbiAgfVxuXG4gIGlmIChpdGVycyA+PSBNQVhfSVRFUlNfUEVSX1RFTVBMQVRFKSB7XG4gICAgY29uc29sZS53YXJuKGBbUENdIHRlbXBsYXRlIGNhdGNoLXVwOiBoaXQgaXRlciBsaW1pdCBmb3IgJHtmaWxlLmJhc2VuYW1lfSwgYWR2YW5jaW5nIG5leHRfZHVlIHRvIHRvZGF5YCk7XG4gICAgbmV4dER1ZSA9IHRvZGF5O1xuICB9XG5cbiAgLy8gV3JpdGUgYm9keSBvbmNlIHBlciBmaWxlIChpZiB3ZSBnZW5lcmF0ZWQgYW55IGxpbmVzKVxuICBpZiAobmV3Qm9keUxpbmVzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBtZXJnZWQgPSBbLi4ubmV3Qm9keUxpbmVzLCAuLi5leGlzdGluZ0xpbmVzXS5qb2luKFwiXFxuXCIpICsgXCJcXG5cIjtcbiAgICBjb25zdCBmbVNlY3Rpb24gPSByYXcuc2xpY2UoMCwgZm1FbmQgKyAzKTtcbiAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIGZtU2VjdGlvbiArIFwiXFxuXCIgKyBtZXJnZWQpO1xuICB9XG5cbiAgLy8gQWx3YXlzIHBlcnNpc3QgYWR2YW5jZWQgbmV4dF9kdWUsIGV2ZW4gd2hlbiBldmVyeSBpdGVyYXRpb24gd2FzIGEgZHVwLlxuICBhd2FpdCBhcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmKSA9PiB7XG4gICAgaWYgKCFmLnRlbXBsYXRlIHx8IHR5cGVvZiBmLnRlbXBsYXRlICE9PSBcIm9iamVjdFwiKSByZXR1cm47XG4gICAgZi50ZW1wbGF0ZS5uZXh0X2R1ZSA9IG5leHREdWU7XG4gIH0pO1xuXG4gIC8vIFJlY2FsYyBzbyB0b3RhbHMgcmVmbGVjdCB0aGUgbmV3IGJvZHkgbGluZXM7IG9rIHRvIGNhbGwgb25jZSBwZXIgZmlsZS5cbiAgYXdhaXQgcmVjYWxjQXNzZXQoYXBwLCBmaWxlKTtcblxuICByZXR1cm4geyBvcHNBcHBsaWVkLCBsZWRnZXJFbnRyaWVzOiBuZXdMZWRnZXJFbnRyaWVzIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFwcGx5VGVtcGxhdGVzKGFwcCwgc2V0dGluZ3MpIHtcbiAgY29uc3QgZm9sZGVyID0gU3RyaW5nKHNldHRpbmdzLmFzc2V0c0ZvbGRlciB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcbiAgaWYgKCFmb2xkZXIpIHJldHVybiB7IG9wc0FwcGxpZWQ6IDAsIGRlcG9zaXRzQWZmZWN0ZWQ6IDAgfTtcblxuICBjb25zdCBmaWxlcyA9IGFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCkuZmlsdGVyKFxuICAgIGYgPT4gZi5wYXRoLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChmb2xkZXIgKyBcIi9cIilcbiAgKTtcblxuICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCk7XG4gIGNvbnN0IGFsbExlZGdlckVudHJpZXMgPSBbXTtcbiAgbGV0IG9wc0FwcGxpZWQgPSAwO1xuICBsZXQgZGVwb3NpdHNBZmZlY3RlZCA9IDA7XG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFwcGx5VGVtcGxhdGVzRm9yRmlsZShhcHAsIHNldHRpbmdzLCBmaWxlLCB0b2RheSk7XG4gICAgICBpZiAoIXJlc3VsdCkgY29udGludWU7XG4gICAgICBpZiAocmVzdWx0Lm9wc0FwcGxpZWQgPiAwKSB7XG4gICAgICAgIGRlcG9zaXRzQWZmZWN0ZWQgKz0gMTtcbiAgICAgICAgb3BzQXBwbGllZCArPSByZXN1bHQub3BzQXBwbGllZDtcbiAgICAgIH1cbiAgICAgIGlmIChyZXN1bHQubGVkZ2VyRW50cmllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGFsbExlZGdlckVudHJpZXMucHVzaCguLi5yZXN1bHQubGVkZ2VyRW50cmllcyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS53YXJuKGBbUENdIHRlbXBsYXRlIGNhdGNoLXVwIGZhaWxlZCBmb3IgJHtmaWxlLmJhc2VuYW1lfTpgLCBlKTtcbiAgICB9XG4gIH1cblxuICAvLyBCYXRjaCBhbGwgbGVkZ2VyIHdyaXRlcyBmcm9tIHRoaXMgcnVuIGludG8gb25lIGZsdXNoIFx1MjAxNCBjaGVhcGVyIGFuZCBsZXRzXG4gIC8vIHdyaXRlTGVkZ2VyRW50cmllcyBncm91cCBieSB5ZWFyIGludGVybmFsbHkuXG4gIGlmIChhbGxMZWRnZXJFbnRyaWVzLmxlbmd0aCA+IDApIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgd3JpdGVMZWRnZXJFbnRyaWVzKGFwcCwgc2V0dGluZ3MsIGFsbExlZGdlckVudHJpZXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIltQQ10gdGVtcGxhdGUgY2F0Y2gtdXA6IGJhdGNoZWQgbGVkZ2VyIHdyaXRlIGZhaWxlZDpcIiwgZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgb3BzQXBwbGllZCwgZGVwb3NpdHNBZmZlY3RlZCB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgYXBwbHlUZW1wbGF0ZXMgfTtcbiIsICJjb25zdCB7IFN1Z2dlc3RNb2RhbCB9ID0gcmVxdWlyZShcIm9ic2lkaWFuXCIpO1xuY29uc3QgeyBmbXQgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxuY2xhc3MgUGlja0Fzc2V0TW9kYWwgZXh0ZW5kcyBTdWdnZXN0TW9kYWwge1xuICBjb25zdHJ1Y3RvcihhcHAsIHBsdWdpbiwgb25QaWNrKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICB0aGlzLm9uUGljayA9IG9uUGljaztcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb25zKHF1ZXJ5KSB7XG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXNzZXRzRm9sZGVyLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xuICAgIGNvbnN0IHEgICAgICA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKVxuICAgICAgLmZpbHRlcihmID0+IGYucGF0aC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoZm9sZGVyICsgXCIvXCIpICYmIGYuYmFzZW5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxKSk7XG4gIH1cblxuICByZW5kZXJTdWdnZXN0aW9uKGl0ZW0sIGVsKSB7XG4gICAgY29uc3QgY2FjaGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShpdGVtKTtcbiAgICBjb25zdCBmbSAgICA9IGNhY2hlPy5mcm9udG1hdHRlciA/PyB7fTtcbiAgICBlbC5jcmVhdGVFbChcImRpdlwiLCB7IHRleHQ6IGl0ZW0uYmFzZW5hbWUgfSk7XG4gICAgZWwuY3JlYXRlRWwoXCJzbWFsbFwiLCB7XG4gICAgICB0ZXh0OiBgJHtmbS50eXBlID8/IFwiP1wifSBcdTAwQjcgJHtmbS5jdXJyZW5jeSA/PyBcIj9cIn0gXHUwMEI3ICR7Zm10KGZtLmN1cnJlbnRfdmFsdWUgPz8gMCwgMil9IFx1MDBCNyAke2ZtdChmbS5wbF9wY3QgPz8gMCwgMSl9JWBcbiAgICB9KTtcbiAgfVxuXG4gIG9uQ2hvb3NlU3VnZ2VzdGlvbihpdGVtKSB7IHRoaXMub25QaWNrKGl0ZW0pOyB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyBQaWNrQXNzZXRNb2RhbCB9O1xuIiwgImNvbnN0IHsgTW9kYWwgfSA9IHJlcXVpcmUoXCJvYnNpZGlhblwiKTtcbmNvbnN0IHsgdG9OdW0sIHNob3dOb3RpY2UsIGtpbGxXaGVlbENoYW5nZSB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuY29uc3QgeyByZWNhbGNBc3NldCB9ID0gcmVxdWlyZShcIi4uL2Fzc2V0cy9yZWNhbGNcIik7XG5jb25zdCB7IHdyaXRlTGVkZ2VyRW50cnkgfSA9IHJlcXVpcmUoXCIuLi9sZWRnZXIvaW9cIik7XG5jb25zdCB7IHJlYWRBY2NvdW50cyB9ID0gcmVxdWlyZShcIi4uL2FjY291bnRzL2lvXCIpO1xuXG5jbGFzcyBBZGRBc3NldExpbmVNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoYXBwLCBmaWxlLCBwbHVnaW4pIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuZmlsZSAgID0gZmlsZTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCwgZmlsZSB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcblxuICAgIC8vIFJlYWQgZnJvbnRtYXR0ZXIgb25jZSBcdTIwMTQgZGVwb3NpdCB2cyBnZW5lcmljIGFzc2V0IGNoYW5nZXMgb3AgbGFiZWxzLFxuICAgIC8vIGZpZWxkIHZpc2liaWxpdHksIGFuZCB3aGF0IFwiY2xvc2VcIiBtZWFucyBpbiB0aGUgYXJjaGl2ZSBwcm9tcHQuXG4gICAgY29uc3QgZm0gPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKT8uZnJvbnRtYXR0ZXIgPz8ge307XG4gICAgY29uc3QgaXNEZXBvc2l0ID0gU3RyaW5nKGZtLnR5cGUgfHwgXCJcIikudG9Mb3dlckNhc2UoKSA9PT0gXCJkZXBvc2l0XCI7XG4gICAgY29uc3QgcHJpbmNpcGFsID0gdG9OdW0oZm0udG90YWxfaW52ZXN0ZWQpO1xuICAgIGNvbnN0IGV4cGVjdGVkQ2xvc2UgPSB0b051bShmbS5jdXJyZW50X3ZhbHVlKSB8fCBwcmluY2lwYWw7XG4gICAgLy8gVXNlIGFjdHVhbCBjdXJyZW50IHF0eSBmb3IgZGVwb3NpdCBjbG9zZSBcdTIwMTQgYSBkZXBvc2l0IHRoYXQgd2FzIHRvcHBlZCB1cFxuICAgIC8vIChidXkgcXR5PTEgcmVwZWF0ZWQpIGhhcyBxdHk+MSwgYW5kIGZvcmNpbmcgcXR5PTEgb24gY2xvc2Ugd291bGQgbGVhdmVcbiAgICAvLyB0aGUgcG9zaXRpb24gbm9uLXplcm8uIERlZmF1bHQgdG8gMSB3aGVuIHVuc2V0IChicmFuZC1uZXcgZGVwb3NpdCkuXG4gICAgY29uc3QgZGVwb3NpdFF0eSA9IE1hdGgubWF4KDEsIHRvTnVtKGZtLmN1cnJlbnRfcXR5KSB8fCAxKTtcblxuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogKGlzRGVwb3NpdCA/IFwiVXBkYXRlIGRlcG9zaXQ6IFwiIDogXCJVcGRhdGUgXCIpICsgZmlsZS5iYXNlbmFtZSB9KTtcblxuICAgIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgICBjb25zdCBmb3JtICA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1mb3JtXCIgfSk7XG4gICAgY29uc3Qgcm93ICAgPSAobGFiZWwsIGlucHV0KSA9PiB7XG4gICAgICBjb25zdCBkID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICAgIGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsIH0pO1xuICAgICAgZC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfTtcblxuICAgIGNvbnN0IGRhdGVJbiA9IHJvdyhcIkRhdGVcIiwgY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImRhdGVcIiB9KSk7XG4gICAgZGF0ZUluLnZhbHVlID0gdG9kYXk7XG4gICAgZGF0ZUluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcblxuICAgIC8vIERlcG9zaXQgb3BzIHVzZSBodW1hbiBsYW5ndWFnZTsgaGlkZSByZWludmVzdC9wcmljZSAobm8gbWFya2V0IGNvbmNlcHQpLlxuICAgIGNvbnN0IG9wSW4gPSByb3coXCJPcGVyYXRpb25cIiwgY29udGVudEVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpKTtcbiAgICBjb25zdCBvcE9wdGlvbnMgPSBpc0RlcG9zaXRcbiAgICAgID8gW1xuICAgICAgICAgIFtcImJ1eVwiLCAgXCJUb3AgdXAgZGVwb3NpdFwiXSxcbiAgICAgICAgICBbXCJzZWxsXCIsIFwiQ2xvc2UgZGVwb3NpdFwiXSxcbiAgICAgICAgICBbXCJkaXZcIiwgIFwiSW50ZXJlc3QgcGFpZCB0byBhY2NvdW50XCJdLFxuICAgICAgICBdXG4gICAgICA6IFtcbiAgICAgICAgICBbXCJidXlcIiwgICAgICBcIkJ1eSBcXHUyMDE0IHB1cmNoYXNlIHNoYXJlcy91bml0c1wiXSxcbiAgICAgICAgICBbXCJzZWxsXCIsICAgICBcIlNlbGwgXFx1MjAxNCBsaXF1aWRhdGUgc2hhcmVzL3VuaXRzXCJdLFxuICAgICAgICAgIFtcImRpdlwiLCAgICAgIFwiRGl2IFxcdTIwMTQgZGl2aWRlbmQgLyBjb3Vwb24gLyBpbnRlcmVzdCAoY2FzaCByZWNlaXZlZClcIl0sXG4gICAgICAgICAgW1wicmVpbnZlc3RcIiwgXCJSZWludmVzdCBcXHUyMDE0IGF1dG8tcmVpbnZlc3RlZCAobm8gY2FzaCBmbG93KVwiXSxcbiAgICAgICAgICBbXCJwcmljZVwiLCAgICBcIlByaWNlIFxcdTIwMTQgdXBkYXRlIGN1cnJlbnQgcHJpY2UgKG5vIHRyYW5zYWN0aW9uKVwiXSxcbiAgICAgICAgXTtcbiAgICBvcE9wdGlvbnMuZm9yRWFjaCgoW3ZhbCwgbGFiZWxdKSA9PiB7XG4gICAgICBjb25zdCBvID0gb3BJbi5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGxhYmVsIH0pO1xuICAgICAgby52YWx1ZSA9IHZhbDtcbiAgICB9KTtcbiAgICBvcEluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcblxuICAgIGNvbnN0IHF0eVdyYXAgID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICBxdHlXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlF1YW50aXR5ICh1bml0cylcIiB9KTtcbiAgICBjb25zdCBxdHlJbiAgICA9IHF0eVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIHN0ZXA6IFwiYW55XCIgfSk7XG4gICAgcXR5SW4ucGxhY2Vob2xkZXIgPSBcImUuZy4gNVwiO1xuICAgIHF0eUluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcbiAgICBraWxsV2hlZWxDaGFuZ2UocXR5SW4pO1xuXG4gICAgY29uc3QgcHJpY2VXcmFwID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICBwcmljZVdyYXAuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiUHJpY2UgcGVyIHVuaXQgLyB0b3RhbCBhbW91bnRcIiB9KTtcbiAgICBjb25zdCBwcmljZUluICAgPSBwcmljZVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIHN0ZXA6IFwiYW55XCIgfSk7XG4gICAgcHJpY2VJbi5wbGFjZWhvbGRlciA9IFwiZS5nLiAxODYuNTBcIjtcbiAgICBwcmljZUluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcbiAgICBraWxsV2hlZWxDaGFuZ2UocHJpY2VJbik7XG5cbiAgICAvLyBcIlNldCBhcyBjdXJyZW50IHByaWNlXCIgXHUyMDE0IGxldHMgdXNlcnMgY29ycmVjdCBjdXJyZW50X3ByaWNlIGlubGluZSB3aGVuXG4gICAgLy8gcmVjb3JkaW5nIGEgYnV5L3NlbGwvcmVpbnZlc3QsIGluc3RlYWQgb2YgaGF2aW5nIHRvIGFkZCBhIHNlcGFyYXRlXG4gICAgLy8gYHByaWNlYCBvcC4gV2hlbiBjaGVja2VkLCBlbWl0cyBhIGJvZHkgcHJpY2UgbGluZSBhbG9uZ3NpZGUgdGhlIG1haW5cbiAgICAvLyBsaW5lIGF0IHN1Ym1pdC4gSGlkZGVuIGZvciBkZXBvc2l0cyAobm8gbWFya2V0IHByaWNlIGNvbmNlcHQpIGFuZCBmb3JcbiAgICAvLyBkaXYvcHJpY2Ugb3BzIHdoZXJlIGl0J3Mgbm9uc2Vuc2UuXG4gICAgY29uc3Qgc2V0Q3VycmVudFByaWNlV3JhcCA9IGZvcm0uY3JlYXRlRGl2KCk7XG4gICAgY29uc3Qgc2V0Q3VycmVudFByaWNlTGFiZWwgPSBzZXRDdXJyZW50UHJpY2VXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIik7XG4gICAgY29uc3Qgc2V0Q3VycmVudFByaWNlSW4gPSBzZXRDdXJyZW50UHJpY2VMYWJlbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJjaGVja2JveFwiIH0pO1xuICAgIHNldEN1cnJlbnRQcmljZUxhYmVsLmFwcGVuZFRleHQoXCIgU2V0IGFzIGN1cnJlbnQgcHJpY2VcIik7XG5cbiAgICAvLyBDb21taXNzaW9uIC8gZmVlIChvcHRpb25hbCkgXHUyMDE0IGFmZmVjdHMgY2FzaCBmbG93IG9uIHRoZSBhY2NvdW50LlxuICAgIC8vIEZvciBidXlzLCBjb3N0IGJhc2lzIGdyb3dzIGJ5IGZlZS4gRm9yIHNlbGxzLCBwcm9jZWVkcyBzaHJpbmsgYnkgZmVlLlxuICAgIGNvbnN0IGZlZVdyYXAgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgIGZlZVdyYXAuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiQ29tbWlzc2lvbiAvIGZlZSAob3B0aW9uYWwpXCIgfSk7XG4gICAgY29uc3QgZmVlSW4gICA9IGZlZVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIHN0ZXA6IFwiYW55XCIgfSk7XG4gICAgZmVlSW4ucGxhY2Vob2xkZXIgPSBcIjBcIjtcbiAgICBmZWVJbi5hZGRDbGFzcyhcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIik7XG4gICAga2lsbFdoZWVsQ2hhbmdlKGZlZUluKTtcblxuICAgIC8vIEFjY291bnQgcGlja2VyIChzb3VyY2UgZm9yIGJ1eXMsIGRlc3RpbmF0aW9uIGZvciBzZWxscy9kaXZzKVxuICAgIGNvbnN0IGFjY3RXcmFwID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICBhY2N0V3JhcC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJBY2NvdW50XCIgfSk7XG4gICAgY29uc3QgYWNjdEluID0gYWNjdFdyYXAuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgYWNjdEluLmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogXCJcXHUyMDE0IG5vbmUgXFx1MjAxNFwiLCB2YWx1ZTogXCJcIiB9KTtcbiAgICBhY2N0SW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuICAgIHJlYWRBY2NvdW50cyh0aGlzLmFwcCwgdGhpcy5wbHVnaW4uc2V0dGluZ3MpLnRoZW4oYWNjdHMgPT4ge1xuICAgICAgZm9yIChjb25zdCBhIG9mIGFjY3RzKSBhY2N0SW4uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBhLm5hbWUsIHZhbHVlOiBhLm5hbWUgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBTaG93L2hpZGUgcXR5IGJhc2VkIG9uIG9wXG4gICAgY29uc3QgdXBkYXRlRmllbGRzID0gKCkgPT4ge1xuICAgICAgY29uc3Qgb3AgPSBvcEluLnZhbHVlO1xuICAgICAgLy8gUXR5IGhpZGRlbiBmb3IgZGl2L3ByaWNlIChubyB1bml0cyBpbnZvbHZlZCkgYW5kIGZvciBkZXBvc2l0IHNlbGxcbiAgICAgIC8vIChhbHdheXMgMSBcdTIwMTQgdXNlciBvbmx5IGVudGVycyB0aGUgYWN0dWFsIGFtb3VudCByZWNlaXZlZCkuXG4gICAgICBxdHlXcmFwLnN0eWxlLmRpc3BsYXkgPSAob3AgPT09IFwiZGl2XCIgfHwgb3AgPT09IFwicHJpY2VcIiB8fCAoaXNEZXBvc2l0ICYmIG9wID09PSBcInNlbGxcIikpID8gXCJub25lXCIgOiBcIlwiO1xuICAgICAgLy8gUHJpY2UgbGFiZWwgJiBwbGFjZWhvbGRlciBcdTIwMTQgZGVwb3NpdCBtb2RlIHVzZXMgcGxhaW4tbGFuZ3VhZ2Ugd29yZGluZy5cbiAgICAgIGNvbnN0IHByaWNlTGFiZWwgPSBwcmljZVdyYXAucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpO1xuICAgICAgaWYgKGlzRGVwb3NpdCkge1xuICAgICAgICBwcmljZUxhYmVsLnRleHRDb250ZW50ID1cbiAgICAgICAgICBvcCA9PT0gXCJzZWxsXCIgPyBcIkFjdHVhbCBhbW91bnQgcmVjZWl2ZWRcIiA6XG4gICAgICAgICAgb3AgPT09IFwiZGl2XCIgID8gXCJJbnRlcmVzdCBhbW91bnRcIiAgICAgICAgOlxuICAgICAgICAgIG9wID09PSBcImJ1eVwiICA/IFwiVG9wLXVwIGFtb3VudFwiICAgICAgICAgIDogXCJBbW91bnRcIjtcbiAgICAgICAgcHJpY2VJbi5wbGFjZWhvbGRlciA9IChvcCA9PT0gXCJzZWxsXCIgJiYgZXhwZWN0ZWRDbG9zZSA+IDApXG4gICAgICAgICAgPyBgZXhwZWN0ZWQgXHUyMjQ4ICR7ZXhwZWN0ZWRDbG9zZX1gXG4gICAgICAgICAgOiAob3AgPT09IFwiZGl2XCIgPyBcImUuZy4gNjI1MFwiIDogXCJlLmcuIDUwMDAwMFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByaWNlTGFiZWwudGV4dENvbnRlbnQgPVxuICAgICAgICAgIG9wID09PSBcImRpdlwiICAgPyBcIlRvdGFsIGFtb3VudCByZWNlaXZlZFwiIDpcbiAgICAgICAgICBvcCA9PT0gXCJwcmljZVwiID8gXCJDdXJyZW50IHByaWNlXCIgICAgICAgICA6IFwiUHJpY2UgcGVyIHVuaXRcIjtcbiAgICAgICAgcHJpY2VJbi5wbGFjZWhvbGRlciA9IFwiZS5nLiAxODYuNTBcIjtcbiAgICAgIH1cbiAgICAgIC8vIFJlaW52ZXN0ID0gbm8gY2FzaCBmbG93LCBzbyB0aGUgYWNjb3VudCBwaWNrZXIgbWFrZXMgbm8gc2Vuc2UgdGhlcmUuXG4gICAgICAvLyBIaWRpbmcgaXQgYWxzbyByZW1vdmVzIHRoZSB0ZW1wdGF0aW9uIHRvIHNldCBgZW50cnkuZnJvbWAgd2hpY2ggd291bGRcbiAgICAgIC8vIHBoYW50b20tZHJhaW4gdGhlIGNob3NlbiBhY2NvdW50LlxuICAgICAgYWNjdFdyYXAuc3R5bGUuZGlzcGxheSA9IChvcCA9PT0gXCJwcmljZVwiIHx8IG9wID09PSBcInJlaW52ZXN0XCIpID8gXCJub25lXCIgOiBcIlwiO1xuICAgICAgY29uc3QgYWNjdExhYmVsID0gYWNjdFdyYXAucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpO1xuICAgICAgaWYgKGlzRGVwb3NpdCkge1xuICAgICAgICBhY2N0TGFiZWwudGV4dENvbnRlbnQgPVxuICAgICAgICAgIG9wID09PSBcInNlbGxcIiA/IFwiVG8gYWNjb3VudFwiICAgOlxuICAgICAgICAgIG9wID09PSBcImRpdlwiICA/IFwiVG8gYWNjb3VudFwiICAgOiBcIkZyb20gYWNjb3VudFwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWNjdExhYmVsLnRleHRDb250ZW50ID0gKG9wID09PSBcInNlbGxcIiB8fCBvcCA9PT0gXCJkaXZcIikgPyBcIkRlc3RpbmF0aW9uIGFjY291bnRcIiA6IFwiU291cmNlIGFjY291bnRcIjtcbiAgICAgIH1cbiAgICAgIC8vIEZlZSBvbmx5IGFwcGxpZXMgdG8gYWN0dWFsIHRyYW5zYWN0aW9ucyBhZ2FpbnN0IGFuIGFjY291bnQuXG4gICAgICBmZWVXcmFwLnN0eWxlLmRpc3BsYXkgPSAob3AgPT09IFwiYnV5XCIgfHwgb3AgPT09IFwic2VsbFwiKSA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgICAgIC8vIElubGluZSBcInNldCBhcyBjdXJyZW50IHByaWNlXCIgXHUyMDE0IG1ha2VzIHNlbnNlIG9ubHkgZm9yIG5vbi1kZXBvc2l0XG4gICAgICAvLyBidXkvc2VsbC9yZWludmVzdCAodGhvc2UgY2FycnkgYSB1bml0IHByaWNlKS4gSGlkZGVuIG90aGVyd2lzZS5cbiAgICAgIHNldEN1cnJlbnRQcmljZVdyYXAuc3R5bGUuZGlzcGxheSA9XG4gICAgICAgICghaXNEZXBvc2l0ICYmIChvcCA9PT0gXCJidXlcIiB8fCBvcCA9PT0gXCJzZWxsXCIgfHwgb3AgPT09IFwicmVpbnZlc3RcIikpID8gXCJcIiA6IFwibm9uZVwiO1xuICAgIH07XG4gICAgb3BJbi5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUZpZWxkcyk7XG4gICAgdXBkYXRlRmllbGRzKCk7XG5cbiAgICBjb25zdCBidG5zICA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1idXR0b25zXCIgfSk7XG4gICAgY29uc3QgYWRkQnRuID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQWRkXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY29uc3QgY2FuY2VsID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG4gICAgY2FuY2VsLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG5cbiAgICBhZGRCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGUgID0gZGF0ZUluLnZhbHVlIHx8IHRvZGF5O1xuICAgICAgY29uc3Qgb3AgICAgPSBvcEluLnZhbHVlO1xuICAgICAgbGV0ICAgcHJpY2UgPSBwcmljZUluLnZhbHVlLnRyaW0oKTtcbiAgICAgIGlmICghcHJpY2UpIHsgc2hvd05vdGljZShcIlByaWNlL2Ftb3VudCBpcyByZXF1aXJlZFwiKTsgcmV0dXJuOyB9XG5cbiAgICAgIC8vIERlcG9zaXQgY2xvc2U6IHVzZXIgZW50ZXJzIFRPVEFMIGFtb3VudCByZWNlaXZlZDsgY29udmVydCB0byBwZXItdW5pdFxuICAgICAgLy8gcHJpY2Ugc28gcXR5ICogcHJpY2UgbWF0aCBzdGF5cyBjb3JyZWN0IGFjcm9zcyB0aGUgbGVkZ2VyIGFuZCBwYXJzZXIuXG4gICAgICBpZiAoaXNEZXBvc2l0ICYmIG9wID09PSBcInNlbGxcIikge1xuICAgICAgICBjb25zdCB0b3RhbCA9IHRvTnVtKHByaWNlKTtcbiAgICAgICAgY29uc3QgcGVyVW5pdCA9IHRvdGFsIC8gZGVwb3NpdFF0eTtcbiAgICAgICAgcHJpY2UgPSBTdHJpbmcocGFyc2VGbG9hdChwZXJVbml0LnRvRml4ZWQoNCkpKTtcbiAgICAgIH1cblxuICAgICAgLy8gRGVwb3NpdCBzZWxsID0gdXNlIHRoZSBmdWxsIGN1cnJlbnRfcXR5IHNvIGNsb3NlIHplcm9zIG91dCBjbGVhbmx5XG4gICAgICAvLyBldmVuIHdoZW4gdGhlIGRlcG9zaXQgd2FzIHRvcHBlZCB1cCAocXR5ID4gMSkuIFByaWNlIGZpZWxkIGhvbGRzIHRoZVxuICAgICAgLy8gdG90YWwgYW1vdW50IHJlY2VpdmVkOyB3ZSBzcGxpdCBpdCBwZXIgdW5pdCBiZWxvdy5cbiAgICAgIGNvbnN0IHF0eSAgPSAob3AgPT09IFwiZGl2XCIgfHwgb3AgPT09IFwicHJpY2VcIikgICAgICA/IFwiXFx1MjAxNFwiXG4gICAgICAgICAgICAgICAgIDogKGlzRGVwb3NpdCAmJiBvcCA9PT0gXCJzZWxsXCIpICAgICAgICAgICA/IFN0cmluZyhkZXBvc2l0UXR5KVxuICAgICAgICAgICAgICAgICA6IChxdHlJbi52YWx1ZS50cmltKCkgfHwgXCIxXCIpO1xuICAgICAgLy8gUGFyc2UgZmVlIG9uY2UgXHUyMDE0IHJldXNlZCBiZWxvdyBmb3IgbGVkZ2VyIGFtdCBBTkQgZm9yIHRoZSBib2R5IGxpbmUuXG4gICAgICBjb25zdCBudW1GZWUgPSBNYXRoLm1heCgwLCB0b051bShmZWVJbi52YWx1ZSkpO1xuXG4gICAgICAvLyBXcml0ZSB0byBsZWRnZXIgRklSU1QgKHNvdXJjZSBvZiB0cnV0aCkgXHUyMDE0IGV4Y2VwdCBwcmljZSB1cGRhdGVzXG4gICAgICBpZiAob3AgIT09IFwicHJpY2VcIikge1xuICAgICAgICBjb25zdCBlbnRyeSA9IHsgZDogZGF0ZSwgYXNzZXQ6IGZpbGUuYmFzZW5hbWUgfTtcbiAgICAgICAgY29uc3QgbnVtUXR5ID0gdG9OdW0ocXR5KTtcbiAgICAgICAgY29uc3QgbnVtUHJpY2UgPSB0b051bShwcmljZSk7XG4gICAgICAgIGlmIChvcCA9PT0gXCJidXlcIiB8fCBvcCA9PT0gXCJyZWludmVzdFwiKSB7XG4gICAgICAgICAgZW50cnkudHlwZSA9IFwiYnV5XCI7XG4gICAgICAgICAgZW50cnkucXR5ID0gbnVtUXR5OyBlbnRyeS5wcmljZSA9IG51bVByaWNlO1xuICAgICAgICAgIC8vIGFtdCBpcyBjYXNoIG1vdmVtZW50IChpbmNsLiBmZWUpOyBjb3N0IGJhc2lzIHN0YXlzIHF0eSpwcmljZSBcdTIwMTQgZmVlIGlzXG4gICAgICAgICAgLy8ga2VwdCBvdXQgb2YgYmFzaXMgc28gUCZMIGlzbid0IHNrZXdlZCBieSBicm9rZXIgY29tbWlzc2lvbnMuXG4gICAgICAgICAgZW50cnkuYW10ID0gbnVtUXR5ICogbnVtUHJpY2UgKyBudW1GZWU7XG4gICAgICAgICAgaWYgKG51bUZlZSA+IDApIGVudHJ5LmZlZSA9IG51bUZlZTtcbiAgICAgICAgICAvLyBPbmx5IGEgcmVhbCBgYnV5YCBtb3ZlcyBjYXNoIG9mZiBhIHNvdXJjZSBhY2NvdW50LiBSZWludmVzdCBpcyBhXG4gICAgICAgICAgLy8gbm9uLWNhc2ggdW5pdCBpbmNyZWFzZSAoZGl2aWRlbmQgXHUyMTkyIHNoYXJlcyksIHNvIG5vIGBmcm9tYC5cbiAgICAgICAgICBpZiAob3AgPT09IFwiYnV5XCIgJiYgYWNjdEluLnZhbHVlKSBlbnRyeS5mcm9tID0gYWNjdEluLnZhbHVlO1xuICAgICAgICAgIGlmIChvcCA9PT0gXCJyZWludmVzdFwiKSBlbnRyeS5ub3RlID0gXCJyZWludmVzdFwiO1xuICAgICAgICB9IGVsc2UgaWYgKG9wID09PSBcInNlbGxcIikge1xuICAgICAgICAgIGVudHJ5LnR5cGUgPSBcInNlbGxcIjtcbiAgICAgICAgICBlbnRyeS5xdHkgPSBudW1RdHk7IGVudHJ5LnByaWNlID0gbnVtUHJpY2U7XG4gICAgICAgICAgLy8gTmV0IHByb2NlZWRzIGhpdHRpbmcgdGhlIGFjY291bnQgKGdyb3NzIFx1MjIxMiBmZWUpLiBDb3N0IGJhc2lzIGlzXG4gICAgICAgICAgLy8gYWxyZWFkeSBmZWUtZnJlZSwgc28gUCZMIHJlZmxlY3RzIGZlZSBpbXBhY3Qgb25seSBvbiBzZWxsIHNpZGUuXG4gICAgICAgICAgZW50cnkuYW10ID0gTWF0aC5tYXgoMCwgbnVtUXR5ICogbnVtUHJpY2UgLSBudW1GZWUpO1xuICAgICAgICAgIGlmIChudW1GZWUgPiAwKSBlbnRyeS5mZWUgPSBudW1GZWU7XG4gICAgICAgICAgaWYgKGFjY3RJbi52YWx1ZSkgZW50cnkudG8gPSBhY2N0SW4udmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAob3AgPT09IFwiZGl2XCIpIHtcbiAgICAgICAgICBlbnRyeS50eXBlID0gXCJkaXZpZGVuZFwiO1xuICAgICAgICAgIGVudHJ5LmFtdCA9IG51bVByaWNlO1xuICAgICAgICAgIGlmIChhY2N0SW4udmFsdWUpIGVudHJ5LnRvID0gYWNjdEluLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHdyaXRlTGVkZ2VyRW50cnkodGhpcy5hcHAsIHRoaXMucGx1Z2luLnNldHRpbmdzLCBlbnRyeSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdyaXRlIGJvZHkgYXMgZGVyaXZlZCB2aWV3LiBGZWUgc2hvd24gYXMgNXRoIGNvbHVtbiBmb3IgdHJhbnNwYXJlbmN5O1xuICAgICAgLy8gcGFyc2VBc3NldEJvZHkgaWdub3JlcyBhbnl0aGluZyBwYXN0IGNvbHVtbiA0LCBzbyB0aGlzIGlzIHNhZmUuXG4gICAgICBjb25zdCBsaW5lID0gKG9wID09PSBcImJ1eVwiIHx8IG9wID09PSBcInNlbGxcIikgJiYgbnVtRmVlID4gMFxuICAgICAgICA/IGAke2RhdGV9IHwgJHtvcH0gfCAke3F0eX0gfCAke3ByaWNlfSB8IGZlZT0ke251bUZlZX1gXG4gICAgICAgIDogYCR7ZGF0ZX0gfCAke29wfSB8ICR7cXR5fSB8ICR7cHJpY2V9YDtcbiAgICAgIC8vIFwiU2V0IGFzIGN1cnJlbnQgcHJpY2VcIiBpbmxpbmUgXHUyMDE0IGVtaXRzIGFuIGV4dHJhIHByaWNlIG9wIGFmdGVyIHRoZSBtYWluXG4gICAgICAvLyBsaW5lLCBzbyB0aGUgYXNzZXQncyBjdXJyZW50X3ByaWNlIHJlZmxlY3RzIHRoaXMgdHJhbnNhY3Rpb24ncyBwcmljZVxuICAgICAgLy8gd2l0aG91dCBmb3JjaW5nIHVzZXJzIHRvIGFkZCBhIHNlcGFyYXRlIGBwcmljZWAgb3AgbWFudWFsbHkuXG4gICAgICBjb25zdCBleHRyYVByaWNlTGluZSA9ICghaXNEZXBvc2l0XG4gICAgICAgICYmIHNldEN1cnJlbnRQcmljZUluLmNoZWNrZWRcbiAgICAgICAgJiYgKG9wID09PSBcImJ1eVwiIHx8IG9wID09PSBcInNlbGxcIiB8fCBvcCA9PT0gXCJyZWludmVzdFwiKSlcbiAgICAgICAgPyBgJHtkYXRlfSB8IHByaWNlIHwgXFx1MjAxNCB8ICR7cHJpY2V9YFxuICAgICAgICA6IG51bGw7XG4gICAgICBjb25zdCBpbnNlcnRlZExpbmVzID0gZXh0cmFQcmljZUxpbmUgPyBgJHtsaW5lfVxcbiR7ZXh0cmFQcmljZUxpbmV9YCA6IGxpbmU7XG4gICAgICBjb25zdCByYXcgICAgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgZm1FbmQgID0gcmF3LmluZGV4T2YoXCItLS1cIiwgMyk7XG4gICAgICBsZXQgbmV3Q29udGVudDtcbiAgICAgIGlmIChmbUVuZCA9PT0gLTEpIHtcbiAgICAgICAgbmV3Q29udGVudCA9IGluc2VydGVkTGluZXMgKyBcIlxcblwiICsgcmF3LnRyaW1FbmQoKSArIFwiXFxuXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBhZnRlckZtICA9IHJhdy5zbGljZShmbUVuZCArIDMpLnJlcGxhY2UoL15cXG4/LywgXCJcIik7XG4gICAgICAgIG5ld0NvbnRlbnQgPSByYXcuc2xpY2UoMCwgZm1FbmQgKyAzKSArIFwiXFxuXCIgKyBpbnNlcnRlZExpbmVzICsgXCJcXG5cIiArIGFmdGVyRm07XG4gICAgICB9XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbmV3Q29udGVudCk7XG5cbiAgICAgIC8vIFJlY2FsY3VsYXRlIGZyb250bWF0dGVyIFx1MjAxNCByZXR1cm5zIGNvbXB1dGVkIHN0YXRzIGRpcmVjdGx5IChubyBzdGFsZSBjYWNoZSlcbiAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgcmVjYWxjQXNzZXQodGhpcy5hcHAsIGZpbGUpO1xuXG4gICAgICBzaG93Tm90aWNlKGBBZGRlZCAke29wfSBsaW5lIHRvICR7ZmlsZS5iYXNlbmFtZX1gKTtcblxuICAgICAgLy8gQ2xvc2UgcG9zaXRpb24gZGV0ZWN0aW9uOiBpZiBzZWxsIGFuZCByZW1haW5pbmcgcXR5ID0gMFxuICAgICAgaWYgKG9wID09PSBcInNlbGxcIikge1xuICAgICAgICBjb25zdCB1cGRhdGVkUXR5ID0gc3RhdHMgPyBzdGF0cy5jdXJyZW50UXR5IDogMTtcbiAgICAgICAgaWYgKHVwZGF0ZWRRdHkgPD0gMCkge1xuICAgICAgICAgIC8vIE9mZmVyIHRvIGFyY2hpdmVcbiAgICAgICAgICBjb25zdCBhcmNoaXZlTW9kYWwgPSBuZXcgTW9kYWwodGhpcy5hcHApO1xuICAgICAgICAgIGFyY2hpdmVNb2RhbC50aXRsZUVsLnNldFRleHQoaXNEZXBvc2l0ID8gXCJEZXBvc2l0IGNsb3NlZFwiIDogXCJQb3NpdGlvbiBjbG9zZWRcIik7XG4gICAgICAgICAgYXJjaGl2ZU1vZGFsLmNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICAgICAgdGV4dDogaXNEZXBvc2l0XG4gICAgICAgICAgICAgID8gYCR7ZmlsZS5iYXNlbmFtZX0gaGFzIGJlZW4gY2xvc2VkLiBBcmNoaXZlIHRoaXMgZGVwb3NpdD9gXG4gICAgICAgICAgICAgIDogYCR7ZmlsZS5iYXNlbmFtZX0gaGFzIDAgdW5pdHMgcmVtYWluaW5nLiBBcmNoaXZlIHRoaXMgcG9zaXRpb24/YFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IGFyY2hCdG5zID0gYXJjaGl2ZU1vZGFsLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1idXR0b25zXCIgfSk7XG4gICAgICAgICAgY29uc3QgYXJjaEJ0biA9IGFyY2hCdG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJBcmNoaXZlXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgICAgICAgYXJjaEJ0bnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIktlZXBcIiB9KS5vbmNsaWNrID0gKCkgPT4gYXJjaGl2ZU1vZGFsLmNsb3NlKCk7XG4gICAgICAgICAgYXJjaEJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgLy8gV3JpdGUgY2xvc2UgZW50cnkgdG8gbGVkZ2VyXG4gICAgICAgICAgICBhd2FpdCB3cml0ZUxlZGdlckVudHJ5KHRoaXMuYXBwLCB0aGlzLnBsdWdpbi5zZXR0aW5ncywge1xuICAgICAgICAgICAgICBkOiBkYXRlLCB0eXBlOiBcImNsb3NlXCIsIGFzc2V0OiBmaWxlLmJhc2VuYW1lLCBhbXQ6IDAsXG4gICAgICAgICAgICAgIG5vdGU6IFwicG9zaXRpb24gY2xvc2VkXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIE1vdmUgdG8gYXJjaGl2ZVxuICAgICAgICAgICAgY29uc3QgYXJjaEZvbGRlciA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmFyY2hpdmVGb2xkZXIgfHwgXCJmaW5hbmNlL0RhdGEvYXJjaGl2ZVwiO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYXJjaEZvbGRlcikpIHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGFyY2hGb2xkZXIpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5ld1BhdGggPSBgJHthcmNoRm9sZGVyfS8ke2ZpbGUuYmFzZW5hbWV9Lm1kYDtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLmZpbGVNYW5hZ2VyLnJlbmFtZUZpbGUoZmlsZSwgbmV3UGF0aCk7XG4gICAgICAgICAgICAvLyBVcGRhdGUgZnJvbnRtYXR0ZXJcbiAgICAgICAgICAgIGNvbnN0IGFyY2hpdmVkRmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChuZXdQYXRoKTtcbiAgICAgICAgICAgIGlmIChhcmNoaXZlZEZpbGUpIHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGFyY2hpdmVkRmlsZSwgKGZtKSA9PiB7XG4gICAgICAgICAgICAgICAgZm0uc3RhdHVzID0gXCJjbG9zZWRcIjtcbiAgICAgICAgICAgICAgICBmbS5jbG9zZWRfZGF0ZSA9IGRhdGU7XG4gICAgICAgICAgICAgICAgLy8gU3RyaXAgYXV0by1sb2cgdGVtcGxhdGUgXHUyMDE0IGNsb3NlZCBkZXBvc2l0cyBzaG91bGRuJ3QgYWNjcnVlXG4gICAgICAgICAgICAgICAgLy8gZnVydGhlci4gVGhlIGVuZ2luZSBhbHJlYWR5IGd1YXJkcyBvbiBjdXJyZW50UXR5PD0wLCBidXRcbiAgICAgICAgICAgICAgICAvLyBjbGVhbmluZyB1cCBrZWVwcyBhcmNoaXZlIGZpbGVzIHRpZHkgYW5kIHByZXZlbnRzIGNvbmZ1c2lvblxuICAgICAgICAgICAgICAgIC8vIGlmIGEgdXNlciByZW9wZW5zIHRoZSBwb3NpdGlvbiBsYXRlci5cbiAgICAgICAgICAgICAgICBpZiAoZm0udGVtcGxhdGUpIGRlbGV0ZSBmbS50ZW1wbGF0ZTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaG93Tm90aWNlKGBcXHUyNzEzICR7ZmlsZS5iYXNlbmFtZX0gYXJjaGl2ZWRgKTtcbiAgICAgICAgICAgIGFyY2hpdmVNb2RhbC5jbG9zZSgpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgYXJjaGl2ZU1vZGFsLm9wZW4oKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgQWRkQXNzZXRMaW5lTW9kYWwgfTtcbiIsICJjb25zdCB7IE1vZGFsIH0gPSByZXF1aXJlKFwib2JzaWRpYW5cIik7XG5jb25zdCB7IEFTU0VUX1RZUEVTIH0gPSByZXF1aXJlKFwiLi4vY29uc3RhbnRzXCIpO1xuY29uc3QgeyB0b051bSwgc2hvd05vdGljZSwgZm10LCBraWxsV2hlZWxDaGFuZ2UgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcbmNvbnN0IHsgcmVjYWxjQXNzZXQgfSA9IHJlcXVpcmUoXCIuLi9hc3NldHMvcmVjYWxjXCIpO1xuY29uc3QgeyB3cml0ZUxlZGdlckVudHJ5IH0gPSByZXF1aXJlKFwiLi4vbGVkZ2VyL2lvXCIpO1xuY29uc3QgeyByZWFkQWNjb3VudHMgfSA9IHJlcXVpcmUoXCIuLi9hY2NvdW50cy9pb1wiKTtcblxuY2xhc3MgQ3JlYXRlQXNzZXRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoYXBwLCBwbHVnaW4pIHsgc3VwZXIoYXBwKTsgdGhpcy5wbHVnaW4gPSBwbHVnaW47IH1cblxuICBvbk9wZW4oKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkFkZCBuZXcgYXNzZXRcIiB9KTtcblxuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtZm9ybVwiIH0pO1xuICAgIGNvbnN0IHJvdyAgPSAobGFiZWwsIGlucHV0KSA9PiB7XG4gICAgICBjb25zdCBkID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICAgIGQuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IGxhYmVsIH0pO1xuICAgICAgZC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfTtcblxuICAgIC8vIFR5cGUgZmlyc3QgXHUyMDE0IGRyaXZlcyBmaWVsZCB2aXNpYmlsaXR5LCBzbyB1c2VyIHBpY2tzIHRoaXMgYmVmb3JlIGFueXRoaW5nXG4gICAgLy8gZWxzZS4gUHJldmVudHMgXCJ3aHkgaXMgdGhpcyBmaWVsZCBoZXJlXCIgY29uZnVzaW9uIGZvciBkZXBvc2l0cy9ib25kcy5cbiAgICBjb25zdCB0eXBlSW4gID0gcm93KFwiVHlwZVwiLCBjb250ZW50RWwuY3JlYXRlRWwoXCJzZWxlY3RcIikpO1xuICAgIEFTU0VUX1RZUEVTLmZvckVhY2godCA9PiB7IGNvbnN0IG8gPSB0eXBlSW4uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiB0IH0pOyBvLnZhbHVlID0gdDsgfSk7XG4gICAgdHlwZUluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcblxuICAgIGNvbnN0IG5hbWVJbiAgPSByb3coXCJUaWNrZXIgLyBOYW1lXCIsIGNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIgfSkpO1xuICAgIG5hbWVJbi5wbGFjZWhvbGRlciA9IFwiZS5nLiBTQkVSLCBBQVBMLCBNeURlcG9zaXRcIjtcbiAgICBuYW1lSW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuXG4gICAgY29uc3QgdGlja2VySW4gPSByb3coXCJFeGNoYW5nZSB0aWNrZXIgKG9wdGlvbmFsKVwiLCBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiIH0pKTtcbiAgICB0aWNrZXJJbi5wbGFjZWhvbGRlciA9IFwiZS5nLiBUIGZvciBcdTA0MjItXHUwNDIyXHUwNDM1XHUwNDQ1XHUwNDNEXHUwNDNFXHUwNDNCXHUwNDNFXHUwNDMzXHUwNDM4XHUwNDM4LCBTUEJFIGZvciBTUEIgRXhjaGFuZ2VcIjtcbiAgICB0aWNrZXJJbi5hZGRDbGFzcyhcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIik7XG5cbiAgICBjb25zdCBjdXJySW4gID0gcm93KFwiQ3VycmVuY3lcIiwgY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiB9KSk7XG4gICAgY3VyckluLnZhbHVlID0gXCJSVUJcIjtcbiAgICBjdXJySW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuXG4gICAgLy8gRmFjZSB2YWx1ZSB3cmFwcGVyIFx1MjAxNCB2aXNpYmxlIG9ubHkgZm9yIGJvbmRzLlxuICAgIGNvbnN0IGZhY2VXcmFwID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICBmYWNlV3JhcC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJGYWNlIHZhbHVlIChib25kcyBvbmx5KVwiIH0pO1xuICAgIGNvbnN0IGZhY2VJbiAgPSBmYWNlV3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgc3RlcDogXCJhbnlcIiB9KTtcbiAgICBmYWNlSW4ucGxhY2Vob2xkZXIgPSBcIjEwMDAgKGRlZmF1bHQgZm9yIFJ1c3NpYW4gYm9uZHMpXCI7XG4gICAgZmFjZUluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcbiAgICBraWxsV2hlZWxDaGFuZ2UoZmFjZUluKTtcblxuICAgIGNvbnN0IHByaWNlSW4gPSByb3coXCJJbml0aWFsIHByaWNlIC8gdmFsdWVcIiwgY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBzdGVwOiBcImFueVwiIH0pKTtcbiAgICBwcmljZUluLnBsYWNlaG9sZGVyID0gXCJlLmcuIDE4NS41MFwiO1xuICAgIHByaWNlSW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuICAgIGtpbGxXaGVlbENoYW5nZShwcmljZUluKTtcblxuICAgIGNvbnN0IHF0eUluICAgPSByb3coXCJJbml0aWFsIHF1YW50aXR5XCIsIGNvbnRlbnRFbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgc3RlcDogXCJhbnlcIiB9KSk7XG4gICAgcXR5SW4ucGxhY2Vob2xkZXIgPSBcImUuZy4gMTBcIjtcbiAgICBxdHlJbi5hZGRDbGFzcyhcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIik7XG4gICAga2lsbFdoZWVsQ2hhbmdlKHF0eUluKTtcblxuICAgIGNvbnN0IGZlZUluICAgPSByb3coXCJDb21taXNzaW9uIC8gZmVlIChvcHRpb25hbClcIiwgY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBzdGVwOiBcImFueVwiIH0pKTtcbiAgICBmZWVJbi5wbGFjZWhvbGRlciA9IFwiMFwiO1xuICAgIGZlZUluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcbiAgICBraWxsV2hlZWxDaGFuZ2UoZmVlSW4pO1xuXG4gICAgY29uc3QgZGF0ZUluICA9IHJvdyhcIkluaXRpYWwgZGF0ZVwiLCBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiZGF0ZVwiIH0pKTtcbiAgICBkYXRlSW4udmFsdWUgID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgICBkYXRlSW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuXG4gICAgLy8gU291cmNlIGFjY291bnQgcGlja2VyXG4gICAgY29uc3Qgc3JjV3JhcCA9IGZvcm0uY3JlYXRlRGl2KCk7XG4gICAgc3JjV3JhcC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJTb3VyY2UgYWNjb3VudFwiIH0pO1xuICAgIGNvbnN0IHNyY0luID0gc3JjV3JhcC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBzcmNJbi5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiXHUyMDE0IG5vbmUgXHUyMDE0XCIsIHZhbHVlOiBcIlwiIH0pO1xuICAgIHNyY0luLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcblxuICAgIC8vIERpdmlkZW5kIHJvdXRpbmcgKGhpZGRlbiBmb3IgYm9uZHMgXHUyMDE0IGNvdXBvbnMgYXJlIGFsd2F5cyBjYXNoKS5cbiAgICBjb25zdCBkaXZQb2xpY3lXcmFwID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICBkaXZQb2xpY3lXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIkRpdmlkZW5kIHBvbGljeVwiIH0pO1xuICAgIGNvbnN0IGRpdlBvbGljeUluID0gZGl2UG9saWN5V3JhcC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBbXG4gICAgICBbXCJjYXNoXCIsICAgICBcIkNhc2ggXFx1MjAxNCBwYXkgb3V0IHRvIGFjY291bnRcIl0sXG4gICAgICBbXCJyZWludmVzdFwiLCBcIlJlaW52ZXN0IFxcdTIwMTQgYXV0by1idXkgbW9yZSB1bml0c1wiXSxcbiAgICBdLmZvckVhY2goKFt2YWwsIGxhYmVsXSkgPT4ge1xuICAgICAgY29uc3QgbyA9IGRpdlBvbGljeUluLmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogbGFiZWwgfSk7XG4gICAgICBvLnZhbHVlID0gdmFsO1xuICAgIH0pO1xuICAgIGRpdlBvbGljeUluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcblxuICAgIC8vIERpdmlkZW5kIGRlc3RpbmF0aW9uIGFjY291bnQgKGRlZmF1bHRzIHRvIHNvdXJjZSBhY2NvdW50OyB1c2VyIGNhbiBvdmVycmlkZSkuXG4gICAgY29uc3QgZGl2QWNjdFdyYXAgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgIGRpdkFjY3RXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIkRpdmlkZW5kIGFjY291bnRcIiB9KTtcbiAgICBjb25zdCBkaXZBY2N0SW4gPSBkaXZBY2N0V3JhcC5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBkaXZBY2N0SW4uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBcIlx1MjAxNCBub25lIFx1MjAxNFwiLCB2YWx1ZTogXCJcIiB9KTtcbiAgICBkaXZBY2N0SW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuXG4gICAgLy8gTG9hZCBhY2NvdW50cyBpbnRvIGJvdGggc3JjICsgZGl2QWNjdCBzZWxlY3RzXG4gICAgcmVhZEFjY291bnRzKHRoaXMuYXBwLCB0aGlzLnBsdWdpbi5zZXR0aW5ncykudGhlbihhY2N0cyA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGEgb2YgYWNjdHMpIHtcbiAgICAgICAgc3JjSW4uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBhLm5hbWUsIHZhbHVlOiBhLm5hbWUgfSk7XG4gICAgICAgIGRpdkFjY3RJbi5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGEubmFtZSwgdmFsdWU6IGEubmFtZSB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIE1pcnJvciBzcmMgXHUyMTkyIGRpdkFjY3Qgd2hlbiB1c2VyIHBpY2tzIHNvdXJjZSAoc28gZGl2aWRlbmRzIGRlZmF1bHQgdG9cbiAgICAvLyB3aGVyZSBjYXNoIGNhbWUgZnJvbSkuIFVzZXIgY2FuIHN0aWxsIG92ZXJyaWRlIG1hbnVhbGx5LlxuICAgIGxldCBkaXZBY2N0VG91Y2hlZCA9IGZhbHNlO1xuICAgIGRpdkFjY3RJbi5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHsgZGl2QWNjdFRvdWNoZWQgPSB0cnVlOyB9KTtcbiAgICBzcmNJbi5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICAgIGlmICghZGl2QWNjdFRvdWNoZWQpIGRpdkFjY3RJbi52YWx1ZSA9IHNyY0luLnZhbHVlO1xuICAgIH0pO1xuXG4gICAgLy8gRGVwb3NpdCBhdXRvLWxvZyB0ZW1wbGF0ZSBcdTIwMTQgb3B0LWluIHZpYSBcIkFkZCB0ZW1wbGF0ZVwiIGJ1dHRvbi4gV2hlbiB0aGVcbiAgICAvLyB1c2VyIHJldmVhbHMgdGhlIHNlY3Rpb24gYW5kIGZpbGxzIGl0LCB0aGUgZGVwb3NpdCdzIGZyb250bWF0dGVyIGNhcnJpZXNcbiAgICAvLyBhIGB0ZW1wbGF0ZTpgIGJsb2NrOyB0aGUgXCJVcGRhdGUgcHJpY2VzXCIgcGlwZWxpbmUgdGhlbiBhdXRvLWxvZ3MgcGVyaW9kaWNcbiAgICAvLyBpbnRlcmVzdCBvcHMgKGNhc2ggXHUyMTkyIGRpdiArIGxlZGdlciBlbnRyeTsgY2FwaXRhbGl6ZSBcdTIxOTIgcHJpbmNpcGFsIGdyb3dzKS5cbiAgICAvLyBXaG9sZSBzZWN0aW9uIGhpZGRlbiB1bmxlc3MgdHlwZT1kZXBvc2l0IChzZWUgdXBkYXRlVHlwZUZpZWxkcykuXG4gICAgY29uc3QgdHBsV3JhcCA9IGZvcm0uY3JlYXRlRGl2KHsgY2xzOiBcInBjLXRlbXBsYXRlLXdyYXBcIiB9KTtcbiAgICBjb25zdCB0cGxUb2dnbGVCdG4gPSB0cGxXcmFwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiKyBBZGQgYXV0by1sb2cgdGVtcGxhdGVcIixcbiAgICAgIGNsczogXCJwYy1hY3Rpb24tYnRuIHBjLXRlbXBsYXRlLXRvZ2dsZVwiLFxuICAgIH0pO1xuICAgIHRwbFRvZ2dsZUJ0bi50eXBlID0gXCJidXR0b25cIjsgLy8gYXZvaWQgYWNjaWRlbnRhbCBmb3JtIHN1Ym1pdFxuICAgIGNvbnN0IHRwbEZpZWxkcyA9IHRwbFdyYXAuY3JlYXRlRGl2KHsgY2xzOiBcInBjLXRlbXBsYXRlLWZpZWxkc1wiIH0pO1xuICAgIHRwbEZpZWxkcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgdHBsRmllbGRzLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIlRoZSBwbHVnaW4gd2lsbCBhdXRvLWxvZyBpbnRlcmVzdCBwYXltZW50cyBlYWNoIHRpbWUgeW91IGNsaWNrIFxcdTIwMUNVcGRhdGUgcHJpY2VzXFx1MjAxRC4gWW91IGNhbiBzdGlsbCByZWNvcmQgb3Igb3ZlcnJpZGUgZW50cmllcyBtYW51YWxseSBhdCBhbnkgdGltZS5cIixcbiAgICAgIGNsczogXCJwYy10ZW1wbGF0ZS1oaW50XCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCB0cGxSYXRlUm93ID0gdHBsRmllbGRzLmNyZWF0ZURpdigpO1xuICAgIHRwbFJhdGVSb3cuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiSW50ZXJlc3QgcmF0ZSAoJSBwZXIgeWVhcilcIiB9KTtcbiAgICBjb25zdCB0cGxSYXRlSW4gPSB0cGxSYXRlUm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBzdGVwOiBcImFueVwiIH0pO1xuICAgIHRwbFJhdGVJbi5wbGFjZWhvbGRlciA9IFwiZS5nLiAxOC41XCI7XG4gICAgdHBsUmF0ZUluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcbiAgICBraWxsV2hlZWxDaGFuZ2UodHBsUmF0ZUluKTtcblxuICAgIGNvbnN0IHRwbEZyZXFSb3cgPSB0cGxGaWVsZHMuY3JlYXRlRGl2KCk7XG4gICAgdHBsRnJlcVJvdy5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJQYXltZW50IGV2ZXJ5IE4gZGF5c1wiIH0pO1xuICAgIGNvbnN0IHRwbEZyZXFJbiA9IHRwbEZyZXFSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIHN0ZXA6IFwiMVwiIH0pO1xuICAgIHRwbEZyZXFJbi5wbGFjZWhvbGRlciA9IFwiMzBcIjtcbiAgICB0cGxGcmVxSW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuICAgIGtpbGxXaGVlbENoYW5nZSh0cGxGcmVxSW4pO1xuXG4gICAgY29uc3QgdHBsTW9kZVJvdyA9IHRwbEZpZWxkcy5jcmVhdGVEaXYoKTtcbiAgICB0cGxNb2RlUm93LmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlBheW91dCBtb2RlXCIgfSk7XG4gICAgY29uc3QgdHBsTW9kZUluID0gdHBsTW9kZVJvdy5jcmVhdGVFbChcInNlbGVjdFwiKTtcbiAgICBbXG4gICAgICBbXCJjYXNoXCIsICAgICAgIFwiUGFpZCB0byBhY2NvdW50IChjYXNoKVwiXSxcbiAgICAgIFtcImNhcGl0YWxpemVcIiwgXCJDYXBpdGFsaXplZCAoYWRkZWQgdG8gZGVwb3NpdClcIl0sXG4gICAgXS5mb3JFYWNoKChbdmFsLCBsYWJlbF0pID0+IHtcbiAgICAgIGNvbnN0IG8gPSB0cGxNb2RlSW4uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCB9KTtcbiAgICAgIG8udmFsdWUgPSB2YWw7XG4gICAgfSk7XG4gICAgdHBsTW9kZUluLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcblxuICAgIGNvbnN0IHRwbEZpcnN0Um93ID0gdHBsRmllbGRzLmNyZWF0ZURpdigpO1xuICAgIHRwbEZpcnN0Um93LmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIkZpcnN0IHBheW1lbnQgZGF0ZVwiIH0pO1xuICAgIGNvbnN0IHRwbEZpcnN0SW4gPSB0cGxGaXJzdFJvdy5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJkYXRlXCIgfSk7XG4gICAgdHBsRmlyc3RJbi5hZGRDbGFzcyhcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIik7XG5cbiAgICBsZXQgdHBsRW5hYmxlZCA9IGZhbHNlO1xuICAgIHRwbFRvZ2dsZUJ0bi5vbmNsaWNrID0gKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRwbEVuYWJsZWQgPSAhdHBsRW5hYmxlZDtcbiAgICAgIHRwbEZpZWxkcy5zdHlsZS5kaXNwbGF5ID0gdHBsRW5hYmxlZCA/IFwiXCIgOiBcIm5vbmVcIjtcbiAgICAgIHRwbFRvZ2dsZUJ0bi50ZXh0Q29udGVudCA9IHRwbEVuYWJsZWRcbiAgICAgICAgPyBcIlxcdTAwRDcgUmVtb3ZlIGF1dG8tbG9nIHRlbXBsYXRlXCJcbiAgICAgICAgOiBcIisgQWRkIGF1dG8tbG9nIHRlbXBsYXRlXCI7XG4gICAgICBpZiAodHBsRW5hYmxlZCAmJiAhdHBsRmlyc3RJbi52YWx1ZSkge1xuICAgICAgICAvLyBTZW5zaWJsZSBkZWZhdWx0OiBmaXJzdCBwYXltZW50IDMwIGRheXMgYWZ0ZXIgdGhlIGRlcG9zaXQncyBzdGFydCBkYXRlLlxuICAgICAgICBjb25zdCBzdGFydERhdGUgPSBkYXRlSW4udmFsdWUgfHwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKHN0YXJ0RGF0ZSk7XG4gICAgICAgIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIDMwKTtcbiAgICAgICAgdHBsRmlyc3RJbi52YWx1ZSA9IGQudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCk7XG4gICAgICB9XG4gICAgICBpZiAodHBsRW5hYmxlZCAmJiAhdHBsRnJlcUluLnZhbHVlKSB0cGxGcmVxSW4udmFsdWUgPSBcIjMwXCI7XG4gICAgfTtcblxuICAgIC8vIFNob3cvaGlkZSBmaWVsZHMgYmFzZWQgb24gYXNzZXQgdHlwZS4gTWlycm9ycyB1cGRhdGVGaWVsZHMoKSBwYXR0ZXJuXG4gICAgLy8gZnJvbSBhc3NldC1saW5lLmpzIFx1MjAxNCBzaW5nbGUgc291cmNlIG9mIHRydXRoIGZvciBmaWVsZCB2aXNpYmlsaXR5LlxuICAgIGNvbnN0IHVwZGF0ZVR5cGVGaWVsZHMgPSAoKSA9PiB7XG4gICAgICBjb25zdCB0ID0gdHlwZUluLnZhbHVlO1xuICAgICAgY29uc3QgaXNEZXBvc2l0ID0gdCA9PT0gXCJkZXBvc2l0XCI7XG4gICAgICBmYWNlV3JhcC5zdHlsZS5kaXNwbGF5ICAgICA9IHQgPT09IFwiYm9uZFwiICAgID8gXCJcIiA6IFwibm9uZVwiO1xuICAgICAgdHBsV3JhcC5zdHlsZS5kaXNwbGF5ICAgICAgPSBpc0RlcG9zaXQgICAgICAgPyBcIlwiIDogXCJub25lXCI7XG4gICAgICAvLyBCb25kczogY291cG9ucyBhcmUgYWx3YXlzIGNhc2ggKHlvdSBjYW4ndCByZWludmVzdCBhIGNvdXBvbiBpbnRvIHRoZVxuICAgICAgLy8gc2FtZSBib25kIGlzc3VlKS4gRGVwb3NpdHM6IGludGVyZXN0IGFsd2F5cyBjYXNoLiBNYXRlcmlhbHMvY3J5cHRvOlxuICAgICAgLy8gbm8gZGl2aWRlbmRzIGVpdGhlciwgYnV0IHdlIGtlZXAgdGhlIGZpZWxkIGluIGNhc2Ugb2YgZnV0dXJlIGVkZ2UgY2FzZXMuXG4gICAgICBkaXZQb2xpY3lXcmFwLnN0eWxlLmRpc3BsYXkgPSAodCA9PT0gXCJib25kXCIgfHwgaXNEZXBvc2l0KSA/IFwibm9uZVwiIDogXCJcIjtcbiAgICAgIC8vIERlcG9zaXQtbW9kZSBVSTogdGlja2VyICsgcXR5IGFyZSBtZWFuaW5nbGVzcyAoc2luZ2xlLXBvc2l0aW9uIGFzc2V0KSxcbiAgICAgIC8vIGRpdmlkZW5kX2FjY291bnQgaXMgcmVkdW5kYW50IChhbHdheXMgPSBzb3VyY2UpLiBIaWRlIHRoZW0gYW5kIHJlbGFiZWxcbiAgICAgIC8vIHRoZSByZW1haW5pbmcgZmllbGRzIGluIHBsYWluIGh1bWFuIGxhbmd1YWdlLlxuICAgICAgdGlja2VySW4ucGFyZW50RWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gaXNEZXBvc2l0ID8gXCJub25lXCIgOiBcIlwiO1xuICAgICAgcXR5SW4ucGFyZW50RWxlbWVudC5zdHlsZS5kaXNwbGF5ICAgID0gaXNEZXBvc2l0ID8gXCJub25lXCIgOiBcIlwiO1xuICAgICAgZGl2QWNjdFdyYXAuc3R5bGUuZGlzcGxheSAgICAgICAgICAgID0gaXNEZXBvc2l0ID8gXCJub25lXCIgOiBcIlwiO1xuICAgICAgLy8gRHluYW1pYyBsYWJlbHMgXHUyMDE0IHN3YXAgdG8gZGVwb3NpdC1mcmllbmRseSB3b3JkaW5nLlxuICAgICAgbmFtZUluLnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpLnRleHRDb250ZW50ID1cbiAgICAgICAgaXNEZXBvc2l0ID8gXCJEZXBvc2l0IG5hbWVcIiA6IFwiVGlja2VyIC8gTmFtZVwiO1xuICAgICAgcHJpY2VJbi5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbFwiKS50ZXh0Q29udGVudCA9XG4gICAgICAgIGlzRGVwb3NpdCA/IFwiRGVwb3NpdCBhbW91bnRcIiA6IFwiSW5pdGlhbCBwcmljZSAvIHZhbHVlXCI7XG4gICAgICBuYW1lSW4ucGxhY2Vob2xkZXIgPVxuICAgICAgICBpc0RlcG9zaXQgPyBcImUuZy4gVGlua29mZiBcXHUwNDMyXFx1MDQzQVxcdTA0M0JcXHUwNDMwXFx1MDQzNFwiIDogXCJlLmcuIFNCRVIsIEFBUEwsIE15RGVwb3NpdFwiO1xuICAgICAgcHJpY2VJbi5wbGFjZWhvbGRlciA9XG4gICAgICAgIGlzRGVwb3NpdCA/IFwiZS5nLiA1MDAwMDBcIiA6IFwiZS5nLiAxODUuNTBcIjtcbiAgICAgIC8vIEJ1dHRvbiBsYWJlbCBmb2xsb3dzIGNvbnRleHQgdG9vLlxuICAgICAgaWYgKGNyZWF0ZSkgY3JlYXRlLnRleHRDb250ZW50ID0gaXNEZXBvc2l0ID8gXCJPcGVuIGRlcG9zaXRcIiA6IFwiQ3JlYXRlXCI7XG4gICAgfTtcbiAgICB0eXBlSW4uYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB1cGRhdGVUeXBlRmllbGRzKTtcblxuICAgIGNvbnN0IGJ0bnMgICA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1idXR0b25zXCIgfSk7XG4gICAgY29uc3QgY3JlYXRlID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQ3JlYXRlXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY29uc3QgY2FuY2VsID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG4gICAgY2FuY2VsLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG5cbiAgICAvLyBJbml0aWFsIHZpc2liaWxpdHkgXHUyMDE0IG5vdyB0aGF0IGBjcmVhdGVgIGV4aXN0cywgbGV0IHVwZGF0ZVR5cGVGaWVsZHNcbiAgICAvLyBzZXQgdGhlIGJ1dHRvbiBsYWJlbCB0b28uIENhbGxlZCBoZXJlIChub3QgcmlnaHQgYWZ0ZXIgZGVmaW5pdGlvbikgc29cbiAgICAvLyB0aGUgYGlmIChjcmVhdGUpYCBndWFyZCBzZWVzIGEgcmVhbCBidXR0b24gcmVmZXJlbmNlIG9uIGZpcnN0IHBhaW50LlxuICAgIHVwZGF0ZVR5cGVGaWVsZHMoKTtcblxuICAgIGNyZWF0ZS5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbmFtZSA9IG5hbWVJbi52YWx1ZS50cmltKCk7XG4gICAgICBpZiAoIW5hbWUpIHsgc2hvd05vdGljZShcIk5hbWUgaXMgcmVxdWlyZWRcIik7IHJldHVybjsgfVxuXG4gICAgICBjb25zdCBhc3NldHNGb2xkZXIgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hc3NldHNGb2xkZXI7XG4gICAgICBjb25zdCBmb2xkZXJGaWxlICAgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYXNzZXRzRm9sZGVyKTtcbiAgICAgIGlmICghZm9sZGVyRmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGFzc2V0c0ZvbGRlcik7XG5cbiAgICAgIGNvbnN0IHBhdGggPSBgJHthc3NldHNGb2xkZXJ9LyR7bmFtZX0ubWRgO1xuICAgICAgaWYgKHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKSkge1xuICAgICAgICBzaG93Tm90aWNlKFwiQXNzZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgbmFtZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gRGVwb3NpdCA9IHNpbmdsZS1wb3NpdGlvbiBhc3NldCwgcXR5IGZpZWxkIGlzIGhpZGRlbiBhbmQgZm9yY2VkIHRvIDFcbiAgICAgIC8vIHNvIHRoZSBcImJ1eSAxIEAgYW1vdW50XCIgcmVjb3JkIG1vZGVscyB0aGUgb3BlbmluZyBkZXBvc2l0IGNvcnJlY3RseS5cbiAgICAgIGNvbnN0IGFzc2V0VHlwZSAgICA9IHR5cGVJbi52YWx1ZTtcbiAgICAgIGNvbnN0IHF0eSAgID0gYXNzZXRUeXBlID09PSBcImRlcG9zaXRcIiA/IFwiMVwiIDogcXR5SW4udmFsdWUudHJpbSgpO1xuICAgICAgY29uc3QgcHJpY2UgPSBwcmljZUluLnZhbHVlLnRyaW0oKTtcbiAgICAgIGNvbnN0IGRhdGUgID0gZGF0ZUluLnZhbHVlLnRyaW0oKTtcblxuICAgICAgLy8gQnVpbGQgZnJvbnRtYXR0ZXJcbiAgICAgIGNvbnN0IHRpY2tlclZhbCAgICA9IHRpY2tlckluLnZhbHVlLnRyaW0oKTtcbiAgICAgIGNvbnN0IGZhY2VWYWwgICAgICA9IGZhY2VJbi52YWx1ZS50cmltKCk7XG4gICAgICBjb25zdCBmbUxpbmVzID0gW1xuICAgICAgICBcIi0tLVwiLFxuICAgICAgICBgbmFtZTogJHtuYW1lfWAsXG4gICAgICBdO1xuICAgICAgaWYgKHRpY2tlclZhbCkgZm1MaW5lcy5wdXNoKGB0aWNrZXI6ICR7dGlja2VyVmFsfWApO1xuICAgICAgZm1MaW5lcy5wdXNoKFxuICAgICAgICBgdHlwZTogJHthc3NldFR5cGV9YCxcbiAgICAgICAgYGN1cnJlbmN5OiAke2N1cnJJbi52YWx1ZS50b1VwcGVyQ2FzZSgpLnRyaW0oKSB8fCBcIlJVQlwifWAsXG4gICAgICApO1xuICAgICAgaWYgKGFzc2V0VHlwZSA9PT0gXCJib25kXCIgJiYgZmFjZVZhbCkgZm1MaW5lcy5wdXNoKGBmYWNlX3ZhbHVlOiAke2ZhY2VWYWx9YCk7XG4gICAgICAvLyBEaXZpZGVuZCByb3V0aW5nOiBib25kcy9kZXBvc2l0cyBza2lwIHBvbGljeSAoYWx3YXlzIGNhc2ggYnkgbmF0dXJlKS5cbiAgICAgIC8vIE90aGVyIHR5cGVzIGRlZmF1bHQgdG8gYGNhc2hgIHVubGVzcyB1c2VyIGNob3NlIGByZWludmVzdGAuXG4gICAgICBpZiAoYXNzZXRUeXBlICE9PSBcImJvbmRcIiAmJiBhc3NldFR5cGUgIT09IFwiZGVwb3NpdFwiKSB7XG4gICAgICAgIGZtTGluZXMucHVzaChgZGl2aWRlbmRfcG9saWN5OiAke2RpdlBvbGljeUluLnZhbHVlfWApO1xuICAgICAgfVxuICAgICAgLy8gRGVmYXVsdCBkaXZpZGVuZCBkZXN0aW5hdGlvbiA9IHNvdXJjZSBhY2NvdW50IHVubGVzcyB1c2VyIG92ZXJyb2RlLlxuICAgICAgY29uc3QgZGl2aWRlbmRBY2NvdW50ID0gZGl2QWNjdEluLnZhbHVlIHx8IHNyY0luLnZhbHVlO1xuICAgICAgaWYgKGRpdmlkZW5kQWNjb3VudCkgZm1MaW5lcy5wdXNoKGBkaXZpZGVuZF9hY2NvdW50OiAke2RpdmlkZW5kQWNjb3VudH1gKTtcblxuICAgICAgLy8gRGVwb3NpdCBhdXRvLWxvZyB0ZW1wbGF0ZSBcdTIwMTQgWUFNTCBuZXN0ZWQgYmxvY2suIFRoZSB0ZW1wbGF0ZSBlbmdpbmVcbiAgICAgIC8vIChzcmMvYXNzZXRzL3RlbXBsYXRlcy5qcykgcmVhZHMgdGhpcyBvbiBcIlVwZGF0ZSBwcmljZXNcIiBhbmQgd3JpdGVzXG4gICAgICAvLyBwZXJpb2RpYyBkaXYvY2FwaXRhbGl6ZSBvcHMgdXAgdG8gdG9kYXkuXG4gICAgICBpZiAoYXNzZXRUeXBlID09PSBcImRlcG9zaXRcIiAmJiB0cGxFbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IHRwbFJhdGUgID0gdG9OdW0odHBsUmF0ZUluLnZhbHVlKTtcbiAgICAgICAgY29uc3QgdHBsRnJlcSAgPSBNYXRoLm1heCgxLCBNYXRoLnJvdW5kKHRvTnVtKHRwbEZyZXFJbi52YWx1ZSkgfHwgMzApKTtcbiAgICAgICAgY29uc3QgdHBsTW9kZSAgPSB0cGxNb2RlSW4udmFsdWU7XG4gICAgICAgIGNvbnN0IHRwbEZpcnN0ID0gdHBsRmlyc3RJbi52YWx1ZS50cmltKCk7XG4gICAgICAgIGlmICh0cGxSYXRlID4gMCAmJiB0cGxGaXJzdCkge1xuICAgICAgICAgIGZtTGluZXMucHVzaChcInRlbXBsYXRlOlwiKTtcbiAgICAgICAgICBmbUxpbmVzLnB1c2goYCAgcmF0ZTogJHt0cGxSYXRlfWApO1xuICAgICAgICAgIGZtTGluZXMucHVzaChgICBmcmVxX2RheXM6ICR7dHBsRnJlcX1gKTtcbiAgICAgICAgICBmbUxpbmVzLnB1c2goYCAgbW9kZTogJHt0cGxNb2RlfWApO1xuICAgICAgICAgIGlmICh0cGxNb2RlID09PSBcImNhc2hcIiAmJiBzcmNJbi52YWx1ZSkgZm1MaW5lcy5wdXNoKGAgIGFjY291bnQ6ICR7c3JjSW4udmFsdWV9YCk7XG4gICAgICAgICAgZm1MaW5lcy5wdXNoKGAgIG5leHRfZHVlOiAke3RwbEZpcnN0fWApO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZtTGluZXMucHVzaChcbiAgICAgICAgXCJjdXJyZW50X3F0eTpcIixcbiAgICAgICAgXCJhdmdfY29zdDpcIixcbiAgICAgICAgXCJ0b3RhbF9pbnZlc3RlZDpcIixcbiAgICAgICAgXCJjdXJyZW50X3ByaWNlOlwiLFxuICAgICAgICBcImN1cnJlbnRfdmFsdWU6XCIsXG4gICAgICAgIFwicGxfYW1vdW50OlwiLFxuICAgICAgICBcInBsX3BjdDpcIixcbiAgICAgICAgXCJwYXNzaXZlX2luY29tZV90b3RhbDpcIixcbiAgICAgICAgYGluaXRpYWxfZGF0ZTogJHtkYXRlfWAsXG4gICAgICAgIGBsYXN0X3VwZGF0ZWQ6ICR7ZGF0ZX1gLFxuICAgICAgICBcIi0tLVwiLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IGZtID0gZm1MaW5lcy5qb2luKFwiXFxuXCIpO1xuXG4gICAgICBjb25zdCBmZWVOdW0gPSBNYXRoLm1heCgwLCB0b051bShmZWVJbi52YWx1ZSkpO1xuXG4gICAgICAvLyBCdWlsZCBpbml0aWFsIGxvZyBsaW5lIGlmIHF0eSArIHByaWNlIHByb3ZpZGVkXG4gICAgICBjb25zdCBsb2dMaW5lID0gKHF0eSAmJiBwcmljZSlcbiAgICAgICAgPyAoZmVlTnVtID4gMFxuICAgICAgICAgICAgPyBgXFxuJHtkYXRlfSB8IGJ1eSB8ICR7cXR5fSB8ICR7cHJpY2V9IHwgZmVlPSR7ZmVlTnVtfVxcbmBcbiAgICAgICAgICAgIDogYFxcbiR7ZGF0ZX0gfCBidXkgfCAke3F0eX0gfCAke3ByaWNlfVxcbmApXG4gICAgICAgIDogXCJcXG5cIjtcblxuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIGZtICsgbG9nTGluZSk7XG5cbiAgICAgIC8vIFJlY2FsY3VsYXRlIGZyb250bWF0dGVyIGZyb20gbG9nIGxpbmVcbiAgICAgIGNvbnN0IG5ld0ZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gICAgICBpZiAobmV3RmlsZSkgYXdhaXQgcmVjYWxjQXNzZXQodGhpcy5hcHAsIG5ld0ZpbGUpO1xuXG4gICAgICAvLyBXcml0ZSB0byBsZWRnZXJcbiAgICAgIGlmIChxdHkgJiYgcHJpY2UpIHtcbiAgICAgICAgY29uc3QgcSA9IHBhcnNlRmxvYXQocXR5KSwgcCA9IHBhcnNlRmxvYXQocHJpY2UpO1xuICAgICAgICBjb25zdCBlbnRyeSA9IHtcbiAgICAgICAgICBkOiBkYXRlLCB0eXBlOiBcImJ1eVwiLCBhc3NldDogbmFtZSxcbiAgICAgICAgICBxdHk6IHEsIHByaWNlOiBwLFxuICAgICAgICAgIGFtdDogcSAqIHAgKyBmZWVOdW0sXG4gICAgICAgIH07XG4gICAgICAgIGlmIChmZWVOdW0gPiAwKSBlbnRyeS5mZWUgPSBmZWVOdW07XG4gICAgICAgIGlmIChzcmNJbi52YWx1ZSkgZW50cnkuZnJvbSA9IHNyY0luLnZhbHVlO1xuICAgICAgICBhd2FpdCB3cml0ZUxlZGdlckVudHJ5KHRoaXMuYXBwLCB0aGlzLnBsdWdpbi5zZXR0aW5ncywgZW50cnkpO1xuICAgICAgfVxuXG4gICAgICBzaG93Tm90aWNlKFwiQ3JlYXRlZDogXCIgKyBuYW1lKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9O1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyBDcmVhdGVBc3NldE1vZGFsIH07XG4iLCAiY29uc3QgeyBmbXQsIGZtdFNpZ25lZCwgc2hvd05vdGljZSwgbWFrZUludGVyYWN0aXZlIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5jb25zdCB7IHVwZGF0ZUFsbEFzc2V0UHJpY2VzIH0gPSByZXF1aXJlKFwiLi4vYXNzZXRzL3ByaWNlc1wiKTtcbmNvbnN0IHsgdXBkYXRlRnhSYXRlcyB9ID0gcmVxdWlyZShcIi4uL2Fzc2V0cy9meFwiKTtcbmNvbnN0IHsgYXBwbHlUZW1wbGF0ZXMgfSA9IHJlcXVpcmUoXCIuLi9hc3NldHMvdGVtcGxhdGVzXCIpO1xuXG4vLyBDb21wdXRlIGZpbmFuY2lhbCBtZXRyaWNzIGZvciBkaXNwbGF5XG5mdW5jdGlvbiBjb21wdXRlQXNzZXRNZXRyaWNzKGEpIHtcbiAgY29uc3QgaW52ZXN0ZWQgICAgPSBhLmN1cnJlbnRWYWx1ZSAtIGEucGxBbW91bnQ7ICAvLyB0b3RhbCBjb3N0IGJhc2lzXG4gIGNvbnN0IHRvdGFsUmV0dXJuID0gaW52ZXN0ZWQgPiAwXG4gICAgPyAoKGEucGxBbW91bnQgKyBhLnBhc3NpdmVJbmNvbWVUb3QpIC8gaW52ZXN0ZWQpICogMTAwXG4gICAgOiAwO1xuXG4gIC8vIFlpZWxkIG9uIENvc3QgPSB0b3RhbCBwYXNzaXZlIGluY29tZSAvIGludmVzdGVkIFx1MDBENyAxMDBcbiAgY29uc3QgeWllbGRPbkNvc3QgPSBpbnZlc3RlZCA+IDBcbiAgICA/IChhLnBhc3NpdmVJbmNvbWVUb3QgLyBpbnZlc3RlZCkgKiAxMDBcbiAgICA6IDA7XG5cbiAgLy8gQ0FHUiA9ICgoY3VycmVudF92YWx1ZSArIHBhc3NpdmVfaW5jb21lKSAvIGludmVzdGVkKV4oMS95ZWFycykgXHUyMjEyIDFcbiAgbGV0IGNhZ3IgPSAwO1xuICBpZiAoYS5pbml0aWFsRGF0ZSAmJiBpbnZlc3RlZCA+IDApIHtcbiAgICBjb25zdCBzdGFydERhdGUgPSBuZXcgRGF0ZShhLmluaXRpYWxEYXRlKTtcbiAgICBjb25zdCBub3cgICAgICAgPSBuZXcgRGF0ZSgpO1xuICAgIGNvbnN0IHllYXJzICAgICA9IChub3cgLSBzdGFydERhdGUpIC8gKDM2NS4yNSAqIDI0ICogMzYwMCAqIDEwMDApO1xuICAgIGlmICh5ZWFycyA+PSAwLjEpIHsgLy8gbmVlZCBhdCBsZWFzdCB+MSBtb250aFxuICAgICAgY29uc3QgdG90YWxWYWx1ZSA9IGEuY3VycmVudFZhbHVlICsgYS5wYXNzaXZlSW5jb21lVG90O1xuICAgICAgY2FnciA9IChNYXRoLnBvdyh0b3RhbFZhbHVlIC8gaW52ZXN0ZWQsIDEgLyB5ZWFycykgLSAxKSAqIDEwMDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRvdGFsUmV0dXJuOiBwYXJzZUZsb2F0KHRvdGFsUmV0dXJuLnRvRml4ZWQoMikpLFxuICAgIHlpZWxkT25Db3N0OiBwYXJzZUZsb2F0KHlpZWxkT25Db3N0LnRvRml4ZWQoMikpLFxuICAgIGNhZ3I6ICAgICAgICBwYXJzZUZsb2F0KGNhZ3IudG9GaXhlZCgyKSksXG4gICAgaW52ZXN0ZWQ6ICAgIHBhcnNlRmxvYXQoaW52ZXN0ZWQudG9GaXhlZCgyKSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlbmRlckFzc2V0Q2FyZHMoY29udGFpbmVyLCBhc3NldHMsIHNldHRpbmdzLCBhcHAsIHBsdWdpbiwgZGFzaENvbnRhaW5lcikge1xuICAvLyBMYXp5IHJlcXVpcmVzIHRvIGF2b2lkIGNpcmN1bGFyIGRlcGVuZGVuY2llc1xuICBjb25zdCB7IHJlbmRlckRhc2hib2FyZCB9ID0gcmVxdWlyZShcIi4vZGFzaGJvYXJkXCIpO1xuICBjb25zdCB7IFBpY2tBc3NldE1vZGFsIH0gPSByZXF1aXJlKFwiLi4vbW9kYWxzL2Fzc2V0LXBpY2tcIik7XG4gIGNvbnN0IHsgQWRkQXNzZXRMaW5lTW9kYWwgfSA9IHJlcXVpcmUoXCIuLi9tb2RhbHMvYXNzZXQtbGluZVwiKTtcbiAgY29uc3QgeyBDcmVhdGVBc3NldE1vZGFsIH0gPSByZXF1aXJlKFwiLi4vbW9kYWxzL2Fzc2V0LWNyZWF0ZVwiKTtcblxuICBpZiAoYXNzZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwicGMtZW1wdHlcIiwgdGV4dDogXCJObyBhc3NldHMgeWV0LlwiIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGluc3RySGVhZGVyID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1ibG9jay1oZWFkZXJcIiB9KTtcbiAgaW5zdHJIZWFkZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwicGMtYmxvY2stdGl0bGVcIiwgdGV4dDogXCJJbnN0cnVtZW50c1wiIH0pO1xuXG4gIGlmIChhcHAgJiYgcGx1Z2luICYmIGRhc2hDb250YWluZXIpIHtcbiAgICBjb25zdCByZXJlbmRlciA9ICgpID0+IHJlbmRlckRhc2hib2FyZChhcHAsIHNldHRpbmdzLCBkYXNoQ29udGFpbmVyLCBwbHVnaW4pO1xuXG4gICAgY29uc3QgYnRuR3JvdXAgPSBpbnN0ckhlYWRlci5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYmxvY2staGVhZGVyLWFjdGlvbnNcIiB9KTtcblxuICAgIGNvbnN0IGFzc2V0QWN0aW9uQnRuID0gYnRuR3JvdXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwicGMtYWN0aW9uLWJ0blwiLCB0ZXh0OiBcIlxcdTIxQkIgQXNzZXQgYWN0aW9uXCIgfSk7XG4gICAgYXNzZXRBY3Rpb25CdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIG5ldyBQaWNrQXNzZXRNb2RhbChhcHAsIHBsdWdpbiwgKGZpbGUpID0+IHtcbiAgICAgICAgY29uc3QgbW9kYWwgPSBuZXcgQWRkQXNzZXRMaW5lTW9kYWwoYXBwLCBmaWxlLCBwbHVnaW4pO1xuICAgICAgICBjb25zdCBvcmlnQ2xvc2UgPSBtb2RhbC5vbkNsb3NlID8gbW9kYWwub25DbG9zZS5iaW5kKG1vZGFsKSA6IG51bGw7XG4gICAgICAgIG1vZGFsLm9uQ2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKG9yaWdDbG9zZSkgb3JpZ0Nsb3NlKCk7XG4gICAgICAgICAgcmVyZW5kZXIoKTtcbiAgICAgICAgfTtcbiAgICAgICAgbW9kYWwub3BlbigpO1xuICAgICAgfSkub3BlbigpO1xuICAgIH07XG5cbiAgICBjb25zdCBuZXdBc3NldEJ0biA9IGJ0bkdyb3VwLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcInBjLWFjdGlvbi1idG5cIiwgdGV4dDogXCJcXHVGRjBCIEFzc2V0XCIgfSk7XG4gICAgbmV3QXNzZXRCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNvbnN0IG1vZGFsID0gbmV3IENyZWF0ZUFzc2V0TW9kYWwoYXBwLCBwbHVnaW4pO1xuICAgICAgY29uc3Qgb3JpZ0Nsb3NlID0gbW9kYWwub25DbG9zZSA/IG1vZGFsLm9uQ2xvc2UuYmluZChtb2RhbCkgOiBudWxsO1xuICAgICAgbW9kYWwub25DbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG9yaWdDbG9zZSkgb3JpZ0Nsb3NlKCk7XG4gICAgICAgIHJlcmVuZGVyKCk7XG4gICAgICB9O1xuICAgICAgbW9kYWwub3BlbigpO1xuICAgIH07XG5cbiAgICBjb25zdCB1cGRhdGVCdG4gPSBidG5Hcm91cC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJwYy11cGRhdGUtcHJpY2VzLWJ0blwiLCB0ZXh0OiBcIlxcdTIxQkIgVXBkYXRlIHByaWNlc1wiIH0pO1xuICAgIHVwZGF0ZUJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdXBkYXRlQnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIGNvbnN0IG5vdGljZXMgPSBbXTtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFN0ZXAgMTogcmVmcmVzaCBGWCByYXRlcyAocHJlcmVxdWlzaXRlIGZvciBSVUIgY29udmVyc2lvbnMpLlxuICAgICAgICB1cGRhdGVCdG4udGV4dENvbnRlbnQgPSBcIkZYXFx1MjAyNlwiO1xuICAgICAgICBsZXQgZnhSZXN1bHQgPSB7IHVwZGF0ZWQ6IGZhbHNlIH07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgZnhSZXN1bHQgPSBhd2FpdCB1cGRhdGVGeFJhdGVzKHNldHRpbmdzKTtcbiAgICAgICAgICBpZiAoZnhSZXN1bHQudXBkYXRlZCkge1xuICAgICAgICAgICAgYXdhaXQgcGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgbm90aWNlcy5wdXNoKGBcXHUyNzEzIEZYICR7ZnhSZXN1bHQuc291cmNlfWApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZnhSZXN1bHQuZXJyb3IpIHtcbiAgICAgICAgICAgIG5vdGljZXMucHVzaChgXFx1MjZBMCBGWDogJHtmeFJlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbUENdIEZYIHVwZGF0ZSB0aHJldzpcIiwgZSk7XG4gICAgICAgICAgbm90aWNlcy5wdXNoKGBcXHUyNkEwIEZYOiAke2UubWVzc2FnZSB8fCBlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RlcCAyOiB1cGRhdGUgYXNzZXQgcHJpY2VzLlxuICAgICAgICB1cGRhdGVCdG4udGV4dENvbnRlbnQgPSBcIlVwZGF0aW5nXFx1MjAyNlwiO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB1cGRhdGVBbGxBc3NldFByaWNlcyhhcHAsIHNldHRpbmdzLCAodGlja2VyKSA9PiB7XG4gICAgICAgICAgdXBkYXRlQnRuLnRleHRDb250ZW50ID0gYEZldGNoaW5nICR7dGlja2VyfVxcdTIwMjZgO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHJlc3VsdC51cGRhdGVkID4gMCkge1xuICAgICAgICAgIGNvbnN0IGRpdlRvdGFsID0gcmVzdWx0LnJlc3VsdHMucmVkdWNlKChzLCByKSA9PiBzICsgKHIuZGl2c0FkZGVkIHx8IDApLCAwKTtcbiAgICAgICAgICBsZXQgbXNnID0gYFxcdTI3MTMgJHtyZXN1bHQudXBkYXRlZH0vJHtyZXN1bHQudG90YWx9IGFzc2V0KHMpYDtcbiAgICAgICAgICBpZiAoZGl2VG90YWwgPiAwKSBtc2cgKz0gYCwgJHtkaXZUb3RhbH0gZGl2KHMpYDtcbiAgICAgICAgICBub3RpY2VzLnB1c2gobXNnKTtcbiAgICAgICAgICBhd2FpdCByZW5kZXJEYXNoYm9hcmQoYXBwLCBzZXR0aW5ncywgZGFzaENvbnRhaW5lciwgcGx1Z2luKTtcbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbUENdIFByaWNlIHVwZGF0ZSBpc3N1ZXM6XFxuXCIgKyByZXN1bHQuZXJyb3JzLm1hcChlID0+IGAke2UudGlja2VyfTogJHtlLmVycm9yfWApLmpvaW4oXCJcXG5cIikpO1xuICAgICAgICAgIG5vdGljZXMucHVzaChcIlxcdTI2QTAgUHJpY2VzOiBzZWUgY29uc29sZVwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub3RpY2VzLnB1c2goXCJQcmljZXMgdXAgdG8gZGF0ZVwiKTtcbiAgICAgICAgICBpZiAoZnhSZXN1bHQudXBkYXRlZCkgYXdhaXQgcmVuZGVyRGFzaGJvYXJkKGFwcCwgc2V0dGluZ3MsIGRhc2hDb250YWluZXIsIHBsdWdpbik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGVwIDM6IHRlbXBsYXRlIGNhdGNoLXVwIFx1MjAxNCBhdXRvLWxvZyBkZXBvc2l0IGludGVyZXN0IGV0Yy4gUnVuc1xuICAgICAgICAvLyBhZnRlciBwcmljZXMgc28gY29tcG91bmRpbmcgdXNlcyB0aGUgZnJlc2hlc3QgdG90YWxzLiBCZXN0LWVmZm9ydDpcbiAgICAgICAgLy8gYW55IGZhaWx1cmUgaGVyZSBpcyBsb2dnZWQgYnV0IGRvZXNuJ3QgZmFpbCB0aGUgd2hvbGUgcGlwZWxpbmUuXG4gICAgICAgIHVwZGF0ZUJ0bi50ZXh0Q29udGVudCA9IFwiVGVtcGxhdGVzXFx1MjAyNlwiO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHRwbFJlc3VsdCA9IGF3YWl0IGFwcGx5VGVtcGxhdGVzKGFwcCwgc2V0dGluZ3MpO1xuICAgICAgICAgIGlmICh0cGxSZXN1bHQub3BzQXBwbGllZCA+IDApIHtcbiAgICAgICAgICAgIG5vdGljZXMucHVzaChgXFx1MjcxMyAke3RwbFJlc3VsdC5vcHNBcHBsaWVkfSBhdXRvLW9wKHMpIC8gJHt0cGxSZXN1bHQuZGVwb3NpdHNBZmZlY3RlZH0gZGVwb3NpdChzKWApO1xuICAgICAgICAgICAgYXdhaXQgcmVuZGVyRGFzaGJvYXJkKGFwcCwgc2V0dGluZ3MsIGRhc2hDb250YWluZXIsIHBsdWdpbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiW1BDXSB0ZW1wbGF0ZSBjYXRjaC11cCB0aHJldzpcIiwgZSk7XG4gICAgICAgICAgbm90aWNlcy5wdXNoKGBcXHUyNkEwIHRlbXBsYXRlczogJHtlLm1lc3NhZ2UgfHwgZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNob3dOb3RpY2Uobm90aWNlcy5qb2luKFwiIFxcdTAwQjcgXCIpLCA0NTAwKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgc2hvd05vdGljZShcIlVwZGF0ZSBmYWlsZWQ6IFwiICsgKGUubWVzc2FnZSB8fCBlKSwgNDAwMCk7XG4gICAgICB9XG4gICAgICB1cGRhdGVCdG4uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIHVwZGF0ZUJ0bi50ZXh0Q29udGVudCA9IFwiXFx1MjFCQiBVcGRhdGUgcHJpY2VzXCI7XG4gICAgfTtcbiAgfVxuICBjb25zdCBncmlkID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1hc3NldC1ncmlkXCIgfSk7XG4gIGxldCBvcGVuQXNzZXQgPSBudWxsO1xuICBsZXQgb3BlbkFjY29yZGlvbiA9IG51bGw7XG4gIGNvbnN0IGNhcmRFbHMgPSBbXTtcblxuICBmb3IgKGNvbnN0IGEgb2YgYXNzZXRzKSB7XG4gICAgY29uc3QgbSA9IGNvbXB1dGVBc3NldE1ldHJpY3MoYSk7XG4gICAgY29uc3QgcG9zaXRpdmUgPSBhLnBsQW1vdW50ID49IDA7XG4gICAgY29uc3Qgc3ltID0gYS5jdXJyZW5jeTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBDYXJkIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGNhcmQgPSBncmlkLmNyZWF0ZURpdih7IGNsczogYHBjLWFzc2V0LWNhcmQgJHtwb3NpdGl2ZSA/IFwicGMtYXNzZXQtY2FyZC0tcG9zXCIgOiBcInBjLWFzc2V0LWNhcmQtLW5lZ1wifWAgfSk7XG4gICAgbWFrZUludGVyYWN0aXZlKGNhcmQpO1xuICAgIGNhcmRFbHMucHVzaCh7IGNhcmQsIGFzc2V0OiBhIH0pO1xuXG4gICAgLy8gSGVhZGVyOiB0aWNrZXIgKyB0eXBlIGJhZGdlXG4gICAgY29uc3QgaGRyID0gY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYXNzZXQtaGRyXCIgfSk7XG4gICAgY29uc3QgaGRyTGVmdCA9IGhkci5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYXNzZXQtaGRyLWxlZnRcIiB9KTtcbiAgICBoZHJMZWZ0LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLWFzc2V0LXRpY2tlclwiLCB0ZXh0OiBhLm5hbWUgfSk7XG4gICAgaGRyTGVmdC5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtYXNzZXQtc3ViXCIsXG4gICAgICB0ZXh0OiBgJHthLnR5cGV9IFxcdTAwQjcgJHtzeW19YCArIChhLmN1cnJlbnRRdHkgPiAwID8gYCBcXHUwMEQ3JHthLmN1cnJlbnRRdHl9YCA6IFwiXCIpIH0pO1xuXG4gICAgLy8gQ0FHUiBiYWRnZSAodG9wIHJpZ2h0KSBcdTIwMTQgb25seSBpZiBtZWFuaW5nZnVsXG4gICAgaWYgKE1hdGguYWJzKG0uY2FncikgPiAwLjAxKSB7XG4gICAgICBjb25zdCBjYWdyQ2xzID0gbS5jYWdyID49IDAgPyBcInBjLXBvc1wiIDogXCJwYy1uZWdcIjtcbiAgICAgIGhkci5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IGBwYy1hc3NldC1jYWdyLWJhZGdlICR7Y2FnckNsc31gLFxuICAgICAgICB0ZXh0OiBgJHttLmNhZ3IgPj0gMCA/IFwiK1wiIDogXCJcIn0ke2ZtdChtLmNhZ3IsIDEpfSUgYW51bWAgfSk7XG4gICAgfVxuXG4gICAgLy8gU3BhY2VyXG4gICAgY2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYXNzZXQtc3BhY2VyXCIgfSk7XG5cbiAgICAvLyBIZXJvIHZhbHVlXG4gICAgY2FyZC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1hc3NldC12YWx1ZVwiLFxuICAgICAgdGV4dDogYCR7Zm10KGEuY3VycmVudFZhbHVlLCAwKX0gJHtzeW19YCB9KTtcblxuICAgIC8vIFAmTCByb3dcbiAgICBjb25zdCBwbEFycm93ID0gcG9zaXRpdmUgPyBcIlxcdTIxOTFcIiA6IFwiXFx1MjE5M1wiO1xuICAgIGNvbnN0IHBsQ2xzICAgPSBwb3NpdGl2ZSA/IFwicGMtcG9zXCIgOiBcInBjLW5lZ1wiO1xuICAgIGNvbnN0IHBsUm93ICAgPSBjYXJkLmNyZWF0ZURpdih7IGNsczogXCJwYy1hc3NldC1wbC1yb3dcIiB9KTtcbiAgICBwbFJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IGBwYy1hc3NldC1wbC1hbXQgJHtwbENsc31gLFxuICAgICAgdGV4dDogYCR7Zm10U2lnbmVkKGEucGxBbW91bnQsIDApfSAke3N5bX1gIH0pO1xuICAgIHBsUm93LmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogYHBjLWFzc2V0LXBsLXBjdCAke3BsQ2xzfWAsXG4gICAgICB0ZXh0OiBgJHtwbEFycm93fSAke2ZtdChNYXRoLmFicyhhLnBsUGN0KSwgMSl9JWAgfSk7XG5cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBBY2NvcmRpb24gcGFuZWwgKGluc2VydGVkIHJpZ2h0IGFmdGVyIGNhcmQsIHNwYW5zIGZ1bGwgd2lkdGgpIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGFjY29yZGlvbiA9IGdyaWQuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWFzc2V0LWFjY29yZGlvblwiIH0pO1xuICAgIGFjY29yZGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cbiAgICBjYXJkLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjb25zdCB3YXNPcGVuID0gb3BlbkFzc2V0ID09PSBhO1xuXG4gICAgICAvLyBDbG9zZSBhbnkgb3BlbiBhY2NvcmRpb25cbiAgICAgIGNhcmRFbHMuZm9yRWFjaChjZSA9PiBjZS5jYXJkLmNsYXNzTGlzdC5yZW1vdmUoXCJwYy1hc3NldC1jYXJkLS1vcGVuXCIpKTtcbiAgICAgIGlmIChvcGVuQWNjb3JkaW9uKSB7XG4gICAgICAgIG9wZW5BY2NvcmRpb24uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBvcGVuQWNjb3JkaW9uID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKHdhc09wZW4pIHtcbiAgICAgICAgb3BlbkFzc2V0ID0gbnVsbDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBPcGVuIHRoaXMgYWNjb3JkaW9uXG4gICAgICBvcGVuQXNzZXQgPSBhO1xuICAgICAgb3BlbkFjY29yZGlvbiA9IGFjY29yZGlvbjtcbiAgICAgIGNhcmQuY2xhc3NMaXN0LmFkZChcInBjLWFzc2V0LWNhcmQtLW9wZW5cIik7XG4gICAgICBhY2NvcmRpb24uZW1wdHkoKTtcbiAgICAgIGFjY29yZGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuXG4gICAgICAvLyBEZXRhaWwgaGVhZGVyXG4gICAgICBhY2NvcmRpb24uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwicGMtYXNzZXQtZGV0YWlsLXRpdGxlXCIsIHRleHQ6IGEubmFtZSB9KTtcblxuICAgICAgLy8gS2V5IG1ldHJpY3Mgcm93IChoaWdobGlnaHRlZClcbiAgICAgIGNvbnN0IG1ldHJpY3NSb3cgPSBhY2NvcmRpb24uY3JlYXRlRGl2KHsgY2xzOiBcInBjLWFzc2V0LW1ldHJpY3NcIiB9KTtcbiAgICAgIGNvbnN0IG1ldHJpY0l0ZW1zID0gW1xuICAgICAgICB7IGxhYmVsOiBcIlRvdGFsIFJldHVyblwiLCAgdmFsdWU6IGAke20udG90YWxSZXR1cm4gPj0gMCA/IFwiK1wiIDogXCJcIn0ke2ZtdChtLnRvdGFsUmV0dXJuLCAxKX0lYCwgY2xzOiBtLnRvdGFsUmV0dXJuID49IDAgPyBcInBjLXBvc1wiIDogXCJwYy1uZWdcIiB9LFxuICAgICAgICB7IGxhYmVsOiBcIllpZWxkIG9uIENvc3RcIiwgdmFsdWU6IGAke2ZtdChtLnlpZWxkT25Db3N0LCAyKX0lYCwgY2xzOiBcInBjLW5ldXRyYWxcIiB9LFxuICAgICAgICB7IGxhYmVsOiBcIkNBR1JcIiwgICAgICAgICAgdmFsdWU6IGAke20uY2FnciA+PSAwID8gXCIrXCIgOiBcIlwifSR7Zm10KG0uY2FnciwgMSl9JWAsIGNsczogbS5jYWdyID49IDAgPyBcInBjLXBvc1wiIDogXCJwYy1uZWdcIiB9LFxuICAgICAgICB7IGxhYmVsOiBcIkluY29tZSBUb3RhbFwiLCAgdmFsdWU6IGAke2ZtdChhLnBhc3NpdmVJbmNvbWVUb3QsIDApfSAke3N5bX1gLCBjbHM6IFwicGMtbmV1dHJhbFwiIH0sXG4gICAgICBdO1xuICAgICAgZm9yIChjb25zdCBtaSBvZiBtZXRyaWNJdGVtcykge1xuICAgICAgICBjb25zdCBpdGVtID0gbWV0cmljc1Jvdy5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYXNzZXQtbWV0cmljXCIgfSk7XG4gICAgICAgIGl0ZW0uY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IGBwYy1hc3NldC1tZXRyaWMtdmFsICR7bWkuY2xzfWAsIHRleHQ6IG1pLnZhbHVlIH0pO1xuICAgICAgICBpdGVtLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLWFzc2V0LW1ldHJpYy1sYWJlbFwiLCB0ZXh0OiBtaS5sYWJlbCB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gRGV0YWlsIHJvd3NcbiAgICAgIGNvbnN0IHJvd3MgPSBbXG4gICAgICAgIFtcIkN1cnJlbnQgcHJpY2VcIiwgIGEuY3VycmVudFByaWNlICE9IG51bGwgPyBgJHthLmN1cnJlbnRQcmljZX0gJHtzeW19YCA6IFwiXFx1MjAxNFwiXSxcbiAgICAgICAgW1wiQXZnIGNvc3RcIiwgICAgICAgYS5jdXJyZW50UXR5ID4gMCA/IGAke2ZtdChtLmludmVzdGVkIC8gYS5jdXJyZW50UXR5LCAyKX0gJHtzeW19YCA6IFwiXFx1MjAxNFwiXSxcbiAgICAgICAgW1wiVG90YWwgaW52ZXN0ZWRcIiwgYCR7Zm10KG0uaW52ZXN0ZWQsIDApfSAke3N5bX1gXSxcbiAgICAgICAgW1wiUCZMIChwcmljZSlcIiwgICAgYCR7Zm10U2lnbmVkKGEucGxBbW91bnQsIDApfSAke3N5bX1gXSxcbiAgICAgICAgW1wiUGFzc2l2ZSBpbmNvbWVcIiwgYCR7Zm10KGEucGFzc2l2ZUluY29tZVRvdCwgMCl9ICR7c3ltfWBdLFxuICAgICAgICBbXCJTaW5jZVwiLCAgICAgICAgICBhLmluaXRpYWxEYXRlID8/IFwiXFx1MjAxNFwiXSxcbiAgICAgICAgW1wiTGFzdCB1cGRhdGVkXCIsICAgYS5sYXN0VXBkYXRlZCA/PyBcIlxcdTIwMTRcIl0sXG4gICAgICBdO1xuXG4gICAgICBjb25zdCBkZXRhaWxHcmlkID0gYWNjb3JkaW9uLmNyZWF0ZURpdih7IGNsczogXCJwYy1hc3NldC1kZXRhaWwtZ3JpZFwiIH0pO1xuICAgICAgZm9yIChjb25zdCBbaywgdl0gb2Ygcm93cykge1xuICAgICAgICBjb25zdCByb3cgPSBkZXRhaWxHcmlkLmNyZWF0ZURpdih7IGNsczogXCJwYy1hc3NldC1kZXRhaWwtcm93XCIgfSk7XG4gICAgICAgIHJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtYXNzZXQtZGV0YWlsLWtleVwiLCB0ZXh0OiBrIH0pO1xuICAgICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLWFzc2V0LWRldGFpbC12YWxcIiwgdGV4dDogU3RyaW5nKHYpIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IGNvbXB1dGVBc3NldE1ldHJpY3MsIHJlbmRlckFzc2V0Q2FyZHMgfTtcbiIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIFdBTlRTIFFVRVVFICAocmVhZCAvIHdyaXRlIC8gY2xlYW51cClcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCB7IHRvTnVtLCBnZXRDdXJyZW50TW9udGhLZXkgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuY29uc3QgeyBlbnF1ZXVlV3JpdGUgfSA9IHJlcXVpcmUoXCIuL2xlZGdlci93cml0ZS1xdWV1ZVwiKTtcblxuYXN5bmMgZnVuY3Rpb24gcmVhZFdhbnRzUXVldWUoYXBwLCBzZXR0aW5ncykge1xuICBjb25zdCBwYXRoID0gc2V0dGluZ3Mud2FudHNRdWV1ZVBhdGg7XG4gIGNvbnN0IGZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICBpZiAoIWZpbGUpIHJldHVybiBbXTtcbiAgY29uc3QgZm0gPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk/LmZyb250bWF0dGVyO1xuICBpZiAoIWZtPy5pdGVtcyB8fCAhQXJyYXkuaXNBcnJheShmbS5pdGVtcykpIHJldHVybiBbXTtcbiAgcmV0dXJuIGZtLml0ZW1zLm1hcChpdCA9PiAoe1xuICAgIG5hbWU6IFN0cmluZyhpdC5uYW1lID8/IFwiXCIpLFxuICAgIGNvc3Q6IHRvTnVtKGl0LmNvc3QpLFxuICAgIGRvbmU6IGl0LmRvbmUgPz8gbnVsbCxcbiAgfSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB3cml0ZVdhbnRzUXVldWUoYXBwLCBzZXR0aW5ncywgaXRlbXMpIHtcbiAgY29uc3QgcGF0aCA9IHNldHRpbmdzLndhbnRzUXVldWVQYXRoO1xuICByZXR1cm4gZW5xdWV1ZVdyaXRlKHBhdGgsIGFzeW5jICgpID0+IHtcbiAgICBsZXQgZmlsZSA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gICAgaWYgKCFmaWxlKSB7XG4gICAgICBjb25zdCBkaXIgPSBwYXRoLnNwbGl0KFwiL1wiKS5zbGljZSgwLCAtMSkuam9pbihcIi9cIik7XG4gICAgICBpZiAoZGlyICYmICFhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGRpcikpIHtcbiAgICAgICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihkaXIpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH1cbiAgICAgIGZpbGUgPSBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKHBhdGgsIFwiLS0tXFxuaXRlbXM6IFtdXFxuLS0tXFxuXCIpO1xuICAgIH1cbiAgICBhd2FpdCBhcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmbSkgPT4ge1xuICAgICAgZm0uaXRlbXMgPSBpdGVtcy5tYXAoaXQgPT4ge1xuICAgICAgICBjb25zdCBvID0geyBuYW1lOiBpdC5uYW1lLCBjb3N0OiBpdC5jb3N0IH07XG4gICAgICAgIGlmIChpdC5kb25lKSBvLmRvbmUgPSBpdC5kb25lO1xuICAgICAgICByZXR1cm4gbztcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY2xlYW51cERvbmVJdGVtcyhpdGVtcykge1xuICBjb25zdCBjdXJyZW50TWsgPSBnZXRDdXJyZW50TW9udGhLZXkoKTtcbiAgcmV0dXJuIGl0ZW1zLmZpbHRlcihpdCA9PiAhaXQuZG9uZSB8fCBpdC5kb25lID09PSBjdXJyZW50TWspO1xufVxuXG5mdW5jdGlvbiBnZXRXYW50c1F1ZXVlVG90YWwoaXRlbXMpIHtcbiAgcmV0dXJuIGl0ZW1zLmZpbHRlcihpdCA9PiAhaXQuZG9uZSkucmVkdWNlKChzLCBpdCkgPT4gcyArIGl0LmNvc3QsIDApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgcmVhZFdhbnRzUXVldWUsIHdyaXRlV2FudHNRdWV1ZSwgY2xlYW51cERvbmVJdGVtcywgZ2V0V2FudHNRdWV1ZVRvdGFsIH07XG4iLCAiLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBEQVRBIFNOQVBTSE9UIChzaGFyZWQgYmV0d2VlbiBzdHJhdGVneSAmIGFuYWx5c2lzIHByb21wdHMpXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgeyBNT05USF9OQU1FUyB9ID0gcmVxdWlyZShcIi4uL2NvbnN0YW50c1wiKTtcbmNvbnN0IHsgZm10LCBmbXRTaWduZWQsIGdldEN1cnJlbnRNb250aElkeCwgZ2V0Q3VycmVudFllYXIgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcbmNvbnN0IHsgYnVpbGRBc3NldEZsb3dzQXN5bmMgfSA9IHJlcXVpcmUoXCIuLi9hc3NldHMvZmxvd3NcIik7XG5jb25zdCB7IGJ1aWxkQ2FzaGZsb3dSb3dzIH0gPSByZXF1aXJlKFwiLi4vYnVkZ2V0L2Nhc2hmbG93XCIpO1xuY29uc3QgeyBidWlsZEJ1ZGdldFN1bW1hcnkgfSA9IHJlcXVpcmUoXCIuLi9idWRnZXQvc3VtbWFyeVwiKTtcbmNvbnN0IHsgcmVhZENhcGl0YWxIaXN0b3J5IH0gPSByZXF1aXJlKFwiLi4vYnVkZ2V0L3RpbWVsaW5lXCIpO1xuY29uc3QgeyBnZXRBY2NvdW50QmFsYW5jZSwgZ2V0TGlxdWlkVG90YWwgfSA9IHJlcXVpcmUoXCIuLi9hY2NvdW50cy9iYWxhbmNlXCIpO1xuY29uc3QgeyByZWFkV2FudHNRdWV1ZSB9ID0gcmVxdWlyZShcIi4uL3dhbnRzLXF1ZXVlXCIpO1xuXG5hc3luYyBmdW5jdGlvbiBidWlsZERhdGFTbmFwc2hvdChhcHAsIHNldHRpbmdzKSB7XG4gIGNvbnN0IGFmID0gYXdhaXQgYnVpbGRBc3NldEZsb3dzQXN5bmMoYXBwLCBzZXR0aW5ncyk7XG4gIGNvbnN0IHsgcGFzc2l2ZUluY29tZSwgc2F2ZXMsIGFzc2V0cywgc2F2ZXNCeU1vbnRoS2V5LCBhY2NvdW50cywgYWxsTGVkZ2VyIH0gPSBhZjtcbiAgY29uc3QgY2ZSb3dzICA9IGJ1aWxkQ2FzaGZsb3dSb3dzKGFwcCwgc2V0dGluZ3MsIGFsbExlZGdlcik7XG4gIGNvbnN0IGJ1ZGdldCAgPSBidWlsZEJ1ZGdldFN1bW1hcnkoY2ZSb3dzLCBzZXR0aW5ncywgYWYpO1xuICBjb25zdCBoaXN0b3J5ID0gYXdhaXQgcmVhZENhcGl0YWxIaXN0b3J5KGFwcCwgc2V0dGluZ3MpO1xuICBjb25zdCB3cUl0ZW1zID0gYXdhaXQgcmVhZFdhbnRzUXVldWUoYXBwLCBzZXR0aW5ncyk7XG4gIGNvbnN0IHdxUGVuZGluZyA9IHdxSXRlbXMuZmlsdGVyKGl0ID0+ICFpdC5kb25lKTtcbiAgY29uc3Qgc3ltICAgICA9IHNldHRpbmdzLmhvbWVDdXJyZW5jeVN5bWJvbDtcblxuICBjb25zdCBpbnZlc3RlZENhcGl0YWwgPSBhc3NldHMucmVkdWNlKChzLCBhKSA9PiBzICsgYS5jdXJyZW50VmFsdWVSdWIsIDApO1xuICBjb25zdCBsaXF1aWRUb3RhbCAgICAgPSBnZXRMaXF1aWRUb3RhbChzZXR0aW5ncywgYWNjb3VudHMsIGFsbExlZGdlcik7XG4gIGNvbnN0IHRvdGFsQ2FwaXRhbCAgICA9IGludmVzdGVkQ2FwaXRhbCArIGxpcXVpZFRvdGFsO1xuICBjb25zdCBjdXJNb250aCA9IE1PTlRIX05BTUVTW2dldEN1cnJlbnRNb250aElkeCgpXTtcbiAgY29uc3QgY3VyWWVhciAgPSBnZXRDdXJyZW50WWVhcigpO1xuXG4gIGNvbnN0IGxpbmVzID0gW1xuICAgIGAjIyBDdXJyZW50IFBlcmlvZDogJHtjdXJNb250aH0gJHtjdXJZZWFyfWAsXG4gICAgYGAsXG4gICAgYCMjIEJ1ZGdldCBTdW1tYXJ5YCxcbiAgICBgLSBBY3RpdmUgSW5jb21lOiAgICR7Zm10KGJ1ZGdldC5pbmNvbWUpfSAke3N5bX1gLFxuICAgIGAtIFBhc3NpdmUgSW5jb21lOiAgJHtmbXQoYnVkZ2V0LnBhc3NpdmVJbmNvbWUpfSAke3N5bX1gLFxuICAgIGAtIFRvdGFsIEluY29tZTogICAgJHtmbXQoYnVkZ2V0LnRvdGFsSW5jb21lKX0gJHtzeW19YCxcbiAgICBgLSBOZWVkczogICAgICAgICAgICR7Zm10KGJ1ZGdldC5uZWVkcyl9ICR7c3ltfSAgKCR7YnVkZ2V0LnRvdGFsSW5jb21lICE9PSAwID8gTWF0aC5yb3VuZChNYXRoLmFicyhidWRnZXQubmVlZHMpIC8gYnVkZ2V0LnRvdGFsSW5jb21lICogMTAwKSA6IDB9JSBvZiBpbmNvbWUpYCxcbiAgICBgLSBXYW50czogICAgICAgICAgICR7Zm10KGJ1ZGdldC53YW50cyl9ICR7c3ltfWAsXG4gICAgYC0gU2F2ZXMgKGFjdHVhbCk6ICAke2ZtdChidWRnZXQuc2F2ZXMpfSAke3N5bX1gLFxuICAgIGAtIFNhdmVzICh0YXJnZXQpOiAgJHtmbXQoYnVkZ2V0LnNhdmVzVGFyZ2V0KX0gJHtzeW19ICAoJHtzZXR0aW5ncy5zYXZlc1RhcmdldFBjdH0lIG9mIGluY29tZSlgLFxuICAgIGAtIExlZnQgKGxpcXVpZCk6ICAgJHtmbXQoYnVkZ2V0LmxlZnQpfSAke3N5bX1gLFxuICAgIGBgLFxuICAgIGAjIyBDYXNoZmxvdyBCcmVha2Rvd24gKCR7Y3VyTW9udGh9KWAsXG4gICAgYHwgVHlwZSB8IENhdGVnb3J5IHwgUmVjdXJyaW5nIHwgVGhpcyBNb250aCB8IFByb2plY3RlZCBNby4gfGAsXG4gICAgYHwtLS18LS0tfC0tLXwtLS18LS0tfGAsXG4gICAgLi4uY2ZSb3dzLm1hcChyID0+IHtcbiAgICAgIGNvbnN0IG1rICA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKS5nZXRDdXJyZW50TW9udGhLZXkoKTtcbiAgICAgIGNvbnN0IGFjdCA9IHIubW9udGhzW21rXSAhPSBudWxsID8gZm10KHIubW9udGhzW21rXSkgOiBcIlx1MjAxNFwiO1xuICAgICAgY29uc3QgcHJqID0gci5wcm9qZWN0ZWQgIT0gbnVsbCA/IGZtdChyLnByb2plY3RlZCkgOiBcIlx1MjAxNFwiO1xuICAgICAgcmV0dXJuIGB8ICR7ci50eXBlfSB8ICR7ci5lbW9qaX0gJHtyLmNhdGVnb3J5fSB8ICR7ci5yZWN1cnJpbmcgPyBcIlx1MjcxM1wiIDogXCJcIn0gfCAke2FjdH0gfCAke3Byan0gfGA7XG4gICAgfSksXG4gICAgYGAsXG4gICAgYCMjIFBvcnRmb2xpbyBcdTIwMTQgQXNzZXRzYCxcbiAgICBgfCBUaWNrZXIgfCBUeXBlIHwgQ2N5IHwgUXR5IHwgUHJpY2UgfCBWYWx1ZSB8IFAmTCB8IFAmTCUgfCBEaXYvSW5jb21lIHxgLFxuICAgIGB8LS0tfC0tLXwtLS18LS0tfC0tLXwtLS18LS0tfC0tLXwtLS18YCxcbiAgICAuLi5hc3NldHMubWFwKGEgPT5cbiAgICAgIGB8ICR7YS5uYW1lfSB8ICR7YS50eXBlfSB8ICR7YS5jdXJyZW5jeX0gfCAke2EuY3VycmVudFF0eX0gfCAke2EuY3VycmVudFByaWNlID8/IFwiXHUyMDE0XCJ9IHwgJHtmbXQoYS5jdXJyZW50VmFsdWUsIDIpfSB8ICR7Zm10U2lnbmVkKGEucGxBbW91bnQsIDIpfSB8ICR7Zm10U2lnbmVkKGEucGxQY3QsIDEpfSUgfCAke2ZtdChhLnBhc3NpdmVJbmNvbWVUb3QsIDIpfSB8YFxuICAgICksXG4gICAgYGAsXG4gICAgYCMjIEFjY291bnRzYCxcbiAgICAuLi4oYWNjb3VudHMgJiYgYWNjb3VudHMubGVuZ3RoID4gMFxuICAgICAgPyBbYWNjb3VudHMubWFwKGEgPT4gYCR7YS5uYW1lfSAke2ZtdChnZXRBY2NvdW50QmFsYW5jZShhLCBhbGxMZWRnZXIpKX0ke2EubG9ja2VkID8gXCIgXHVEODNEXHVERDEyXCIgOiBcIlwifWApLmpvaW4oXCIsIFwiKSArIGAgXHUyMDE0IFRvdGFsOiAke2ZtdChsaXF1aWRUb3RhbCl9ICR7c3ltfWBdXG4gICAgICA6IFtgQmFuayAke2ZtdChzZXR0aW5ncy5saXF1aWRCYW5rID8/IDApfSR7c2V0dGluZ3MubGlxdWlkQmFua0lzTGlxdWlkICE9PSBmYWxzZSA/IFwiXCIgOiBcIiBcdUQ4M0RcdUREMTJcIn0sIEJyb2tlciAke2ZtdChzZXR0aW5ncy5saXF1aWRCcm9rZXJDYXNoID8/IDApfSR7c2V0dGluZ3MubGlxdWlkQnJva2VyQ2FzaElzTGlxdWlkICE9PSBmYWxzZSA/IFwiXCIgOiBcIiBcdUQ4M0RcdUREMTJcIn0sIENhc2ggJHtmbXQoc2V0dGluZ3MubGlxdWlkQ2FzaCA/PyAwKX0ke3NldHRpbmdzLmxpcXVpZENhc2hJc0xpcXVpZCAhPT0gZmFsc2UgPyBcIlwiIDogXCIgXHVEODNEXHVERDEyXCJ9LCBCdXNpbmVzcyAke2ZtdChzZXR0aW5ncy5saXF1aWRCdXNpbmVzcyA/PyAwKX0ke3NldHRpbmdzLmxpcXVpZEJ1c2luZXNzSXNMaXF1aWQgPyBcIlwiIDogXCIgXHVEODNEXHVERDEyXCJ9IFx1MjAxNCBUb3RhbDogJHtmbXQobGlxdWlkVG90YWwpfSAke3N5bX1gXSksXG4gICAgYGAsXG4gICAgYCMjIFRvdGFsIENhcGl0YWxgLFxuICAgIGBJbnZlc3RlZDogJHtmbXQoaW52ZXN0ZWRDYXBpdGFsKX0sIExpcXVpZDogJHtmbXQobGlxdWlkVG90YWwpfSwgKipUb3RhbDogJHtmbXQodG90YWxDYXBpdGFsKX0gJHtzeW19KipgLFxuICAgIGBgLFxuICAgIGBgLFxuICBdO1xuXG4gIGlmICh3cVBlbmRpbmcubGVuZ3RoID4gMCkge1xuICAgIGxpbmVzLnB1c2goYCMjIFdhbnRzIFF1ZXVlIChwbGFubmVkIHB1cmNoYXNlcylgKTtcbiAgICBsaW5lcy5wdXNoKGB8IEl0ZW0gfCBFc3QuIENvc3QgfGApO1xuICAgIGxpbmVzLnB1c2goYHwtLS18LS0tfGApO1xuICAgIGZvciAoY29uc3QgaXQgb2Ygd3FQZW5kaW5nKSB7XG4gICAgICBsaW5lcy5wdXNoKGB8ICR7aXQubmFtZX0gfCAke2ZtdChpdC5jb3N0KX0gJHtzeW19IHxgKTtcbiAgICB9XG4gICAgbGluZXMucHVzaChgLSBRdWV1ZSB0b3RhbDogJHtmbXQod3FQZW5kaW5nLnJlZHVjZSgocywgaXQpID0+IHMgKyBpdC5jb3N0LCAwKSl9ICR7c3ltfWApO1xuICAgIGxpbmVzLnB1c2goYGApO1xuICB9XG5cbiAgcmV0dXJuIHsgbGluZXMsIGJ1ZGdldCwgYXNzZXRzLCBoaXN0b3J5LCB0b3RhbENhcGl0YWwsIGN1ck1vbnRoLCBjdXJZZWFyIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyBidWlsZERhdGFTbmFwc2hvdCB9O1xuIiwgIi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gSU5TSUdIVFMgUFJPTVBUIEJVSUxERVJTXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY29uc3QgeyBmbXQgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcbmNvbnN0IHsgZ2V0QWNjb3VudEJhbGFuY2UsIGdldExpcXVpZFRvdGFsIH0gPSByZXF1aXJlKFwiLi4vYWNjb3VudHMvYmFsYW5jZVwiKTtcbmNvbnN0IHsgYnVpbGREYXRhU25hcHNob3QgfSA9IHJlcXVpcmUoXCIuL3NuYXBzaG90XCIpO1xuXG5hc3luYyBmdW5jdGlvbiBidWlsZENoYXRQcm9tcHQoYXBwLCBzZXR0aW5ncywgcURhdGEpIHtcbiAgY29uc3QgeyBsaW5lcywgdG90YWxDYXBpdGFsLCBjdXJNb250aCwgY3VyWWVhciB9ID0gYXdhaXQgYnVpbGREYXRhU25hcHNob3QoYXBwLCBzZXR0aW5ncyk7XG4gIGNvbnN0IHN5bSA9IHNldHRpbmdzLmhvbWVDdXJyZW5jeVN5bWJvbDtcbiAgY29uc3QgcGVyc29uYWxDdHggPSAoc2V0dGluZ3MucGVyc29uYWxDb250ZXh0ID8/IFwiXCIpLnRyaW0oKTtcblxuICBsZXQgc3RyYXRlZ3lUZXh0ID0gXCJcIjtcbiAgY29uc3Qgc3RyYXRGaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChzZXR0aW5ncy5zdHJhdGVneVBhdGgpO1xuICBpZiAoc3RyYXRGaWxlKSBzdHJhdGVneVRleHQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChzdHJhdEZpbGUpO1xuXG4gIGNvbnN0IHFMYWJlbHMgPSB7IGludmVzdEV4cDogXCJJbnZlc3RpbmcgZXhwZXJpZW5jZVwiLCBnb2FsczogXCJHb2Fsc1wiLCBvYmxpZ2F0aW9uczogXCJPYmxpZ2F0aW9uc1wiLCBjb25jZXJuczogXCJDb25jZXJucyAvIHJpc2tzXCIgfTtcbiAgY29uc3QgcUxpbmVzID0gW107XG4gIGlmIChxRGF0YSkge1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHFEYXRhKSkge1xuICAgICAgaWYgKHYgJiYgdi50cmltKCkpIHFMaW5lcy5wdXNoKGAtICR7cUxhYmVsc1trXSB8fCBrfTogJHt2LnRyaW0oKX1gKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBwcm9tcHQgPSBbXG4gICAgYCMgUm9sZWAsXG4gICAgYFlvdSBhcmUgYSBwZXJzb25hbCBmaW5hbmNlIGFkdmlzb3IgYW5kIGNhcGl0YWwgZ3Jvd3RoIGNvbnN1bHRhbnQuYCxcbiAgICBgYCxcbiAgICBwZXJzb25hbEN0eCA/IGAjIFVzZXIgUHJvZmlsZVxcbiR7cGVyc29uYWxDdHh9XFxuYCA6IFwiXCIsXG4gICAgcUxpbmVzLmxlbmd0aCA+IDAgPyBgIyBBZGRpdGlvbmFsIENvbnRleHRcXG4ke3FMaW5lcy5qb2luKFwiXFxuXCIpfVxcbmAgOiBcIlwiLFxuICAgIHN0cmF0ZWd5VGV4dCA/IGAjIEN1cnJlbnQgU3RyYXRlZ3lcXG4ke3N0cmF0ZWd5VGV4dH1cXG5cXG4tLS1gIDogXCJcIixcbiAgICBgIyBGaW5hbmNpYWwgRGF0YSBcdTIwMTQgJHtjdXJNb250aH0gJHtjdXJZZWFyfWAsXG4gICAgYGAsXG4gICAgLi4ubGluZXMsXG4gICAgYC0tLWAsXG4gICAgYGAsXG4gICAgYFRvdGFsIGNhcGl0YWw6ICoqJHtmbXQodG90YWxDYXBpdGFsKX0gJHtzeW19KipgLFxuICAgIGBgLFxuICAgIGBSZXZpZXcgdGhlIGRhdGEgYWJvdmUuIEJyaWVmbHkgc3VtbWFyaXplIHdoYXQgeW91IHNlZSBcdTIwMTQgY2FwaXRhbCBzdGF0ZSwgYW55IG5vdGFibGUgY2hhbmdlcyBvciBjb25jZXJucy4gVGhlbiBhc2s6IFwiV2hhdCB3b3VsZCB5b3UgbGlrZSB0byBmb2N1cyBvbj9cImAsXG4gICAgYGAsXG4gICAgYF9LZXkgZmlsZXM6IHN0cmF0ZWd5IFx1MjE5MiBcXGAke3NldHRpbmdzLnN0cmF0ZWd5UGF0aH1cXGBfYCxcbiAgXS5maWx0ZXIoQm9vbGVhbik7XG5cbiAgcmV0dXJuIHByb21wdC5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBidWlsZEFnZW50UHJvbXB0KHNldHRpbmdzLCBxRGF0YSwgYWNjb3VudHMsIGFsbExlZGdlcikge1xuICBjb25zdCBwZXJzb25hbEN0eCA9IChzZXR0aW5ncy5wZXJzb25hbENvbnRleHQgPz8gXCJcIikudHJpbSgpO1xuICBjb25zdCBzeW0gPSBzZXR0aW5ncy5ob21lQ3VycmVuY3lTeW1ib2w7XG4gIGNvbnN0IGxpcXVpZFRvdGFsID0gZ2V0TGlxdWlkVG90YWwoc2V0dGluZ3MsIGFjY291bnRzLCBhbGxMZWRnZXIpO1xuXG4gIGNvbnN0IHFMYWJlbHMgPSB7IGludmVzdEV4cDogXCJJbnZlc3RpbmcgZXhwZXJpZW5jZVwiLCBnb2FsczogXCJHb2Fsc1wiLCBvYmxpZ2F0aW9uczogXCJPYmxpZ2F0aW9uc1wiLCBjb25jZXJuczogXCJDb25jZXJucyAvIHJpc2tzXCIgfTtcbiAgY29uc3QgcUxpbmVzID0gW107XG4gIGlmIChxRGF0YSkge1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKHFEYXRhKSkge1xuICAgICAgaWYgKHYgJiYgdi50cmltKCkpIHFMaW5lcy5wdXNoKGAtICR7cUxhYmVsc1trXSB8fCBrfTogJHt2LnRyaW0oKX1gKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBwcm9tcHQgPSBbXG4gICAgYCMgUm9sZWAsXG4gICAgYFlvdSBhcmUgYSBwZXJzb25hbCBmaW5hbmNlIGFkdmlzb3IgYW5kIGNhcGl0YWwgZ3Jvd3RoIGNvbnN1bHRhbnQuYCxcbiAgICBgWW91IGhhdmUgYWNjZXNzIHRvIHRoZSB1c2VyJ3MgT2JzaWRpYW4gdmF1bHQgd2l0aCBmaW5hbmNpYWwgZGF0YS5gLFxuICAgIGBgLFxuICAgIHBlcnNvbmFsQ3R4ID8gYCMgVXNlciBQcm9maWxlXFxuJHtwZXJzb25hbEN0eH1cXG5gIDogXCJcIixcbiAgICBxTGluZXMubGVuZ3RoID4gMCA/IGAjIEFkZGl0aW9uYWwgQ29udGV4dFxcbiR7cUxpbmVzLmpvaW4oXCJcXG5cIil9XFxuYCA6IFwiXCIsXG4gICAgYCMgRGF0YSBMb2NhdGlvbmAsXG4gICAgYFJlYWQgdGhlIGZvbGxvd2luZyBmaWxlcyB0byB1bmRlcnN0YW5kIHRoZSB1c2VyJ3MgZmluYW5jaWFsIHBvc2l0aW9uOmAsXG4gICAgYGAsXG4gICAgYC0gKipDYXNoZmxvdyBjYXRlZ29yaWVzKio6IFxcYCR7c2V0dGluZ3MuY2F0ZWdvcmllc0ZvbGRlcn0vXFxgIFx1MjAxNCBlYWNoIC5tZCBmaWxlIGhhcyBZQU1MIGZyb250bWF0dGVyIHdpdGggdHlwZSAoSW5jb21lL05lZWRzL1dhbnRzKSwgbW9udGhseSB2YWx1ZXMgKG0wMS1tMTIpYCxcbiAgICBgLSAqKkFzc2V0cyoqOiBcXGAke3NldHRpbmdzLmFzc2V0c0ZvbGRlcn0vXFxgIFx1MjAxNCBlYWNoIC5tZCBmaWxlIGhhcyBmcm9udG1hdHRlciAodHlwZSwgY3VycmVuY3ksIHF0eSwgcHJpY2UpICsgbG9nIGxpbmVzIGluIGJvZHkgKFlZWVktTU0tREQgfCBvcCB8IHF0eSB8IHByaWNlKWAsXG4gICAgYC0gKipTdHJhdGVneSoqOiBcXGAke3NldHRpbmdzLnN0cmF0ZWd5UGF0aH1cXGAgXHUyMDE0IGN1cnJlbnQgc3RyYXRlZ3kgZG9jdW1lbnQgKG1heSBub3QgZXhpc3QgeWV0KWAsXG4gICAgYC0gKipEYXNoYm9hcmQgbm90ZSoqOiBcXGAke3NldHRpbmdzLmRhc2hib2FyZFBhdGh9XFxgYCxcbiAgICBgYCxcbiAgICBgIyBBY2NvdW50c2AsXG4gICAgLi4uKGFjY291bnRzICYmIGFjY291bnRzLmxlbmd0aCA+IDBcbiAgICAgID8gW2FjY291bnRzLm1hcChhID0+IGAke2EubmFtZX0gJHtmbXQoZ2V0QWNjb3VudEJhbGFuY2UoYSwgYWxsTGVkZ2VyIHx8IFtdKSl9JHthLmxvY2tlZCA/IFwiIFx1RDgzRFx1REQxMlwiIDogXCJcIn1gKS5qb2luKFwiLCBcIikgKyBgIFx1MjAxNCBUb3RhbDogJHtmbXQobGlxdWlkVG90YWwpfSAke3N5bX1gXVxuICAgICAgOiBbYEJhbmsgJHtmbXQoc2V0dGluZ3MubGlxdWlkQmFuayA/PyAwKX0sIEJyb2tlciAke2ZtdChzZXR0aW5ncy5saXF1aWRCcm9rZXJDYXNoID8/IDApfSwgQ2FzaCAke2ZtdChzZXR0aW5ncy5saXF1aWRDYXNoID8/IDApfSwgQnVzaW5lc3MgJHtmbXQoc2V0dGluZ3MubGlxdWlkQnVzaW5lc3MgPz8gMCl9IFx1MjAxNCBUb3RhbDogJHtmbXQobGlxdWlkVG90YWwpfSAke3N5bX1gXSksXG4gICAgYGAsXG4gICAgYCMgTGVkZ2VyYCxcbiAgICBgRmluYW5jaWFsIHRyYW5zYWN0aW9uIGxvZzogXFxgJHtzZXR0aW5ncy5sZWRnZXJGb2xkZXIgfHwgXCJmaW5hbmNlL0RhdGFcIn0vbGVkZ2VyLSouanNvbmxcXGBgLFxuICAgIGBgLFxuICAgIGAjIEluc3RydWN0aW9uc2AsXG4gICAgYDEuIFJlYWQgdGhlIGFzc2V0IGZpbGVzIGFuZCBjYXRlZ29yeSBmaWxlcyB0byB1bmRlcnN0YW5kIHRoZSBjdXJyZW50IHN0YXRlYCxcbiAgICBgMi4gQ29uc2lkZXIgQk9USCBpbnZlc3RlZCBhc3NldHMgQU5EIGxpcXVpZCBwb29scyBcdTIwMTQgdG90YWwgY2FwaXRhbCBpcyBhc3NldHMgKyBsaXF1aWRgLFxuICAgIGAzLiBTdW1tYXJpemUgd2hhdCB5b3Ugc2VlIFx1MjAxNCBjYXBpdGFsIHN0cnVjdHVyZSwgY2FzaGZsb3cgaGVhbHRoLCBwb3J0Zm9saW8gc3RhdHVzYCxcbiAgICBgNC4gQXNrOiBcIldoYXQgd291bGQgeW91IGxpa2UgdG8gZm9jdXMgb24/XCJgLFxuICAgIGBgLFxuICAgIGBXaGVuIG1ha2luZyBjaGFuZ2VzIHRvIGZpbGVzLCBmb2xsb3cgdGhlIGV4aXN0aW5nIGZvcm1hdCBleGFjdGx5LmAsXG4gIF0uZmlsdGVyKEJvb2xlYW4pO1xuXG4gIHJldHVybiBwcm9tcHQuam9pbihcIlxcblwiKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IGJ1aWxkQ2hhdFByb21wdCwgYnVpbGRBZ2VudFByb21wdCB9O1xuIiwgImNvbnN0IHsgTW9kYWwgfSA9IHJlcXVpcmUoXCJvYnNpZGlhblwiKTtcbmNvbnN0IHsgcmVhZEFjY291bnRzIH0gPSByZXF1aXJlKFwiLi4vYWNjb3VudHMvaW9cIik7XG5jb25zdCB7IHJlYWRMZWRnZXJNdWx0aVllYXIgfSA9IHJlcXVpcmUoXCIuLi9sZWRnZXIvaW9cIik7XG5jb25zdCB7IGJ1aWxkQ2hhdFByb21wdCwgYnVpbGRBZ2VudFByb21wdCB9ID0gcmVxdWlyZShcIi4uL2FpL3Byb21wdHNcIik7XG5cbmNsYXNzIEluc2lnaHRzTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIGNvbnN0cnVjdG9yKGFwcCwgc2V0dGluZ3MpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB0aGlzLnFEYXRhID0ge307XG4gICAgdGhpcy5zY3JlZW4gPSAwOyAvLyAwID0gY29udGV4dCwgMSA9IGNhcmRzXG4gIH1cblxuICBvbk9wZW4oKSB7IHRoaXMucmVuZGVyKCk7IH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwicGMtaW5zaWdodHMtbW9kYWxcIik7XG5cbiAgICBpZiAodGhpcy5zY3JlZW4gPT09IDApIHRoaXMucmVuZGVyQ29udGV4dFNjcmVlbihjb250ZW50RWwpO1xuICAgIGVsc2UgdGhpcy5yZW5kZXJDYXJkc1NjcmVlbihjb250ZW50RWwpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNjcmVlbiAxOiBPcHRpb25hbCBjb250ZXh0IHF1ZXN0aW9ubmFpcmUgXHUyNTAwXHUyNTAwXG4gIHJlbmRlckNvbnRleHRTY3JlZW4oZWwpIHtcbiAgICBlbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1pbnNpZ2h0cy10aXRsZVwiLCB0ZXh0OiBcIlByZXBhcmUgQW5hbHlzaXNcIiB9KTtcbiAgICBlbC5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwicGMtaW5zaWdodHMtZGVzY1wiLFxuICAgICAgdGV4dDogXCJIZWxwIHRoZSBBSSB1bmRlcnN0YW5kIHlvdXIgc2l0dWF0aW9uIGJldHRlci4gT3B0aW9uYWwgXHUyMDE0IHNraXAgaWYgeW91IHByZWZlci5cIiB9KTtcblxuICAgIGNvbnN0IGZvcm0gPSBlbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtaW5zaWdodHMtY29udGV4dC1mb3JtXCIgfSk7XG4gICAgY29uc3QgcXVlc3Rpb25zID0gW1xuICAgICAgW1wiaW52ZXN0RXhwXCIsICAgXCJJbnZlc3RpbmcgZXhwZXJpZW5jZT9cIiwgICAgICBcImUuZy4gYmVnaW5uZXIsIDMgeWVhcnMgYWN0aXZlXCJdLFxuICAgICAgW1wiZ29hbHNcIiwgICAgICAgXCJXaGF0IGFyZSB5b3VyIGdvYWxzP1wiLCAgICAgICAgXCJlLmcuIHBhc3NpdmUgaW5jb21lLCBlYXJseSByZXRpcmVtZW50XCJdLFxuICAgICAgW1wib2JsaWdhdGlvbnNcIiwgXCJXaGF0IGFyZSB5b3VyIG9ibGlnYXRpb25zP1wiLCAgXCJlLmcuIG1vcnRnYWdlIDMway9tbywgSVAgdGF4XCJdLFxuICAgICAgW1wiY29uY2VybnNcIiwgICAgXCJDb25jZXJucyAvIHJpc2tzP1wiLCAgICAgICAgICAgXCJlLmcuIGluZmxhdGlvbiwgam9iIGluc3RhYmlsaXR5XCJdLFxuICAgIF07XG4gICAgZm9yIChjb25zdCBba2V5LCBsYWJlbCwgcGxhY2Vob2xkZXJdIG9mIHF1ZXN0aW9ucykge1xuICAgICAgY29uc3Qgcm93ID0gZm9ybS5jcmVhdGVEaXYoeyBjbHM6IFwicGMtaW5zaWdodHMtcS1yb3dcIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcImxhYmVsXCIsIHsgY2xzOiBcInBjLWluc2lnaHRzLXEtbGFiZWxcIiwgdGV4dDogbGFiZWwgfSk7XG4gICAgICBjb25zdCBpbnAgPSByb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBwbGFjZWhvbGRlciwgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIiB9KTtcbiAgICAgIGlmICh0aGlzLnFEYXRhW2tleV0pIGlucC52YWx1ZSA9IHRoaXMucURhdGFba2V5XTtcbiAgICAgIGlucC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4geyB0aGlzLnFEYXRhW2tleV0gPSBpbnAudmFsdWU7IH0pO1xuICAgIH1cblxuICAgIGZvcm0uY3JlYXRlRWwoXCJwXCIsIHsgY2xzOiBcInBjLWluc2lnaHRzLXEtaGludFwiLFxuICAgICAgdGV4dDogXCJUaGVzZSBhbnN3ZXJzIGFyZSBhZGRlZCB0byB0aGUgcHJvbXB0IG9ubHkuIE5vdGhpbmcgaXMgc2F2ZWQgb3Igc2hhcmVkLlwiIH0pO1xuXG4gICAgY29uc3QgbmF2ID0gZWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWluc2lnaHRzLW5hdlwiIH0pO1xuICAgIGNvbnN0IHNraXBCdG4gPSBuYXYuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwicGMtaW5zaWdodHMtbmF2LWJ0blwiLCB0ZXh0OiBcIlNraXAgXHUyMTkyXCIgfSk7XG4gICAgc2tpcEJ0bi5vbmNsaWNrID0gKCkgPT4geyB0aGlzLnNjcmVlbiA9IDE7IHRoaXMucmVuZGVyKCk7IH07XG4gICAgY29uc3QgbmV4dEJ0biA9IG5hdi5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJwYy1pbnNpZ2h0cy1uYXYtYnRuIG1vZC1jdGFcIiwgdGV4dDogXCJDb250aW51ZSBcdTIxOTJcIiB9KTtcbiAgICBuZXh0QnRuLm9uY2xpY2sgPSAoKSA9PiB7IHRoaXMuc2NyZWVuID0gMTsgdGhpcy5yZW5kZXIoKTsgfTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBTY3JlZW4gMjogQ2hhdCAvIEFnZW50IGNhcmRzIFx1MjUwMFx1MjUwMFxuICByZW5kZXJDYXJkc1NjcmVlbihlbCkge1xuICAgIGVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLWluc2lnaHRzLXRpdGxlXCIsIHRleHQ6IFwiQ2hvb3NlIEFJIG1vZGVcIiB9KTtcbiAgICBlbC5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwicGMtaW5zaWdodHMtZGVzY1wiLFxuICAgICAgdGV4dDogXCJObyBkYXRhIGlzIHNoYXJlZCBhdXRvbWF0aWNhbGx5LlwiIH0pO1xuXG4gICAgY29uc3QgY2FyZHMgPSBlbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtaW5zaWdodHMtY2FyZHNcIiB9KTtcblxuICAgIC8vIENhcmQgMTogQUkgQ2hhdFxuICAgIGNvbnN0IGNoYXRDYXJkID0gY2FyZHMuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWluc2lnaHRzLWNhcmRcIiB9KTtcbiAgICBjaGF0Q2FyZC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1pbnNpZ2h0cy1jYXJkLWljb25cIiwgdGV4dDogXCJcdUQ4M0RcdURDQUNcIiB9KTtcbiAgICBjaGF0Q2FyZC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1pbnNpZ2h0cy1jYXJkLXRpdGxlXCIsIHRleHQ6IFwiQUkgQ2hhdFwiIH0pO1xuICAgIGNoYXRDYXJkLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJwYy1pbnNpZ2h0cy1jYXJkLWRlc2NcIixcbiAgICAgIHRleHQ6IFwiQ29weSBwcm9tcHQgd2l0aCBhbGwgeW91ciBkYXRhIHRvIHBhc3RlIGludG8gQ2xhdWRlLCBDaGF0R1BULCBvciBhbnkgQUkgY2hhdC5cIiB9KTtcbiAgICBjb25zdCBjaGF0U3RhdHVzID0gY2hhdENhcmQuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWluc2lnaHRzLWNhcmQtc3RhdHVzXCIgfSk7XG4gICAgY29uc3QgY2hhdEJ0biA9IGNoYXRDYXJkLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcInBjLWluc2lnaHRzLWNhcmQtYnRuIG1vZC1jdGFcIiwgdGV4dDogXCJDb3B5IHByb21wdFwiIH0pO1xuXG4gICAgY2hhdEJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY2hhdEJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICBjaGF0U3RhdHVzLnRleHRDb250ZW50ID0gXCJCdWlsZGluZ1x1MjAyNlwiO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY3R4ID0gYXdhaXQgYnVpbGRDaGF0UHJvbXB0KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLCB0aGlzLnFEYXRhKTtcbiAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoY3R4KTtcbiAgICAgICAgYXdhaXQgdGhpcy5fc2F2ZVByb21wdChjdHgsIFwiY2hhdF9wcm9tcHQubWRcIik7XG4gICAgICAgIGNoYXRTdGF0dXMudGV4dENvbnRlbnQgPSBcIlx1MjcxMyBDb3BpZWQhXCI7XG4gICAgICAgIGNoYXRTdGF0dXMuY2xhc3NMaXN0LmFkZChcInBjLWluc2lnaHRzLXN0YXR1cy0tb2tcIik7XG4gICAgICAgIGNoYXRCdG4udGV4dENvbnRlbnQgPSBcIlx1MjcxMyBDb3BpZWRcIjtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmNsb3NlKCksIDEyMDApO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjaGF0U3RhdHVzLnRleHRDb250ZW50ID0gXCJFcnJvcjogXCIgKyBlLm1lc3NhZ2U7XG4gICAgICAgIGNoYXRCdG4uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQ2FyZCAyOiBBSSBBZ2VudFxuICAgIGNvbnN0IGFnZW50Q2FyZCA9IGNhcmRzLmNyZWF0ZURpdih7IGNsczogXCJwYy1pbnNpZ2h0cy1jYXJkXCIgfSk7XG4gICAgYWdlbnRDYXJkLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLWluc2lnaHRzLWNhcmQtaWNvblwiLCB0ZXh0OiBcIlx1RDgzRVx1REQxNlwiIH0pO1xuICAgIGFnZW50Q2FyZC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1pbnNpZ2h0cy1jYXJkLXRpdGxlXCIsIHRleHQ6IFwiQUkgQWdlbnRcIiB9KTtcbiAgICBhZ2VudENhcmQuY3JlYXRlRWwoXCJwXCIsIHsgY2xzOiBcInBjLWluc2lnaHRzLWNhcmQtZGVzY1wiLFxuICAgICAgdGV4dDogXCJDb3B5IHByb21wdCB3aXRoIHZhdWx0IHBhdGhzIGZvciBDdXJzb3IsIENsYXVkZSBDb2RlLCBDb3BpbG90LCBvciBhbnkgYWdlbnQgd2l0aCBmaWxlIGFjY2Vzcy5cIiB9KTtcbiAgICBjb25zdCBhZ2VudFN0YXR1cyA9IGFnZW50Q2FyZC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtaW5zaWdodHMtY2FyZC1zdGF0dXNcIiB9KTtcbiAgICBjb25zdCBhZ2VudEJ0biA9IGFnZW50Q2FyZC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJwYy1pbnNpZ2h0cy1jYXJkLWJ0blwiLCB0ZXh0OiBcIkNvcHkgcHJvbXB0XCIgfSk7XG5cbiAgICBhZ2VudEJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgYWdlbnRCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgYWdlbnRTdGF0dXMudGV4dENvbnRlbnQgPSBcIkJ1aWxkaW5nXHUyMDI2XCI7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBhY2N0cyA9IGF3YWl0IHJlYWRBY2NvdW50cyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIGNvbnN0IGxlZGcgPSBhd2FpdCByZWFkTGVkZ2VyTXVsdGlZZWFyKHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLCBbbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpXSk7XG4gICAgICAgIGNvbnN0IGN0eCA9IGJ1aWxkQWdlbnRQcm9tcHQodGhpcy5zZXR0aW5ncywgdGhpcy5xRGF0YSwgYWNjdHMsIGxlZGcpO1xuICAgICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChjdHgpO1xuICAgICAgICBhd2FpdCB0aGlzLl9zYXZlUHJvbXB0KGN0eCwgXCJhZ2VudF9wcm9tcHQubWRcIik7XG4gICAgICAgIGFnZW50U3RhdHVzLnRleHRDb250ZW50ID0gXCJcdTI3MTMgQ29waWVkIVwiO1xuICAgICAgICBhZ2VudFN0YXR1cy5jbGFzc0xpc3QuYWRkKFwicGMtaW5zaWdodHMtc3RhdHVzLS1va1wiKTtcbiAgICAgICAgYWdlbnRCdG4udGV4dENvbnRlbnQgPSBcIlx1MjcxMyBDb3BpZWRcIjtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmNsb3NlKCksIDEyMDApO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBhZ2VudFN0YXR1cy50ZXh0Q29udGVudCA9IFwiRXJyb3I6IFwiICsgZS5tZXNzYWdlO1xuICAgICAgICBhZ2VudEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBCYWNrICsgdGlwc1xuICAgIGNvbnN0IG5hdiA9IGVsLmNyZWF0ZURpdih7IGNsczogXCJwYy1pbnNpZ2h0cy1uYXZcIiB9KTtcbiAgICBjb25zdCBiYWNrQnRuID0gbmF2LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcInBjLWluc2lnaHRzLW5hdi1idG5cIiwgdGV4dDogXCJcdTIxOTAgQmFja1wiIH0pO1xuICAgIGJhY2tCdG4ub25jbGljayA9ICgpID0+IHsgdGhpcy5zY3JlZW4gPSAwOyB0aGlzLnJlbmRlcigpOyB9O1xuXG4gICAgY29uc3QgdGlwcyA9IGVsLmNyZWF0ZURpdih7IGNsczogXCJwYy1pbnNpZ2h0cy10aXBzXCIgfSk7XG4gICAgdGlwcy5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIlx1RDgzRFx1RENBMSBBZGp1c3QgdGhlIHByb21wdCBhcyB5b3UgbGlrZSBcdTIwMTQgYXNrIGFueXRoaW5nIGFib3V0IHlvdXIgZmluYW5jZXMuXCIgfSk7XG4gICAgdGlwcy5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIlx1MjZBMFx1RkUwRiBBSSBtYXkgbWFrZSBtaXN0YWtlcy4gRG9uJ3QgZm9sbG93IHJlY29tbWVuZGF0aW9ucyBibGluZGx5IFx1MjAxNCBpdCdzIGFsd2F5cyB5b3VyIGNhbGwuXCIgfSk7XG4gIH1cblxuICBhc3luYyBfc2F2ZVByb21wdChjdHgsIGZpbGVOYW1lKSB7XG4gICAgY29uc3QgYWlEaXIgPSB0aGlzLnNldHRpbmdzLmNhdGVnb3JpZXNGb2xkZXIucmVwbGFjZSgvY2F0ZWdvcmllc1xcLz8kLywgXCJhaV9jb250ZXh0XCIpO1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGFpRGlyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGFpRGlyKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgfVxuICAgIGNvbnN0IG91dFBhdGggPSBgJHthaURpcn0vJHtmaWxlTmFtZX1gO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG91dFBhdGgpO1xuICAgIGlmIChleGlzdGluZykgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBjdHgpO1xuICAgIGVsc2UgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKG91dFBhdGgsIGN0eCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IEluc2lnaHRzTW9kYWwgfTtcbiIsICJmdW5jdGlvbiByZW5kZXJBbmFseXNpc0Jsb2NrKGNvbnRhaW5lciwgYXBwLCBzZXR0aW5ncykge1xuICAvLyBMYXp5IHJlcXVpcmUgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jeVxuICBjb25zdCB7IEluc2lnaHRzTW9kYWwgfSA9IHJlcXVpcmUoXCIuLi9tb2RhbHMvaW5zaWdodHNcIik7XG5cbiAgY29uc3QgZGVzYyA9IGNvbnRhaW5lci5jcmVhdGVFbChcInBcIiwgeyBjbHM6IFwicGMtYW5hbHlzaXMtZGVzY1wiIH0pO1xuICBkZXNjLnRleHRDb250ZW50ID0gXCJOZWVkIGluc2lnaHRzIG9uIHlvdXIgY2FwaXRhbD8gUHJlcGFyZSBhIHByb21wdCBmb3IgeW91ciBBSS5cIjtcblxuICBjb25zdCBidG5Sb3cgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWFuYWx5c2lzLWJ0bi1yb3dcIiB9KTtcbiAgY29uc3QgYnRuID0gYnRuUm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICBjbHM6IFwicGMtYW5hbHlzaXMtYnRuXCIsXG4gICAgdGV4dDogXCJQcmVwYXJlIEFuYWx5c2lzXCIsXG4gIH0pO1xuICBidG4ub25jbGljayA9ICgpID0+IG5ldyBJbnNpZ2h0c01vZGFsKGFwcCwgc2V0dGluZ3MpLm9wZW4oKTtcblxuICBjb25zdCB0aXAgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWFuYWx5c2lzLXRpcFwiIH0pO1xuICB0aXAuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCJBZGp1c3QgdGhlIHByb21wdCBhcyB5b3UgbGlrZS4gVGhpcyB0b29sIGRvZXMgbm90IHByb3ZpZGUgaW52ZXN0bWVudCByZWNvbW1lbmRhdGlvbnMgXFx1MjAxNCBhbHdheXMgdXNlIHlvdXIgb3duIGp1ZGdtZW50LlwiIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgcmVuZGVyQW5hbHlzaXNCbG9jayB9O1xuIiwgImNvbnN0IHsgZm10LCBnZXRDdXJyZW50TW9udGhLZXksIG1ha2VJbnRlcmFjdGl2ZSwga2lsbFdoZWVsQ2hhbmdlIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5jb25zdCB7IHJlYWRXYW50c1F1ZXVlLCB3cml0ZVdhbnRzUXVldWUsIGNsZWFudXBEb25lSXRlbXMgfSA9IHJlcXVpcmUoXCIuLi93YW50cy1xdWV1ZVwiKTtcblxuZnVuY3Rpb24gcmVuZGVyV2FudHNRdWV1ZShjb250YWluZXIsIGFwcCwgc2V0dGluZ3MsIHJlZnJlc2hEYXNoYm9hcmQpIHtcbiAgbGV0IGl0ZW1zID0gW107ICAgLy8gbG9hZGVkIGFzeW5jIGJlbG93XG4gIGxldCBzYXZpbmcgPSBmYWxzZTtcblxuICBjb25zdCB3cmFwID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy13cS13cmFwXCIgfSk7XG5cbiAgY29uc3Qgc2F2ZSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoc2F2aW5nKSByZXR1cm47XG4gICAgc2F2aW5nID0gdHJ1ZTtcbiAgICBhd2FpdCB3cml0ZVdhbnRzUXVldWUoYXBwLCBzZXR0aW5ncywgaXRlbXMpO1xuICAgIHNhdmluZyA9IGZhbHNlO1xuICB9O1xuXG4gIGNvbnN0IHJlYnVpbGRMaXN0ID0gKCkgPT4ge1xuICAgIGxpc3RFbC5lbXB0eSgpO1xuICAgIGNvbnN0IHN5bSA9IHNldHRpbmdzLmhvbWVDdXJyZW5jeVN5bWJvbDtcbiAgICBjb25zdCBjdXJyZW50TWsgPSBnZXRDdXJyZW50TW9udGhLZXkoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ID0gaXRlbXNbaV07XG4gICAgICBjb25zdCBpc0RvbmUgPSAhIWl0LmRvbmU7XG4gICAgICBjb25zdCByb3cgPSBsaXN0RWwuY3JlYXRlRGl2KHsgY2xzOiBgcGMtd3EtaXRlbSAke2lzRG9uZSA/IFwicGMtd3EtaXRlbS0tZG9uZVwiIDogXCJcIn1gIH0pO1xuXG4gICAgICAvLyBDaGVja2JveFxuICAgICAgY29uc3QgY2hlY2sgPSByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLXdxLWNoZWNrXCIsIHRleHQ6IGlzRG9uZSA/IFwiXFx1MjYxMVwiIDogXCJcXHUyNjEwXCIgfSk7XG4gICAgICBtYWtlSW50ZXJhY3RpdmUoY2hlY2ssIFwiY2hlY2tib3hcIik7XG4gICAgICBjaGVjay5vbmNsaWNrID0gYXN5bmMgKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgaWYgKGlzRG9uZSkge1xuICAgICAgICAgIGl0LmRvbmUgPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGl0LmRvbmUgPSBjdXJyZW50TWs7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgc2F2ZSgpO1xuICAgICAgICByZWJ1aWxkTGlzdCgpO1xuICAgICAgICB1cGRhdGVGb290ZXIoKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIE5hbWVcbiAgICAgIHJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtd3EtbmFtZVwiLCB0ZXh0OiBpdC5uYW1lIH0pO1xuXG4gICAgICAvLyBDb3N0XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLXdxLWNvc3RcIiwgdGV4dDogYCR7Zm10KGl0LmNvc3QpfSAke3N5bX1gIH0pO1xuXG4gICAgICAvLyBSZW1vdmUgYnV0dG9uXG4gICAgICBjb25zdCBybSA9IHJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtd3Etcm1cIiwgdGV4dDogXCJcXHUwMEQ3XCIgfSk7XG4gICAgICBtYWtlSW50ZXJhY3RpdmUocm0pO1xuICAgICAgcm0ub25jbGljayA9IGFzeW5jIChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGl0ZW1zLnNwbGljZShpLCAxKTtcbiAgICAgICAgYXdhaXQgc2F2ZSgpO1xuICAgICAgICByZWJ1aWxkTGlzdCgpO1xuICAgICAgICB1cGRhdGVGb290ZXIoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbGlzdEVsLmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy13cS1lbXB0eVwiLCB0ZXh0OiBcIk5vIHBsYW5uZWQgcHVyY2hhc2VzXCIgfSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHVwZGF0ZUZvb3RlciA9ICgpID0+IHtcbiAgICBjb25zdCBwZW5kaW5nICAgPSBpdGVtcy5maWx0ZXIoaXQgPT4gIWl0LmRvbmUpO1xuICAgIGNvbnN0IHRvdGFsICAgICA9IHBlbmRpbmcucmVkdWNlKChzLCBpdCkgPT4gcyArIGl0LmNvc3QsIDApO1xuICAgIGNvbnN0IHN5bSAgICAgICA9IHNldHRpbmdzLmhvbWVDdXJyZW5jeVN5bWJvbDtcbiAgICBmb290ZXJFbC50ZXh0Q29udGVudCA9IHBlbmRpbmcubGVuZ3RoID4gMFxuICAgICAgPyBgJHtwZW5kaW5nLmxlbmd0aH0gaXRlbSR7cGVuZGluZy5sZW5ndGggPiAxID8gXCJzXCIgOiBcIlwifSBcXHUwMEI3ICR7Zm10KHRvdGFsKX0gJHtzeW19YFxuICAgICAgOiBcIlwiO1xuICB9O1xuXG4gIC8vIEhlYWRlciByb3dcbiAgY29uc3QgaGRyID0gd3JhcC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtd3EtaGVhZGVyXCIgfSk7XG4gIGhkci5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtd3EtdGl0bGVcIiwgdGV4dDogXCJXYW50cyBRdWV1ZVwiIH0pO1xuICBjb25zdCBhZGRCdG4gPSBoZHIuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLXdxLWFkZFwiLCB0ZXh0OiBcIitcIiB9KTtcbiAgbWFrZUludGVyYWN0aXZlKGFkZEJ0bik7XG5cbiAgLy8gTGlzdFxuICBjb25zdCBsaXN0RWwgPSB3cmFwLmNyZWF0ZURpdih7IGNsczogXCJwYy13cS1saXN0XCIgfSk7XG5cbiAgLy8gRm9vdGVyXG4gIGNvbnN0IGZvb3RlckVsID0gd3JhcC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtd3EtZm9vdGVyXCIgfSk7XG5cbiAgLy8gQWRkIGl0ZW0gaW5saW5lXG4gIGxldCBhZGRSb3dFbCA9IG51bGw7XG4gIGFkZEJ0bi5vbmNsaWNrID0gKCkgPT4ge1xuICAgIGlmIChhZGRSb3dFbCkgeyBhZGRSb3dFbC5yZW1vdmUoKTsgYWRkUm93RWwgPSBudWxsOyByZXR1cm47IH1cbiAgICBhZGRSb3dFbCA9IHdyYXAuY3JlYXRlRGl2KHsgY2xzOiBcInBjLXdxLWFkZC1yb3dcIiB9KTtcbiAgICBjb25zdCBuYW1lSW4gPSBhZGRSb3dFbC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIHBsYWNlaG9sZGVyOiBcIldoYXQgZG8geW91IHdhbnQ/XCIsIGNsczogXCJwYy13cS1pbnB1dFwiIH0pO1xuICAgIGNvbnN0IGNvc3RJbiA9IGFkZFJvd0VsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBwbGFjZWhvbGRlcjogXCJDb3N0XCIsIGNsczogXCJwYy13cS1pbnB1dCBwYy13cS1pbnB1dC0tY29zdFwiIH0pO1xuICAgIGtpbGxXaGVlbENoYW5nZShjb3N0SW4pO1xuICAgIGNvbnN0IG9rQnRuICA9IGFkZFJvd0VsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJBZGRcIiwgY2xzOiBcInBjLXdxLW9rXCIgfSk7XG5cbiAgICBjb25zdCBkb0FkZCA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lSW4udmFsdWUudHJpbSgpO1xuICAgICAgY29uc3QgY29zdCA9IHBhcnNlRmxvYXQoY29zdEluLnZhbHVlKSB8fCAwO1xuICAgICAgaWYgKCFuYW1lIHx8IGNvc3QgPD0gMCkgcmV0dXJuO1xuICAgICAgaXRlbXMucHVzaCh7IG5hbWUsIGNvc3QsIGRvbmU6IG51bGwgfSk7XG4gICAgICBhd2FpdCBzYXZlKCk7XG4gICAgICBhZGRSb3dFbC5yZW1vdmUoKTtcbiAgICAgIGFkZFJvd0VsID0gbnVsbDtcbiAgICAgIHJlYnVpbGRMaXN0KCk7XG4gICAgICB1cGRhdGVGb290ZXIoKTtcbiAgICB9O1xuXG4gICAgb2tCdG4ub25jbGljayA9IGRvQWRkO1xuICAgIGNvc3RJbi5vbmtleWRvd24gPSAoZSkgPT4geyBpZiAoZS5rZXkgPT09IFwiRW50ZXJcIikgZG9BZGQoKTsgfTtcbiAgICBuYW1lSW4ub25rZXlkb3duID0gKGUpID0+IHsgaWYgKGUua2V5ID09PSBcIkVudGVyXCIpIGNvc3RJbi5mb2N1cygpOyB9O1xuXG4gICAgLy8gSW5zZXJ0IGJlZm9yZSBmb290ZXJcbiAgICB3cmFwLmluc2VydEJlZm9yZShhZGRSb3dFbCwgZm9vdGVyRWwpO1xuICAgIG5hbWVJbi5mb2N1cygpO1xuICB9O1xuXG4gIC8vIExvYWQgZGF0YSBhc3luY1xuICByZWFkV2FudHNRdWV1ZShhcHAsIHNldHRpbmdzKS50aGVuKChsb2FkZWQpID0+IHtcbiAgICBpdGVtcyA9IGNsZWFudXBEb25lSXRlbXMobG9hZGVkKTtcbiAgICAvLyBJZiBjbGVhbnVwIHJlbW92ZWQgaXRlbXMsIHBlcnNpc3RcbiAgICBpZiAoaXRlbXMubGVuZ3RoICE9PSBsb2FkZWQubGVuZ3RoKSBzYXZlKCk7XG4gICAgcmVidWlsZExpc3QoKTtcbiAgICB1cGRhdGVGb290ZXIoKTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyByZW5kZXJXYW50c1F1ZXVlIH07XG4iLCAiY29uc3QgeyBNb2RhbCB9ID0gcmVxdWlyZShcIm9ic2lkaWFuXCIpO1xuY29uc3QgeyBmbXQsIHNob3dOb3RpY2UsIGtpbGxXaGVlbENoYW5nZSB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuY29uc3QgeyByZWFkQWNjb3VudHMgfSA9IHJlcXVpcmUoXCIuLi9hY2NvdW50cy9pb1wiKTtcblxuLy8gQ291bnRyeSBcdTIxOTIgY3VycmVuY3kgbWFwcGluZ1xuY29uc3QgQ09VTlRSWV9DVVJSRU5DWSA9IHtcbiAgXCJSdXNzaWFcIjogICAgICB7IGNvZGU6IFwiUlVCXCIsIHN5bWJvbDogXCJcdTIwQkRcIiB9LFxuICBcIlVTQVwiOiAgICAgICAgIHsgY29kZTogXCJVU0RcIiwgc3ltYm9sOiBcIiRcIiB9LFxuICBcIlVLXCI6ICAgICAgICAgIHsgY29kZTogXCJHQlBcIiwgc3ltYm9sOiBcIlx1MDBBM1wiIH0sXG4gIFwiSmFwYW5cIjogICAgICAgeyBjb2RlOiBcIkpQWVwiLCBzeW1ib2w6IFwiXHUwMEE1XCIgfSxcbiAgXCJDaGluYVwiOiAgICAgICB7IGNvZGU6IFwiQ05ZXCIsIHN5bWJvbDogXCJcdTAwQTVcIiB9LFxuICBcIkVVXCI6ICAgICAgICAgIHsgY29kZTogXCJFVVJcIiwgc3ltYm9sOiBcIlx1MjBBQ1wiIH0sXG4gIFwiR2VybWFueVwiOiAgICAgeyBjb2RlOiBcIkVVUlwiLCBzeW1ib2w6IFwiXHUyMEFDXCIgfSxcbiAgXCJGcmFuY2VcIjogICAgICB7IGNvZGU6IFwiRVVSXCIsIHN5bWJvbDogXCJcdTIwQUNcIiB9LFxuICBcIkl0YWx5XCI6ICAgICAgIHsgY29kZTogXCJFVVJcIiwgc3ltYm9sOiBcIlx1MjBBQ1wiIH0sXG4gIFwiU3BhaW5cIjogICAgICAgeyBjb2RlOiBcIkVVUlwiLCBzeW1ib2w6IFwiXHUyMEFDXCIgfSxcbiAgXCJOZXRoZXJsYW5kc1wiOiB7IGNvZGU6IFwiRVVSXCIsIHN5bWJvbDogXCJcdTIwQUNcIiB9LFxuICBcIkNhbmFkYVwiOiAgICAgIHsgY29kZTogXCJDQURcIiwgc3ltYm9sOiBcIkMkXCIgfSxcbiAgXCJBdXN0cmFsaWFcIjogICB7IGNvZGU6IFwiQVVEXCIsIHN5bWJvbDogXCJBJFwiIH0sXG4gIFwiSW5kaWFcIjogICAgICAgeyBjb2RlOiBcIklOUlwiLCBzeW1ib2w6IFwiXHUyMEI5XCIgfSxcbiAgXCJCcmF6aWxcIjogICAgICB7IGNvZGU6IFwiQlJMXCIsIHN5bWJvbDogXCJSJFwiIH0sXG4gIFwiVHVya2V5XCI6ICAgICAgeyBjb2RlOiBcIlRSWVwiLCBzeW1ib2w6IFwiXHUyMEJBXCIgfSxcbiAgXCJTb3V0aCBLb3JlYVwiOiB7IGNvZGU6IFwiS1JXXCIsIHN5bWJvbDogXCJcdTIwQTlcIiB9LFxuICBcIlN3aXR6ZXJsYW5kXCI6IHsgY29kZTogXCJDSEZcIiwgc3ltYm9sOiBcIkNIRlwiIH0sXG4gIFwiSXNyYWVsXCI6ICAgICAgeyBjb2RlOiBcIklMU1wiLCBzeW1ib2w6IFwiXHUyMEFBXCIgfSxcbiAgXCJVQUVcIjogICAgICAgICB7IGNvZGU6IFwiQUVEXCIsIHN5bWJvbDogXCJBRURcIiB9LFxufTtcbmNvbnN0IENPVU5UUllfTElTVCA9IE9iamVjdC5rZXlzKENPVU5UUllfQ1VSUkVOQ1kpO1xuXG5jbGFzcyBPbmJvYXJkaW5nTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIGNvbnN0cnVjdG9yKGFwcCwgcGx1Z2luLCBvbkRvbmUpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgIHRoaXMub25Eb25lID0gb25Eb25lO1xuICAgIHRoaXMuc3RlcCA9IDA7XG4gICAgdGhpcy5kYXRhID0ge1xuICAgICAgbGlxdWlkQmFuazogcGx1Z2luLnNldHRpbmdzLmxpcXVpZEJhbmsgfHwgMCxcbiAgICAgIGxpcXVpZEJyb2tlckNhc2g6IHBsdWdpbi5zZXR0aW5ncy5saXF1aWRCcm9rZXJDYXNoIHx8IDAsXG4gICAgICBsaXF1aWRDYXNoOiBwbHVnaW4uc2V0dGluZ3MubGlxdWlkQ2FzaCB8fCAwLFxuICAgICAgbGlxdWlkQnVzaW5lc3M6IHBsdWdpbi5zZXR0aW5ncy5saXF1aWRCdXNpbmVzcyB8fCAwLFxuICAgICAgY291bnRyeTogXCJcIiwgYnJva2VyOiBcIlwiLFxuICAgIH07XG4gIH1cblxuICBvbk9wZW4oKSB7IHRoaXMucmVuZGVyKCk7IH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgY29udGVudEVsLmFkZENsYXNzKFwicGMtb25ib2FyZC13aXphcmRcIik7XG5cbiAgICBjb25zdCBzdGVwcyA9IFtcbiAgICAgICgpID0+IHRoaXMucmVuZGVyU3RlcFNldHVwKGNvbnRlbnRFbCksXG4gICAgICAoKSA9PiB0aGlzLnJlbmRlclN0ZXBNb25leShjb250ZW50RWwpLFxuICAgICAgKCkgPT4gdGhpcy5yZW5kZXJTdGVwT3ZlcnZpZXcoY29udGVudEVsKSxcbiAgICBdO1xuICAgIHRoaXMudG90YWxTdGVwcyA9IHN0ZXBzLmxlbmd0aDtcbiAgICBzdGVwc1t0aGlzLnN0ZXBdKCk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU3RlcCAxOiBDb3VudHJ5ICsgQnJva2VyIFx1MjUwMFx1MjUwMFxuICByZW5kZXJTdGVwU2V0dXAoZWwpIHtcbiAgICBlbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtb25ib2FyZC1zdGVwLWluZGljYXRvclwiLCB0ZXh0OiBgMSAvICR7dGhpcy50b3RhbFN0ZXBzfWAgfSk7XG4gICAgZWwuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwicGMtb25ib2FyZC10aXRsZVwiLCB0ZXh0OiBcIlNldHVwXCIgfSk7XG4gICAgZWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIGNsczogXCJwYy1vbmJvYXJkLWRlc2NcIixcbiAgICAgIHRleHQ6IFwiU2VsZWN0IHlvdXIgY291bnRyeSB0byBzZXQgdGhlIGRlZmF1bHQgY3VycmVuY3kuXCIsXG4gICAgfSk7XG5cbiAgICAvLyBDb3VudHJ5IGRyb3Bkb3duXG4gICAgY29uc3QgY291bnRyeVJvdyA9IGVsLmNyZWF0ZURpdih7IGNsczogXCJwYy1vbmJvYXJkLXJvd1wiIH0pO1xuICAgIGNvdW50cnlSb3cuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHVEODNDXHVERjBEICBDb3VudHJ5XCIgfSk7XG4gICAgY29uc3QgY291bnRyeVNlbGVjdCA9IGNvdW50cnlSb3cuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiIH0pO1xuICAgIGNvdW50cnlTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBcIlNlbGVjdFx1MjAyNlwiLCB2YWx1ZTogXCJcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGMgb2YgQ09VTlRSWV9MSVNUKSB7XG4gICAgICBjb25zdCBvcHQgPSBjb3VudHJ5U2VsZWN0LmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogYywgdmFsdWU6IGMgfSk7XG4gICAgICBpZiAodGhpcy5kYXRhLmNvdW50cnkgPT09IGMpIG9wdC5zZWxlY3RlZCA9IHRydWU7XG4gICAgfVxuICAgIGNvdW50cnlTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICB0aGlzLmRhdGEuY291bnRyeSA9IGNvdW50cnlTZWxlY3QudmFsdWU7XG4gICAgfSk7XG5cbiAgICAvLyBCcm9rZXJcbiAgICBjb25zdCBicm9rZXJSb3cgPSBlbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtb25ib2FyZC1yb3dcIiB9KTtcbiAgICBicm9rZXJSb3cuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiXHVEODNEXHVEQ0NBICBCcm9rZXJcIiB9KTtcbiAgICBjb25zdCBicm9rZXJJbnAgPSBicm9rZXJSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcInRleHRcIiwgcGxhY2Vob2xkZXI6IFwiZS5nLiBULUJhbmssIEludGVyYWN0aXZlIEJyb2tlcnNcIiwgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIixcbiAgICB9KTtcbiAgICBicm9rZXJJbnAudmFsdWUgPSB0aGlzLmRhdGEuYnJva2VyIHx8IFwiXCI7XG4gICAgYnJva2VySW5wLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7IHRoaXMuZGF0YS5icm9rZXIgPSBicm9rZXJJbnAudmFsdWU7IH0pO1xuXG4gICAgdGhpcy5yZW5kZXJOYXYoZWwsIHsgYmFjazogZmFsc2UgfSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU3RlcCAyOiBDb3VudCB5b3VyIG1vbmV5IFx1MjUwMFx1MjUwMFxuICByZW5kZXJTdGVwTW9uZXkoZWwpIHtcbiAgICBjb25zdCBjdXIgPSBDT1VOVFJZX0NVUlJFTkNZW3RoaXMuZGF0YS5jb3VudHJ5XTtcbiAgICBjb25zdCBzeW0gPSBjdXIgPyBjdXIuc3ltYm9sIDogKHRoaXMucGx1Z2luLnNldHRpbmdzLmhvbWVDdXJyZW5jeVN5bWJvbCA/PyBcIlx1MjBCRFwiKTtcblxuICAgIGVsLmNyZWF0ZURpdih7IGNsczogXCJwYy1vbmJvYXJkLXN0ZXAtaW5kaWNhdG9yXCIsIHRleHQ6IGAyIC8gJHt0aGlzLnRvdGFsU3RlcHN9YCB9KTtcbiAgICBlbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1vbmJvYXJkLXRpdGxlXCIsIHRleHQ6IFwiQ291bnQgeW91ciBtb25leVwiIH0pO1xuICAgIGVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwicGMtb25ib2FyZC1kZXNjXCIsXG4gICAgICB0ZXh0OiBcIlN1bSB1cCB3aGF0IHlvdSBoYXZlIHJpZ2h0IG5vdy4gVGhpcyBpcyB5b3VyIHN0YXJ0aW5nIGNhcGl0YWwgcG9zaXRpb24uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBwb29scyA9IFtcbiAgICAgIFtcImxpcXVpZEJhbmtcIiwgICAgICAgXCJcdUQ4M0RcdURDQjMgIEJhbmsgYWNjb3VudHNcIiwgICAgIFwiQWxsIGJhbmsgYWNjb3VudHMgdG90YWxcIl0sXG4gICAgICBbXCJsaXF1aWRCcm9rZXJDYXNoXCIsIFwiXHVEODNEXHVEQ0NBICBCcm9rZXIgZnJlZSBjYXNoXCIsICBcIlVuaW52ZXN0ZWQgY2FzaCBvbiBicm9rZXJcIl0sXG4gICAgICBbXCJsaXF1aWRDYXNoXCIsICAgICAgIFwiXHVEODNEXHVEQ0I1ICBQaHlzaWNhbCBjYXNoXCIsICAgICAgXCJDYXNoIGF0IGhhbmRcIl0sXG4gICAgICBbXCJsaXF1aWRCdXNpbmVzc1wiLCAgIFwiXHVEODNDXHVERkUyICBCdXNpbmVzcyBhY2NvdW50XCIsICAgXCJPcHRpb25hbCBcdTIwMTQgbGVhdmUgMCBpZiBub25lXCJdLFxuICAgIF07XG5cbiAgICBjb25zdCBpbnB1dHMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGxhYmVsLCBwbGFjZWhvbGRlcl0gb2YgcG9vbHMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGVsLmNyZWF0ZURpdih7IGNsczogXCJwYy1vbmJvYXJkLXJvd1wiIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBsYWJlbCB9KTtcbiAgICAgIGNvbnN0IGlucCA9IHJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgdHlwZTogXCJudW1iZXJcIiwgcGxhY2Vob2xkZXIsIGNsczogXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIsXG4gICAgICB9KTtcbiAgICAgIGlucC52YWx1ZSA9IHRoaXMuZGF0YVtrZXldIHx8IFwiXCI7XG4gICAgICBraWxsV2hlZWxDaGFuZ2UoaW5wKTtcbiAgICAgIGlucHV0c1trZXldID0gaW5wO1xuICAgICAgaW5wLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuZGF0YVtrZXldID0gcGFyc2VGbG9hdChpbnAudmFsdWUpIHx8IDA7XG4gICAgICAgIHVwZGF0ZVRvdGFsKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB0b3RhbEVsID0gZWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLW9uYm9hcmQtdG90YWxcIiB9KTtcbiAgICBjb25zdCB1cGRhdGVUb3RhbCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IHN1bSA9IHBvb2xzLnJlZHVjZSgocywgW2tdKSA9PiBzICsgKHRoaXMuZGF0YVtrXSB8fCAwKSwgMCk7XG4gICAgICB0b3RhbEVsLnRleHRDb250ZW50ID0gYFRvdGFsOiAke2ZtdChzdW0pfSAke3N5bX1gO1xuICAgIH07XG4gICAgdXBkYXRlVG90YWwoKTtcblxuICAgIHRoaXMucmVuZGVyTmF2KGVsLCB7fSk7XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgU3RlcCAzOiBPdmVydmlldyBcdTI1MDBcdTI1MDBcbiAgcmVuZGVyU3RlcE92ZXJ2aWV3KGVsKSB7XG4gICAgY29uc3QgY3VyID0gQ09VTlRSWV9DVVJSRU5DWVt0aGlzLmRhdGEuY291bnRyeV07XG4gICAgY29uc3Qgc3ltID0gY3VyID8gY3VyLnN5bWJvbCA6ICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ob21lQ3VycmVuY3lTeW1ib2wgPz8gXCJcdTIwQkRcIik7XG5cbiAgICBlbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtb25ib2FyZC1zdGVwLWluZGljYXRvclwiLCB0ZXh0OiBgJHt0aGlzLnRvdGFsU3RlcHN9IC8gJHt0aGlzLnRvdGFsU3RlcHN9YCB9KTtcbiAgICBlbC5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1vbmJvYXJkLXRpdGxlXCIsIHRleHQ6IFwiT3ZlcnZpZXdcIiB9KTtcbiAgICBlbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgY2xzOiBcInBjLW9uYm9hcmQtZGVzY1wiLFxuICAgICAgdGV4dDogXCJSZXZpZXcgeW91ciBzZXR1cC4gRXZlcnl0aGluZyBzdGF5cyBsb2NhbC4gRWRpdGFibGUgaW4gU2V0dGluZ3MuXCIsXG4gICAgfSk7XG5cbiAgICAvLyBTZXR1cCBzdW1tYXJ5XG4gICAgY29uc3Qgc2V0dXBTZWN0aW9uID0gZWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLW9uYm9hcmQtc3VtbWFyeS1zZWN0aW9uXCIgfSk7XG4gICAgc2V0dXBTZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLW9uYm9hcmQtc3VtbWFyeS1sYWJlbFwiLCB0ZXh0OiBcIlNldHVwXCIgfSk7XG4gICAgaWYgKHRoaXMuZGF0YS5jb3VudHJ5KSB7XG4gICAgICBjb25zdCBjUm93ID0gc2V0dXBTZWN0aW9uLmNyZWF0ZURpdih7IGNsczogXCJwYy1vbmJvYXJkLXN1bW1hcnktcm93XCIgfSk7XG4gICAgICBjUm93LmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiQ291bnRyeVwiIH0pO1xuICAgICAgY1Jvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtb25ib2FyZC1zdW1tYXJ5LXZhbFwiLCB0ZXh0OiBgJHt0aGlzLmRhdGEuY291bnRyeX0gKCR7Y3VyID8gY3VyLnN5bWJvbCA6IFwiP1wifSlgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5kYXRhLmJyb2tlcikge1xuICAgICAgY29uc3QgYlJvdyA9IHNldHVwU2VjdGlvbi5jcmVhdGVEaXYoeyBjbHM6IFwicGMtb25ib2FyZC1zdW1tYXJ5LXJvd1wiIH0pO1xuICAgICAgYlJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIkJyb2tlclwiIH0pO1xuICAgICAgYlJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtb25ib2FyZC1zdW1tYXJ5LXZhbFwiLCB0ZXh0OiB0aGlzLmRhdGEuYnJva2VyIH0pO1xuICAgIH1cblxuICAgIC8vIExpcXVpZCBwb29scyBzdW1tYXJ5XG4gICAgY29uc3QgcG9vbHNTZWN0aW9uID0gZWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLW9uYm9hcmQtc3VtbWFyeS1zZWN0aW9uXCIgfSk7XG4gICAgcG9vbHNTZWN0aW9uLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLW9uYm9hcmQtc3VtbWFyeS1sYWJlbFwiLCB0ZXh0OiBcIkxpcXVpZCBjYXBpdGFsXCIgfSk7XG4gICAgY29uc3QgcG9vbEl0ZW1zID0gW1xuICAgICAgW1wiQmFuayBhY2NvdW50c1wiLCB0aGlzLmRhdGEubGlxdWlkQmFua10sXG4gICAgICBbXCJCcm9rZXIgZnJlZSBjYXNoXCIsIHRoaXMuZGF0YS5saXF1aWRCcm9rZXJDYXNoXSxcbiAgICAgIFtcIlBoeXNpY2FsIGNhc2hcIiwgdGhpcy5kYXRhLmxpcXVpZENhc2hdLFxuICAgICAgW1wiQnVzaW5lc3MgYWNjb3VudFwiLCB0aGlzLmRhdGEubGlxdWlkQnVzaW5lc3NdLFxuICAgIF07XG4gICAgbGV0IHBvb2xUb3RhbCA9IDA7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgdmFsXSBvZiBwb29sSXRlbXMpIHtcbiAgICAgIGlmICghdmFsKSBjb250aW51ZTtcbiAgICAgIHBvb2xUb3RhbCArPSB2YWw7XG4gICAgICBjb25zdCByb3cgPSBwb29sc1NlY3Rpb24uY3JlYXRlRGl2KHsgY2xzOiBcInBjLW9uYm9hcmQtc3VtbWFyeS1yb3cgcGMtb25ib2FyZC1zdW1tYXJ5LXJvdy0tbW9uZXlcIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBuYW1lIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1vbmJvYXJkLXN1bW1hcnktdmFsXCIsIHRleHQ6IGAke2ZtdCh2YWwpfSAke3N5bX1gIH0pO1xuICAgIH1cbiAgICBjb25zdCB0b3RhbFJvdyA9IHBvb2xzU2VjdGlvbi5jcmVhdGVEaXYoeyBjbHM6IFwicGMtb25ib2FyZC1zdW1tYXJ5LXJvdyBwYy1vbmJvYXJkLXN1bW1hcnktcm93LS1tb25leSBwYy1vbmJvYXJkLXN1bW1hcnktdG90YWxcIiB9KTtcbiAgICB0b3RhbFJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBcIlRvdGFsXCIgfSk7XG4gICAgdG90YWxSb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLW9uYm9hcmQtc3VtbWFyeS12YWxcIiwgdGV4dDogYCR7Zm10KHBvb2xUb3RhbCl9ICR7c3ltfWAgfSk7XG5cbiAgICB0aGlzLnJlbmRlck5hdihlbCwgeyBuZXh0OiBmYWxzZSwgZG9uZTogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBOYXZpZ2F0aW9uIGJhciBcdTI1MDBcdTI1MDBcbiAgcmVuZGVyTmF2KGVsLCBvcHRzID0ge30pIHtcbiAgICBjb25zdCBuYXYgPSBlbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtb25ib2FyZC1uYXZcIiB9KTtcblxuICAgIGlmIChvcHRzLmJhY2sgIT09IGZhbHNlICYmIHRoaXMuc3RlcCA+IDApIHtcbiAgICAgIGNvbnN0IGJhY2tCdG4gPSBuYXYuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlx1MjE5MCBCYWNrXCIsIGNsczogXCJwYy1vbmJvYXJkLW5hdi1idG5cIiB9KTtcbiAgICAgIGJhY2tCdG4ub25jbGljayA9ICgpID0+IHsgdGhpcy5zdGVwLS07IHRoaXMucmVuZGVyKCk7IH07XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdi5jcmVhdGVEaXYoKTsgLy8gc3BhY2VyXG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZG9uZSkge1xuICAgICAgY29uc3QgZG9uZUJ0biA9IG5hdi5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiRG9uZSBcdTIwMTQgb3BlbiBkYXNoYm9hcmRcIiwgY2xzOiBcIm1vZC1jdGEgcGMtb25ib2FyZC1uYXYtYnRuXCIgfSk7XG4gICAgICBkb25lQnRuLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmZpbmlzaCgpO1xuICAgIH0gZWxzZSBpZiAob3B0cy5uZXh0ICE9PSBmYWxzZSkge1xuICAgICAgY29uc3QgbmV4dEJ0biA9IG5hdi5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiTmV4dCBcdTIxOTJcIiwgY2xzOiBcIm1vZC1jdGEgcGMtb25ib2FyZC1uYXYtYnRuXCIgfSk7XG4gICAgICBuZXh0QnRuLm9uY2xpY2sgPSAoKSA9PiB7IHRoaXMuc3RlcCsrOyB0aGlzLnJlbmRlcigpOyB9O1xuICAgIH1cblxuICAgIC8vIFNraXAgbGlua1xuICAgIGNvbnN0IHNraXAgPSBuYXYuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwicGMtb25ib2FyZC1za2lwXCIsIHRleHQ6IFwic2tpcCBmb3Igbm93XCIgfSk7XG4gICAgc2tpcC5vbmNsaWNrID0gKCkgPT4gdGhpcy5jbG9zZSgpO1xuICB9XG5cbiAgYXN5bmMgZmluaXNoKCkge1xuICAgIC8vIFNhdmUgbGVnYWN5IGxpcXVpZCBwb29scyAoZm9yIGJhY2t3YXJkIGNvbXBhdClcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5saXF1aWRCYW5rICAgICAgID0gdGhpcy5kYXRhLmxpcXVpZEJhbms7XG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MubGlxdWlkQnJva2VyQ2FzaCA9IHRoaXMuZGF0YS5saXF1aWRCcm9rZXJDYXNoO1xuICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmxpcXVpZENhc2ggICAgICAgPSB0aGlzLmRhdGEubGlxdWlkQ2FzaDtcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5saXF1aWRCdXNpbmVzcyAgID0gdGhpcy5kYXRhLmxpcXVpZEJ1c2luZXNzO1xuXG4gICAgLy8gQXBwbHkgY291bnRyeSBcdTIxOTIgY3VycmVuY3lcbiAgICBjb25zdCBjdXIgPSBDT1VOVFJZX0NVUlJFTkNZW3RoaXMuZGF0YS5jb3VudHJ5XTtcbiAgICBpZiAoY3VyKSB7XG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ob21lQ3VycmVuY3kgPSBjdXIuY29kZTtcbiAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmhvbWVDdXJyZW5jeVN5bWJvbCA9IGN1ci5zeW1ib2w7XG4gICAgfVxuXG4gICAgLy8gU2F2ZSBicm9rZXIgKyBjb3VudHJ5IHRvIHBlcnNvbmFsIGNvbnRleHQgKHJlcGxhY2UgZXhpc3RpbmcgbGluZXMsIGRvbid0IGR1cGxpY2F0ZSlcbiAgICBsZXQgY3R4ID0gKHRoaXMucGx1Z2luLnNldHRpbmdzLnBlcnNvbmFsQ29udGV4dCA/PyBcIlwiKS50cmltKCk7XG4gICAgY3R4ID0gY3R4LnNwbGl0KFwiXFxuXCIpLmZpbHRlcihsID0+ICFsLnN0YXJ0c1dpdGgoXCJDb3VudHJ5OlwiKSAmJiAhbC5zdGFydHNXaXRoKFwiQnJva2VyOlwiKSkuam9pbihcIlxcblwiKS50cmltKCk7XG4gICAgY29uc3QgY3R4UGFydHMgPSBbXTtcbiAgICBpZiAodGhpcy5kYXRhLmNvdW50cnkpIGN0eFBhcnRzLnB1c2goYENvdW50cnk6ICR7dGhpcy5kYXRhLmNvdW50cnl9YCk7XG4gICAgaWYgKHRoaXMuZGF0YS5icm9rZXIpIGN0eFBhcnRzLnB1c2goYEJyb2tlcjogJHt0aGlzLmRhdGEuYnJva2VyfWApO1xuICAgIGlmIChjdHhQYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wZXJzb25hbENvbnRleHQgPSBjdHhcbiAgICAgICAgPyBjdHhQYXJ0cy5qb2luKFwiXFxuXCIpICsgXCJcXG5cIiArIGN0eFxuICAgICAgICA6IGN0eFBhcnRzLmpvaW4oXCJcXG5cIik7XG4gICAgfVxuXG4gICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Mub25ib2FyZGluZ0RvbmUgPSB0cnVlO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLl9zY2FmZm9sZFZhdWx0KCk7XG5cbiAgICAvLyBDcmVhdGUgYWNjb3VudCBmaWxlcyBmcm9tIHBvb2wgdmFsdWVzXG4gICAgY29uc3QgYWNjb3VudHNGb2xkZXIgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hY2NvdW50c0ZvbGRlciB8fCBcImZpbmFuY2UvRGF0YS9hY2NvdW50c1wiO1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGFjY291bnRzRm9sZGVyKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGFjY291bnRzRm9sZGVyKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgfVxuICAgIGNvbnN0IGFjY3RDdXIgPSBjdXIgPyBjdXIuY29kZSA6ICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ob21lQ3VycmVuY3kgfHwgXCJSVUJcIik7XG4gICAgY29uc3QgcG9vbERlZnMgPSBbXG4gICAgICB7IHZhbDogdGhpcy5kYXRhLmxpcXVpZEJhbmssIG5hbWU6IFwiQmFua1wiLCB0eXBlOiBcImJhbmtcIiwgbGlxdWlkOiB0cnVlIH0sXG4gICAgICB7IHZhbDogdGhpcy5kYXRhLmxpcXVpZEJyb2tlckNhc2gsIG5hbWU6IFwiQnJva2VyIENhc2hcIiwgdHlwZTogXCJicm9rZXJcIiwgbGlxdWlkOiB0cnVlIH0sXG4gICAgICB7IHZhbDogdGhpcy5kYXRhLmxpcXVpZENhc2gsIG5hbWU6IFwiQ2FzaFwiLCB0eXBlOiBcImNhc2hcIiwgbGlxdWlkOiB0cnVlIH0sXG4gICAgICB7IHZhbDogdGhpcy5kYXRhLmxpcXVpZEJ1c2luZXNzLCBuYW1lOiBcIkJ1c2luZXNzXCIsIHR5cGU6IFwiYnVzaW5lc3NcIiwgbGlxdWlkOiBmYWxzZSB9LFxuICAgIF07XG4gICAgY29uc3QgdG9kYXkgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApO1xuICAgIGZvciAoY29uc3QgcGQgb2YgcG9vbERlZnMpIHtcbiAgICAgIGlmIChwZC52YWwgPD0gMCkgY29udGludWU7XG4gICAgICBjb25zdCBwYXRoID0gYCR7YWNjb3VudHNGb2xkZXJ9LyR7cGQubmFtZX0ubWRgO1xuICAgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCkpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IFtcbiAgICAgICAgICBcIi0tLVwiLCBgbmFtZTogXCIke3BkLm5hbWV9XCJgLCBgdHlwZTogJHtwZC50eXBlfWAsXG4gICAgICAgICAgYGN1cnJlbmN5OiAke2FjY3RDdXJ9YCwgYGxpcXVpZDogJHtwZC5saXF1aWR9YCwgYGxvY2tlZDogJHshcGQubGlxdWlkfWAsXG4gICAgICAgICAgYGluaXRpYWxfYmFsYW5jZTogJHtwZC52YWx9YCwgYGxhc3RfcmVjb25jaWxlZDogXCIke3RvZGF5fVwiYCxcbiAgICAgICAgICBcIi0tLVwiLCBcIlwiLFxuICAgICAgICBdLmpvaW4oXCJcXG5cIik7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBjb250ZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNYXJrIG1pZ3JhdGlvbiBkb25lIChhY2NvdW50cyBjcmVhdGVkLCBsZWRnZXIgd2lsbCBwb3B1bGF0ZSBhcyB1c2VyIHVzZXMgdGhlIHN5c3RlbSlcbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5taWdyYXRpb25Eb25lID0gdHJ1ZTtcbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gICAgaWYgKHRoaXMub25Eb25lKSB7XG4gICAgICB0aGlzLm9uRG9uZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBsdWdpbi5fb3BlbkRhc2hib2FyZE5vdGUoKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IE9uYm9hcmRpbmdNb2RhbCwgQ09VTlRSWV9DVVJSRU5DWSwgQ09VTlRSWV9MSVNUIH07XG4iLCAiY29uc3QgeyBNb2RhbCB9ID0gcmVxdWlyZShcIm9ic2lkaWFuXCIpO1xuY29uc3QgeyBzaG93Tm90aWNlLCBmbXQsIGtpbGxXaGVlbENoYW5nZSB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuY29uc3QgeyB3cml0ZUxlZGdlckVudHJ5IH0gPSByZXF1aXJlKFwiLi4vbGVkZ2VyL2lvXCIpO1xuXG5jbGFzcyBBZGRUcmFuc2FjdGlvbk1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihhcHAsIHBsdWdpbiwgYWNjb3VudHMsIG9uRG9uZSkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgdGhpcy5hY2NvdW50cyA9IGFjY291bnRzIHx8IFtdO1xuICAgIHRoaXMub25Eb25lID0gb25Eb25lO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJBZGQgVHJhbnNhY3Rpb25cIiB9KTtcblxuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5wbHVnaW4gPyB0aGlzLnBsdWdpbi5zZXR0aW5ncyA6IHt9O1xuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtZm9ybVwiIH0pO1xuICAgIGNvbnN0IHJvdyA9IChsYWJlbCwgaW5wdXQpID0+IHtcbiAgICAgIGNvbnN0IGQgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgICAgZC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogbGFiZWwgfSk7XG4gICAgICBkLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xuXG4gICAgLy8gVHlwZVxuICAgIGNvbnN0IHR5cGVJbiA9IHJvdyhcIlR5cGVcIiwgY29udGVudEVsLmNyZWF0ZUVsKFwic2VsZWN0XCIpKTtcbiAgICBbXG4gICAgICBbXCJleHBlbnNlXCIsICBcIkV4cGVuc2UgXHUyMDE0IG1vbmV5IG91dFwiXSxcbiAgICAgIFtcImluY29tZVwiLCAgIFwiSW5jb21lIFx1MjAxNCBtb25leSBpblwiXSxcbiAgICAgIFtcInRyYW5zZmVyXCIsIFwiVHJhbnNmZXIgXHUyMDE0IGJldHdlZW4gYWNjb3VudHNcIl0sXG4gICAgXS5mb3JFYWNoKChbdmFsLCBsYWJlbF0pID0+IHtcbiAgICAgIGNvbnN0IG8gPSB0eXBlSW4uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCB9KTsgby52YWx1ZSA9IHZhbDtcbiAgICB9KTtcbiAgICB0eXBlSW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuXG4gICAgLy8gRGF0ZVxuICAgIGNvbnN0IGRhdGVJbiA9IHJvdyhcIkRhdGVcIiwgY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImRhdGVcIiB9KSk7XG4gICAgZGF0ZUluLnZhbHVlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgICBkYXRlSW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuXG4gICAgLy8gQW1vdW50XG4gICAgY29uc3QgYW10SW4gPSByb3coXCJBbW91bnRcIiwgY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBzdGVwOiBcImFueVwiIH0pKTtcbiAgICBhbXRJbi5wbGFjZWhvbGRlciA9IFwiZS5nLiA1MDAwXCI7XG4gICAgYW10SW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuICAgIGtpbGxXaGVlbENoYW5nZShhbXRJbik7XG5cbiAgICAvLyBDYXRlZ29yeSAoZm9yIGV4cGVuc2UvaW5jb21lKVxuICAgIGNvbnN0IGNhdFdyYXAgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgIGNhdFdyYXAuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiQ2F0ZWdvcnlcIiB9KTtcbiAgICBjb25zdCBjYXRJbiA9IGNhdFdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBwbGFjZWhvbGRlcjogXCJlLmcuIEdyb2NlcmllcywgV2FnZXNcIiB9KTtcbiAgICBjYXRJbi5hZGRDbGFzcyhcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIik7XG5cbiAgICAvLyBGcm9tIGFjY291bnRcbiAgICBjb25zdCBmcm9tV3JhcCA9IGZvcm0uY3JlYXRlRGl2KCk7XG4gICAgZnJvbVdyYXAuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiRnJvbSBhY2NvdW50XCIgfSk7XG4gICAgY29uc3QgZnJvbUluID0gZnJvbVdyYXAuY3JlYXRlRWwoXCJzZWxlY3RcIik7XG4gICAgZnJvbUluLmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogXCJcdTIwMTQgbm9uZSBcdTIwMTRcIiwgdmFsdWU6IFwiXCIgfSk7XG4gICAgZm9yIChjb25zdCBhIG9mIHRoaXMuYWNjb3VudHMpIGZyb21Jbi5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGEubmFtZSwgdmFsdWU6IGEubmFtZSB9KTtcbiAgICBmcm9tSW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuXG4gICAgLy8gVG8gYWNjb3VudFxuICAgIGNvbnN0IHRvV3JhcCA9IGZvcm0uY3JlYXRlRGl2KCk7XG4gICAgdG9XcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlRvIGFjY291bnRcIiB9KTtcbiAgICBjb25zdCB0b0luID0gdG9XcmFwLmNyZWF0ZUVsKFwic2VsZWN0XCIpO1xuICAgIHRvSW4uY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBcIlx1MjAxNCBub25lIFx1MjAxNFwiLCB2YWx1ZTogXCJcIiB9KTtcbiAgICBmb3IgKGNvbnN0IGEgb2YgdGhpcy5hY2NvdW50cykgdG9Jbi5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IGEubmFtZSwgdmFsdWU6IGEubmFtZSB9KTtcbiAgICB0b0luLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcblxuICAgIC8vIE5vdGVcbiAgICBjb25zdCBub3RlSW4gPSByb3coXCJOb3RlIChvcHRpb25hbClcIiwgY29udGVudEVsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiB9KSk7XG4gICAgbm90ZUluLnBsYWNlaG9sZGVyID0gXCJlLmcuIGdyb2Nlcnkgc3RvcmVcIjtcbiAgICBub3RlSW4uYWRkQ2xhc3MoXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIpO1xuXG4gICAgLy8gU2hvdy9oaWRlIGZpZWxkcyBiYXNlZCBvbiB0eXBlXG4gICAgY29uc3QgdXBkYXRlRmllbGRzID0gKCkgPT4ge1xuICAgICAgY29uc3QgdCA9IHR5cGVJbi52YWx1ZTtcbiAgICAgIGNhdFdyYXAuc3R5bGUuZGlzcGxheSA9IHQgPT09IFwidHJhbnNmZXJcIiA/IFwibm9uZVwiIDogXCJcIjtcbiAgICAgIGZyb21XcmFwLnN0eWxlLmRpc3BsYXkgPSB0ID09PSBcImluY29tZVwiID8gXCJub25lXCIgOiBcIlwiO1xuICAgICAgdG9XcmFwLnN0eWxlLmRpc3BsYXkgPSB0ID09PSBcImV4cGVuc2VcIiA/IFwibm9uZVwiIDogXCJcIjtcbiAgICB9O1xuICAgIHR5cGVJbi5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHVwZGF0ZUZpZWxkcyk7XG4gICAgdXBkYXRlRmllbGRzKCk7XG5cbiAgICAvLyBCdXR0b25zXG4gICAgY29uc3QgYnRucyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1idXR0b25zXCIgfSk7XG4gICAgY29uc3QgYWRkQnRuID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQWRkXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQ2FuY2VsXCIgfSkub25jbGljayA9ICgpID0+IHRoaXMuY2xvc2UoKTtcblxuICAgIGFkZEJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYW10ID0gcGFyc2VGbG9hdChhbXRJbi52YWx1ZSkgfHwgMDtcbiAgICAgIGlmIChhbXQgPD0gMCkgeyBzaG93Tm90aWNlKFwiQW1vdW50IGlzIHJlcXVpcmVkXCIpOyByZXR1cm47IH1cblxuICAgICAgY29uc3QgZW50cnkgPSB7XG4gICAgICAgIGQ6IGRhdGVJbi52YWx1ZSB8fCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApLFxuICAgICAgICB0eXBlOiB0eXBlSW4udmFsdWUsXG4gICAgICAgIGFtdCxcbiAgICAgIH07XG4gICAgICBpZiAodHlwZUluLnZhbHVlICE9PSBcInRyYW5zZmVyXCIgJiYgY2F0SW4udmFsdWUudHJpbSgpKSBlbnRyeS5jYXQgPSBjYXRJbi52YWx1ZS50cmltKCk7XG4gICAgICBpZiAoZnJvbUluLnZhbHVlKSBlbnRyeS5mcm9tID0gZnJvbUluLnZhbHVlO1xuICAgICAgaWYgKHRvSW4udmFsdWUpIGVudHJ5LnRvID0gdG9Jbi52YWx1ZTtcbiAgICAgIGlmIChub3RlSW4udmFsdWUudHJpbSgpKSBlbnRyeS5ub3RlID0gbm90ZUluLnZhbHVlLnRyaW0oKTtcblxuICAgICAgY29uc3QgcyA9IHRoaXMucGx1Z2luID8gdGhpcy5wbHVnaW4uc2V0dGluZ3MgOiBzZXR0aW5ncztcbiAgICAgIGF3YWl0IHdyaXRlTGVkZ2VyRW50cnkodGhpcy5hcHAsIHMsIGVudHJ5KTtcbiAgICAgIHNob3dOb3RpY2UoYFx1MjcxMyBBZGRlZCAke2VudHJ5LnR5cGV9OiAke2ZtdChhbXQpfWApO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgaWYgKHRoaXMub25Eb25lKSB0aGlzLm9uRG9uZSgpO1xuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IEFkZFRyYW5zYWN0aW9uTW9kYWwgfTtcbiIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIFJFQ09OQ0lMRSBBQ0NPVU5UUyBNT0RBTCBcdTIwMTQgY2xvc2UtdGhlLWJvb2tzIHN0eWxlLlxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBTaG93cyBldmVyeSBhY2NvdW50IG9uIG9uZSBzY3JlZW46IGxlZGdlci1leHBlY3RlZCBiYWxhbmNlIHZzLiB0aGVcbi8vIGFjdHVhbCBiYWxhbmNlIHRoZSB1c2VyIHR5cGVzIGluLiBMZWF2ZSBhIHJvdyBibGFuayB0byBza2lwLlxuLy8gT24gUmVjb25jaWxlOiB3cml0ZXMgYSBzaW5nbGUgYHJlY29uY2lsaWF0aW9uYCBsZWRnZXIgZW50cnkgcGVyXG4vLyBub24temVybyBkaWZmIChjYXRlZ29yeSA9IFwiUmVjb25jaWxpYXRpb25cIiwgbm90ZSBhdXRvLWZpbGxlZCkgYW5kXG4vLyBzdGFtcHMgYGxhc3RfcmVjb25jaWxlZGAgb24gZXZlcnkgYWNjb3VudCB0aGUgdXNlciBmaWxsZWQgaW4uXG5cbmNvbnN0IHsgTW9kYWwgfSA9IHJlcXVpcmUoXCJvYnNpZGlhblwiKTtcbmNvbnN0IHsgdG9OdW0sIGZtdCwgc2hvd05vdGljZSwga2lsbFdoZWVsQ2hhbmdlIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5jb25zdCB7IHJlYWRBbGxMZWRnZXIsIHdyaXRlTGVkZ2VyRW50cnkgfSA9IHJlcXVpcmUoXCIuLi9sZWRnZXIvaW9cIik7XG5jb25zdCB7IHJlYWRBY2NvdW50cywgdXBkYXRlTGFzdFJlY29uY2lsZWQgfSA9IHJlcXVpcmUoXCIuLi9hY2NvdW50cy9pb1wiKTtcbmNvbnN0IHsgZ2V0QWNjb3VudEJhbGFuY2UgfSA9IHJlcXVpcmUoXCIuLi9hY2NvdW50cy9iYWxhbmNlXCIpO1xuXG5jbGFzcyBSZWNvbmNpbGVBbGxNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoYXBwLCBwbHVnaW4sIG9uRG9uZSkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgdGhpcy5vbkRvbmUgPSBvbkRvbmU7XG4gICAgdGhpcy5yb3dzID0gW107IC8vIHsgYWNjb3VudCwgZXhwZWN0ZWQsIGFjdHVhbElucHV0LCBkaWZmRWwgfVxuICB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KFwiUmVjb25jaWxlIGFjY291bnRzXCIpO1xuICAgIHRoaXMubW9kYWxFbC5hZGRDbGFzcyhcInBjLXJlY29uY2lsZS1tb2RhbFwiKTtcblxuICAgIGNvbnN0IGludHJvID0gY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJzZXR0aW5nLWl0ZW0tZGVzY3JpcHRpb25cIiB9KTtcbiAgICBpbnRyby50ZXh0Q29udGVudCA9XG4gICAgICBcIlR5cGUgdGhlIGJhbGFuY2UgeW91IGFjdHVhbGx5IHNlZSBvbiBlYWNoIGFjY291bnQgcmlnaHQgbm93LiBcIiArXG4gICAgICBcIkFueSBtaXNtYXRjaCBiZXR3ZWVuIHRoZSBsZWRnZXIgYW5kIHJlYWxpdHkgaXMgd3JpdHRlbiBhcyBhIHNpbmdsZSBcIiArXG4gICAgICBcInJlY29uY2lsaWF0aW9uIGFkanVzdG1lbnQuIExlYXZlIGEgcm93IGJsYW5rIHRvIHNraXAuXCI7XG5cbiAgICAvLyBEYXRlIHJvd1xuICAgIGNvbnN0IGRhdGVSb3cgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLXJlY29uY2lsZS1kYXRlLXJvd1wiIH0pO1xuICAgIGRhdGVSb3cuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiUmVjb25jaWxpYXRpb24gZGF0ZVwiIH0pO1xuICAgIGNvbnN0IGRhdGVJbiA9IGRhdGVSb3cuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiIH0pO1xuICAgIGRhdGVJbi52YWx1ZSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCk7XG4gICAgdGhpcy5kYXRlSW4gPSBkYXRlSW47XG5cbiAgICAvLyBUYWJsZVxuICAgIGNvbnN0IHRhYmxlID0gY29udGVudEVsLmNyZWF0ZUVsKFwidGFibGVcIiwgeyBjbHM6IFwicGMtcmVjb25jaWxlLXRhYmxlXCIgfSk7XG4gICAgY29uc3QgdGhlYWQgPSB0YWJsZS5jcmVhdGVFbChcInRoZWFkXCIpO1xuICAgIGNvbnN0IGh0ciA9IHRoZWFkLmNyZWF0ZUVsKFwidHJcIik7XG4gICAgW1wiQWNjb3VudFwiLCBcIkV4cGVjdGVkXCIsIFwiQWN0dWFsXCIsIFwiRGlmZlwiXS5mb3JFYWNoKGggPT4gaHRyLmNyZWF0ZUVsKFwidGhcIiwgeyB0ZXh0OiBoIH0pKTtcbiAgICBjb25zdCB0Ym9keSA9IHRhYmxlLmNyZWF0ZUVsKFwidGJvZHlcIik7XG5cbiAgICAvLyBMb2FkIGRhdGFcbiAgICBsZXQgYWNjb3VudHMgPSBbXSwgbGVkZ2VyID0gW107XG4gICAgdHJ5IHtcbiAgICAgIFthY2NvdW50cywgbGVkZ2VyXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgcmVhZEFjY291bnRzKHRoaXMuYXBwLCB0aGlzLnBsdWdpbi5zZXR0aW5ncyksXG4gICAgICAgIHJlYWRBbGxMZWRnZXIodGhpcy5hcHAsIHRoaXMucGx1Z2luLnNldHRpbmdzKSxcbiAgICAgIF0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbUENdIHJlY29uY2lsZTogbG9hZCBmYWlsZWQ6XCIsIGUpO1xuICAgICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiRmFpbGVkIHRvIGxvYWQgYWNjb3VudHMvbGVkZ2VyOiBcIiArIChlLm1lc3NhZ2UgfHwgZSkgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGJvZHkuY3JlYXRlRWwoXCJ0clwiKS5jcmVhdGVFbChcInRkXCIsIHsgYXR0cjogeyBjb2xzcGFuOiA0IH0sIHRleHQ6IFwiTm8gYWNjb3VudHMuXCIgfSk7XG4gICAgfVxuXG4gICAgLy8gUHJpb3JpdHk6IG5ldmVyLXJlY29uY2lsZWQgZmlyc3QsIHRoZW4gc3RhbGUsIHRoZW4gYnkgbmFtZS5cbiAgICBjb25zdCBzdGFsZURheXMgPSBNYXRoLm1heCgxLCB0b051bSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWNvbmNpbGVTdGFsZURheXMpIHx8IDMwKTtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGFjY291bnRzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGNvbnN0IHBhID0gYS5sYXN0UmVjb25jaWxlZCA/IE1hdGgubWF4KDAsIE1hdGguZmxvb3IoKG5vdyAtIERhdGUucGFyc2UoYS5sYXN0UmVjb25jaWxlZCkpIC8gODY0MDAwMDApKSA6IEluZmluaXR5O1xuICAgICAgY29uc3QgcGIgPSBiLmxhc3RSZWNvbmNpbGVkID8gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcigobm93IC0gRGF0ZS5wYXJzZShiLmxhc3RSZWNvbmNpbGVkKSkgLyA4NjQwMDAwMCkpIDogSW5maW5pdHk7XG4gICAgICBpZiAocGEgIT09IHBiKSByZXR1cm4gcGIgLSBwYTtcbiAgICAgIHJldHVybiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuICAgIH0pO1xuXG4gICAgY29uc3Qgc3VtbWFyeUVsID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJwYy1yZWNvbmNpbGUtc3VtbWFyeVwiIH0pO1xuXG4gICAgY29uc3QgdXBkYXRlU3VtbWFyeSA9ICgpID0+IHtcbiAgICAgIGxldCBmaWxsZWQgPSAwLCBkaWZmVG90YWwgPSAwLCBkaWZmQ291bnQgPSAwO1xuICAgICAgZm9yIChjb25zdCByIG9mIHRoaXMucm93cykge1xuICAgICAgICBpZiAoIXIuYWN0dWFsSW5wdXQudmFsdWUudHJpbSgpKSBjb250aW51ZTtcbiAgICAgICAgZmlsbGVkICs9IDE7XG4gICAgICAgIGNvbnN0IGFjdHVhbCA9IHRvTnVtKHIuYWN0dWFsSW5wdXQudmFsdWUpO1xuICAgICAgICBjb25zdCBkaWZmID0gYWN0dWFsIC0gci5leHBlY3RlZDtcbiAgICAgICAgaWYgKE1hdGguYWJzKGRpZmYpID49IDAuMDA1KSB7XG4gICAgICAgICAgZGlmZkNvdW50ICs9IDE7XG4gICAgICAgICAgZGlmZlRvdGFsICs9IGRpZmY7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHN1bW1hcnlFbC5lbXB0eSgpO1xuICAgICAgaWYgKGZpbGxlZCA9PT0gMCkge1xuICAgICAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLXRleHQtbXV0ZWRcIiwgdGV4dDogXCJGaWxsIGluIGFueSByb3cgdG8gcmVjb25jaWxlLlwiIH0pO1xuICAgICAgfSBlbHNlIGlmIChkaWZmQ291bnQgPT09IDApIHtcbiAgICAgICAgc3VtbWFyeUVsLmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1yZWNvbmNpbGUtZGlmZi0temVyb1wiLCB0ZXh0OiBgXFx1MjcxMyAke2ZpbGxlZH0gYWNjb3VudChzKSBtYXRjaCB0aGUgbGVkZ2VyLmAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzaWduID0gZGlmZlRvdGFsID49IDAgPyBcIitcIiA6IFwiXHUyMjEyXCI7XG4gICAgICAgIGNvbnN0IGNscyA9IGRpZmZUb3RhbCA+PSAwID8gXCJwYy1yZWNvbmNpbGUtZGlmZi0tcG9zXCIgOiBcInBjLXJlY29uY2lsZS1kaWZmLS1uZWdcIjtcbiAgICAgICAgY29uc3QgbGVhZCA9IHN1bW1hcnlFbC5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHMgfSk7XG4gICAgICAgIGxlYWQudGV4dENvbnRlbnQgPSBgJHtkaWZmQ291bnR9IG1pc21hdGNoKGVzKSBcdTAwQjcgbmV0ICR7c2lnbn0ke2ZtdChNYXRoLmFicyhkaWZmVG90YWwpKX1gO1xuICAgICAgICBzdW1tYXJ5RWwuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLXRleHQtbXV0ZWRcIiwgdGV4dDogYCBhY3Jvc3MgJHtmaWxsZWR9IGFjY291bnQocykgY2hlY2tlZGAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgYSBvZiBhY2NvdW50cykge1xuICAgICAgY29uc3QgZXhwZWN0ZWQgPSBnZXRBY2NvdW50QmFsYW5jZShhLCBsZWRnZXIpO1xuICAgICAgY29uc3QgdHIgPSB0Ym9keS5jcmVhdGVFbChcInRyXCIpO1xuXG4gICAgICAvLyBBY2NvdW50IG5hbWUgKyBzdGFsZSBiYWRnZS5cbiAgICAgIGNvbnN0IG5hbWVUZCA9IHRyLmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICBuYW1lVGQuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogYS5uYW1lIH0pO1xuICAgICAgaWYgKCFhLmxhc3RSZWNvbmNpbGVkKSB7XG4gICAgICAgIG5hbWVUZC5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtcmVjb25jaWxlLXN0YWxlLWJhZGdlXCIsIHRleHQ6IFwiIG5ldmVyXCIgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBkYXlzID0gTWF0aC5mbG9vcigobm93IC0gRGF0ZS5wYXJzZShhLmxhc3RSZWNvbmNpbGVkKSkgLyA4NjQwMDAwMCk7XG4gICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUoZGF5cykgJiYgZGF5cyA+PSBzdGFsZURheXMpIHtcbiAgICAgICAgICBuYW1lVGQuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLXJlY29uY2lsZS1zdGFsZS1iYWRnZVwiLCB0ZXh0OiBgICR7ZGF5c31kYCB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBFeHBlY3RlZC5cbiAgICAgIGNvbnN0IGV4cFRkID0gdHIuY3JlYXRlRWwoXCJ0ZFwiLCB7IGNsczogXCJwYy1yZWNvbmNpbGUtbnVtXCIgfSk7XG4gICAgICBleHBUZC50ZXh0Q29udGVudCA9IGAke2ZtdChleHBlY3RlZCl9ICR7YS5jdXJyZW5jeX1gO1xuXG4gICAgICAvLyBBY3R1YWwgaW5wdXQuXG4gICAgICBjb25zdCBhY3RUZCA9IHRyLmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICBjb25zdCBhY3RJbiA9IGFjdFRkLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiIH0pO1xuICAgICAgYWN0SW4uc3RlcCA9IFwiMC4wMVwiO1xuICAgICAgYWN0SW4ucGxhY2Vob2xkZXIgPSBTdHJpbmcoTWF0aC5yb3VuZChleHBlY3RlZCkpO1xuICAgICAga2lsbFdoZWVsQ2hhbmdlKGFjdEluKTtcblxuICAgICAgLy8gRGlmZiBjZWxsLlxuICAgICAgY29uc3QgZGlmZlRkID0gdHIuY3JlYXRlRWwoXCJ0ZFwiLCB7IGNsczogXCJwYy1yZWNvbmNpbGUtbnVtIHBjLXJlY29uY2lsZS1kaWZmLWNlbGxcIiB9KTtcbiAgICAgIGRpZmZUZC50ZXh0Q29udGVudCA9IFwiXHUyMDE0XCI7XG5cbiAgICAgIGNvbnN0IHVwZGF0ZURpZmYgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJhdyA9IGFjdEluLnZhbHVlLnRyaW0oKTtcbiAgICAgICAgaWYgKCFyYXcpIHtcbiAgICAgICAgICBkaWZmVGQudGV4dENvbnRlbnQgPSBcIlx1MjAxNFwiO1xuICAgICAgICAgIGRpZmZUZC5jbGFzc0xpc3QucmVtb3ZlKFwicGMtcmVjb25jaWxlLWRpZmYtLXplcm9cIiwgXCJwYy1yZWNvbmNpbGUtZGlmZi0tcG9zXCIsIFwicGMtcmVjb25jaWxlLWRpZmYtLW5lZ1wiKTtcbiAgICAgICAgICB1cGRhdGVTdW1tYXJ5KCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFjdHVhbCA9IHRvTnVtKHJhdyk7XG4gICAgICAgIGNvbnN0IGRpZmYgPSBhY3R1YWwgLSBleHBlY3RlZDtcbiAgICAgICAgZGlmZlRkLmNsYXNzTGlzdC5yZW1vdmUoXCJwYy1yZWNvbmNpbGUtZGlmZi0temVyb1wiLCBcInBjLXJlY29uY2lsZS1kaWZmLS1wb3NcIiwgXCJwYy1yZWNvbmNpbGUtZGlmZi0tbmVnXCIpO1xuICAgICAgICBpZiAoTWF0aC5hYnMoZGlmZikgPCAwLjAwNSkge1xuICAgICAgICAgIGRpZmZUZC50ZXh0Q29udGVudCA9IGBcXHUyNzEzIG1hdGNoYDtcbiAgICAgICAgICBkaWZmVGQuY2xhc3NMaXN0LmFkZChcInBjLXJlY29uY2lsZS1kaWZmLS16ZXJvXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRpZmZUZC50ZXh0Q29udGVudCA9IGAke2RpZmYgPj0gMCA/IFwiK1wiIDogXCJcdTIyMTJcIn0gJHtmbXQoTWF0aC5hYnMoZGlmZikpfWA7XG4gICAgICAgICAgZGlmZlRkLmNsYXNzTGlzdC5hZGQoZGlmZiA+IDAgPyBcInBjLXJlY29uY2lsZS1kaWZmLS1wb3NcIiA6IFwicGMtcmVjb25jaWxlLWRpZmYtLW5lZ1wiKTtcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVTdW1tYXJ5KCk7XG4gICAgICB9O1xuICAgICAgYWN0SW4ub25pbnB1dCA9IHVwZGF0ZURpZmY7XG5cbiAgICAgIHRoaXMucm93cy5wdXNoKHsgYWNjb3VudDogYSwgZXhwZWN0ZWQsIGFjdHVhbElucHV0OiBhY3RJbiB9KTtcbiAgICB9XG5cbiAgICB1cGRhdGVTdW1tYXJ5KCk7XG5cbiAgICAvLyBCdXR0b25zLlxuICAgIGNvbnN0IGJ0bnMgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtYnV0dG9uc1wiIH0pO1xuICAgIGNvbnN0IG9rQnRuID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiUmVjb25jaWxlXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY29uc3QgY2FuY2VsQnRuID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQ2FuY2VsXCIgfSk7XG5cbiAgICBva0J0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZCA9IHRoaXMuZGF0ZUluLnZhbHVlIHx8IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCk7XG4gICAgICBsZXQgd3JvdGUgPSAwLCBzdGFtcGVkID0gMCwgZXJyb3JzID0gMDtcblxuICAgICAgb2tCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgb2tCdG4udGV4dENvbnRlbnQgPSBcIlJlY29uY2lsaW5nXFx1MjAyNlwiO1xuXG4gICAgICBmb3IgKGNvbnN0IHIgb2YgdGhpcy5yb3dzKSB7XG4gICAgICAgIGNvbnN0IHJhdyA9IHIuYWN0dWFsSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgICBpZiAoIXJhdykgY29udGludWU7XG4gICAgICAgIGNvbnN0IGFjdHVhbCA9IHRvTnVtKHJhdyk7XG4gICAgICAgIGNvbnN0IGRpZmYgPSBhY3R1YWwgLSByLmV4cGVjdGVkO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKE1hdGguYWJzKGRpZmYpID49IDAuMDA1KSB7XG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9IHtcbiAgICAgICAgICAgICAgZCxcbiAgICAgICAgICAgICAgdHlwZTogXCJyZWNvbmNpbGlhdGlvblwiLFxuICAgICAgICAgICAgICBhbXQ6IE1hdGguYWJzKGRpZmYpLFxuICAgICAgICAgICAgICBjYXQ6IFwiUmVjb25jaWxpYXRpb25cIixcbiAgICAgICAgICAgICAgbm90ZTogYEF1dG8tYWRqdXN0ICR7ci5hY2NvdW50Lm5hbWV9OiAke2RpZmYgPj0gMCA/IFwiK1wiIDogXCJcdTIyMTJcIn0ke2ZtdChNYXRoLmFicyhkaWZmKSl9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoZGlmZiA+IDApIGVudHJ5LnRvICAgPSByLmFjY291bnQubmFtZTtcbiAgICAgICAgICAgIGVsc2UgICAgICAgICAgZW50cnkuZnJvbSA9IHIuYWNjb3VudC5uYW1lO1xuICAgICAgICAgICAgYXdhaXQgd3JpdGVMZWRnZXJFbnRyeSh0aGlzLmFwcCwgdGhpcy5wbHVnaW4uc2V0dGluZ3MsIGVudHJ5KTtcbiAgICAgICAgICAgIHdyb3RlICs9IDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHVwZGF0ZUxhc3RSZWNvbmNpbGVkKHRoaXMuYXBwLCByLmFjY291bnQuZmlsZSwgZCk7XG4gICAgICAgICAgc3RhbXBlZCArPSAxO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIltQQ10gcmVjb25jaWxlIHJvdyBmYWlsZWQ6XCIsIHIuYWNjb3VudC5uYW1lLCBlKTtcbiAgICAgICAgICBlcnJvcnMgKz0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc3RhbXBlZCA9PT0gMCkge1xuICAgICAgICBzaG93Tm90aWNlKFwiTm90aGluZyB0byByZWNvbmNpbGUgXHUyMDE0IGZpbGwgaW4gYXQgbGVhc3Qgb25lIHJvdy5cIiwgMzAwMCk7XG4gICAgICAgIG9rQnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIG9rQnRuLnRleHRDb250ZW50ID0gXCJSZWNvbmNpbGVcIjtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtc2cgPSB3cm90ZSA9PT0gMFxuICAgICAgICA/IGBcXHUyNzEzIFN0YW1wZWQgJHtzdGFtcGVkfSBhY2NvdW50KHMpIFx1MjAxNCBhbGwgbWF0Y2hlZGBcbiAgICAgICAgOiBgXFx1MjcxMyBTdGFtcGVkICR7c3RhbXBlZH0sIHdyb3RlICR7d3JvdGV9IGFkanVzdG1lbnQocylgO1xuICAgICAgc2hvd05vdGljZShlcnJvcnMgPiAwID8gYCR7bXNnfSBcdTAwQjcgJHtlcnJvcnN9IGZhaWxlZGAgOiBtc2csIDQwMDApO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgaWYgKHRoaXMub25Eb25lKSBhd2FpdCB0aGlzLm9uRG9uZSgpO1xuICAgIH07XG5cbiAgICBjYW5jZWxCdG4ub25jbGljayA9ICgpID0+IHRoaXMuY2xvc2UoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IFJlY29uY2lsZUFsbE1vZGFsIH07XG4iLCAiLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBEQVNIQk9BUkQgUkVOREVSRVJcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCB7IE1PTlRIX1NIT1JUIH0gPSByZXF1aXJlKFwiLi4vY29uc3RhbnRzXCIpO1xuY29uc3QgeyBmbXQsIHNob3dOb3RpY2UsIG1ha2VJbnRlcmFjdGl2ZSB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuY29uc3QgeyBidWlsZEFzc2V0Rmxvd3NBc3luYyB9ID0gcmVxdWlyZShcIi4uL2Fzc2V0cy9mbG93c1wiKTtcbmNvbnN0IHsgYnVpbGRDYXNoZmxvd1Jvd3MgfSA9IHJlcXVpcmUoXCIuLi9idWRnZXQvY2FzaGZsb3dcIik7XG5jb25zdCB7IGJ1aWxkQnVkZ2V0U3VtbWFyeSwgYnVpbGRQcm9qZWN0ZWQgfSA9IHJlcXVpcmUoXCIuLi9idWRnZXQvc3VtbWFyeVwiKTtcbmNvbnN0IHsgcmVhZENhcGl0YWxIaXN0b3J5IH0gPSByZXF1aXJlKFwiLi4vYnVkZ2V0L3RpbWVsaW5lXCIpO1xuY29uc3QgeyBnZXRMaXF1aWRUb3RhbCB9ID0gcmVxdWlyZShcIi4uL2FjY291bnRzL2JhbGFuY2VcIik7XG5jb25zdCB7IGdlbmVyYXRlTW9udGhseVJlcG9ydCB9ID0gcmVxdWlyZShcIi4uL3JlcG9ydFwiKTtcbmNvbnN0IHsgcmVuZGVyQnVkZ2V0Q2FyZHMgfSA9IHJlcXVpcmUoXCIuL2NhcmRzXCIpO1xuY29uc3QgeyByZW5kZXJQcm9qZWN0ZWQgfSA9IHJlcXVpcmUoXCIuL3Byb2plY3RlZFwiKTtcbmNvbnN0IHsgcmVuZGVyQ2FwaXRhbENoYXJ0IH0gPSByZXF1aXJlKFwiLi9jaGFydFwiKTtcbmNvbnN0IHsgcmVuZGVyQmFza2V0cyB9ID0gcmVxdWlyZShcIi4vYmFza2V0c1wiKTtcbmNvbnN0IHsgcmVuZGVyQXNzZXRDYXJkcyB9ID0gcmVxdWlyZShcIi4vYXNzZXRzXCIpO1xuY29uc3QgeyByZW5kZXJBbmFseXNpc0Jsb2NrIH0gPSByZXF1aXJlKFwiLi9hbmFseXNpc1wiKTtcbmNvbnN0IHsgcmVuZGVyV2FudHNRdWV1ZSB9ID0gcmVxdWlyZShcIi4vd2FudHNcIik7XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbmRlckRhc2hib2FyZChhcHAsIHNldHRpbmdzLCBjb250YWluZXIsIHBsdWdpbikge1xuICBjb250YWluZXIuZW1wdHkoKTtcbiAgY29udGFpbmVyLmFkZENsYXNzKFwicGMtZGFzaGJvYXJkXCIpO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBJZiBvbmJvYXJkaW5nIG5vdCBkb25lLCBzaG93IHBsYWNlaG9sZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBpZiAoIXNldHRpbmdzLm9uYm9hcmRpbmdEb25lKSB7XG4gICAgY29uc3QgeyBPbmJvYXJkaW5nTW9kYWwgfSA9IHJlcXVpcmUoXCIuLi9tb2RhbHMvb25ib2FyZGluZ1wiKTtcbiAgICBjb25zdCBwaCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwicGMtb25ib2FyZC1wbGFjZWhvbGRlclwiIH0pO1xuICAgIHBoLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLW9uYm9hcmQtcGxhY2Vob2xkZXItaWNvblwiLCB0ZXh0OiBcIlx1RDgzRFx1RENDQVwiIH0pO1xuICAgIHBoLmNyZWF0ZUVsKFwiaDJcIiwgIHsgY2xzOiBcInBjLW9uYm9hcmQtcGxhY2Vob2xkZXItdGl0bGVcIiwgdGV4dDogXCJXZWxjb21lIHRvIFBlcnNvbmFsIENhcGl0YWxcIiB9KTtcbiAgICBwaC5jcmVhdGVFbChcInBcIiwgICB7IGNsczogXCJwYy1vbmJvYXJkLXBsYWNlaG9sZGVyLWRlc2NcIixcbiAgICAgIHRleHQ6IFwiTGV0J3Mgc2V0IHVwIHlvdXIgY2FwaXRhbCB0cmFja2luZy4gSXQgdGFrZXMgMzAgc2Vjb25kcyBcdTIwMTQganVzdCBjb3VudCB3aGF0IHlvdSBoYXZlLlwiIH0pO1xuICAgIGNvbnN0IGJ0biA9IHBoLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcInBjLW9uYm9hcmQtcGxhY2Vob2xkZXItYnRuIG1vZC1jdGFcIiwgdGV4dDogXCJTdGFydCBzZXR1cFwiIH0pO1xuICAgIGJ0bi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgaWYgKHBsdWdpbikge1xuICAgICAgICBuZXcgT25ib2FyZGluZ01vZGFsKGFwcCwgcGx1Z2luLCAoKSA9PiB7XG4gICAgICAgICAgcmVuZGVyRGFzaGJvYXJkKGFwcCwgcGx1Z2luLnNldHRpbmdzLCBjb250YWluZXIsIHBsdWdpbik7XG4gICAgICAgIH0pLm9wZW4oKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIEdhdGhlciBkYXRhXG4gIGNvbnN0IGFmID0gYXdhaXQgYnVpbGRBc3NldEZsb3dzQXN5bmMoYXBwLCBzZXR0aW5ncyk7XG4gIGNvbnN0IHsgcGFzc2l2ZUluY29tZSwgc2F2ZXMsIGFzc2V0cywgc2F2ZXNCeU1vbnRoS2V5LCBhY2NvdW50cywgYWxsTGVkZ2VyIH0gPSBhZjtcbiAgY29uc3QgY2ZSb3dzICA9IGJ1aWxkQ2FzaGZsb3dSb3dzKGFwcCwgc2V0dGluZ3MsIGFsbExlZGdlcik7XG4gIGNvbnN0IGJ1ZGdldCAgPSBidWlsZEJ1ZGdldFN1bW1hcnkoY2ZSb3dzLCBzZXR0aW5ncywgYWYpO1xuICBjb25zdCBwcm9qICAgID0gYnVpbGRQcm9qZWN0ZWQoY2ZSb3dzKTtcbiAgY29uc3QgaGlzdG9yeSA9IGF3YWl0IHJlYWRDYXBpdGFsSGlzdG9yeShhcHAsIHNldHRpbmdzKTtcbiAgY29uc3Qgc3ltICAgICA9IHNldHRpbmdzLmhvbWVDdXJyZW5jeVN5bWJvbDtcblxuICAvLyBcdTI1MDBcdTI1MDAgSEVBREVSOiBMRUZUICh0b3RhbCkgKyBSSUdIVCAoYWN0aW9ucykgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IGhlcm9TZWN0aW9uID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1oZXJvLXNlY3Rpb25cIiB9KTtcblxuICBjb25zdCBpbnZlc3RlZENhcGl0YWwgPSBhc3NldHMucmVkdWNlKChzLCBhKSA9PiBzICsgYS5jdXJyZW50VmFsdWVSdWIsIDApO1xuICBjb25zdCBsaXF1aWRUb3RhbCAgICAgPSBnZXRMaXF1aWRUb3RhbChzZXR0aW5ncywgYWNjb3VudHMsIGFsbExlZGdlcik7XG4gIGNvbnN0IHRvdGFsQ2FwaXRhbCAgICA9IGludmVzdGVkQ2FwaXRhbCArIGxpcXVpZFRvdGFsO1xuICBjb25zdCBoZXJvTGVmdCA9IGhlcm9TZWN0aW9uLmNyZWF0ZURpdih7IGNsczogXCJwYy1oZXJvLWxlZnRcIiB9KTtcbiAgaGVyb0xlZnQuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwicGMtaGVyby1sYWJlbFwiLCB0ZXh0OiBcIlRvdGFsIENhcGl0YWxcIiB9KTtcbiAgaGVyb0xlZnQuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwicGMtaGVyby12YWx1ZVwiLCB0ZXh0OiBgJHtmbXQodG90YWxDYXBpdGFsKX0gJHtzeW19YCB9KTtcbiAgY29uc3QgaGVyb1N1YiA9IGhlcm9MZWZ0LmNyZWF0ZURpdih7IGNsczogXCJwYy1oZXJvLXN1YlwiIH0pO1xuICBoZXJvU3ViLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IGBJbnZlc3RlZCAke2ZtdChpbnZlc3RlZENhcGl0YWwpfSAke3N5bX1gIH0pO1xuICBoZXJvU3ViLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiIFx1MDBCNyBcIiB9KTtcbiAgaGVyb1N1Yi5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBgQWNjb3VudHMgJHtmbXQobGlxdWlkVG90YWwpfSAke3N5bX1gIH0pO1xuXG4gIC8vIFJpZ2h0OiBBY3Rpb24gYnV0dG9uc1xuICBjb25zdCBoZXJvUmlnaHQgPSBoZXJvU2VjdGlvbi5jcmVhdGVEaXYoeyBjbHM6IFwicGMtaGVyby1yaWdodFwiIH0pO1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXG4gIC8vIExhenkgcmVxdWlyZSBtb2RhbHMgdG8gYXZvaWQgY2lyY3VsYXIgZGVwc1xuICBjb25zdCB7IEFkZFRyYW5zYWN0aW9uTW9kYWwgfSA9IHJlcXVpcmUoXCIuLi9tb2RhbHMvdHJhbnNhY3Rpb25cIik7XG4gIGNvbnN0IFBDX0xFREdFUl9WSUVXID0gXCJwYy1sZWRnZXItdmlld1wiO1xuXG4gIGNvbnN0IHJlcG9ydEJ0biA9IGhlcm9SaWdodC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJwYy1hY3Rpb24tYnRuXCIsIHRleHQ6IFwiXHVEODNEXHVEQ0NCIFJlcG9ydFwiIH0pO1xuICByZXBvcnRCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICByZXBvcnRCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHJlcG9ydEJ0bi50ZXh0Q29udGVudCA9IFwiR2VuZXJhdGluZ1x1MjAyNlwiO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXRoID0gYXdhaXQgZ2VuZXJhdGVNb250aGx5UmVwb3J0KGFwcCwgc2V0dGluZ3MsIGJ1ZGdldCwgYXNzZXRzLCBjZlJvd3MsIHN5bSk7XG4gICAgICBzaG93Tm90aWNlKGBcdTI3MTMgUmVwb3J0IHNhdmVkOiAke3BhdGh9YCwgNDAwMCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgc2hvd05vdGljZShcIlJlcG9ydCBmYWlsZWQ6IFwiICsgKGUubWVzc2FnZSB8fCBlKSwgNDAwMCk7XG4gICAgfVxuICAgIHJlcG9ydEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIHJlcG9ydEJ0bi50ZXh0Q29udGVudCA9IFwiXHVEODNEXHVEQ0NCIFJlcG9ydFwiO1xuICB9O1xuXG4gIGNvbnN0IGFkZFR4QnRuID0gaGVyb1JpZ2h0LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcInBjLWFjdGlvbi1idG5cIiwgdGV4dDogXCJcdUZGMEIgVHJhbnNhY3Rpb25cIiB9KTtcbiAgYWRkVHhCdG4ub25jbGljayA9ICgpID0+IG5ldyBBZGRUcmFuc2FjdGlvbk1vZGFsKGFwcCwgcGx1Z2luLCBhY2NvdW50cykub3BlbigpO1xuXG4gIGNvbnN0IGxlZGdlckJ0biA9IGhlcm9SaWdodC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJwYy1hY3Rpb24tYnRuXCIsIHRleHQ6IFwiXHVEODNEXHVEQ0QyIExlZGdlclwiIH0pO1xuICBsZWRnZXJCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBsZWFmID0gYXBwLndvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgIGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHsgdHlwZTogUENfTEVER0VSX1ZJRVcsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgfTtcblxuICBjb25zdCB7IFJlY29uY2lsZUFsbE1vZGFsIH0gPSByZXF1aXJlKFwiLi4vbW9kYWxzL3JlY29uY2lsZVwiKTtcbiAgY29uc3QgcmVjb25jaWxlQnRuID0gaGVyb1JpZ2h0LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcInBjLWFjdGlvbi1idG5cIiwgdGV4dDogXCJcXHUyNjk2IFJlY29uY2lsZVwiIH0pO1xuICByZWNvbmNpbGVCdG4ub25jbGljayA9ICgpID0+IG5ldyBSZWNvbmNpbGVBbGxNb2RhbChhcHAsIHBsdWdpbiwgKCkgPT4gcmVuZGVyRGFzaGJvYXJkKGFwcCwgc2V0dGluZ3MsIGNvbnRhaW5lciwgcGx1Z2luKSkub3BlbigpO1xuXG4gIGNvbnN0IHJlZnJlc2hCdG4gPSBoZXJvUmlnaHQuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwicGMtYWN0aW9uLWJ0biBwYy1hY3Rpb24tYnRuLS1zZWNvbmRhcnlcIiwgdGV4dDogXCJcdTIxQkIgUmVmcmVzaFwiIH0pO1xuICByZWZyZXNoQnRuLm9uY2xpY2sgPSAoKSA9PiByZW5kZXJEYXNoYm9hcmQoYXBwLCBzZXR0aW5ncywgY29udGFpbmVyLCBwbHVnaW4pO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBCTE9DSyAxOiBCVURHRVQgQ0FSRFMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IGIxID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1ibG9ja1wiIH0pO1xuICBiMS5jcmVhdGVFbChcImRpdlwiLCB7IGNsczogXCJwYy1ibG9jay10aXRsZVwiLCB0ZXh0OiBcIkJ1ZGdldCBcdTAwQjcgXCIgKyBNT05USF9TSE9SVFtub3cuZ2V0TW9udGgoKV0gfSk7XG4gIGNvbnN0IGIxYm9keSA9IGIxLmNyZWF0ZURpdih7IGNsczogXCJwYy1ibG9jay1ib2R5IHBjLWNhcmRzLWdyaWRcIiB9KTtcbiAgcmVuZGVyQnVkZ2V0Q2FyZHMoYjFib2R5LCBidWRnZXQsIHN5bSk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEJMT0NLIDFiOiBXQU5UUyBRVUVVRSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgYjFiID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1ibG9ja1wiIH0pO1xuICByZW5kZXJXYW50c1F1ZXVlKGIxYiwgYXBwLCBzZXR0aW5ncyk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEJMT0NLIDI6IFBST0pFQ1RFRCBORVhUIE1PTlRIIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBiMiA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYmxvY2tcIiB9KTtcbiAgYjIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwicGMtYmxvY2stdGl0bGVcIiwgdGV4dDogXCJQcm9qZWN0ZWQgXHUwMEI3IFwiICsgTU9OVEhfU0hPUlRbKG5vdy5nZXRNb250aCgpICsgMSkgJSAxMl0gfSk7XG4gIGNvbnN0IGIyYm9keSA9IGIyLmNyZWF0ZURpdih7IGNsczogXCJwYy1ibG9jay1ib2R5XCIgfSk7XG4gIHJlbmRlclByb2plY3RlZChiMmJvZHksIHByb2osIHN5bSwgYnVkZ2V0KTtcblxuICAvLyBcdTI1MDBcdTI1MDAgQkxPQ0sgMzogQ0FQSVRBTCBHUk9XVEggQ0hBUlQgKyBBU1NFVFMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IGIzID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1ibG9ja1wiIH0pO1xuICBjb25zdCBiM2hlYWRlciA9IGIzLmNyZWF0ZURpdih7IGNsczogXCJwYy1ibG9jay1oZWFkZXJcIiB9KTtcbiAgYjNoZWFkZXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwicGMtYmxvY2stdGl0bGVcIiwgdGV4dDogXCJDYXBpdGFsIEdyb3d0aFwiIH0pO1xuXG4gIGNvbnN0IGIzYm9keSA9IGIzLmNyZWF0ZURpdih7IGNsczogXCJwYy1ibG9jay1ib2R5XCIgfSk7XG4gIHJlbmRlckNhcGl0YWxDaGFydChiM2JvZHksIGhpc3RvcnksIGFzc2V0cywgc2V0dGluZ3MsIGJ1ZGdldCwgYWNjb3VudHMsIGFsbExlZGdlcik7XG4gIHJlbmRlckJhc2tldHMoYjNib2R5LCBhc3NldHMsIHNldHRpbmdzLCBzeW0sIGFwcCwgcGx1Z2luLCBhY2NvdW50cywgYWxsTGVkZ2VyKTtcbiAgcmVuZGVyQXNzZXRDYXJkcyhiM2JvZHksIGFzc2V0cywgc2V0dGluZ3MsIGFwcCwgcGx1Z2luLCBjb250YWluZXIpO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBCTE9DSyA0OiBBTkFMWVNJUyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgYjQgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWJsb2NrXCIgfSk7XG4gIGI0LmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLWJsb2NrLXRpdGxlXCIsIHRleHQ6IFwiQW5hbHlzaXMgU2Vzc2lvblwiIH0pO1xuICBjb25zdCBiNGJvZHkgPSBiNC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtYmxvY2stYm9keVwiIH0pO1xuICByZW5kZXJBbmFseXNpc0Jsb2NrKGI0Ym9keSwgYXBwLCBzZXR0aW5ncyk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNFVFRJTkdTIExJTksgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IHNldHRpbmdzQnRuID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1zZXR0aW5ncy1saW5rXCIgfSk7XG4gIG1ha2VJbnRlcmFjdGl2ZShzZXR0aW5nc0J0bik7XG4gIHNldHRpbmdzQnRuLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiXHUyNjk5XCIgfSk7XG4gIHNldHRpbmdzQnRuLmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IFwiU2V0dGluZ3NcIiB9KTtcbiAgc2V0dGluZ3NCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICBhcHAuc2V0dGluZy5vcGVuKCk7XG4gICAgYXBwLnNldHRpbmcub3BlblRhYkJ5SWQoXCJwZXJzb25hbC1jYXBpdGFsXCIpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgcmVuZGVyRGFzaGJvYXJkIH07XG4iLCAiY29uc3QgeyBNb2RhbCB9ID0gcmVxdWlyZShcIm9ic2lkaWFuXCIpO1xuY29uc3QgeyBNT05USF9OQU1FUywgTU9OVEhfS0VZUyB9ID0gcmVxdWlyZShcIi4uL2NvbnN0YW50c1wiKTtcbmNvbnN0IHsgdG9OdW0sIHNob3dOb3RpY2UsIGZtdCwga2lsbFdoZWVsQ2hhbmdlIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5jb25zdCB7IHJlYWRMZWRnZXIsIHdyaXRlTGVkZ2VyRW50cnksIGRlbGV0ZUxlZGdlckVudHJ5IH0gPSByZXF1aXJlKFwiLi4vbGVkZ2VyL2lvXCIpO1xuXG5jbGFzcyBDYXNoZmxvd0NlbGxNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoYXBwLCBzZXR0aW5ncywgb3B0cykge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgIHRoaXMueWVhciA9IG9wdHMueWVhcjtcbiAgICB0aGlzLm1vbnRoSWR4ID0gb3B0cy5tb250aElkeDtcbiAgICB0aGlzLmNhdGVnb3J5ID0gb3B0cy5jYXRlZ29yeTtcbiAgICB0aGlzLmlzSW5jb21lID0gISFvcHRzLmlzSW5jb21lO1xuICAgIHRoaXMuYWNjb3VudHMgPSBvcHRzLmFjY291bnRzIHx8IFtdO1xuICAgIHRoaXMub25TYXZlZCA9IG9wdHMub25TYXZlZDtcbiAgICAvLyBXb3JraW5nIHJvdyBzdGF0ZTogeyBlbnRyeTogb3JpZ2luYWx8bnVsbCwgZHJhZnQ6IHtkLGFtdCxhY2N0LG5vdGV9LCBkZWxldGVkOiBib29sIH1cbiAgICB0aGlzLnJvd3MgPSBbXTtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICBjb25zdCBtb250aE5hbWUgPSBNT05USF9OQU1FU1t0aGlzLm1vbnRoSWR4XTtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChgJHttb250aE5hbWV9ICR7dGhpcy55ZWFyfSBcdTAwQjcgJHt0aGlzLmNhdGVnb3J5fWApO1xuXG4gICAgLy8gTG9hZCBleGlzdGluZyBsZWRnZXIgZW50cmllcyBmb3IgdGhpcyAoeWVhciwgbW9udGgsIGNhdGVnb3J5KVxuICAgIGNvbnN0IGFsbCA9IGF3YWl0IHJlYWRMZWRnZXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MsIHRoaXMueWVhcik7XG4gICAgY29uc3QgbW0gPSBTdHJpbmcodGhpcy5tb250aElkeCArIDEpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICBjb25zdCBwcmVmaXggPSBgJHt0aGlzLnllYXJ9LSR7bW19YDtcbiAgICBjb25zdCBtYXRjaGluZyA9IGFsbC5maWx0ZXIoZSA9PlxuICAgICAgZSAmJiBlLmQgJiYgZS5kLnN0YXJ0c1dpdGgocHJlZml4KSAmJlxuICAgICAgZS5jYXQgPT09IHRoaXMuY2F0ZWdvcnkgJiZcbiAgICAgIChlLnR5cGUgPT09IFwiZXhwZW5zZVwiIHx8IGUudHlwZSA9PT0gXCJpbmNvbWVcIilcbiAgICApO1xuXG4gICAgZm9yIChjb25zdCBlIG9mIG1hdGNoaW5nKSB7XG4gICAgICB0aGlzLnJvd3MucHVzaCh7XG4gICAgICAgIGVudHJ5OiBlLFxuICAgICAgICBkcmFmdDoge1xuICAgICAgICAgIGQ6IGUuZCxcbiAgICAgICAgICBhbXQ6IE1hdGguYWJzKHRvTnVtKGUuYW10KSksXG4gICAgICAgICAgYWNjdDogKHRoaXMuaXNJbmNvbWUgPyBlLnRvIDogZS5mcm9tKSB8fCBcIlwiLFxuICAgICAgICAgIG5vdGU6IGUubm90ZSB8fCBcIlwiLFxuICAgICAgICB9LFxuICAgICAgICBkZWxldGVkOiBmYWxzZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHRhYmxlV3JhcCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtY2VsbC1tb2RhbFwiIH0pO1xuICAgIGNvbnN0IHRhYmxlID0gdGFibGVXcmFwLmNyZWF0ZUVsKFwidGFibGVcIiwgeyBjbHM6IFwicGMtY2VsbC1tb2RhbC10YWJsZVwiIH0pO1xuICAgIGNvbnN0IHRoZWFkID0gdGFibGUuY3JlYXRlRWwoXCJ0aGVhZFwiKTtcbiAgICBjb25zdCBociA9IHRoZWFkLmNyZWF0ZUVsKFwidHJcIik7XG4gICAgW1wiRGF0ZVwiLCBcIkFtb3VudFwiLCB0aGlzLmlzSW5jb21lID8gXCJUbyBhY2NvdW50XCIgOiBcIkZyb20gYWNjb3VudFwiLCBcIk5vdGVcIiwgXCJcIl0uZm9yRWFjaChoID0+IGhyLmNyZWF0ZUVsKFwidGhcIiwgeyB0ZXh0OiBoIH0pKTtcbiAgICBjb25zdCB0Ym9keSA9IHRhYmxlLmNyZWF0ZUVsKFwidGJvZHlcIik7XG5cbiAgICBjb25zdCByZW5kZXJSb3dzID0gKCkgPT4ge1xuICAgICAgdGJvZHkuZW1wdHkoKTtcbiAgICAgIGNvbnN0IHZpc2libGUgPSB0aGlzLnJvd3MuZmlsdGVyKHIgPT4gIXIuZGVsZXRlZCk7XG4gICAgICBpZiAodmlzaWJsZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc3QgZW1wdHlUciA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIik7XG4gICAgICAgIGVtcHR5VHIuY3JlYXRlRWwoXCJ0ZFwiLCB7IHRleHQ6IFwiTm8gZW50cmllcyB5ZXQuXCIsIGF0dHI6IHsgY29sc3BhbjogXCI1XCIgfSwgY2xzOiBcInBjLWNlbGwtbW9kYWwtZW1wdHlcIiB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMucm93cy5mb3JFYWNoKChyLCBpZHgpID0+IHtcbiAgICAgICAgaWYgKHIuZGVsZXRlZCkgcmV0dXJuO1xuICAgICAgICBjb25zdCB0ciA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwgeyBjbHM6IFwicGMtY2VsbC1tb2RhbC1yb3dcIiB9KTtcblxuICAgICAgICBjb25zdCBkYXRlVGQgPSB0ci5jcmVhdGVFbChcInRkXCIpO1xuICAgICAgICBjb25zdCBkYXRlSW4gPSBkYXRlVGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiZGF0ZVwiLCBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiIH0pO1xuICAgICAgICBkYXRlSW4udmFsdWUgPSByLmRyYWZ0LmQ7XG4gICAgICAgIGRhdGVJbi5vbmNoYW5nZSA9ICgpID0+IHsgci5kcmFmdC5kID0gZGF0ZUluLnZhbHVlOyB9O1xuXG4gICAgICAgIGNvbnN0IHN5bmNFcnIgPSAoKSA9PiB0ci5jbGFzc0xpc3QudG9nZ2xlKFwicGMtcm93LWVycm9yXCIsIHIuZHJhZnQuYW10ID4gMCAmJiAhci5kcmFmdC5hY2N0KTtcblxuICAgICAgICBjb25zdCBhbXRUZCA9IHRyLmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgIGNvbnN0IGFtdEluID0gYW10VGQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwibnVtYmVyXCIsIGNsczogXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIgfSk7XG4gICAgICAgIGFtdEluLnN0ZXAgPSBcImFueVwiO1xuICAgICAgICBhbXRJbi52YWx1ZSA9IHIuZHJhZnQuYW10ID8gU3RyaW5nKHIuZHJhZnQuYW10KSA6IFwiXCI7XG4gICAgICAgIGtpbGxXaGVlbENoYW5nZShhbXRJbik7XG4gICAgICAgIGFtdEluLm9uaW5wdXQgPSAoKSA9PiB7IHIuZHJhZnQuYW10ID0gcGFyc2VGbG9hdChhbXRJbi52YWx1ZSkgfHwgMDsgc3luY0VycigpOyB1cGRhdGVTYXZlU3RhdGUoKTsgfTtcblxuICAgICAgICBjb25zdCBhY2N0VGQgPSB0ci5jcmVhdGVFbChcInRkXCIpO1xuICAgICAgICBjb25zdCBhY2N0U2VsID0gYWNjdFRkLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIiB9KTtcbiAgICAgICAgYWNjdFNlbC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiXHUyMDE0IHNlbGVjdCBcdTIwMTRcIiwgdmFsdWU6IFwiXCIgfSk7XG4gICAgICAgIGZvciAoY29uc3QgYSBvZiB0aGlzLmFjY291bnRzKSBhY2N0U2VsLmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogYS5uYW1lLCB2YWx1ZTogYS5uYW1lIH0pO1xuICAgICAgICBhY2N0U2VsLnZhbHVlID0gci5kcmFmdC5hY2N0O1xuICAgICAgICBhY2N0U2VsLm9uY2hhbmdlID0gKCkgPT4geyByLmRyYWZ0LmFjY3QgPSBhY2N0U2VsLnZhbHVlOyBzeW5jRXJyKCk7IHVwZGF0ZVNhdmVTdGF0ZSgpOyB9O1xuICAgICAgICBzeW5jRXJyKCk7XG5cbiAgICAgICAgY29uc3Qgbm90ZVRkID0gdHIuY3JlYXRlRWwoXCJ0ZFwiKTtcbiAgICAgICAgY29uc3Qgbm90ZUluID0gbm90ZVRkLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIiB9KTtcbiAgICAgICAgbm90ZUluLnZhbHVlID0gci5kcmFmdC5ub3RlIHx8IFwiXCI7XG4gICAgICAgIG5vdGVJbi5vbmlucHV0ID0gKCkgPT4geyByLmRyYWZ0Lm5vdGUgPSBub3RlSW4udmFsdWU7IH07XG5cbiAgICAgICAgY29uc3QgZGVsVGQgPSB0ci5jcmVhdGVFbChcInRkXCIpO1xuICAgICAgICBjb25zdCBkZWxCdG4gPSBkZWxUZC5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiXHUyNzE1XCIsIGNsczogXCJwYy1jZWxsLW1vZGFsLWRlbFwiIH0pO1xuICAgICAgICBkZWxCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICByLmRlbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgIHJlbmRlclJvd3MoKTtcbiAgICAgICAgICB1cGRhdGVTYXZlU3RhdGUoKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBZGQgcm93XG4gICAgICBjb25zdCBhZGRUciA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwgeyBjbHM6IFwicGMtY2VsbC1tb2RhbC1hZGRyb3dcIiB9KTtcbiAgICAgIGNvbnN0IGFkZFRkID0gYWRkVHIuY3JlYXRlRWwoXCJ0ZFwiLCB7IHRleHQ6IFwiKyBBZGQgZW50cnlcIiwgYXR0cjogeyBjb2xzcGFuOiBcIjVcIiB9IH0pO1xuICAgICAgYWRkVGQub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgZGVmYXVsdERhdGUgPSBgJHt0aGlzLnllYXJ9LSR7bW19LTE1YDtcbiAgICAgICAgdGhpcy5yb3dzLnB1c2goe1xuICAgICAgICAgIGVudHJ5OiBudWxsLFxuICAgICAgICAgIGRyYWZ0OiB7IGQ6IGRlZmF1bHREYXRlLCBhbXQ6IDAsIGFjY3Q6IFwiXCIsIG5vdGU6IFwiXCIgfSxcbiAgICAgICAgICBkZWxldGVkOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJlbmRlclJvd3MoKTtcbiAgICAgICAgdXBkYXRlU2F2ZVN0YXRlKCk7XG4gICAgICB9O1xuICAgIH07XG5cbiAgICBjb25zdCBidG5zID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJwZXJzb25hbC1jYXBpdGFsLWJ1dHRvbnNcIiB9KTtcbiAgICBjb25zdCBzYXZlQnRuID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiU2F2ZVwiLCBjbHM6IFwibW9kLWN0YVwiIH0pO1xuICAgIGNvbnN0IGNhbmNlbEJ0biA9IGJ0bnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuXG4gICAgY29uc3QgdXBkYXRlU2F2ZVN0YXRlID0gKCkgPT4ge1xuICAgICAgY29uc3QgaGFzSW52YWxpZCA9IHRoaXMucm93cy5zb21lKHIgPT4gIXIuZGVsZXRlZCAmJiByLmRyYWZ0LmFtdCA+IDAgJiYgIXIuZHJhZnQuYWNjdCk7XG4gICAgICBzYXZlQnRuLmRpc2FibGVkID0gaGFzSW52YWxpZDtcbiAgICAgIHNhdmVCdG4uY2xhc3NMaXN0LnRvZ2dsZShcImlzLWRpc2FibGVkXCIsIGhhc0ludmFsaWQpO1xuICAgIH07XG5cbiAgICBzYXZlQnRuLm9uY2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICBzYXZlQnRuLmRpc2FibGVkID0gdHJ1ZTtcblxuICAgICAgLy8gMSkgUHJvY2VzcyBkZWxldGlvbnMgYW5kIHVwZGF0ZXNcbiAgICAgIGZvciAoY29uc3QgciBvZiB0aGlzLnJvd3MpIHtcbiAgICAgICAgaWYgKHIuZW50cnkgJiYgci5kZWxldGVkKSB7XG4gICAgICAgICAgYXdhaXQgZGVsZXRlTGVkZ2VyRW50cnkodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MsIHIuZW50cnkpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyLmVudHJ5ICYmICFyLmRlbGV0ZWQpIHtcbiAgICAgICAgICBjb25zdCBvcmlnID0gci5lbnRyeTtcbiAgICAgICAgICBjb25zdCBvcmlnQWNjdCA9ICh0aGlzLmlzSW5jb21lID8gb3JpZy50byA6IG9yaWcuZnJvbSkgfHwgXCJcIjtcbiAgICAgICAgICBjb25zdCBjaGFuZ2VkID1cbiAgICAgICAgICAgIG9yaWcuZCAhPT0gci5kcmFmdC5kIHx8XG4gICAgICAgICAgICBNYXRoLmFicyh0b051bShvcmlnLmFtdCkpICE9PSByLmRyYWZ0LmFtdCB8fFxuICAgICAgICAgICAgKG9yaWcubm90ZSB8fCBcIlwiKSAhPT0gKHIuZHJhZnQubm90ZSB8fCBcIlwiKSB8fFxuICAgICAgICAgICAgb3JpZ0FjY3QgIT09IHIuZHJhZnQuYWNjdDtcbiAgICAgICAgICBpZiAoIWNoYW5nZWQpIGNvbnRpbnVlO1xuICAgICAgICAgIGF3YWl0IGRlbGV0ZUxlZGdlckVudHJ5KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLCBvcmlnKTtcbiAgICAgICAgICBjb25zdCBlbnRyeSA9IHtcbiAgICAgICAgICAgIGQ6IHIuZHJhZnQuZCxcbiAgICAgICAgICAgIHR5cGU6IHRoaXMuaXNJbmNvbWUgPyBcImluY29tZVwiIDogXCJleHBlbnNlXCIsXG4gICAgICAgICAgICBjYXQ6IHRoaXMuY2F0ZWdvcnksXG4gICAgICAgICAgICBhbXQ6IHIuZHJhZnQuYW10LFxuICAgICAgICAgIH07XG4gICAgICAgICAgaWYgKHRoaXMuaXNJbmNvbWUpIGVudHJ5LnRvID0gci5kcmFmdC5hY2N0OyBlbHNlIGVudHJ5LmZyb20gPSByLmRyYWZ0LmFjY3Q7XG4gICAgICAgICAgaWYgKHIuZHJhZnQubm90ZSkgZW50cnkubm90ZSA9IHIuZHJhZnQubm90ZTtcbiAgICAgICAgICBhd2FpdCB3cml0ZUxlZGdlckVudHJ5KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzLCBlbnRyeSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFyLmVudHJ5ICYmICFyLmRlbGV0ZWQgJiYgci5kcmFmdC5hbXQgPiAwICYmIHIuZHJhZnQuYWNjdCkge1xuICAgICAgICAgIGNvbnN0IGVudHJ5ID0ge1xuICAgICAgICAgICAgZDogci5kcmFmdC5kLFxuICAgICAgICAgICAgdHlwZTogdGhpcy5pc0luY29tZSA/IFwiaW5jb21lXCIgOiBcImV4cGVuc2VcIixcbiAgICAgICAgICAgIGNhdDogdGhpcy5jYXRlZ29yeSxcbiAgICAgICAgICAgIGFtdDogci5kcmFmdC5hbXQsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZiAodGhpcy5pc0luY29tZSkgZW50cnkudG8gPSByLmRyYWZ0LmFjY3Q7IGVsc2UgZW50cnkuZnJvbSA9IHIuZHJhZnQuYWNjdDtcbiAgICAgICAgICBpZiAoci5kcmFmdC5ub3RlKSBlbnRyeS5ub3RlID0gci5kcmFmdC5ub3RlO1xuICAgICAgICAgIGF3YWl0IHdyaXRlTGVkZ2VyRW50cnkodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MsIGVudHJ5KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICBpZiAodGhpcy5vblNhdmVkKSBhd2FpdCB0aGlzLm9uU2F2ZWQoKTtcbiAgICB9O1xuXG4gICAgY2FuY2VsQnRuLm9uY2xpY2sgPSAoKSA9PiB0aGlzLmNsb3NlKCk7XG5cbiAgICByZW5kZXJSb3dzKCk7XG4gICAgdXBkYXRlU2F2ZVN0YXRlKCk7XG4gIH1cblxuICBvbkNsb3NlKCkgeyB0aGlzLmNvbnRlbnRFbC5lbXB0eSgpOyB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyBDYXNoZmxvd0NlbGxNb2RhbCB9O1xuIiwgImNvbnN0IHsgTW9kYWwgfSA9IHJlcXVpcmUoXCJvYnNpZGlhblwiKTtcbmNvbnN0IHsgc2hvd05vdGljZSB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuXG5jbGFzcyBBZGRDYXRlZ29yeU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihhcHAsIHNldHRpbmdzLCBvbkRvbmUpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB0aGlzLm9uRG9uZSA9IG9uRG9uZTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuZW1wdHkoKTtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIk5ldyBjYXRlZ29yeVwiKTtcblxuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtZm9ybVwiIH0pO1xuXG4gICAgY29uc3QgbmFtZVdyYXAgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgIG5hbWVXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIk5hbWVcIiB9KTtcbiAgICBjb25zdCBuYW1lSW4gPSBuYW1lV3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIgfSk7XG4gICAgbmFtZUluLnBsYWNlaG9sZGVyID0gXCJlLmcuIEdyb2Nlcmllc1wiO1xuXG4gICAgY29uc3QgdHlwZVdyYXAgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgIHR5cGVXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlR5cGVcIiB9KTtcbiAgICBjb25zdCB0eXBlU2VsID0gdHlwZVdyYXAuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiIH0pO1xuICAgIGZvciAoY29uc3QgdCBvZiBbXCJJbmNvbWVcIiwgXCJOZWVkc1wiLCBcIldhbnRzXCJdKSB7XG4gICAgICB0eXBlU2VsLmNyZWF0ZUVsKFwib3B0aW9uXCIsIHsgdGV4dDogdCwgdmFsdWU6IHQgfSk7XG4gICAgfVxuICAgIHR5cGVTZWwudmFsdWUgPSBcIldhbnRzXCI7XG5cbiAgICBjb25zdCBlbW9qaVdyYXAgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgIGVtb2ppV3JhcC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJFbW9qaVwiIH0pO1xuICAgIGNvbnN0IGVtb2ppSW4gPSBlbW9qaVdyYXAuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwidGV4dFwiLCBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiIH0pO1xuICAgIGVtb2ppSW4ucGxhY2Vob2xkZXIgPSBcIlx1RDgzRFx1REVEMlwiO1xuICAgIGVtb2ppSW4ubWF4TGVuZ3RoID0gNDtcblxuICAgIGNvbnN0IHJlY1dyYXAgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgIGNvbnN0IHJlY0xibCA9IHJlY1dyYXAuY3JlYXRlRWwoXCJsYWJlbFwiLCB7IHRleHQ6IFwiUmVjdXJyaW5nIChmZWVkcyBQcm9qZWN0ZWQgc2VjdGlvbikgXCIgfSk7XG4gICAgY29uc3QgcmVjSW4gPSByZWNMYmwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcblxuICAgIGNvbnN0IGJ0bnMgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtYnV0dG9uc1wiIH0pO1xuICAgIGNvbnN0IHNhdmVCdG4gPSBidG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJDcmVhdGVcIiwgY2xzOiBcIm1vZC1jdGFcIiB9KTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBidG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJDYW5jZWxcIiB9KTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lSW4udmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCFuYW1lKSB7IHNob3dOb3RpY2UoXCJOYW1lIGlzIHJlcXVpcmVkXCIpOyByZXR1cm47IH1cbiAgICAgIGlmICgvW1xcXFwvOio/XCI8PnxdLy50ZXN0KG5hbWUpKSB7IHNob3dOb3RpY2UoXCJJbnZhbGlkIGNoYXJhY3RlcnMgaW4gbmFtZVwiKTsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuc2V0dGluZ3MuY2F0ZWdvcmllc0ZvbGRlciB8fCBcImZpbmFuY2UvRGF0YS9jYXRlZ29yaWVzXCI7XG4gICAgICBjb25zdCBwYXRoID0gYCR7Zm9sZGVyfS8ke25hbWV9Lm1kYDtcblxuICAgICAgaWYgKHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKSkge1xuICAgICAgICBzaG93Tm90aWNlKGBDYXRlZ29yeSBcIiR7bmFtZX1cIiBhbHJlYWR5IGV4aXN0c2ApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXIpKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXIpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdHlwZSA9IHR5cGVTZWwudmFsdWU7XG4gICAgICBjb25zdCBlbW9qaSA9IGVtb2ppSW4udmFsdWUudHJpbSgpO1xuICAgICAgY29uc3QgcmVjdXJyaW5nID0gISFyZWNJbi5jaGVja2VkO1xuICAgICAgY29uc3QgZm0gPSBbXG4gICAgICAgIFwiLS0tXCIsXG4gICAgICAgIGBjYXRlZ29yeTogJHtuYW1lfWAsXG4gICAgICAgIGB0eXBlOiAke3R5cGV9YCxcbiAgICAgICAgYGVtb2ppOiAke2Vtb2ppfWAsXG4gICAgICAgIGByZWN1cnJpbmc6ICR7cmVjdXJyaW5nfWAsXG4gICAgICAgIFwiLS0tXCIsXG4gICAgICAgIFwiXCIsXG4gICAgICBdLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBmbSk7XG4gICAgICBzaG93Tm90aWNlKGBcdTI3MTMgQ3JlYXRlZCBjYXRlZ29yeSBcIiR7bmFtZX1cImApO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgaWYgKHRoaXMub25Eb25lKSBhd2FpdCB0aGlzLm9uRG9uZSgpO1xuICAgIH07XG5cbiAgICBjYW5jZWxCdG4ub25jbGljayA9ICgpID0+IHRoaXMuY2xvc2UoKTtcbiAgICBuYW1lSW4uZm9jdXMoKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7IHRoaXMuY29udGVudEVsLmVtcHR5KCk7IH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IEFkZENhdGVnb3J5TW9kYWwgfTtcbiIsICJjb25zdCB7IE1PTlRIX0tFWVMsIE1PTlRIX05BTUVTLCBNT05USF9TSE9SVCB9ID0gcmVxdWlyZShcIi4uL2NvbnN0YW50c1wiKTtcbmNvbnN0IHsgdG9OdW0sIGZtdCwgZ2V0Q3VycmVudFllYXIsIGdldEN1cnJlbnRNb250aEtleSwgbWFrZUludGVyYWN0aXZlIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5jb25zdCB7IHJlYWRBbGxMZWRnZXIsIHJlYWRMZWRnZXJNdWx0aVllYXIgfSA9IHJlcXVpcmUoXCIuLi9sZWRnZXIvaW9cIik7XG5jb25zdCB7IHJlYWRBY2NvdW50cyB9ID0gcmVxdWlyZShcIi4uL2FjY291bnRzL2lvXCIpO1xuY29uc3QgeyBnZXRBY2NvdW50QmFsYW5jZSB9ID0gcmVxdWlyZShcIi4uL2FjY291bnRzL2JhbGFuY2VcIik7XG5jb25zdCB7IGJ1aWxkQ2FzaGZsb3dSb3dzIH0gPSByZXF1aXJlKFwiLi4vYnVkZ2V0L2Nhc2hmbG93XCIpO1xuXG5hc3luYyBmdW5jdGlvbiByZW5kZXJMZWRnZXJDbGFzc2ljKGFwcCwgc2V0dGluZ3MsIGNvbnRhaW5lciwgcGx1Z2luLCBvbkNoYW5nZSkge1xuICBjb250YWluZXIuZW1wdHkoKTtcbiAgY29udGFpbmVyLmFkZENsYXNzKFwicGMtbGVkZ2VyLXZpZXdcIik7XG5cbiAgY29uc3QgZW50cmllcyA9IGF3YWl0IHJlYWRBbGxMZWRnZXIoYXBwLCBzZXR0aW5ncyk7XG4gIGNvbnN0IGFjY291bnRzID0gYXdhaXQgcmVhZEFjY291bnRzKGFwcCwgc2V0dGluZ3MpO1xuICBjb25zdCBzeW0gPSBzZXR0aW5ncy5ob21lQ3VycmVuY3lTeW1ib2w7XG5cbiAgLy8gRmlsdGVyIGJhclxuICBjb25zdCBmaWx0ZXJCYXIgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWxlZGdlci1maWx0ZXJzXCIgfSk7XG4gIGxldCBmaWx0ZXJUeXBlID0gXCJcIjtcbiAgbGV0IGZpbHRlckFjY291bnQgPSBcIlwiO1xuICBjb25zdCB0eXBlU2VsZWN0ID0gZmlsdGVyQmFyLmNyZWF0ZUVsKFwic2VsZWN0XCIsIHsgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXQgcGMtbGVkZ2VyLWZpbHRlci1zZWxlY3RcIiB9KTtcbiAgdHlwZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IFwiQWxsIHR5cGVzXCIsIHZhbHVlOiBcIlwiIH0pO1xuICBmb3IgKGNvbnN0IHQgb2YgW1wiYnV5XCIsXCJzZWxsXCIsXCJkaXZpZGVuZFwiLFwiY2xvc2VcIixcImV4cGVuc2VcIixcImluY29tZVwiLFwidHJhbnNmZXJcIixcInJlY29uY2lsaWF0aW9uXCJdKSB7XG4gICAgdHlwZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IHQsIHZhbHVlOiB0IH0pO1xuICB9XG5cbiAgLy8gQWNjb3VudHMgc3VtbWFyeSBcdTIwMTQgY2xpY2thYmxlIHRvIGZpbHRlclxuICBjb25zdCBhY2N0QmFyID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1sZWRnZXItYWNjb3VudHNcIiB9KTtcbiAgY29uc3QgYWxsVGFnID0gYWNjdEJhci5jcmVhdGVEaXYoeyBjbHM6IFwicGMtbGVkZ2VyLWFjY3QtdGFnIHBjLWxlZGdlci1hY2N0LWFjdGl2ZVwiIH0pO1xuICBhbGxUYWcuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLWxlZGdlci1hY2N0LW5hbWVcIiwgdGV4dDogXCJBbGxcIiB9KTtcbiAgYWxsVGFnLmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1sZWRnZXItYWNjdC1iYWxcIiwgdGV4dDogYCR7ZW50cmllcy5sZW5ndGh9YCB9KTtcblxuICBjb25zdCBhY2N0VGFncyA9IFt7IGVsOiBhbGxUYWcsIG5hbWU6IFwiXCIgfV07XG4gIGNvbnN0IHN0YWxlRGF5cyA9IE1hdGgubWF4KDEsIHRvTnVtKHNldHRpbmdzLnJlY29uY2lsZVN0YWxlRGF5cykgfHwgMzApO1xuICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gIGZvciAoY29uc3QgYSBvZiBhY2NvdW50cykge1xuICAgIGNvbnN0IGJhbCA9IGdldEFjY291bnRCYWxhbmNlKGEsIGVudHJpZXMpO1xuICAgIGNvbnN0IHRhZyA9IGFjY3RCYXIuY3JlYXRlRGl2KHsgY2xzOiBgcGMtbGVkZ2VyLWFjY3QtdGFnICR7YS5sb2NrZWQgPyBcInBjLWxlZGdlci1hY2N0LWxvY2tlZFwiIDogXCJcIn1gIH0pO1xuICAgIGNvbnN0IG5hbWVFbCA9IHRhZy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtbGVkZ2VyLWFjY3QtbmFtZVwiLCB0ZXh0OiBhLm5hbWUgfSk7XG4gICAgLy8gU3RhbGVuZXNzOiBhcHBlbmQgXHUyN0YzIGlmIG5ldmVyIHJlY29uY2lsZWQgb3IgYmV5b25kIHRocmVzaG9sZC5cbiAgICBsZXQgc3RhbGVUZXh0ID0gbnVsbDtcbiAgICBpZiAoIWEubGFzdFJlY29uY2lsZWQpIHtcbiAgICAgIHN0YWxlVGV4dCA9IFwiTmV2ZXIgcmVjb25jaWxlZFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBkYXlzID0gTWF0aC5mbG9vcigobm93TXMgLSBEYXRlLnBhcnNlKGEubGFzdFJlY29uY2lsZWQpKSAvIDg2NDAwMDAwKTtcbiAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUoZGF5cykgJiYgZGF5cyA+PSBzdGFsZURheXMpIHN0YWxlVGV4dCA9IGBMYXN0IHJlY29uY2lsZWQgJHtkYXlzfWQgYWdvYDtcbiAgICB9XG4gICAgaWYgKHN0YWxlVGV4dCkge1xuICAgICAgY29uc3QgaWNvbiA9IG5hbWVFbC5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtYWNjb3VudC1zdGFsZS1pY29uXCIsIHRleHQ6IFwiIFxcdTI3RjNcIiB9KTtcbiAgICAgIGljb24udGl0bGUgPSBzdGFsZVRleHQ7XG4gICAgfVxuICAgIHRhZy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtbGVkZ2VyLWFjY3QtYmFsXCIsIHRleHQ6IGAke2ZtdChiYWwpfSAke3N5bX1gIH0pO1xuICAgIGFjY3RUYWdzLnB1c2goeyBlbDogdGFnLCBuYW1lOiBhLm5hbWUgfSk7XG4gIH1cblxuICAvLyBcIlVuYXNzaWduZWRcIiB0YWcgZm9yIG1pZ3JhdGVkIGVudHJpZXMgd2l0aG91dCBmcm9tL3RvXG4gIGNvbnN0IHVuYXNzaWduZWRDb3VudCA9IGVudHJpZXMuZmlsdGVyKGUgPT4gIWUuZnJvbSAmJiAhZS50bykubGVuZ3RoO1xuICBpZiAodW5hc3NpZ25lZENvdW50ID4gMCkge1xuICAgIGNvbnN0IHVUYWcgPSBhY2N0QmFyLmNyZWF0ZURpdih7IGNsczogXCJwYy1sZWRnZXItYWNjdC10YWcgcGMtbGVkZ2VyLWFjY3QtbG9ja2VkXCIgfSk7XG4gICAgdVRhZy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtbGVkZ2VyLWFjY3QtbmFtZVwiLCB0ZXh0OiBcIlVuYXNzaWduZWRcIiB9KTtcbiAgICB1VGFnLmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1sZWRnZXItYWNjdC1iYWxcIiwgdGV4dDogYCR7dW5hc3NpZ25lZENvdW50fWAgfSk7XG4gICAgYWNjdFRhZ3MucHVzaCh7IGVsOiB1VGFnLCBuYW1lOiBcIl9fdW5hc3NpZ25lZF9fXCIgfSk7XG4gIH1cblxuICBmb3IgKGNvbnN0IGF0IG9mIGFjY3RUYWdzKSB7XG4gICAgbWFrZUludGVyYWN0aXZlKGF0LmVsKTtcbiAgICBhdC5lbC5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcbiAgICBhdC5lbC5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgZmlsdGVyQWNjb3VudCA9IGF0Lm5hbWU7XG4gICAgICBhY2N0VGFncy5mb3JFYWNoKHQgPT4gdC5lbC5jbGFzc0xpc3QudG9nZ2xlKFwicGMtbGVkZ2VyLWFjY3QtYWN0aXZlXCIsIHQgPT09IGF0KSk7XG4gICAgICByZW5kZXJUYWJsZShmaWx0ZXJUeXBlLCBmaWx0ZXJBY2NvdW50KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gVGFibGVcbiAgY29uc3QgdGFibGUgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWxlZGdlci10YWJsZVwiIH0pO1xuXG4gIGZ1bmN0aW9uIHJlbmRlclRhYmxlKHR5cGVGaWx0ZXIsIGFjY3RGaWx0ZXIpIHtcbiAgICB0YWJsZS5lbXB0eSgpO1xuICAgIGxldCBmaWx0ZXJlZCA9IGVudHJpZXM7XG4gICAgaWYgKHR5cGVGaWx0ZXIpIGZpbHRlcmVkID0gZmlsdGVyZWQuZmlsdGVyKGUgPT4gZS50eXBlID09PSB0eXBlRmlsdGVyKTtcbiAgICBpZiAoYWNjdEZpbHRlciA9PT0gXCJfX3VuYXNzaWduZWRfX1wiKSB7XG4gICAgICBmaWx0ZXJlZCA9IGZpbHRlcmVkLmZpbHRlcihlID0+ICFlLmZyb20gJiYgIWUudG8pO1xuICAgIH0gZWxzZSBpZiAoYWNjdEZpbHRlcikge1xuICAgICAgZmlsdGVyZWQgPSBmaWx0ZXJlZC5maWx0ZXIoZSA9PiBlLmZyb20gPT09IGFjY3RGaWx0ZXIgfHwgZS50byA9PT0gYWNjdEZpbHRlcik7XG4gICAgfVxuICAgIGNvbnN0IHNvcnRlZCA9IFsuLi5maWx0ZXJlZF0uc29ydCgoYSwgYikgPT4gYi5kLmxvY2FsZUNvbXBhcmUoYS5kKSk7XG4gICAgY29uc3Qgc2hvd24gPSBzb3J0ZWQuc2xpY2UoMCwgMTAwKTtcblxuICAgIGlmIChzaG93bi5sZW5ndGggPT09IDApIHtcbiAgICAgIHRhYmxlLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJwYy1lbXB0eVwiLCB0ZXh0OiBcIk5vIHRyYW5zYWN0aW9ucyB5ZXQuXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdHlwZUljb25zID0geyBidXk6IFwiXFx1RDgzRFxcdURDQzhcIiwgc2VsbDogXCJcXHVEODNEXFx1RENDOVwiLCBkaXZpZGVuZDogXCJcXHVEODNEXFx1RENCMFwiLCBjbG9zZTogXCJcXHVEODNEXFx1REQxMlwiLCBleHBlbnNlOiBcIlxcdUQ4M0RcXHVERDM0XCIsIGluY29tZTogXCJcXHVEODNEXFx1REZFMlwiLCB0cmFuc2ZlcjogXCJcXHUyMUQ0XFx1RkUwRlwiLCByZWNvbmNpbGlhdGlvbjogXCJcXHUyNjk2XFx1RkUwRlwiIH07XG5cbiAgICBmb3IgKGNvbnN0IGUgb2Ygc2hvd24pIHtcbiAgICAgIGNvbnN0IHJvdyA9IHRhYmxlLmNyZWF0ZURpdih7IGNsczogXCJwYy1sZWRnZXItcm93XCIgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLWxlZGdlci1kYXRlXCIsIHRleHQ6IGUuZCB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtbGVkZ2VyLXR5cGVcIiwgdGV4dDogYCR7dHlwZUljb25zW2UudHlwZV0gfHwgXCJcXHUwMEI3XCJ9ICR7ZS50eXBlfWAgfSk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLWxlZGdlci1kZXNjXCIsIHRleHQ6IGUuYXNzZXQgfHwgZS5jYXQgfHwgZS5ub3RlIHx8IFwiXFx1MjAxNFwiIH0pO1xuICAgICAgY29uc3QgYW10Q2xzID0gKGUudHlwZSA9PT0gXCJpbmNvbWVcIiB8fCBlLnR5cGUgPT09IFwic2VsbFwiIHx8IGUudHlwZSA9PT0gXCJkaXZpZGVuZFwiKSA/IFwicGMtcG9zXCIgOiAoZS50eXBlID09PSBcImV4cGVuc2VcIiB8fCBlLnR5cGUgPT09IFwiYnV5XCIpID8gXCJwYy1uZWdcIiA6IFwiXCI7XG4gICAgICBjb25zdCBhbXQgPSB0b051bShlLmFtdCk7XG4gICAgICBjb25zdCBhbXREZWMgPSBhbXQgIT09IDAgJiYgTWF0aC5hYnMoYW10KSA8IDEwID8gMiA6IDA7XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBgcGMtbGVkZ2VyLWFtdCAke2FtdENsc31gLCB0ZXh0OiBgJHtmbXQoYW10LCBhbXREZWMpfSAke3N5bX1gIH0pO1xuICAgICAgLy8gU291cmNlL2Rlc3RpbmF0aW9uIGNvbHVtblxuICAgICAgY29uc3QgYWNjdFBhcnRzID0gW107XG4gICAgICBpZiAoZS5mcm9tKSBhY2N0UGFydHMucHVzaChgXFx1MjE5MCAke2UuZnJvbX1gKTtcbiAgICAgIGlmIChlLnRvKSBhY2N0UGFydHMucHVzaChgXFx1MjE5MiAke2UudG99YCk7XG4gICAgICByb3cuY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLWxlZGdlci1hY2N0XCIsIHRleHQ6IGFjY3RQYXJ0cy5qb2luKFwiICBcIikgfHwgXCJcXHUyMDE0XCIgfSk7XG4gICAgfVxuXG4gICAgaWYgKHNvcnRlZC5sZW5ndGggPiAxMDApIHtcbiAgICAgIHRhYmxlLmNyZWF0ZUVsKFwicFwiLCB7IGNsczogXCJwYy1lbXB0eVwiLCB0ZXh0OiBgU2hvd2luZyAxMDAgb2YgJHtzb3J0ZWQubGVuZ3RofSBlbnRyaWVzYCB9KTtcbiAgICB9XG4gIH1cblxuICB0eXBlU2VsZWN0Lm9uY2hhbmdlID0gKCkgPT4geyBmaWx0ZXJUeXBlID0gdHlwZVNlbGVjdC52YWx1ZTsgcmVuZGVyVGFibGUoZmlsdGVyVHlwZSwgZmlsdGVyQWNjb3VudCk7IH07XG4gIHJlbmRlclRhYmxlKFwiXCIsIFwiXCIpO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIExFREdFUiBcdTIwMTQgTU9OVEhMWSBNT0RFIChjYXNoZmxvdyBjYXRlZ29yeSBncmlkKVxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmFzeW5jIGZ1bmN0aW9uIHJlbmRlckxlZGdlck1vbnRobHkoYXBwLCBzZXR0aW5ncywgY29udGFpbmVyLCBwbHVnaW4sIG9uQ2hhbmdlKSB7XG4gIC8vIExhenkgcmVxdWlyZXMgdG8gYXZvaWQgY2lyY3VsYXIgZGVwZW5kZW5jaWVzXG4gIGNvbnN0IHsgQ2FzaGZsb3dDZWxsTW9kYWwgfSA9IHJlcXVpcmUoXCIuLi9tb2RhbHMvY2FzaGZsb3ctY2VsbFwiKTtcbiAgY29uc3QgeyBBZGRDYXRlZ29yeU1vZGFsIH0gPSByZXF1aXJlKFwiLi4vbW9kYWxzL2NhdGVnb3J5XCIpO1xuXG4gIGNvbnRhaW5lci5lbXB0eSgpO1xuICBjb250YWluZXIuYWRkQ2xhc3MoXCJwYy1jYXNoZmxvdy1ncmlkLXZpZXdcIik7XG5cbiAgY29uc3QgY3VyWWVhciA9IGdldEN1cnJlbnRZZWFyKCk7XG4gIGNvbnN0IGFsbExlZGdlciA9IGF3YWl0IHJlYWRMZWRnZXJNdWx0aVllYXIoYXBwLCBzZXR0aW5ncywgW2N1clllYXJdKTtcbiAgY29uc3QgYWNjb3VudHMgPSBhd2FpdCByZWFkQWNjb3VudHMoYXBwLCBzZXR0aW5ncyk7XG4gIGNvbnN0IHJvd3MgPSBidWlsZENhc2hmbG93Um93cyhhcHAsIHNldHRpbmdzLCBhbGxMZWRnZXIpO1xuICBjb25zdCBzeW0gPSBzZXR0aW5ncy5ob21lQ3VycmVuY3lTeW1ib2w7XG4gIGNvbnN0IGN1ck1rID0gZ2V0Q3VycmVudE1vbnRoS2V5KCk7XG4gIGNvbnN0IHJlcmVuZGVyID0gKCkgPT4gcmVuZGVyTGVkZ2VyTW9udGhseShhcHAsIHNldHRpbmdzLCBjb250YWluZXIsIHBsdWdpbiwgb25DaGFuZ2UpO1xuXG4gIC8vIFRhYmxlXG4gIGNvbnN0IHRibCA9IGNvbnRhaW5lci5jcmVhdGVFbChcInRhYmxlXCIsIHsgY2xzOiBcInBjLWNmLXRhYmxlXCIgfSk7XG5cbiAgLy8gSGVhZGVyIHJvd1xuICBjb25zdCB0aGVhZCA9IHRibC5jcmVhdGVFbChcInRoZWFkXCIpO1xuICBjb25zdCBocm93ID0gdGhlYWQuY3JlYXRlRWwoXCJ0clwiKTtcbiAgaHJvdy5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogXCJUeXBlXCIgfSk7XG4gIGhyb3cuY3JlYXRlRWwoXCJ0aFwiLCB7IHRleHQ6IFwiQ2F0ZWdvcnlcIiB9KTtcbiAgZm9yIChjb25zdCBtbiBvZiBNT05USF9TSE9SVCkgaHJvdy5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogbW4sIGNsczogXCJwYy1jZi1tb250aC10aFwiIH0pO1xuICBocm93LmNyZWF0ZUVsKFwidGhcIiwgeyB0ZXh0OiBcIlRvdGFsXCIgfSk7XG5cbiAgLy8gQm9keVxuICBjb25zdCB0Ym9keSA9IHRibC5jcmVhdGVFbChcInRib2R5XCIpO1xuXG4gIC8vIEdyb3VwIGJ5IHR5cGVcbiAgbGV0IGN1cnJlbnRUeXBlID0gXCJcIjtcbiAgbGV0IHR5cGVJbmNvbWUgPSAwLCB0eXBlTmVlZHMgPSAwLCB0eXBlV2FudHMgPSAwO1xuICBjb25zdCBtb250aFRvdGFscyA9IHt9O1xuICBNT05USF9LRVlTLmZvckVhY2goayA9PiB7IG1vbnRoVG90YWxzW2tdID0gMDsgfSk7XG4gIGxldCBncmFuZFRvdGFsID0gMDtcblxuICBmb3IgKGNvbnN0IHIgb2Ygcm93cykge1xuICAgIC8vIFR5cGUgc2VwYXJhdG9yXG4gICAgaWYgKHIudHlwZSAhPT0gY3VycmVudFR5cGUpIHtcbiAgICAgIGN1cnJlbnRUeXBlID0gci50eXBlO1xuICAgICAgY29uc3Qgc2VwUm93ID0gdGJvZHkuY3JlYXRlRWwoXCJ0clwiLCB7IGNsczogXCJwYy1jZi10eXBlLXJvd1wiIH0pO1xuICAgICAgc2VwUm93LmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiByLnR5cGUsIGF0dHI6IHsgY29sc3BhbjogU3RyaW5nKE1PTlRIX0tFWVMubGVuZ3RoICsgMykgfSB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB0ciA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIik7XG4gICAgdHIuY3JlYXRlRWwoXCJ0ZFwiLCB7IGNsczogXCJwYy1jZi10eXBlLWNlbGxcIiwgdGV4dDogXCJcIiB9KTtcbiAgICB0ci5jcmVhdGVFbChcInRkXCIsIHsgY2xzOiBcInBjLWNmLWNhdC1jZWxsXCIsIHRleHQ6IGAke3IuZW1vaml9ICR7ci5jYXRlZ29yeX1gIH0pO1xuXG4gICAgZm9yIChsZXQgbWkgPSAwOyBtaSA8IE1PTlRIX0tFWVMubGVuZ3RoOyBtaSsrKSB7XG4gICAgICBjb25zdCBtayA9IE1PTlRIX0tFWVNbbWldO1xuICAgICAgY29uc3QgdmFsID0gci5tb250aHNbbWtdO1xuICAgICAgY29uc3QgdGQgPSB0ci5jcmVhdGVFbChcInRkXCIsIHsgY2xzOiBgcGMtY2YtdmFsLWNlbGwgJHttayA9PT0gY3VyTWsgPyBcInBjLWNmLWN1cnJlbnRcIiA6IFwiXCJ9YCB9KTtcblxuICAgICAgaWYgKHZhbCAhPSBudWxsICYmIHZhbCAhPT0gMCkge1xuICAgICAgICB0ZC50ZXh0Q29udGVudCA9IGZtdCh2YWwpO1xuICAgICAgICB0ZC5jbGFzc0xpc3QuYWRkKHZhbCA+IDAgPyBcInBjLXBvc1wiIDogXCJwYy1uZWdcIik7XG4gICAgICAgIG1vbnRoVG90YWxzW21rXSArPSB2YWw7XG4gICAgICAgIGdyYW5kVG90YWwgKz0gdmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGQudGV4dENvbnRlbnQgPSBcIlxcdTIwMTRcIjtcbiAgICAgICAgdGQuY2xhc3NMaXN0LmFkZChcInBjLWNmLWVtcHR5XCIpO1xuICAgICAgfVxuXG4gICAgICAvLyBDbGljayB0byBvcGVuIGNlbGwgZGV0YWlsIG1vZGFsIChsaXN0ICsgYWRkICsgZWRpdCArIGRlbGV0ZSlcbiAgICAgIHRkLmNsYXNzTGlzdC5hZGQoXCJwYy1jZi1jbGlja2FibGVcIik7XG4gICAgICBtYWtlSW50ZXJhY3RpdmUodGQpO1xuICAgICAgdGQub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgbmV3IENhc2hmbG93Q2VsbE1vZGFsKGFwcCwgc2V0dGluZ3MsIHtcbiAgICAgICAgICB5ZWFyOiBjdXJZZWFyLFxuICAgICAgICAgIG1vbnRoSWR4OiBtaSxcbiAgICAgICAgICBjYXRlZ29yeTogci5jYXRlZ29yeSxcbiAgICAgICAgICBpc0luY29tZTogci50eXBlID09PSBcIkluY29tZVwiLFxuICAgICAgICAgIGFjY291bnRzLFxuICAgICAgICAgIG9uU2F2ZWQ6IHJlcmVuZGVyLFxuICAgICAgICB9KS5vcGVuKCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHRyLmNyZWF0ZUVsKFwidGRcIiwgeyBjbHM6IGBwYy1jZi10b3RhbC1jZWxsICR7ci50b3RhbCA+PSAwID8gXCJwYy1wb3NcIiA6IFwicGMtbmVnXCJ9YCwgdGV4dDogZm10KHIudG90YWwpIH0pO1xuICB9XG5cbiAgLy8gXCIrIEFkZCBjYXRlZ29yeVwiIHJvd1xuICBjb25zdCBhZGRDYXRUciA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwgeyBjbHM6IFwicGMtY2YtYWRkY2F0LXJvd1wiIH0pO1xuICBjb25zdCBhZGRDYXRUZCA9IGFkZENhdFRyLmNyZWF0ZUVsKFwidGRcIiwge1xuICAgIHRleHQ6IFwiKyBBZGQgY2F0ZWdvcnlcIixcbiAgICBhdHRyOiB7IGNvbHNwYW46IFN0cmluZyhNT05USF9LRVlTLmxlbmd0aCArIDMpIH0sXG4gIH0pO1xuICBtYWtlSW50ZXJhY3RpdmUoYWRkQ2F0VGQpO1xuICBhZGRDYXRUZC5vbmNsaWNrID0gKCkgPT4ge1xuICAgIG5ldyBBZGRDYXRlZ29yeU1vZGFsKGFwcCwgc2V0dGluZ3MsIHJlcmVuZGVyKS5vcGVuKCk7XG4gIH07XG5cbiAgLy8gRm9vdGVyIHRvdGFsc1xuICBjb25zdCB0Zm9vdCA9IHRibC5jcmVhdGVFbChcInRmb290XCIpO1xuICBjb25zdCBmcm93ID0gdGZvb3QuY3JlYXRlRWwoXCJ0clwiKTtcbiAgZnJvdy5jcmVhdGVFbChcInRkXCIsIHsgdGV4dDogXCJcIiB9KTtcbiAgZnJvdy5jcmVhdGVFbChcInRkXCIsIHsgdGV4dDogXCJUb3RhbFwiLCBjbHM6IFwicGMtY2YtdG90YWwtbGFiZWxcIiB9KTtcbiAgZm9yIChjb25zdCBtayBvZiBNT05USF9LRVlTKSB7XG4gICAgY29uc3QgdiA9IG1vbnRoVG90YWxzW21rXTtcbiAgICBmcm93LmNyZWF0ZUVsKFwidGRcIiwgeyBjbHM6IGBwYy1jZi12YWwtY2VsbCBwYy1jZi10b3RhbC1jZWxsICR7diA+PSAwID8gXCJwYy1wb3NcIiA6IFwicGMtbmVnXCJ9YCwgdGV4dDogdiAhPT0gMCA/IGZtdCh2KSA6IFwiXFx1MjAxNFwiIH0pO1xuICB9XG4gIGZyb3cuY3JlYXRlRWwoXCJ0ZFwiLCB7IGNsczogYHBjLWNmLXRvdGFsLWNlbGwgJHtncmFuZFRvdGFsID49IDAgPyBcInBjLXBvc1wiIDogXCJwYy1uZWdcIn1gLCB0ZXh0OiBmbXQoZ3JhbmRUb3RhbCkgfSk7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gTEVER0VSIFx1MjAxNCBVTklGSUVEIFZJRVcgKENsYXNzaWMgXHUyMTk0IE1vbnRobHkgdG9nZ2xlKVxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmFzeW5jIGZ1bmN0aW9uIHJlbmRlclVuaWZpZWRMZWRnZXIoYXBwLCBzZXR0aW5ncywgY29udGFpbmVyLCBwbHVnaW4pIHtcbiAgLy8gTGF6eSByZXF1aXJlcyB0byBhdm9pZCBjaXJjdWxhciBkZXBlbmRlbmNpZXNcbiAgY29uc3QgeyBBZGRUcmFuc2FjdGlvbk1vZGFsIH0gPSByZXF1aXJlKFwiLi4vbW9kYWxzL3RyYW5zYWN0aW9uXCIpO1xuICBjb25zdCB7IFBpY2tBc3NldE1vZGFsIH0gPSByZXF1aXJlKFwiLi4vbW9kYWxzL2Fzc2V0LXBpY2tcIik7XG4gIGNvbnN0IHsgQWRkQXNzZXRMaW5lTW9kYWwgfSA9IHJlcXVpcmUoXCIuLi9tb2RhbHMvYXNzZXQtbGluZVwiKTtcbiAgY29uc3QgeyBDcmVhdGVBc3NldE1vZGFsIH0gPSByZXF1aXJlKFwiLi4vbW9kYWxzL2Fzc2V0LWNyZWF0ZVwiKTtcblxuICBjb250YWluZXIuZW1wdHkoKTtcbiAgY29udGFpbmVyLmFkZENsYXNzKFwicGMtZGFzaGJvYXJkLXJvb3RcIik7XG4gIGNvbnRhaW5lci5hZGRDbGFzcyhcInBjLWxlZGdlci11bmlmaWVkXCIpO1xuXG4gIGNvbnN0IGFjY291bnRzID0gYXdhaXQgcmVhZEFjY291bnRzKGFwcCwgc2V0dGluZ3MpO1xuXG4gIC8vIFNoYXJlZCB0b3AgYmFyOiB0aXRsZSArIENsYXNzaWMvTW9udGhseSB0b2dnbGUgKyBUcmFuc2FjdGlvbiBidXR0b25cbiAgY29uc3QgdG9wQmFyID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogXCJwYy1sZWRnZXItdG9nZ2xlLWJhclwiIH0pO1xuICB0b3BCYXIuY3JlYXRlRWwoXCJkaXZcIiwgeyBjbHM6IFwicGMtYmxvY2stdGl0bGVcIiwgdGV4dDogXCJMZWRnZXJcIiB9KTtcblxuICBjb25zdCB0b2dnbGVXcmFwID0gdG9wQmFyLmNyZWF0ZURpdih7IGNsczogXCJwYy1sZWRnZXItdG9nZ2xlXCIgfSk7XG4gIHRvZ2dsZVdyYXAuY3JlYXRlRGl2KHsgY2xzOiBcInBjLWxlZGdlci10b2dnbGUtdGh1bWJcIiB9KTtcbiAgY29uc3QgY2xhc3NpY0J0biA9IHRvZ2dsZVdyYXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwicGMtdG9nZ2xlLWJ0blwiLCB0ZXh0OiBcIkNsYXNzaWNcIiB9KTtcbiAgY29uc3QgbW9udGhseUJ0biA9IHRvZ2dsZVdyYXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwicGMtdG9nZ2xlLWJ0blwiLCB0ZXh0OiBcIk1vbnRobHlcIiB9KTtcblxuICBjb25zdCBhZGRUeEJ0biA9IHRvcEJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7IGNsczogXCJwYy1hY3Rpb24tYnRuXCIsIHRleHQ6IFwiXFx1RkYwQiBUcmFuc2FjdGlvblwiIH0pO1xuICBhZGRUeEJ0bi5vbmNsaWNrID0gKCkgPT4gbmV3IEFkZFRyYW5zYWN0aW9uTW9kYWwoYXBwLCBwbHVnaW4sIGFjY291bnRzLCAoKSA9PiB7XG4gICAgcmVuZGVyTW9kZSgpO1xuICB9KS5vcGVuKCk7XG5cbiAgY29uc3QgdXBkQXNzZXRCdG4gPSB0b3BCYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyBjbHM6IFwicGMtYWN0aW9uLWJ0blwiLCB0ZXh0OiBcIlxcdTIxQkIgQXNzZXQgYWN0aW9uXCIgfSk7XG4gIHVwZEFzc2V0QnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgbmV3IFBpY2tBc3NldE1vZGFsKGFwcCwgcGx1Z2luLCAoZmlsZSkgPT4ge1xuICAgICAgY29uc3QgbW9kYWwgPSBuZXcgQWRkQXNzZXRMaW5lTW9kYWwoYXBwLCBmaWxlLCBwbHVnaW4pO1xuICAgICAgY29uc3Qgb3JpZ0Nsb3NlID0gbW9kYWwub25DbG9zZSA/IG1vZGFsLm9uQ2xvc2UuYmluZChtb2RhbCkgOiBudWxsO1xuICAgICAgbW9kYWwub25DbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG9yaWdDbG9zZSkgb3JpZ0Nsb3NlKCk7XG4gICAgICAgIHJlbmRlck1vZGUoKTtcbiAgICAgIH07XG4gICAgICBtb2RhbC5vcGVuKCk7XG4gICAgfSkub3BlbigpO1xuICB9O1xuXG4gIGNvbnN0IG5ld0Fzc2V0QnRuID0gdG9wQmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgY2xzOiBcInBjLWFjdGlvbi1idG5cIiwgdGV4dDogXCJcXHVGRjBCIEFzc2V0XCIgfSk7XG4gIG5ld0Fzc2V0QnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgY29uc3QgbW9kYWwgPSBuZXcgQ3JlYXRlQXNzZXRNb2RhbChhcHAsIHBsdWdpbik7XG4gICAgY29uc3Qgb3JpZ0Nsb3NlID0gbW9kYWwub25DbG9zZSA/IG1vZGFsLm9uQ2xvc2UuYmluZChtb2RhbCkgOiBudWxsO1xuICAgIG1vZGFsLm9uQ2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAob3JpZ0Nsb3NlKSBvcmlnQ2xvc2UoKTtcbiAgICAgIHJlbmRlck1vZGUoKTtcbiAgICB9O1xuICAgIG1vZGFsLm9wZW4oKTtcbiAgfTtcblxuICAvLyBNb2RlLWNvbnRlbnQgY29udGFpbmVyIChyZXBsYWNlZCBvbiB0b2dnbGUpXG4gIGNvbnN0IG1vZGVFbCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6IFwicGMtbGVkZ2VyLW1vZGUtY29udGVudFwiIH0pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHJlbmRlck1vZGUoKSB7XG4gICAgY29uc3QgbW9kZSA9IHNldHRpbmdzLmxlZGdlclZpZXdNb2RlID09PSBcIm1vbnRobHlcIiA/IFwibW9udGhseVwiIDogXCJjbGFzc2ljXCI7XG4gICAgdG9nZ2xlV3JhcC5kYXRhc2V0Lm1vZGUgPSBtb2RlO1xuICAgIGNsYXNzaWNCdG4uY2xhc3NMaXN0LnRvZ2dsZShcInBjLXRvZ2dsZS1idG4tLW9uXCIsIG1vZGUgPT09IFwiY2xhc3NpY1wiKTtcbiAgICBtb250aGx5QnRuLmNsYXNzTGlzdC50b2dnbGUoXCJwYy10b2dnbGUtYnRuLS1vblwiLCBtb2RlID09PSBcIm1vbnRobHlcIik7XG4gICAgbW9kZUVsLmVtcHR5KCk7XG4gICAgaWYgKG1vZGUgPT09IFwiY2xhc3NpY1wiKSB7XG4gICAgICBhd2FpdCByZW5kZXJMZWRnZXJDbGFzc2ljKGFwcCwgc2V0dGluZ3MsIG1vZGVFbCwgcGx1Z2luLCByZW5kZXJNb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgcmVuZGVyTGVkZ2VyTW9udGhseShhcHAsIHNldHRpbmdzLCBtb2RlRWwsIHBsdWdpbiwgcmVuZGVyTW9kZSk7XG4gICAgfVxuICB9XG5cbiAgY2xhc3NpY0J0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmIChzZXR0aW5ncy5sZWRnZXJWaWV3TW9kZSA9PT0gXCJjbGFzc2ljXCIpIHJldHVybjtcbiAgICBzZXR0aW5ncy5sZWRnZXJWaWV3TW9kZSA9IFwiY2xhc3NpY1wiO1xuICAgIGlmIChwbHVnaW4gJiYgcGx1Z2luLnNhdmVTZXR0aW5ncykgYXdhaXQgcGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIGF3YWl0IHJlbmRlck1vZGUoKTtcbiAgfTtcbiAgbW9udGhseUJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmIChzZXR0aW5ncy5sZWRnZXJWaWV3TW9kZSA9PT0gXCJtb250aGx5XCIpIHJldHVybjtcbiAgICBzZXR0aW5ncy5sZWRnZXJWaWV3TW9kZSA9IFwibW9udGhseVwiO1xuICAgIGlmIChwbHVnaW4gJiYgcGx1Z2luLnNhdmVTZXR0aW5ncykgYXdhaXQgcGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIGF3YWl0IHJlbmRlck1vZGUoKTtcbiAgfTtcblxuICBhd2FpdCByZW5kZXJNb2RlKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyByZW5kZXJMZWRnZXJDbGFzc2ljLCByZW5kZXJMZWRnZXJNb250aGx5LCByZW5kZXJVbmlmaWVkTGVkZ2VyIH07XG4iLCAiLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBDVVNUT00gSVRFTSBWSUVXUyAodGFiIHZpZXdzIHdpdGhvdXQgYmFja2luZyBmaWxlcylcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCB7IEl0ZW1WaWV3IH0gPSByZXF1aXJlKFwib2JzaWRpYW5cIik7XG5jb25zdCB7IHJlbmRlclVuaWZpZWRMZWRnZXIgfSA9IHJlcXVpcmUoXCIuLi91aS9sZWRnZXItdmlld1wiKTtcblxuY29uc3QgUENfTEVER0VSX1ZJRVcgPSBcInBjLWxlZGdlci12aWV3XCI7XG5cbmNsYXNzIFBDTGVkZ2VyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgY29uc3RydWN0b3IobGVhZiwgcGx1Z2luKSB7IHN1cGVyKGxlYWYpOyB0aGlzLnBsdWdpbiA9IHBsdWdpbjsgfVxuICBnZXRWaWV3VHlwZSgpIHsgcmV0dXJuIFBDX0xFREdFUl9WSUVXOyB9XG4gIGdldERpc3BsYXlUZXh0KCkgeyByZXR1cm4gXCJMZWRnZXJcIjsgfVxuICBnZXRJY29uKCkgeyByZXR1cm4gXCJib29rLW9wZW5cIjsgfVxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgYXdhaXQgcmVuZGVyVW5pZmllZExlZGdlcih0aGlzLmFwcCwgdGhpcy5wbHVnaW4uc2V0dGluZ3MsIHRoaXMuY29udGVudEVsLCB0aGlzLnBsdWdpbik7XG4gIH1cbiAgYXN5bmMgb25DbG9zZSgpIHsgdGhpcy5jb250ZW50RWwuZW1wdHkoKTsgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgUENfTEVER0VSX1ZJRVcsIFBDTGVkZ2VyVmlldyB9O1xuIiwgImNvbnN0IHsgTW9kYWwgfSA9IHJlcXVpcmUoXCJvYnNpZGlhblwiKTtcbmNvbnN0IHsgdG9OdW0sIHNob3dOb3RpY2UsIGtpbGxXaGVlbENoYW5nZSB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuXG5jb25zdCBJTlZBTElEX1BBVEggPSAvW1xcXFwvOio/XCI8PnxdfFxcLlxcLi87XG5cbmNsYXNzIENyZWF0ZUFjY291bnRNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoYXBwLCBwbHVnaW4sIG9uRG9uZSkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgdGhpcy5vbkRvbmUgPSBvbkRvbmU7XG4gIH1cblxuICBvbk9wZW4oKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gICAgdGhpcy50aXRsZUVsLnNldFRleHQoXCJOZXcgYWNjb3VudFwiKTtcblxuICAgIGNvbnN0IGZvcm0gPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtZm9ybVwiIH0pO1xuXG4gICAgY29uc3QgbmFtZVdyYXAgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgIG5hbWVXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIk5hbWVcIiB9KTtcbiAgICBjb25zdCBuYW1lSW4gPSBuYW1lV3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJ0ZXh0XCIsIGNsczogXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIgfSk7XG4gICAgbmFtZUluLnBsYWNlaG9sZGVyID0gXCJlLmcuIFQtQmFuayBEZWJpdFwiO1xuXG4gICAgY29uc3QgdHlwZVdyYXAgPSBmb3JtLmNyZWF0ZURpdigpO1xuICAgIHR5cGVXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIlR5cGVcIiB9KTtcbiAgICBjb25zdCB0eXBlU2VsID0gdHlwZVdyYXAuY3JlYXRlRWwoXCJzZWxlY3RcIiwgeyBjbHM6IFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiIH0pO1xuICAgIGZvciAoY29uc3QgdCBvZiBbXCJiYW5rXCIsIFwiYnJva2VyXCIsIFwiY2FzaFwiLCBcInNhdmluZ3NcIiwgXCJjcmVkaXRcIiwgXCJvdGhlclwiXSkge1xuICAgICAgdHlwZVNlbC5jcmVhdGVFbChcIm9wdGlvblwiLCB7IHRleHQ6IHQsIHZhbHVlOiB0IH0pO1xuICAgIH1cbiAgICB0eXBlU2VsLnZhbHVlID0gXCJiYW5rXCI7XG5cbiAgICBjb25zdCBjdXJXcmFwID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICBjdXJXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIkN1cnJlbmN5XCIgfSk7XG4gICAgY29uc3QgY3VySW4gPSBjdXJXcmFwLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcInRleHRcIiwgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIiB9KTtcbiAgICBjdXJJbi52YWx1ZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmhvbWVDdXJyZW5jeSB8fCBcIlJVQlwiO1xuICAgIGN1ckluLm1heExlbmd0aCA9IDg7XG5cbiAgICBjb25zdCBiYWxXcmFwID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICBiYWxXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIkluaXRpYWwgYmFsYW5jZVwiIH0pO1xuICAgIGNvbnN0IGJhbEluID0gYmFsV3JhcC5jcmVhdGVFbChcImlucHV0XCIsIHsgdHlwZTogXCJudW1iZXJcIiwgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtaW5wdXRcIiB9KTtcbiAgICBiYWxJbi5wbGFjZWhvbGRlciA9IFwiMFwiO1xuICAgIGJhbEluLnN0ZXAgPSBcIjAuMDFcIjtcbiAgICBraWxsV2hlZWxDaGFuZ2UoYmFsSW4pO1xuXG4gICAgY29uc3QgbGlxdWlkV3JhcCA9IGZvcm0uY3JlYXRlRGl2KCk7XG4gICAgY29uc3QgbGlxdWlkTGJsID0gbGlxdWlkV3JhcC5jcmVhdGVFbChcImxhYmVsXCIsIHsgdGV4dDogXCJMaXF1aWQgKGNvdW50cyB0b3dhcmQgYXZhaWxhYmxlIGNhc2gpIFwiIH0pO1xuICAgIGNvbnN0IGxpcXVpZEluID0gbGlxdWlkTGJsLmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcImNoZWNrYm94XCIgfSk7XG4gICAgbGlxdWlkSW4uY2hlY2tlZCA9IHRydWU7XG5cbiAgICBjb25zdCBsb2NrZWRXcmFwID0gZm9ybS5jcmVhdGVEaXYoKTtcbiAgICBjb25zdCBsb2NrZWRMYmwgPSBsb2NrZWRXcmFwLmNyZWF0ZUVsKFwibGFiZWxcIiwgeyB0ZXh0OiBcIkxvY2tlZCAoZS5nLiBkZXBvc2l0L2VzY3JvdykgXCIgfSk7XG4gICAgY29uc3QgbG9ja2VkSW4gPSBsb2NrZWRMYmwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7IHR5cGU6IFwiY2hlY2tib3hcIiB9KTtcblxuICAgIGNvbnN0IGJ0bnMgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiBcInBlcnNvbmFsLWNhcGl0YWwtYnV0dG9uc1wiIH0pO1xuICAgIGNvbnN0IHNhdmVCdG4gPSBidG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJDcmVhdGVcIiwgY2xzOiBcIm1vZC1jdGFcIiB9KTtcbiAgICBjb25zdCBjYW5jZWxCdG4gPSBidG5zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHsgdGV4dDogXCJDYW5jZWxcIiB9KTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lSW4udmFsdWUudHJpbSgpO1xuICAgICAgaWYgKCFuYW1lKSB7IHNob3dOb3RpY2UoXCJOYW1lIGlzIHJlcXVpcmVkXCIpOyByZXR1cm47IH1cbiAgICAgIGlmIChJTlZBTElEX1BBVEgudGVzdChuYW1lKSkge1xuICAgICAgICBzaG93Tm90aWNlKFwiSW52YWxpZCBhY2NvdW50IG5hbWUgXHUyMDE0IGF2b2lkIHNwZWNpYWwgY2hhcmFjdGVyc1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBmb2xkZXIgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hY2NvdW50c0ZvbGRlciB8fCBcImZpbmFuY2UvRGF0YS9hY2NvdW50c1wiO1xuICAgICAgY29uc3QgcGF0aCA9IGAke2ZvbGRlcn0vJHtuYW1lfS5tZGA7XG5cbiAgICAgIGlmICh0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCkpIHtcbiAgICAgICAgc2hvd05vdGljZShgQWNjb3VudCBcIiR7bmFtZX1cIiBhbHJlYWR5IGV4aXN0c2ApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXIpKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXIpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3VycmVuY3kgPSAoY3VySW4udmFsdWUudHJpbSgpIHx8IHRoaXMucGx1Z2luLnNldHRpbmdzLmhvbWVDdXJyZW5jeSB8fCBcIlJVQlwiKS50b1VwcGVyQ2FzZSgpO1xuICAgICAgY29uc3QgYmFsYW5jZSA9IHRvTnVtKGJhbEluLnZhbHVlKSB8fCAwO1xuICAgICAgY29uc3QgbGlxdWlkID0gISFsaXF1aWRJbi5jaGVja2VkO1xuICAgICAgY29uc3QgbG9ja2VkID0gISFsb2NrZWRJbi5jaGVja2VkO1xuXG4gICAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgICBcIi0tLVwiLFxuICAgICAgICBgbmFtZTogXCIke25hbWV9XCJgLFxuICAgICAgICBgdHlwZTogJHt0eXBlU2VsLnZhbHVlfWAsXG4gICAgICAgIGBjdXJyZW5jeTogJHtjdXJyZW5jeX1gLFxuICAgICAgICBgbGlxdWlkOiAke2xpcXVpZH1gLFxuICAgICAgICBgbG9ja2VkOiAke2xvY2tlZH1gLFxuICAgICAgICBgaW5pdGlhbF9iYWxhbmNlOiAke2JhbGFuY2V9YCxcbiAgICAgICAgYGxhc3RfcmVjb25jaWxlZDogXCIke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCl9XCJgLFxuICAgICAgICBcIi0tLVwiLFxuICAgICAgICBcIlwiLFxuICAgICAgXS5qb2luKFwiXFxuXCIpO1xuXG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgY29udGVudCk7XG4gICAgICBzaG93Tm90aWNlKGBcdTI3MTMgQ3JlYXRlZCBhY2NvdW50IFwiJHtuYW1lfVwiYCk7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICBpZiAodGhpcy5vbkRvbmUpIGF3YWl0IHRoaXMub25Eb25lKCk7XG4gICAgfTtcblxuICAgIGNhbmNlbEJ0bi5vbmNsaWNrID0gKCkgPT4gdGhpcy5jbG9zZSgpO1xuICAgIG5hbWVJbi5mb2N1cygpO1xuICB9XG5cbiAgb25DbG9zZSgpIHsgdGhpcy5jb250ZW50RWwuZW1wdHkoKTsgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgQ3JlYXRlQWNjb3VudE1vZGFsIH07XG4iLCAiLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vLyBTRVRUSU5HUyBUQUJcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCB7IFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSA9IHJlcXVpcmUoXCJvYnNpZGlhblwiKTtcbmNvbnN0IHsgdG9OdW0sIGZtdCwgc2hvd05vdGljZSwga2lsbFdoZWVsQ2hhbmdlIH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmNvbnN0IHsgQ09VTlRSWV9DVVJSRU5DWSwgQ09VTlRSWV9MSVNUIH0gPSByZXF1aXJlKFwiLi9tb2RhbHMvb25ib2FyZGluZ1wiKTtcbmNvbnN0IHsgQ3JlYXRlQWNjb3VudE1vZGFsIH0gPSByZXF1aXJlKFwiLi9tb2RhbHMvYWNjb3VudC1jcmVhdGVcIik7XG5jb25zdCB7IFJlY29uY2lsZUFsbE1vZGFsIH0gPSByZXF1aXJlKFwiLi9tb2RhbHMvcmVjb25jaWxlXCIpO1xuY29uc3QgeyByZWFkQWNjb3VudHMgfSA9IHJlcXVpcmUoXCIuL2FjY291bnRzL2lvXCIpO1xuY29uc3QgeyByZWFkQWxsTGVkZ2VyIH0gPSByZXF1aXJlKFwiLi9sZWRnZXIvaW9cIik7XG5jb25zdCB7IGdldEFjY291bnRCYWxhbmNlIH0gPSByZXF1aXJlKFwiLi9hY2NvdW50cy9iYWxhbmNlXCIpO1xuY29uc3QgeyB1cGRhdGVGeFJhdGVzIH0gPSByZXF1aXJlKFwiLi9hc3NldHMvZnhcIik7XG5cbmNsYXNzIFBlcnNvbmFsQ2FwaXRhbFNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgY29uc3RydWN0b3IoYXBwLCBwbHVnaW4pIHsgc3VwZXIoYXBwLCBwbHVnaW4pOyB0aGlzLnBsdWdpbiA9IHBsdWdpbjsgfVxuXG4gIGRpc3BsYXkoKSB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlBlcnNvbmFsIENhcGl0YWwgU2V0dGluZ3NcIiB9KTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb2xkZXJzIFx1MjUwMFx1MjUwMFxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkZvbGRlcnNcIiB9KTtcbiAgICBjb25zdCBmb2xkZXJzID0gW1xuICAgICAgW1wiY2F0ZWdvcmllc0ZvbGRlclwiLCAgIFwiQ2F0ZWdvcmllcyBmb2xkZXJcIiwgICBcImZpbmFuY2UvRGF0YS9jYXRlZ29yaWVzXCJdLFxuICAgICAgW1wiYXNzZXRzRm9sZGVyXCIsICAgICAgIFwiQXNzZXRzIGZvbGRlclwiLCAgICAgICAgXCJmaW5hbmNlL0RhdGEvYXNzZXRzXCJdLFxuICAgICAgW1wiYXJjaGl2ZUZvbGRlclwiLCAgICAgIFwiQXJjaGl2ZSBmb2xkZXJcIiwgICAgICAgXCJmaW5hbmNlL0RhdGEvYXJjaGl2ZVwiXSxcbiAgICAgIFtcInN0cmF0ZWd5UGF0aFwiLCAgICAgICBcIlN0cmF0ZWd5IGZpbGVcIiwgICAgICAgIFwiZmluYW5jZS9zdHJhdGVneS5tZFwiXSxcbiAgICAgIFtcImRhc2hib2FyZFBhdGhcIiwgICAgICBcIkRhc2hib2FyZCBub3RlXCIsICAgICAgIFwiZmluYW5jZS9EYXNoYm9hcmQubWRcIl0sXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIG5hbWUsIHBsYWNlaG9sZGVyXSBvZiBmb2xkZXJzKSB7XG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbCkuc2V0TmFtZShuYW1lKS5hZGRUZXh0KHQgPT5cbiAgICAgICAgdC5zZXRQbGFjZWhvbGRlcihwbGFjZWhvbGRlcilcbiAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5nc1trZXldID8/IFwiXCIpXG4gICAgICAgICAub25DaGFuZ2UoYXN5bmMgdiA9PiB7XG4gICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzW2tleV0gPSB2LnRyaW0oKSB8fCBwbGFjZWhvbGRlcjtcbiAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQ3VycmVuY3kgKGNvdW50cnktYmFzZWQpIFx1MjUwMFx1MjUwMFxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkN1cnJlbmN5XCIgfSk7XG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpLnNldE5hbWUoXCJDb3VudHJ5XCIpLnNldERlc2MoXCJTZXRzIHRoZSBkZWZhdWx0IGhvbWUgY3VycmVuY3lcIikuYWRkRHJvcGRvd24oZCA9PiB7XG4gICAgICBkLmFkZE9wdGlvbihcIlwiLCBcIlNlbGVjdFx1MjAyNlwiKTtcbiAgICAgIGZvciAoY29uc3QgYyBvZiBDT1VOVFJZX0xJU1QpIHtcbiAgICAgICAgY29uc3QgY3VyID0gQ09VTlRSWV9DVVJSRU5DWVtjXTtcbiAgICAgICAgZC5hZGRPcHRpb24oYywgYCR7Y30gKCR7Y3VyLnN5bWJvbH0pYCk7XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJTeW0gPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ob21lQ3VycmVuY3lTeW1ib2wgPz8gXCJcdTIwQkRcIjtcbiAgICAgIGNvbnN0IG1hdGNoID0gQ09VTlRSWV9MSVNULmZpbmQoYyA9PiBDT1VOVFJZX0NVUlJFTkNZW2NdLnN5bWJvbCA9PT0gY3VyU3ltKTtcbiAgICAgIGlmIChtYXRjaCkgZC5zZXRWYWx1ZShtYXRjaCk7XG4gICAgICBkLm9uQ2hhbmdlKGFzeW5jIHYgPT4ge1xuICAgICAgICBjb25zdCBjdXIgPSBDT1VOVFJZX0NVUlJFTkNZW3ZdO1xuICAgICAgICBpZiAoY3VyKSB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaG9tZUN1cnJlbmN5ID0gY3VyLmNvZGU7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaG9tZUN1cnJlbmN5U3ltYm9sID0gY3VyLnN5bWJvbDtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpLnNldE5hbWUoXCJIb21lIGN1cnJlbmN5IHN5bWJvbFwiKS5zZXREZXNjKFwiT3ZlcnJpZGUgaWYgbmVlZGVkXCIpLmFkZFRleHQodCA9PlxuICAgICAgdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5ob21lQ3VycmVuY3lTeW1ib2wgPz8gXCJcdTIwQkRcIilcbiAgICAgICAub25DaGFuZ2UoYXN5bmMgdiA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmhvbWVDdXJyZW5jeVN5bWJvbCA9IHY7IGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpOyB9KVxuICAgICk7XG5cbiAgICAvLyBGWCBSYXRlcyBcdTIwMTQgYXV0by1mZXRjaGVkIChyZWFkLW9ubHkpICsgbWFudWFsIG92ZXJyaWRlc1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDRcIiwgeyB0ZXh0OiBcIkZYIHJhdGVzIFxcdTIxOTIgaG9tZSBjdXJyZW5jeVwiIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkF1dG8tZmV0Y2ggRlggcmF0ZXNcIilcbiAgICAgIC5zZXREZXNjKFwiT24gXFx1MjFCQiBVcGRhdGUgcHJpY2VzOiBDQlIgZm9yIFJVQiBob21lLCBZYWhvbyBvdGhlcndpc2UuIE1hbnVhbCBvdmVycmlkZXMgYWx3YXlzIHdpbi5cIilcbiAgICAgIC5hZGRUb2dnbGUodCA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmZ4QXV0b0ZldGNoICE9PSBmYWxzZSlcbiAgICAgICAgIC5vbkNoYW5nZShhc3luYyB2ID0+IHtcbiAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnhBdXRvRmV0Y2ggPSB2O1xuICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgY29uc3QgZnhTdGF0dXMgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtc2V0dGluZ3MtZngtc3RhdHVzXCIgfSk7XG4gICAgY29uc3QgcmVuZGVyRnhTdGF0dXMgPSAoKSA9PiB7XG4gICAgICBmeFN0YXR1cy5lbXB0eSgpO1xuICAgICAgY29uc3QgbGFiZWwgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5meFNvdXJjZUxhYmVsIHx8IFwiXFx1MjAxNFwiO1xuICAgICAgY29uc3QgdXBkYXRlZCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZ4UmF0ZXNVcGRhdGVkXG4gICAgICAgID8gbmV3IERhdGUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZnhSYXRlc1VwZGF0ZWQpLnRvTG9jYWxlU3RyaW5nKClcbiAgICAgICAgOiBcIm5ldmVyXCI7XG4gICAgICBmeFN0YXR1cy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtdGV4dC1tdXRlZFwiLCB0ZXh0OiBgU291cmNlOiAke2xhYmVsfSBcXHUwMEI3IFVwZGF0ZWQ6ICR7dXBkYXRlZH1gIH0pO1xuICAgIH07XG4gICAgcmVuZGVyRnhTdGF0dXMoKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJSZWZyZXNoIEZYIG5vd1wiKVxuICAgICAgLmFkZEJ1dHRvbihiID0+XG4gICAgICAgIGIuc2V0QnV0dG9uVGV4dChcIlxcdTIxQkIgUmVmcmVzaFwiKVxuICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICBiLnNldERpc2FibGVkKHRydWUpO1xuICAgICAgICAgICBiLnNldEJ1dHRvblRleHQoXCJGZXRjaGluZ1xcdTIwMjZcIik7XG4gICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgY29uc3QgciA9IGF3YWl0IHVwZGF0ZUZ4UmF0ZXModGhpcy5wbHVnaW4uc2V0dGluZ3MpO1xuICAgICAgICAgICAgIGlmIChyLnVwZGF0ZWQpIHtcbiAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgc2hvd05vdGljZShgXFx1MjcxMyBGWCAke3Iuc291cmNlfWAsIDMwMDApO1xuICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIHNob3dOb3RpY2Uoci5lcnJvciB8fCByLnJlYXNvbiB8fCBcIk5vIGNoYW5nZVwiLCAzMDAwKTtcbiAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgIHNob3dOb3RpY2UoXCJGWCBmYWlsZWQ6IFwiICsgKGUubWVzc2FnZSB8fCBlKSwgMzUwMCk7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgYi5zZXREaXNhYmxlZChmYWxzZSk7XG4gICAgICAgICAgIGIuc2V0QnV0dG9uVGV4dChcIlxcdTIxQkIgUmVmcmVzaFwiKTtcbiAgICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgLy8gQXV0byByYXRlcyAocmVhZC1vbmx5KVxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLXNldHRpbmdzLWZ4LXN1YmhlYWRcIiwgdGV4dDogXCJBdXRvIChyZWFkLW9ubHkpXCIgfSk7XG4gICAgY29uc3QgYXV0b1JhdGVzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnhSYXRlc0F1dG8gPz8ge307XG4gICAgY29uc3QgYXV0b0dyaWQgID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KHsgY2xzOiBcInBjLXNldHRpbmdzLWZ4LWdyaWRcIiB9KTtcbiAgICBjb25zdCBob21lID0gU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLmhvbWVDdXJyZW5jeSB8fCBcIlJVQlwiKS50b1VwcGVyQ2FzZSgpO1xuICAgIGNvbnN0IGF1dG9Db2RlcyA9IE9iamVjdC5rZXlzKGF1dG9SYXRlcykuZmlsdGVyKGMgPT4gYy50b1VwcGVyQ2FzZSgpICE9PSBob21lKS5zb3J0KCk7XG4gICAgaWYgKGF1dG9Db2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGF1dG9HcmlkLmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy10ZXh0LW11dGVkXCIsIHRleHQ6IFwiTm8gYXV0byByYXRlcyB5ZXQuIENsaWNrIFJlZnJlc2ggb3IgXFx1MjFCQiBVcGRhdGUgcHJpY2VzLlwiIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGNvbnN0IGNvZGUgb2YgYXV0b0NvZGVzKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IGF1dG9HcmlkLmNyZWF0ZURpdih7IGNsczogXCJwYy1zZXR0aW5ncy1meC1yb3dcIiB9KTtcbiAgICAgICAgcm93LmNyZWF0ZUVsKFwic3BhblwiLCB7IHRleHQ6IGNvZGUgfSk7XG4gICAgICAgIGNvbnN0IHZhbCA9IHJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtdGV4dC1tdXRlZFwiIH0pO1xuICAgICAgICB2YWwudGV4dENvbnRlbnQgPSBTdHJpbmcoYXV0b1JhdGVzW2NvZGVdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNYW51YWwgb3ZlcnJpZGVzIChhbHdheXMgd2luKVxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgY2xzOiBcInBjLXNldHRpbmdzLWZ4LXN1YmhlYWRcIiwgdGV4dDogXCJNYW51YWwgb3ZlcnJpZGVzXCIgfSk7XG4gICAgY29uc3QgbWFudWFsRGVzYyA9IGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgICB0ZXh0OiBcIlNldCBhIG51bWJlciB0byBvdmVycmlkZSB0aGUgYXV0byByYXRlLiBMZWF2ZSBlbXB0eSB0byB1c2UgYXV0by5cIixcbiAgICB9KTtcbiAgICB2b2lkIG1hbnVhbERlc2M7XG4gICAgY29uc3QgbWFudWFsID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnhSYXRlc01hbnVhbCA/PyB7fTtcbiAgICBjb25zdCBjb2Rlc1VuaW9uID0gQXJyYXkuZnJvbShuZXcgU2V0KFsuLi5PYmplY3Qua2V5cyhhdXRvUmF0ZXMpLCAuLi5PYmplY3Qua2V5cyhtYW51YWwpXSkpXG4gICAgICAubWFwKGMgPT4gYy50b1VwcGVyQ2FzZSgpKVxuICAgICAgLmZpbHRlcihjID0+IGMgIT09IGhvbWUpXG4gICAgICAuc29ydCgpO1xuICAgIGNvbnN0IG1hbnVhbEdyaWQgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtc2V0dGluZ3MtZngtZ3JpZFwiIH0pO1xuICAgIGZvciAoY29uc3QgY29kZSBvZiBjb2Rlc1VuaW9uKSB7XG4gICAgICBjb25zdCByb3cgPSBtYW51YWxHcmlkLmNyZWF0ZURpdih7IGNsczogXCJwYy1zZXR0aW5ncy1meC1yb3dcIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyB0ZXh0OiBjb2RlIH0pO1xuICAgICAgY29uc3QgaW5wID0gcm93LmNyZWF0ZUVsKFwiaW5wdXRcIiwgeyB0eXBlOiBcIm51bWJlclwiLCBzdGVwOiBcImFueVwiIH0pO1xuICAgICAgaW5wLmFkZENsYXNzKFwicGVyc29uYWwtY2FwaXRhbC1pbnB1dFwiKTtcbiAgICAgIGtpbGxXaGVlbENoYW5nZShpbnApO1xuICAgICAgaW5wLnBsYWNlaG9sZGVyID0gYXV0b1JhdGVzW2NvZGVdICE9IG51bGwgPyBTdHJpbmcoYXV0b1JhdGVzW2NvZGVdKSA6IFwiXCI7XG4gICAgICBpbnAudmFsdWUgPSBtYW51YWxbY29kZV0gIT0gbnVsbCA/IFN0cmluZyhtYW51YWxbY29kZV0pIDogXCJcIjtcbiAgICAgIGlucC5vbmNoYW5nZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnhSYXRlc01hbnVhbCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZ4UmF0ZXNNYW51YWwgPz8ge307XG4gICAgICAgIGNvbnN0IHYgPSBwYXJzZUZsb2F0KGlucC52YWx1ZSk7XG4gICAgICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHYpIHx8IHYgPD0gMCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5meFJhdGVzTWFudWFsW2NvZGVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZ4UmF0ZXNNYW51YWxbY29kZV0gPSB2O1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQWRkIG1hbnVhbCBvdmVycmlkZVwiKVxuICAgICAgLmFkZFRleHQodCA9PiB7XG4gICAgICAgIHQuc2V0UGxhY2Vob2xkZXIoXCJlLmcuIEFFRFwiKTtcbiAgICAgICAgdC5pbnB1dEVsLmFkZENsYXNzKFwicGMtc2V0dGluZ3MtZngtYWRkLWNvZGVcIik7XG4gICAgICAgIHQuaW5wdXRFbC5kYXRhc2V0LnJvbGUgPSBcImNvZGVcIjtcbiAgICAgIH0pXG4gICAgICAuYWRkVGV4dCh0ID0+IHtcbiAgICAgICAgdC5zZXRQbGFjZWhvbGRlcihcInJhdGVcIik7XG4gICAgICAgIHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdC5pbnB1dEVsLnN0ZXAgPSBcImFueVwiO1xuICAgICAgICB0LmlucHV0RWwuZGF0YXNldC5yb2xlID0gXCJyYXRlXCI7XG4gICAgICAgIGtpbGxXaGVlbENoYW5nZSh0LmlucHV0RWwpO1xuICAgICAgfSlcbiAgICAgIC5hZGRCdXR0b24oYiA9PlxuICAgICAgICBiLnNldEJ1dHRvblRleHQoXCJBZGRcIikub25DbGljayhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgcm93ID0gYi5idXR0b25FbC5jbG9zZXN0KFwiLnNldHRpbmctaXRlbVwiKTtcbiAgICAgICAgICBjb25zdCBjb2RlRWwgPSByb3c/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W2RhdGEtcm9sZT1cImNvZGVcIl0nKTtcbiAgICAgICAgICBjb25zdCByYXRlRWwgPSByb3c/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W2RhdGEtcm9sZT1cInJhdGVcIl0nKTtcbiAgICAgICAgICBjb25zdCBjb2RlID0gU3RyaW5nKGNvZGVFbD8udmFsdWUgfHwgXCJcIikudG9VcHBlckNhc2UoKS50cmltKCk7XG4gICAgICAgICAgY29uc3QgcmF0ZSA9IHBhcnNlRmxvYXQocmF0ZUVsPy52YWx1ZSB8fCBcIlwiKTtcbiAgICAgICAgICBpZiAoIWNvZGUgfHwgIU51bWJlci5pc0Zpbml0ZShyYXRlKSB8fCByYXRlIDw9IDApIHtcbiAgICAgICAgICAgIHNob3dOb3RpY2UoXCJDb2RlICsgcG9zaXRpdmUgcmF0ZSByZXF1aXJlZFwiLCAyNTAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnhSYXRlc01hbnVhbCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZ4UmF0ZXNNYW51YWwgPz8ge307XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnhSYXRlc01hbnVhbFtjb2RlXSA9IHJhdGU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIEFjY291bnRzIFx1MjUwMFx1MjUwMFxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIkFjY291bnRzXCIgfSk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgIHRleHQ6IFwiWW91ciBjYXNoIGFjY291bnRzLiBFYWNoIGlzIGEgLm1kIGZpbGUgaW4gdGhlIGFjY291bnRzIGZvbGRlci4gQmFsYW5jZXMgYXJlIGRlcml2ZWQgZnJvbSB0aGUgbGVkZ2VyLlwiLFxuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYWNjdEZvbGRlciA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmFjY291bnRzRm9sZGVyIHx8IFwiZmluYW5jZS9EYXRhL2FjY291bnRzXCI7XG4gICAgY29uc3QgYWNjdEZpbGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpLmZpbHRlcihcbiAgICAgIGYgPT4gZi5wYXRoLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChhY2N0Rm9sZGVyLnRvTG93ZXJDYXNlKCkgKyBcIi9cIilcbiAgICApO1xuICAgIGlmIChhY2N0RmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgYWNjdExpc3QgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoeyBjbHM6IFwicGMtc2V0dGluZ3MtYWNjdC1saXN0XCIgfSk7XG4gICAgICAvLyBSZW5kZXIgZmFzdCB3aXRoIGZyb250bWF0dGVyIHZhbHVlczsgZW5yaWNoIHdpdGggZGVyaXZlZCBiYWxhbmNlICsgc3RhbGUgZmxhZyBhc3luYy5cbiAgICAgIGNvbnN0IHJvd3NCeU5hbWUgPSBuZXcgTWFwKCk7XG4gICAgICBmb3IgKGNvbnN0IGYgb2YgYWNjdEZpbGVzKSB7XG4gICAgICAgIGNvbnN0IGNhY2hlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZik7XG4gICAgICAgIGNvbnN0IGZtID0gY2FjaGU/LmZyb250bWF0dGVyID8/IHt9O1xuICAgICAgICBjb25zdCBuYW1lID0gZm0ubmFtZSB8fCBmLmJhc2VuYW1lO1xuICAgICAgICBjb25zdCBhY2N0Um93ID0gYWNjdExpc3QuY3JlYXRlRGl2KHsgY2xzOiBcInBjLXNldHRpbmdzLWFjY3Qtcm93XCIgfSk7XG4gICAgICAgIGNvbnN0IG5hbWVTcGFuID0gYWNjdFJvdy5jcmVhdGVFbChcInNwYW5cIiwgeyBjbHM6IFwicGMtc2V0dGluZ3MtYWNjdC1uYW1lXCIsIHRleHQ6IG5hbWUgfSk7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBhY2N0Um93LmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy10ZXh0LW11dGVkXCIgfSk7XG4gICAgICAgIG1ldGEudGV4dENvbnRlbnQgPSBgIFxcdTAwQjcgJHtmbS50eXBlIHx8IFwiP1wifSBcXHUwMEI3ICR7Zm0ubGlxdWlkICE9PSBmYWxzZSA/IFwiTGlxdWlkXCIgOiBcIkxvY2tlZFwifSBcXHUwMEI3IEJhbGFuY2U6ICR7Zm10KHRvTnVtKGZtLmluaXRpYWxfYmFsYW5jZSkpfWA7XG4gICAgICAgIGNvbnN0IGJ0bldyYXAgPSBhY2N0Um93LmNyZWF0ZURpdih7IGNsczogXCJwYy1zZXR0aW5ncy1hY2N0LWJ0bnNcIiB9KTtcbiAgICAgICAgY29uc3Qgb3BlbkJ0biA9IGJ0bldyYXAuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIk9wZW5cIiwgY2xzOiBcInBjLXNldHRpbmdzLWFjY3QtYnRuXCIgfSk7XG4gICAgICAgIG9wZW5CdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgICAgICAgbGVhZi5vcGVuRmlsZShmKTtcbiAgICAgICAgfTtcbiAgICAgICAgcm93c0J5TmFtZS5zZXQobmFtZSwgeyBtZXRhLCBuYW1lU3BhbiB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gRW5yaWNoIGFzeW5jaHJvbm91c2x5IFx1MjAxNCBkZXJpdmVkIGJhbGFuY2UgKyBzdGFsZSBpbmRpY2F0b3IuXG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IFthY2NvdW50cywgbGVkZ2VyXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgIHJlYWRBY2NvdW50cyh0aGlzLmFwcCwgdGhpcy5wbHVnaW4uc2V0dGluZ3MpLFxuICAgICAgICAgICAgcmVhZEFsbExlZGdlcih0aGlzLmFwcCwgdGhpcy5wbHVnaW4uc2V0dGluZ3MpLFxuICAgICAgICAgIF0pO1xuICAgICAgICAgIGNvbnN0IHN0YWxlRGF5cyA9IE1hdGgubWF4KDEsIHRvTnVtKHRoaXMucGx1Z2luLnNldHRpbmdzLnJlY29uY2lsZVN0YWxlRGF5cykgfHwgMzApO1xuICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgICAgZm9yIChjb25zdCBhIG9mIGFjY291bnRzKSB7XG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9IHJvd3NCeU5hbWUuZ2V0KGEubmFtZSk7XG4gICAgICAgICAgICBpZiAoIWVudHJ5KSBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnN0IGJhbCA9IGdldEFjY291bnRCYWxhbmNlKGEsIGxlZGdlcik7XG4gICAgICAgICAgICBlbnRyeS5tZXRhLnRleHRDb250ZW50ID0gYCBcXHUwMEI3ICR7YS50eXBlfSBcXHUwMEI3ICR7YS5saXF1aWQgPyBcIkxpcXVpZFwiIDogXCJMb2NrZWRcIn0gXFx1MDBCNyBCYWxhbmNlOiAke2ZtdChiYWwpfSAke2EuY3VycmVuY3l9YDtcbiAgICAgICAgICAgIGlmIChhLmxhc3RSZWNvbmNpbGVkKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRheXMgPSBNYXRoLmZsb29yKChub3cgLSBEYXRlLnBhcnNlKGEubGFzdFJlY29uY2lsZWQpKSAvIDg2NDAwMDAwKTtcbiAgICAgICAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShkYXlzKSkge1xuICAgICAgICAgICAgICAgIGlmIChkYXlzID49IHN0YWxlRGF5cykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgaWNvbiA9IGVudHJ5Lm5hbWVTcGFuLmNyZWF0ZUVsKFwic3BhblwiLCB7IGNsczogXCJwYy1hY2NvdW50LXN0YWxlLWljb25cIiwgdGV4dDogXCIgXFx1MjdGM1wiIH0pO1xuICAgICAgICAgICAgICAgICAgaWNvbi50aXRsZSA9IGBMYXN0IHJlY29uY2lsZWQgJHtkYXlzfWQgYWdvYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZW50cnkubWV0YS50ZXh0Q29udGVudCArPSBgIFxcdTAwQjcgcmVjb25jaWxlZCAke2RheXN9ZCBhZ29gO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zdCBpY29uID0gZW50cnkubmFtZVNwYW4uY3JlYXRlRWwoXCJzcGFuXCIsIHsgY2xzOiBcInBjLWFjY291bnQtc3RhbGUtaWNvblwiLCB0ZXh0OiBcIiBcXHUyN0YzXCIgfSk7XG4gICAgICAgICAgICAgIGljb24udGl0bGUgPSBcIk5ldmVyIHJlY29uY2lsZWRcIjtcbiAgICAgICAgICAgICAgZW50cnkubWV0YS50ZXh0Q29udGVudCArPSBcIiBcXHUwMEI3IG5ldmVyIHJlY29uY2lsZWRcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbUENdIHNldHRpbmdzIGFjY291bnQgZW5yaWNoIGZhaWxlZDpcIiwgZSk7XG4gICAgICAgIH1cbiAgICAgIH0pKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiTm8gYWNjb3VudCBmaWxlcyBmb3VuZC4gQ29tcGxldGUgb25ib2FyZGluZyBvciBjcmVhdGUgZmlsZXMgaW4gXCIgKyBhY2N0Rm9sZGVyLCBjbHM6IFwicGMtdGV4dC1tdXRlZFwiIH0pO1xuICAgIH1cblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJBY2NvdW50cyBhY3Rpb25zXCIpXG4gICAgICAuYWRkQnV0dG9uKGIgPT5cbiAgICAgICAgYi5zZXRCdXR0b25UZXh0KFwiXFx1MjY5NiBSZWNvbmNpbGUgYWNjb3VudHNcIilcbiAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICBuZXcgUmVjb25jaWxlQWxsTW9kYWwodGhpcy5hcHAsIHRoaXMucGx1Z2luLCAoKSA9PiB0aGlzLmRpc3BsYXkoKSkub3BlbigpO1xuICAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oYiA9PlxuICAgICAgICBiLnNldEJ1dHRvblRleHQoXCJcXHVGRjBCIE5ldyBhY2NvdW50XCIpLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgIG5ldyBDcmVhdGVBY2NvdW50TW9kYWwodGhpcy5hcHAsIHRoaXMucGx1Z2luLCAoKSA9PiB0aGlzLmRpc3BsYXkoKSkub3BlbigpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKS5zZXROYW1lKFwiQWNjb3VudHMgZm9sZGVyXCIpLmFkZFRleHQodCA9PlxuICAgICAgdC5zZXRQbGFjZWhvbGRlcihcImZpbmFuY2UvRGF0YS9hY2NvdW50c1wiKVxuICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hY2NvdW50c0ZvbGRlciA/PyBcIlwiKVxuICAgICAgIC5vbkNoYW5nZShhc3luYyB2ID0+IHtcbiAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmFjY291bnRzRm9sZGVyID0gdi50cmltKCkgfHwgXCJmaW5hbmNlL0RhdGEvYWNjb3VudHNcIjtcbiAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBWaWV3cyBcdTI1MDBcdTI1MDBcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJWaWV3c1wiIH0pO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICB0ZXh0OiBcIk9wdGlvbmFsOiBjcmVhdGUgYSBzdGFuZGFsb25lIG5vdGUgcGFnZSBmb3IgdGhlIHVuaWZpZWQgTGVkZ2VyIHZpZXcgKENsYXNzaWMgXHUyMTk0IE1vbnRobHkgdG9nZ2xlKS4gVGhlIGRhc2hib2FyZCBidXR0b24gd29ya3Mgd2l0aG91dCB0aGlzIG5vdGUuXCIsXG4gICAgICBjbHM6IFwic2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBsZWRnZXJQYXRoID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MubGVkZ2VyTm90ZVBhdGggfHwgXCJmaW5hbmNlL0xlZGdlci5tZFwiO1xuICAgIGNvbnN0IGxlZGdlckV4aXN0cyA9ICEhdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGxlZGdlclBhdGgpO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJMZWRnZXIgdmlld1wiKVxuICAgICAgLnNldERlc2MobGVkZ2VyRXhpc3RzID8gYFx1MjcxMyAke2xlZGdlclBhdGh9YCA6IFwiTm90IGNyZWF0ZWQgeWV0XCIpXG4gICAgICAuYWRkVGV4dCh0ID0+XG4gICAgICAgIHQuc2V0UGxhY2Vob2xkZXIoXCJmaW5hbmNlL0xlZGdlci5tZFwiKVxuICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmxlZGdlck5vdGVQYXRoID8/IFwiXCIpXG4gICAgICAgICAub25DaGFuZ2UoYXN5bmMgdiA9PiB7XG4gICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmxlZGdlck5vdGVQYXRoID0gdi50cmltKCk7XG4gICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgfSlcbiAgICAgIClcbiAgICAgIC5hZGRCdXR0b24oYiA9PlxuICAgICAgICBiLnNldEJ1dHRvblRleHQobGVkZ2VyRXhpc3RzID8gXCJPcGVuXCIgOiBcIkNyZWF0ZVwiKVxuICAgICAgICAgLnNldEN0YSghbGVkZ2VyRXhpc3RzKVxuICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICBjb25zdCBwID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MubGVkZ2VyTm90ZVBhdGggfHwgXCJmaW5hbmNlL0xlZGdlci5tZFwiO1xuICAgICAgICAgICBsZXQgZiA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwKTtcbiAgICAgICAgICAgaWYgKCFmKSB7XG4gICAgICAgICAgICAgY29uc3QgZGlyID0gcC5zcGxpdChcIi9cIikuc2xpY2UoMCwgLTEpLmpvaW4oXCIvXCIpO1xuICAgICAgICAgICAgIGlmIChkaXIgJiYgIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChkaXIpKSB7XG4gICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZGlyKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShwLCBcIi0tLVxcbmNzc2NsYXNzZXM6IFtwYy1kYXNoYm9hcmRdXFxuLS0tXFxuYGBgcGVyc29uYWwtY2FwaXRhbC1sZWRnZXJcXG5gYGBcXG5cIik7XG4gICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MubGVkZ2VyTm90ZVBhdGggPSBwO1xuICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgIHNob3dOb3RpY2UoXCJMZWRnZXIgbm90ZSBjcmVhdGVkXCIpO1xuICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgfVxuICAgICAgICAgICBjb25zdCBsZWFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoXCJ0YWJcIik7XG4gICAgICAgICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZiwgeyBzdGF0ZTogeyBtb2RlOiBcInByZXZpZXdcIiB9IH0pO1xuICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU3RyYXRlZ3kgXHUyNTAwXHUyNTAwXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IFwiU3RyYXRlZ3kgZGVmYXVsdHNcIiB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbCkuc2V0TmFtZShcIlNhdmVzIHRhcmdldCAlIG9mIGluY29tZVwiKS5hZGRUZXh0KHQgPT5cbiAgICAgIHQuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnNhdmVzVGFyZ2V0UGN0ID8/IDMwKSlcbiAgICAgICAub25DaGFuZ2UoYXN5bmMgdiA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLnNhdmVzVGFyZ2V0UGN0ID0gcGFyc2VGbG9hdCh2KSB8fCAzMDsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pXG4gICAgKTtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbCkuc2V0TmFtZShcIkNvbWZvcnQgYnVkZ2V0IChXYW50cyBjZWlsaW5nKVwiKS5hZGRUZXh0KHQgPT5cbiAgICAgIHQuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbWZvcnRCdWRnZXQgPz8gMTAwMDAwKSlcbiAgICAgICAub25DaGFuZ2UoYXN5bmMgdiA9PiB7IHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbWZvcnRCdWRnZXQgPSBwYXJzZUZsb2F0KHYpIHx8IDEwMDAwMDsgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7IH0pXG4gICAgKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBQZXJzb25hbCBDb250ZXh0IChmb3IgQUkpIFx1MjUwMFx1MjUwMFxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiBcIlBlcnNvbmFsIGNvbnRleHRcIiB9KTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwge1xuICAgICAgdGV4dDogXCJGcmVlIHRleHQgaW5jbHVkZWQgaW4gZXZlcnkgQUkgYW5hbHlzaXMgcHJvbXB0LiBEZXNjcmliZSB5b3VyIHNpdHVhdGlvbiwgY29uc3RyYWludHMsIGdvYWxzLlwiLFxuICAgICAgY2xzOiBcInNldHRpbmctaXRlbS1kZXNjcmlwdGlvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGN0eEFyZWEgPSBjb250YWluZXJFbC5jcmVhdGVFbChcInRleHRhcmVhXCIsIHtcbiAgICAgIGNsczogXCJwZXJzb25hbC1jYXBpdGFsLWlucHV0XCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCJlLmcuIEkgaGF2ZSBhbiBJUCB3aXRoIDRNIGlkbGUuIFRyYW5zZmVyIGxpbWl0IDQwMEsvbW9udGguIEluY29tZSBpcyBpcnJlZ3VsYXIuXCIsXG4gICAgfSk7XG4gICAgY3R4QXJlYS5zdHlsZS53aWR0aCA9IFwiMTAwJVwiO1xuICAgIGN0eEFyZWEuc3R5bGUubWluSGVpZ2h0ID0gXCIxMjBweFwiO1xuICAgIGN0eEFyZWEuc3R5bGUucmVzaXplID0gXCJ2ZXJ0aWNhbFwiO1xuICAgIGN0eEFyZWEudmFsdWUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wZXJzb25hbENvbnRleHQgPz8gXCJcIjtcbiAgICBjdHhBcmVhLm9uY2hhbmdlID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucGVyc29uYWxDb250ZXh0ID0gY3R4QXJlYS52YWx1ZTtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IFBlcnNvbmFsQ2FwaXRhbFNldHRpbmdUYWIgfTtcbiIsICIvLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIE1JR1JBVElPTiBcdTIwMTQgb2xkIGRhdGEgXHUyMTkyIGxlZGdlciArIGFjY291bnQgZmlsZXNcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jb25zdCB7IE1PTlRIX0tFWVMgfSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbmNvbnN0IHsgdG9OdW0sIHNob3dOb3RpY2UgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuY29uc3QgeyB3cml0ZUxlZGdlckVudHJpZXMgfSA9IHJlcXVpcmUoXCIuL2xlZGdlci9pb1wiKTtcblxuYXN5bmMgZnVuY3Rpb24gcnVuTWlncmF0aW9uKGFwcCwgc2V0dGluZ3MsIHBsdWdpbikge1xuICBzaG93Tm90aWNlKFwiTWlncmF0aW5nIHRvIGxlZGdlclx1MjAyNlwiLCA1MDAwKTtcbiAgY29uc3QgZW50cmllcyA9IFtdO1xuXG4gIC8vIDEuIE1pZ3JhdGUgYXNzZXQgbG9nRXZlbnRzIFx1MjE5MiBsZWRnZXJcbiAgY29uc3QgYXNzZXRGb2xkZXIgPSBzZXR0aW5ncy5hc3NldHNGb2xkZXIudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gIGNvbnN0IGFzc2V0RmlsZXMgPSBhcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpLmZpbHRlcihcbiAgICBmID0+IGYucGF0aC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoYXNzZXRGb2xkZXIgKyBcIi9cIilcbiAgKTtcbiAgZm9yIChjb25zdCBmaWxlIG9mIGFzc2V0RmlsZXMpIHtcbiAgICBjb25zdCByYXcgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcbiAgICBjb25zdCBmbUVuZCA9IHJhdy5pbmRleE9mKFwiLS0tXCIsIDMpO1xuICAgIGlmIChmbUVuZCA9PT0gLTEpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGJvZHkgPSByYXcuc2xpY2UoZm1FbmQgKyAzKTtcbiAgICBjb25zdCBhc3NldE5hbWUgPSBmaWxlLmJhc2VuYW1lO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBib2R5LnNwbGl0KFwiXFxuXCIpKSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGxpbmUudHJpbSgpLmluY2x1ZGVzKFwifFwiKVxuICAgICAgICA/IGxpbmUudHJpbSgpLnNwbGl0KFwifFwiKS5tYXAocCA9PiBwLnRyaW0oKSlcbiAgICAgICAgOiBsaW5lLnRyaW0oKS5zcGxpdCgvXFxzKy8pO1xuICAgICAgaWYgKHBhcnRzLmxlbmd0aCA8IDQpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKHBhcnRzWzBdKTtcbiAgICAgIGlmIChOdW1iZXIuaXNOYU4oZC5nZXRUaW1lKCkpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG9wID0gcGFydHNbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IHF0eSA9IHRvTnVtKHBhcnRzWzJdKTtcbiAgICAgIGNvbnN0IHZhbCA9IHRvTnVtKHBhcnRzWzNdKTtcbiAgICAgIGlmIChvcCA9PT0gXCJwcmljZVwiKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGVudHJ5ID0geyBkOiBwYXJ0c1swXSwgYXNzZXQ6IGFzc2V0TmFtZSwgbWlncmF0ZWQ6IHRydWUgfTtcbiAgICAgIGlmIChvcCA9PT0gXCJidXlcIiB8fCBvcCA9PT0gXCJyZWludmVzdFwiKSB7XG4gICAgICAgIGVudHJ5LnR5cGUgPSBcImJ1eVwiOyBlbnRyeS5xdHkgPSBxdHk7IGVudHJ5LnByaWNlID0gdmFsOyBlbnRyeS5hbXQgPSBxdHkgKiB2YWw7XG4gICAgICAgIGlmIChvcCA9PT0gXCJyZWludmVzdFwiKSBlbnRyeS5ub3RlID0gXCJyZWludmVzdFwiO1xuICAgICAgfSBlbHNlIGlmIChvcCA9PT0gXCJzZWxsXCIpIHtcbiAgICAgICAgZW50cnkudHlwZSA9IFwic2VsbFwiOyBlbnRyeS5xdHkgPSBxdHk7IGVudHJ5LnByaWNlID0gdmFsOyBlbnRyeS5hbXQgPSBxdHkgKiB2YWw7XG4gICAgICB9IGVsc2UgaWYgKG9wID09PSBcImRpdlwiKSB7XG4gICAgICAgIGVudHJ5LnR5cGUgPSBcImRpdmlkZW5kXCI7IGVudHJ5LmFtdCA9IHZhbDtcbiAgICAgIH0gZWxzZSB7IGNvbnRpbnVlOyB9XG4gICAgICBlbnRyaWVzLnB1c2goZW50cnkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIDIuIE1pZ3JhdGUgbGlxdWlkIHBvb2xzIFx1MjE5MiBhY2NvdW50IGZpbGVzXG4gIGNvbnN0IGFjY291bnRzRm9sZGVyID0gc2V0dGluZ3MuYWNjb3VudHNGb2xkZXIgfHwgXCJmaW5hbmNlL0RhdGEvYWNjb3VudHNcIjtcbiAgaWYgKCFhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGFjY291bnRzRm9sZGVyKSkge1xuICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGVGb2xkZXIoYWNjb3VudHNGb2xkZXIpLmNhdGNoKCgpID0+IHt9KTtcbiAgfVxuICBjb25zdCBwb29scyA9IFtcbiAgICB7IGtleTogXCJsaXF1aWRCYW5rXCIsIGxpcTogXCJsaXF1aWRCYW5rSXNMaXF1aWRcIiwgbmFtZTogXCJCYW5rXCIsIHR5cGU6IFwiYmFua1wiIH0sXG4gICAgeyBrZXk6IFwibGlxdWlkQnJva2VyQ2FzaFwiLCBsaXE6IFwibGlxdWlkQnJva2VyQ2FzaElzTGlxdWlkXCIsIG5hbWU6IFwiQnJva2VyIENhc2hcIiwgdHlwZTogXCJicm9rZXJcIiB9LFxuICAgIHsga2V5OiBcImxpcXVpZENhc2hcIiwgbGlxOiBcImxpcXVpZENhc2hJc0xpcXVpZFwiLCBuYW1lOiBcIkNhc2hcIiwgdHlwZTogXCJjYXNoXCIgfSxcbiAgICB7IGtleTogXCJsaXF1aWRCdXNpbmVzc1wiLCBsaXE6IFwibGlxdWlkQnVzaW5lc3NJc0xpcXVpZFwiLCBuYW1lOiBcIkJ1c2luZXNzXCIsIHR5cGU6IFwiYnVzaW5lc3NcIiB9LFxuICBdO1xuICBmb3IgKGNvbnN0IHBtIG9mIHBvb2xzKSB7XG4gICAgY29uc3QgdmFsID0gc2V0dGluZ3NbcG0ua2V5XSA/PyAwO1xuICAgIGlmICh2YWwgPT09IDApIGNvbnRpbnVlO1xuICAgIGNvbnN0IHBhdGggPSBgJHthY2NvdW50c0ZvbGRlcn0vJHtwbS5uYW1lfS5tZGA7XG4gICAgaWYgKCFhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gW1xuICAgICAgICBcIi0tLVwiLFxuICAgICAgICBgbmFtZTogXCIke3BtLm5hbWV9XCJgLFxuICAgICAgICBgdHlwZTogJHtwbS50eXBlfWAsXG4gICAgICAgIGBjdXJyZW5jeTogJHtzZXR0aW5ncy5ob21lQ3VycmVuY3kgfHwgXCJSVUJcIn1gLFxuICAgICAgICBgbGlxdWlkOiAke3NldHRpbmdzW3BtLmxpcV0gIT09IGZhbHNlfWAsXG4gICAgICAgIGBsb2NrZWQ6ICR7c2V0dGluZ3NbcG0ubGlxXSA9PT0gZmFsc2V9YCxcbiAgICAgICAgYGluaXRpYWxfYmFsYW5jZTogJHt2YWx9YCxcbiAgICAgICAgYGxhc3RfcmVjb25jaWxlZDogXCIke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCl9XCJgLFxuICAgICAgICBcIi0tLVwiLCBcIlwiLFxuICAgICAgXS5qb2luKFwiXFxuXCIpO1xuICAgICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBjb250ZW50KTtcbiAgICB9XG4gIH1cblxuICAvLyAzLiBNaWdyYXRlIGNhdGVnb3J5IG0wMS1tMTIgXHUyMTkyIGxlZGdlciBlbnRyaWVzXG4gIGNvbnN0IGNhdEZvbGRlciA9IHNldHRpbmdzLmNhdGVnb3JpZXNGb2xkZXIudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gIGNvbnN0IGNhdEZpbGVzID0gYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKS5maWx0ZXIoXG4gICAgZiA9PiBmLnBhdGgudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKGNhdEZvbGRlciArIFwiL1wiKVxuICApO1xuICBjb25zdCBjdXJZZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xuICBmb3IgKGNvbnN0IGZpbGUgb2YgY2F0RmlsZXMpIHtcbiAgICBjb25zdCBjYWNoZSA9IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKTtcbiAgICBjb25zdCBmbSA9IGNhY2hlPy5mcm9udG1hdHRlcjtcbiAgICBpZiAoIWZtKSBjb250aW51ZTtcbiAgICBjb25zdCBjYXROYW1lID0gZm0uY2F0ZWdvcnkgfHwgZmlsZS5iYXNlbmFtZTtcbiAgICBjb25zdCBjYXRUeXBlID0gU3RyaW5nKGZtLnR5cGUgfHwgXCJXYW50c1wiKTtcbiAgICBmb3IgKGxldCBtaSA9IDA7IG1pIDwgTU9OVEhfS0VZUy5sZW5ndGg7IG1pKyspIHtcbiAgICAgIGNvbnN0IHZhbCA9IGZtW01PTlRIX0tFWVNbbWldXTtcbiAgICAgIGlmICh2YWwgPT0gbnVsbCB8fCB2YWwgPT09IFwiXCIgfHwgdG9OdW0odmFsKSA9PT0gMCkgY29udGludWU7XG4gICAgICBjb25zdCBhbXQgPSB0b051bSh2YWwpO1xuICAgICAgY29uc3QgbW0gPSBTdHJpbmcobWkgKyAxKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gICAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgICBkOiBgJHtjdXJZZWFyfS0ke21tfS0xNWAsXG4gICAgICAgIHR5cGU6IGNhdFR5cGUgPT09IFwiSW5jb21lXCIgPyBcImluY29tZVwiIDogXCJleHBlbnNlXCIsXG4gICAgICAgIGNhdDogY2F0TmFtZSxcbiAgICAgICAgYW10OiBNYXRoLmFicyhhbXQpLFxuICAgICAgICBtaWdyYXRlZDogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlbnRyaWVzLmxlbmd0aCA+IDApIHtcbiAgICBhd2FpdCB3cml0ZUxlZGdlckVudHJpZXMoYXBwLCBzZXR0aW5ncywgZW50cmllcyk7XG4gIH1cblxuICBzZXR0aW5ncy5taWdyYXRpb25Eb25lID0gdHJ1ZTtcbiAgYXdhaXQgcGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICBzaG93Tm90aWNlKGBcdTI3MTMgTWlncmF0aW9uIGNvbXBsZXRlOiAke2VudHJpZXMubGVuZ3RofSBsZWRnZXIgZW50cmllc2AsIDQwMDApO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgcnVuTWlncmF0aW9uIH07XG4iLCAiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUEVSU09OQUwgQ0FQSVRBTCBcdTIwMTQgT2JzaWRpYW4gUGx1Z2luIGVudHJ5IHBvaW50XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IHsgUGx1Z2luLCBNb2RhbCB9ID0gcmVxdWlyZShcIm9ic2lkaWFuXCIpO1xuY29uc3QgeyBERUZBVUxUX1NFVFRJTkdTLCBNT05USF9LRVlTLCBNT05USF9OQU1FUyB9ID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuY29uc3QgeyBzaG93Tm90aWNlLCBnZXRDdXJyZW50WWVhciB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5jb25zdCB7IHJlbmRlckRhc2hib2FyZCB9ID0gcmVxdWlyZShcIi4vdWkvZGFzaGJvYXJkXCIpO1xuY29uc3QgeyByZW5kZXJVbmlmaWVkTGVkZ2VyIH0gPSByZXF1aXJlKFwiLi91aS9sZWRnZXItdmlld1wiKTtcbmNvbnN0IHsgUENfTEVER0VSX1ZJRVcsIFBDTGVkZ2VyVmlldyB9ID0gcmVxdWlyZShcIi4vdmlld3MvbGVkZ2VyLXRhYlwiKTtcbmNvbnN0IHsgUGVyc29uYWxDYXBpdGFsU2V0dGluZ1RhYiB9ID0gcmVxdWlyZShcIi4vc2V0dGluZ3NcIik7XG5jb25zdCB7IE9uYm9hcmRpbmdNb2RhbCB9ID0gcmVxdWlyZShcIi4vbW9kYWxzL29uYm9hcmRpbmdcIik7XG5jb25zdCB7IENyZWF0ZUFzc2V0TW9kYWwgfSA9IHJlcXVpcmUoXCIuL21vZGFscy9hc3NldC1jcmVhdGVcIik7XG5jb25zdCB7IFBpY2tBc3NldE1vZGFsIH0gPSByZXF1aXJlKFwiLi9tb2RhbHMvYXNzZXQtcGlja1wiKTtcbmNvbnN0IHsgQWRkQXNzZXRMaW5lTW9kYWwgfSA9IHJlcXVpcmUoXCIuL21vZGFscy9hc3NldC1saW5lXCIpO1xuY29uc3QgeyBBZGRUcmFuc2FjdGlvbk1vZGFsIH0gPSByZXF1aXJlKFwiLi9tb2RhbHMvdHJhbnNhY3Rpb25cIik7XG5jb25zdCB7IHJ1bk1pZ3JhdGlvbiB9ID0gcmVxdWlyZShcIi4vbWlncmF0aW9uXCIpO1xuY29uc3QgeyByZWNhbGNBc3NldCB9ID0gcmVxdWlyZShcIi4vYXNzZXRzL3JlY2FsY1wiKTtcbmNvbnN0IHsgdXBkYXRlQWxsQXNzZXRQcmljZXMgfSA9IHJlcXVpcmUoXCIuL2Fzc2V0cy9wcmljZXNcIik7XG5jb25zdCB7IHJlYWRBY2NvdW50cyB9ID0gcmVxdWlyZShcIi4vYWNjb3VudHMvaW9cIik7XG5jb25zdCB7IGJ1aWxkQ2hhdFByb21wdCB9ID0gcmVxdWlyZShcIi4vYWkvcHJvbXB0c1wiKTtcbmNvbnN0IHsgcmVhZExlZGdlck11bHRpWWVhciB9ID0gcmVxdWlyZShcIi4vbGVkZ2VyL2lvXCIpO1xuY29uc3QgeyBidWlsZENhc2hmbG93Um93cyB9ID0gcmVxdWlyZShcIi4vYnVkZ2V0L2Nhc2hmbG93XCIpO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBEQVNIQk9BUkQgTk9URSBURU1QTEFURSAod3JpdHRlbiB3aGVuIG5vdGUgZG9lc24ndCBleGlzdClcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgREFTSEJPQVJEX05PVEVfQ09OVEVOVCA9IGAtLS1cbmNzc2NsYXNzZXM6XG4gIC0gcGMtZGFzaGJvYXJkXG4tLS1cblxcYFxcYFxcYHBlcnNvbmFsLWNhcGl0YWwtZGFzaGJvYXJkXG5cXGBcXGBcXGBcbmA7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNUQVJURVIgQ0FURUdPUklFUyAoY3JlYXRlZCBvbiBmaXJzdCBvbmJvYXJkaW5nKVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gW25hbWUsIHR5cGUsIGVtb2ppLCByZWN1cnJpbmddXG5cbmNvbnN0IFNUQVJURVJfQ0FURUdPUklFUyA9IFtcbiAgLy8gSW5jb21lXG4gIFtcIldhZ2VzXCIsICAgICAgICAgIFwiSW5jb21lXCIsIFwiXFx1ezFGNEJDfVwiLCB0cnVlXSxcbiAgW1wiRnJlZWxhbmNlXCIsICAgICAgXCJJbmNvbWVcIiwgXCJcXHV7MUY0QkJ9XCIsIGZhbHNlXSxcbiAgW1wiR2lmdHMgJiBCb251c1wiLCAgXCJJbmNvbWVcIiwgXCJcXHV7MUYzODF9XCIsIGZhbHNlXSxcbiAgLy8gTmVlZHNcbiAgW1wiUmVudFwiLCAgICAgICAgICAgXCJOZWVkc1wiLCAgXCJcXHV7MUYzRTB9XCIsIHRydWVdLFxuICBbXCJHcm9jZXJpZXNcIiwgICAgICBcIk5lZWRzXCIsICBcIlxcdXsxRjZEMn1cIiwgdHJ1ZV0sXG4gIFtcIkJpbGxzXCIsICAgICAgICAgIFwiTmVlZHNcIiwgIFwiXFx1ezFGNEM0fVwiLCB0cnVlXSxcbiAgW1wiSGVhbHRoXCIsICAgICAgICAgXCJOZWVkc1wiLCAgXCJcXHV7MUY0OEF9XCIsIGZhbHNlXSxcbiAgW1wiVHJhbnNwb3J0XCIsICAgICAgXCJOZWVkc1wiLCAgXCJcXHV7MUY2OEN9XCIsIHRydWVdLFxuICAvLyBXYW50c1xuICBbXCJFYXQgT3V0XCIsICAgICAgICBcIldhbnRzXCIsICBcIlxcdXsxRjM1NH1cIiwgZmFsc2VdLFxuICBbXCJFbnRlcnRhaW5tZW50XCIsICBcIldhbnRzXCIsICBcIlxcdXsxRjNBRX1cIiwgZmFsc2VdLFxuICBbXCJDbG90aGluZ1wiLCAgICAgICBcIldhbnRzXCIsICBcIlxcdXsxRjQ1NX1cIiwgZmFsc2VdLFxuICBbXCJTdWJzY3JpcHRpb25zXCIsICBcIldhbnRzXCIsICBcIlxcdXsxRjRGMX1cIiwgdHJ1ZV0sXG4gIFtcIlZhY2F0aW9uXCIsICAgICAgIFwiV2FudHNcIiwgIFwiXFx1MjcwOFxcdUZFMEZcIiwgIGZhbHNlXSxcbl07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFBMVUdJTiBDTEFTU1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFBlcnNvbmFsQ2FwaXRhbFBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIE1pZ3JhdGlvbiArIGZpcnN0LWFjdGl2YXRpb24gc2NhZmZvbGQgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHkoYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLm1pZ3JhdGlvbkRvbmUgJiYgdGhpcy5zZXR0aW5ncy5vbmJvYXJkaW5nRG9uZSkge1xuICAgICAgICBhd2FpdCBydW5NaWdyYXRpb24odGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MsIHRoaXMpO1xuICAgICAgfVxuICAgICAgLy8gRmlyc3QgYWN0aXZhdGlvbjogdmF1bHQgaGFzIG5vIGRhc2hib2FyZCBub3RlIHlldCBcdTIxOTIgY3JlYXRlIHRoZVxuICAgICAgLy8gZmluYW5jZS8gc2NhZmZvbGQgc28gdXNlciBzZWVzIHRoZSBwbHVnaW4gXCJhbGl2ZVwiIGltbWVkaWF0ZWx5XG4gICAgICAvLyB3aXRob3V0IGhhdmluZyB0byBkaXNjb3ZlciB0aGUgU2V0dXAgY29tbWFuZC4gT25ib2FyZGluZyB3aXphcmRcbiAgICAgIC8vIHN0YXlzIGF2YWlsYWJsZSB2aWEgXCJTZXR1cCAvIE9uYm9hcmRpbmdcIiBjb21tYW5kIGZvciB1c2VycyB3aG9cbiAgICAgIC8vIHdhbnQgZ3VpZGVkIGluaXRpYWwtYmFsYW5jZSBlbnRyeTsgdGhpcyBwYXRoIGp1c3QgZ2l2ZXMgdGhlbVxuICAgICAgLy8gYW4gZW1wdHkgYnV0IGZ1bmN0aW9uYWwgZGFzaGJvYXJkIG91dCBvZiB0aGUgYm94LlxuICAgICAgY29uc3QgZGFzaEZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGhpcy5zZXR0aW5ncy5kYXNoYm9hcmRQYXRoKTtcbiAgICAgIGlmICghZGFzaEZpbGUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5fc2NhZmZvbGRWYXVsdCgpO1xuICAgICAgICBhd2FpdCB0aGlzLl9vcGVuRGFzaGJvYXJkTm90ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIERhc2hib2FyZCA9IGNvZGUgYmxvY2sgcHJvY2Vzc29yIChyZW5kZXJzIGluc2lkZSBhbnkgbm90ZSkgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3Rlck1hcmtkb3duQ29kZUJsb2NrUHJvY2Vzc29yKFxuICAgICAgXCJwZXJzb25hbC1jYXBpdGFsLWRhc2hib2FyZFwiLFxuICAgICAgYXN5bmMgKHNvdXJjZSwgZWwsIGN0eCkgPT4ge1xuICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKFwicGMtZGFzaGJvYXJkLXJvb3RcIik7XG4gICAgICAgIGF3YWl0IHJlbmRlckRhc2hib2FyZCh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncywgZWwsIHRoaXMpO1xuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgVW5pZmllZCBMZWRnZXIgKENsYXNzaWMgLyBNb250aGx5KSBhcyBhIGNvZGUgYmxvY2sgcHJvY2Vzc29yIFx1MjUwMFx1MjUwMFxuICAgIHRoaXMucmVnaXN0ZXJNYXJrZG93bkNvZGVCbG9ja1Byb2Nlc3NvcihcbiAgICAgIFwicGVyc29uYWwtY2FwaXRhbC1sZWRnZXJcIixcbiAgICAgIGFzeW5jIChzb3VyY2UsIGVsLCBjdHgpID0+IHtcbiAgICAgICAgYXdhaXQgcmVuZGVyVW5pZmllZExlZGdlcih0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncywgZWwsIHRoaXMpO1xuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgVW5pZmllZCBMZWRnZXIgYXMgYSB0YWIgdmlldyAob3BlbmVkIGZyb20gZGFzaGJvYXJkIGJ1dHRvbikgXHUyNTAwXHUyNTAwXG4gICAgdGhpcy5yZWdpc3RlclZpZXcoUENfTEVER0VSX1ZJRVcsIChsZWFmKSA9PiBuZXcgUENMZWRnZXJWaWV3KGxlYWYsIHRoaXMpKTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBGb3JjZSByZWFkaW5nIHZpZXcgd2hlbiBEYXNoYm9hcmQubWQgaXMgb3BlbmVkIFx1MjUwMFx1MjUwMFxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAobGVhZikgPT4ge1xuICAgICAgICBpZiAoIWxlYWY/LnZpZXc/LmZpbGUpIHJldHVybjtcbiAgICAgICAgaWYgKGxlYWYudmlldy5maWxlLnBhdGggIT09IHRoaXMuc2V0dGluZ3MuZGFzaGJvYXJkUGF0aCkgcmV0dXJuO1xuICAgICAgICB0aGlzLl9mb3JjZURhc2hib2FyZFByZXZpZXcoKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJmaWxlLW9wZW5cIiwgKGZpbGUpID0+IHtcbiAgICAgICAgaWYgKCFmaWxlIHx8IGZpbGUucGF0aCAhPT0gdGhpcy5zZXR0aW5ncy5kYXNoYm9hcmRQYXRoKSByZXR1cm47XG4gICAgICAgIHRoaXMuX2ZvcmNlRGFzaGJvYXJkUHJldmlldygpO1xuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gXHUyNTAwXHUyNTAwIENvbW1hbmRzIFx1MjUwMFx1MjUwMFxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogICBcInBjLW9wZW4tZGFzaGJvYXJkXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gRGFzaGJvYXJkXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5fb3BlbkRhc2hib2FyZE5vdGUoKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogICBcInBjLXNldHVwXCIsXG4gICAgICBuYW1lOiBcIlNldHVwIC8gT25ib2FyZGluZ1wiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IG5ldyBPbmJvYXJkaW5nTW9kYWwodGhpcy5hcHAsIHRoaXMpLm9wZW4oKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogICBcInBjLWFkZC1uZXctYXNzZXRcIixcbiAgICAgIG5hbWU6IFwiQWRkIG5ldyBhc3NldFwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IG5ldyBDcmVhdGVBc3NldE1vZGFsKHRoaXMuYXBwLCB0aGlzKS5vcGVuKCksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6ICAgXCJwYy11cGRhdGUtYXNzZXQtcGlja1wiLFxuICAgICAgbmFtZTogXCJVcGRhdGUgYXNzZXQgKHBpY2spXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gbmV3IFBpY2tBc3NldE1vZGFsKHRoaXMuYXBwLCB0aGlzLCAoZmlsZSkgPT5cbiAgICAgICAgbmV3IEFkZEFzc2V0TGluZU1vZGFsKHRoaXMuYXBwLCBmaWxlLCB0aGlzKS5vcGVuKClcbiAgICAgICkub3BlbigpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiAgIFwicGMtcmVjYWxjLWFsbC1hc3NldHNcIixcbiAgICAgIG5hbWU6IFwiUmVjYWxjdWxhdGUgYWxsIGFzc2V0c1wiLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgZm9sZGVyID0gdGhpcy5zZXR0aW5ncy5hc3NldHNGb2xkZXIudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gICAgICAgIGNvbnN0IGZpbGVzICA9IHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKVxuICAgICAgICAgIC5maWx0ZXIoZiA9PiBmLnBhdGgudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKGZvbGRlciArIFwiL1wiKSk7XG4gICAgICAgIGZvciAoY29uc3QgZiBvZiBmaWxlcykgYXdhaXQgcmVjYWxjQXNzZXQodGhpcy5hcHAsIGYpO1xuICAgICAgICBzaG93Tm90aWNlKGBSZWNhbGN1bGF0ZWQgJHtmaWxlcy5sZW5ndGh9IGFzc2V0KHMpYCk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiAgIFwicGMtdXBkYXRlLWFsbC1wcmljZXNcIixcbiAgICAgIG5hbWU6IFwiVXBkYXRlIGFsbCBhc3NldCBwcmljZXNcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIHNob3dOb3RpY2UoXCJGZXRjaGluZyBwcmljZXNcXHUyMDI2XCIpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB1cGRhdGVBbGxBc3NldFByaWNlcyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncywgKHRpY2tlcikgPT4ge1xuICAgICAgICAgIHNob3dOb3RpY2UoYEZldGNoaW5nICR7dGlja2VyfVxcdTIwMjZgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChyZXN1bHQudXBkYXRlZCA+IDApIHtcbiAgICAgICAgICBjb25zdCBkaXZUb3RhbCA9IHJlc3VsdC5yZXN1bHRzLnJlZHVjZSgocywgcikgPT4gcyArIChyLmRpdnNBZGRlZCB8fCAwKSwgMCk7XG4gICAgICAgICAgbGV0IG1zZyA9IGBcXHUyNzEzIFVwZGF0ZWQgJHtyZXN1bHQudXBkYXRlZH0vJHtyZXN1bHQudG90YWx9IGFzc2V0KHMpYDtcbiAgICAgICAgICBpZiAoZGl2VG90YWwgPiAwKSBtc2cgKz0gYCwgJHtkaXZUb3RhbH0gZGl2aWRlbmQocylgO1xuICAgICAgICAgIHNob3dOb3RpY2UobXNnLCA0MDAwKTtcbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQuZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzaG93Tm90aWNlKFwiTm8gdXBkYXRlcy4gQ2hlY2sgY29uc29sZSBmb3IgZGV0YWlscy5cIiwgNDAwMCk7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiW1BDXSBQcmljZSB1cGRhdGUgZXJyb3JzOlwiLCByZXN1bHQuZXJyb3JzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzaG93Tm90aWNlKFwiQWxsIGFzc2V0cyBhbHJlYWR5IHVwIHRvIGRhdGVcIik7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6ICAgXCJwYy1hZGQtdHJhbnNhY3Rpb25cIixcbiAgICAgIG5hbWU6IFwiQWRkIHRyYW5zYWN0aW9uXCIsXG4gICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBhY2NvdW50cyA9IGF3YWl0IHJlYWRBY2NvdW50cyh0aGlzLmFwcCwgdGhpcy5zZXR0aW5ncyk7XG4gICAgICAgIG5ldyBBZGRUcmFuc2FjdGlvbk1vZGFsKHRoaXMuYXBwLCB0aGlzLCBhY2NvdW50cykub3BlbigpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogICBcInBjLWNhc2hmbG93LWVyYXNlLWFuZC1hcmNoaXZlXCIsXG4gICAgICBuYW1lOiBcIkNhc2hmbG93OiBFcmFzZSAmIGFyY2hpdmVcIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmNvbmZpcm1FcmFzZUFuZEFyY2hpdmUoKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogICBcInBjLWNvcHktYW5hbHlzaXMtY29udGV4dFwiLFxuICAgICAgbmFtZTogXCJDb3B5IGFuYWx5c2lzIGNvbnRleHQgKGZvciBBSSlcIixcbiAgICAgIGNhbGxiYWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIHNob3dOb3RpY2UoXCJCdWlsZGluZyBjb250ZXh0XFx1MjAyNlwiKTtcbiAgICAgICAgY29uc3QgY3R4ID0gYXdhaXQgYnVpbGRDaGF0UHJvbXB0KHRoaXMuYXBwLCB0aGlzLnNldHRpbmdzKTtcbiAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoY3R4KTtcbiAgICAgICAgc2hvd05vdGljZShcIlxcdTI3MTMgQW5hbHlzaXMgY29udGV4dCBjb3BpZWQgdG8gY2xpcGJvYXJkXCIpO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgUGVyc29uYWxDYXBpdGFsU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEZvcmNlIHByZXZpZXcgKyByZWFkLW9ubHkgb24gYW55IGxlYWYgc2hvd2luZyBEYXNoYm9hcmQubWQgXHUyNTAwXHUyNTAwXG4gIF9mb3JjZURhc2hib2FyZFByZXZpZXcoKSB7XG4gICAgY29uc3QgcGF0aCA9IHRoaXMuc2V0dGluZ3MuZGFzaGJvYXJkUGF0aDtcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShcIm1hcmtkb3duXCIpKSB7XG4gICAgICBpZiAobGVhZi52aWV3Py5maWxlPy5wYXRoICE9PSBwYXRoKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHN0YXRlID0gbGVhZi5nZXRWaWV3U3RhdGUoKTtcbiAgICAgIGlmIChzdGF0ZT8uc3RhdGU/Lm1vZGUgPT09IFwicHJldmlld1wiKSBjb250aW51ZTtcbiAgICAgIHN0YXRlLnN0YXRlID0gc3RhdGUuc3RhdGUgfHwge307XG4gICAgICBzdGF0ZS5zdGF0ZS5tb2RlID0gXCJwcmV2aWV3XCI7XG4gICAgICBzdGF0ZS5zdGF0ZS5zb3VyY2UgPSBmYWxzZTtcbiAgICAgIGxlYWYuc2V0Vmlld1N0YXRlKHN0YXRlKTtcbiAgICB9XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgT3BlbiAob3IgZm9jdXMpIHRoZSBEYXNoYm9hcmQubWQgbm90ZSBcdTI1MDBcdTI1MDBcbiAgYXN5bmMgX29wZW5EYXNoYm9hcmROb3RlKCkge1xuICAgIGF3YWl0IHRoaXMuX3NjYWZmb2xkVmF1bHQoKTtcbiAgICBjb25zdCBwYXRoID0gdGhpcy5zZXR0aW5ncy5kYXNoYm9hcmRQYXRoO1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG4gICAgaWYgKCFmaWxlKSByZXR1cm47XG5cbiAgICAvLyBDaGVjayBpZiBhbHJlYWR5IG9wZW4gaW4gYSB0YWIgXHUyMDE0IGZvY3VzIGl0IGluc3RlYWQgb2YgZHVwbGljYXRpbmdcbiAgICBmb3IgKGNvbnN0IGxlYWYgb2YgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShcIm1hcmtkb3duXCIpKSB7XG4gICAgICBpZiAobGVhZi52aWV3Py5maWxlPy5wYXRoID09PSBwYXRoKSB7XG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5zZXRBY3RpdmVMZWFmKGxlYWYsIHsgZm9jdXM6IHRydWUgfSk7XG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICAgICAgICB0aGlzLl9mb3JjZURhc2hib2FyZFByZXZpZXcoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihcInRhYlwiKTtcbiAgICBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUsIHsgc3RhdGU6IHsgbW9kZTogXCJwcmV2aWV3XCIgfSB9KTtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBDcmVhdGUgZmluYW5jZSBmb2xkZXIgc3RydWN0dXJlICsgYWxsIHN0YXJ0ZXIgZmlsZXMgaWYgbWlzc2luZyBcdTI1MDBcdTI1MDBcbiAgYXN5bmMgX3NjYWZmb2xkVmF1bHQoKSB7XG4gICAgLy8gMS4gRm9sZGVyc1xuICAgIGNvbnN0IGZvbGRlcnMgPSBbXG4gICAgICB0aGlzLnNldHRpbmdzLmNhdGVnb3JpZXNGb2xkZXIsXG4gICAgICB0aGlzLnNldHRpbmdzLmFzc2V0c0ZvbGRlcixcbiAgICAgIHRoaXMuc2V0dGluZ3MuYXJjaGl2ZUZvbGRlcixcbiAgICAgIHRoaXMuc2V0dGluZ3MuYWNjb3VudHNGb2xkZXIgfHwgXCJmaW5hbmNlL0RhdGEvYWNjb3VudHNcIixcbiAgICBdO1xuICAgIGZvciAoY29uc3QgZiBvZiBmb2xkZXJzKSB7XG4gICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmKSkge1xuICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZikuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBQYXJlbnQgZGlycyBmb3Igc2luZ2xlIGZpbGVzXG4gICAgZm9yIChjb25zdCBwIG9mIFt0aGlzLnNldHRpbmdzLmNhcGl0YWxIaXN0b3J5UGF0aCwgdGhpcy5zZXR0aW5ncy5zdHJhdGVneVBhdGgsIHRoaXMuc2V0dGluZ3MuZGFzaGJvYXJkUGF0aF0pIHtcbiAgICAgIGNvbnN0IGRpciA9IHAuc3BsaXQoXCIvXCIpLnNsaWNlKDAsIC0xKS5qb2luKFwiL1wiKTtcbiAgICAgIGlmIChkaXIgJiYgIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChkaXIpKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihkaXIpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAyLiBEYXNoYm9hcmQgbm90ZVxuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHRoaXMuc2V0dGluZ3MuZGFzaGJvYXJkUGF0aCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZSh0aGlzLnNldHRpbmdzLmRhc2hib2FyZFBhdGgsIERBU0hCT0FSRF9OT1RFX0NPTlRFTlQpO1xuICAgIH1cblxuICAgIC8vIDMuIFN0YXJ0ZXIgY2F0ZWdvcnkgZmlsZXMgKG9ubHkgaWYgY2F0ZWdvcmllcyBmb2xkZXIgaXMgZW1wdHkpXG4gICAgY29uc3QgY2F0Rm9sZGVyID0gdGhpcy5zZXR0aW5ncy5jYXRlZ29yaWVzRm9sZGVyLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFwvJC8sIFwiXCIpO1xuICAgIGNvbnN0IGV4aXN0aW5nQ2F0cyA9IHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKVxuICAgICAgLmZpbHRlcihmID0+IGYucGF0aC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoY2F0Rm9sZGVyICsgXCIvXCIpKTtcbiAgICBpZiAoZXhpc3RpbmdDYXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZm9yIChjb25zdCBbbmFtZSwgdHlwZSwgZW1vamksIHJlY3VycmluZ10gb2YgU1RBUlRFUl9DQVRFR09SSUVTKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBgJHt0aGlzLnNldHRpbmdzLmNhdGVnb3JpZXNGb2xkZXJ9LyR7bmFtZX0ubWRgO1xuICAgICAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKSkge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBbXG4gICAgICAgICAgICBcIi0tLVwiLFxuICAgICAgICAgICAgYHR5cGU6ICR7dHlwZX1gLFxuICAgICAgICAgICAgYGNhdGVnb3J5OiAke25hbWV9YCxcbiAgICAgICAgICAgIGBlbW9qaTogJHtlbW9qaX1gLFxuICAgICAgICAgICAgYHJlY3VycmluZzogJHtyZWN1cnJpbmd9YCxcbiAgICAgICAgICAgIC4uLk1PTlRIX0tFWVMubWFwKGsgPT4gYCR7a306YCksXG4gICAgICAgICAgICBcIi0tLVwiLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICBdLmpvaW4oXCJcXG5cIik7XG4gICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIGNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xuXG4gICAgLy8gT25lLXNob3QgbWlncmF0aW9uOiBsZWdhY3kgYGZ4UmF0ZXNgIFx1MjE5MiBgZnhSYXRlc0F1dG9gXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuZnhSYXRlcyAmJiAhdGhpcy5zZXR0aW5ncy5meFJhdGVzVXBkYXRlZCkge1xuICAgICAgdGhpcy5zZXR0aW5ncy5meFJhdGVzQXV0byA9IE9iamVjdC5hc3NpZ24oXG4gICAgICAgIHt9LFxuICAgICAgICBERUZBVUxUX1NFVFRJTkdTLmZ4UmF0ZXNBdXRvLFxuICAgICAgICB0aGlzLnNldHRpbmdzLmZ4UmF0ZXNBdXRvID8/IHt9LFxuICAgICAgICB0aGlzLnNldHRpbmdzLmZ4UmF0ZXMsXG4gICAgICApO1xuICAgICAgZGVsZXRlIHRoaXMuc2V0dGluZ3MuZnhSYXRlcztcbiAgICB9XG5cbiAgICAvLyBEZWVwLW1lcmdlIEZYIGxheWVyc1xuICAgIHRoaXMuc2V0dGluZ3MuZnhSYXRlc01hbnVhbCA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MuZnhSYXRlc01hbnVhbCwgdGhpcy5zZXR0aW5ncy5meFJhdGVzTWFudWFsID8/IHt9KTtcbiAgICB0aGlzLnNldHRpbmdzLmZ4UmF0ZXNBdXRvICAgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLmZ4UmF0ZXNBdXRvLCAgIHRoaXMuc2V0dGluZ3MuZnhSYXRlc0F1dG8gICA/PyB7fSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7IGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7IH1cblxuICAvLyBcdTI1MDBcdTI1MDAgQ2FzaGZsb3cgYXJjaGl2ZSBcdTI1MDBcdTI1MDBcblxuICBjb25maXJtRXJhc2VBbmRBcmNoaXZlKCkge1xuICAgIGNvbnN0IG1vZGFsID0gbmV3IE1vZGFsKHRoaXMuYXBwKTtcbiAgICBtb2RhbC50aXRsZUVsLnNldFRleHQoXCJFcmFzZSAmIGFyY2hpdmUgY2FzaGZsb3dcIik7XG4gICAgbW9kYWwuY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IFwiRXhwb3J0IGN1cnJlbnQgeWVhciB0byBhcmNoaXZlLCB0aGVuIGNsZWFyIGFsbCBtb250aGx5IHZhbHVlcz9cIiB9KTtcbiAgICBjb25zdCBidG5zID0gbW9kYWwuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJwZXJzb25hbC1jYXBpdGFsLWJ1dHRvbnNcIiB9KTtcbiAgICBjb25zdCB5ZXMgID0gYnRucy5jcmVhdGVFbChcImJ1dHRvblwiLCB7IHRleHQ6IFwiQXJjaGl2ZSAmIGNsZWFyXCIsIGNsczogXCJtb2QtY3RhXCIgfSk7XG4gICAgY29uc3Qgbm8gICA9IGJ0bnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIkNhbmNlbFwiIH0pO1xuICAgIG5vLm9uY2xpY2sgID0gKCkgPT4gbW9kYWwuY2xvc2UoKTtcbiAgICB5ZXMub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgIG1vZGFsLmNsb3NlKCk7XG4gICAgICBhd2FpdCB0aGlzLmV4cG9ydENhc2hmbG93VG9BcmNoaXZlKCk7XG4gICAgfTtcbiAgICBtb2RhbC5vcGVuKCk7XG4gIH1cblxuICBhc3luYyBleHBvcnRDYXNoZmxvd1RvQXJjaGl2ZSgpIHtcbiAgICBjb25zdCB5ZWFyICAgPSBnZXRDdXJyZW50WWVhcigpO1xuICAgIGNvbnN0IGxlZGdlciA9IGF3YWl0IHJlYWRMZWRnZXJNdWx0aVllYXIodGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MsIFt5ZWFyXSk7XG4gICAgY29uc3Qgcm93cyAgID0gYnVpbGRDYXNoZmxvd1Jvd3ModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MsIGxlZGdlcik7XG4gICAgY29uc3QgaGVhZGVyID0gW1wiVHlwZVwiLFwiQ2F0ZWdvcnlcIixcIlJlY3VycmluZ1wiLFwiUHJvamVjdGVkXCIsXCJUb3RhbFwiLCAuLi5NT05USF9OQU1FU107XG4gICAgY29uc3QgbWRSb3dzID0gW1xuICAgICAgXCJ8IFwiICsgaGVhZGVyLmpvaW4oXCIgfCBcIikgKyBcIiB8XCIsXG4gICAgICBcInxcIiArIGhlYWRlci5tYXAoKCkgPT4gXCItLS1cIikuam9pbihcInxcIikgKyBcInxcIixcbiAgICAgIC4uLnJvd3MubWFwKHIgPT4ge1xuICAgICAgICBjb25zdCBjZWxscyA9IFtcbiAgICAgICAgICByLnR5cGUsXG4gICAgICAgICAgKHIuZW1vamkgPyByLmVtb2ppICsgXCIgXCIgOiBcIlwiKSArIHIuY2F0ZWdvcnksXG4gICAgICAgICAgci5yZWN1cnJpbmcgPyBcIlxcdTI3MTNcIiA6IFwiXCIsXG4gICAgICAgICAgci5wcm9qZWN0ZWQgIT0gbnVsbCA/IFN0cmluZyhyLnByb2plY3RlZCkgOiBcIlwiLFxuICAgICAgICAgIFN0cmluZyhyLnRvdGFsKSxcbiAgICAgICAgICAuLi5NT05USF9LRVlTLm1hcChrID0+IHIubW9udGhzW2tdICE9IG51bGwgPyBTdHJpbmcoci5tb250aHNba10pIDogXCJcIiksXG4gICAgICAgIF07XG4gICAgICAgIHJldHVybiBcInwgXCIgKyBjZWxscy5qb2luKFwiIHwgXCIpICsgXCIgfFwiO1xuICAgICAgfSksXG4gICAgXTtcblxuICAgIGNvbnN0IGFyY2hpdmVEaXIgPSB0aGlzLnNldHRpbmdzLmFyY2hpdmVGb2xkZXI7XG4gICAgaWYgKCF0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoYXJjaGl2ZURpcikpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihhcmNoaXZlRGlyKTtcbiAgICB9XG4gICAgY29uc3Qgb3V0UGF0aCAgPSBgJHthcmNoaXZlRGlyfS8ke3llYXJ9X2Nhc2hmbG93Lm1kYDtcbiAgICBjb25zdCBjb250ZW50ICA9IGAjIENhc2hmbG93ICR7eWVhcn1cXG5cXG5gICsgbWRSb3dzLmpvaW4oXCJcXG5cIikgKyBcIlxcblwiO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG91dFBhdGgpO1xuICAgIGV4aXN0aW5nXG4gICAgICA/IGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShleGlzdGluZywgY29udGVudClcbiAgICAgIDogYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKG91dFBhdGgsIGNvbnRlbnQpO1xuXG4gICAgLy8gQ2xlYXIgbW9udGhseSB2YWx1ZXMgZnJvbSBhbGwgY2F0ZWdvcnkgZmlsZXNcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLnNldHRpbmdzLmNhdGVnb3JpZXNGb2xkZXIudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gICAgY29uc3QgZmlsZXMgID0gdGhpcy5hcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpXG4gICAgICAuZmlsdGVyKGYgPT4gZi5wYXRoLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChmb2xkZXIgKyBcIi9cIikpO1xuICAgIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xuICAgICAgYXdhaXQgdGhpcy5hcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGYsIChmbSkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGsgb2YgTU9OVEhfS0VZUykgZm1ba10gPSBudWxsO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2hvd05vdGljZShgQXJjaGl2ZWQgdG8gJHtvdXRQYXRofSBhbmQgY2xlYXJlZC5gKTtcbiAgfVxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7OztBQUFBO0FBQUEscUJBQUFBLFVBQUFDLFNBQUE7QUFJQSxRQUFNQyxjQUFjLENBQUMsT0FBTSxPQUFNLE9BQU0sT0FBTSxPQUFNLE9BQU0sT0FBTSxPQUFNLE9BQU0sT0FBTSxPQUFNLEtBQUs7QUFDNUYsUUFBTUMsZUFBYyxDQUFDLFdBQVUsWUFBVyxTQUFRLFNBQVEsT0FB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QzdFLFVBQU0sUUFBUyxLQUFLLElBQUksTUFBTSxpQkFBaUIsRUFDNUMsT0FBTyxPQUFLLEVBQUUsS0FBSyxZQUFZLEVBQUUsV0FBVyxTQUFTLEdBQUcsQ0FBQztBQUM1RCxlQUFXLEtBQUssT0FBTztBQUNyQixZQUFNLEtBQUssSUFBSSxZQUFZLG1CQUFtQixHQUFHLENBQUMsT0FBTztBQUN2RCxtQkFBVyxLQUFLLFdBQVksSUFBRyxDQUFDLElBQUk7QUFBQSxNQUN0QyxDQUFDO0FBQUEsSUFDSDtBQUVBLGVBQVcsZUFBZSxPQUFPLGVBQWU7QUFBQSxFQUNsRDtBQUNGOyIsCiAgIm5hbWVzIjogWyJleHBvcnRzIiwgIm1vZHVsZSIsICJNT05USF9LRVlTIiwgIk1PTlRIX05BTUVTIiwgIkRFRkFVTFRfU0VUVElOR1MiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiTU9OVEhfS0VZUyIsICJzaG93Tm90aWNlIiwgImdldEN1cnJlbnRZZWFyIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInJlYWRMZWRnZXJNdWx0aVllYXIiLCAicmVxdWlyZV9pbyIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJyZWFkQWNjb3VudHMiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiTU9OVEhfS0VZUyIsICJnZXRDdXJyZW50WWVhciIsICJyZWFkQWNjb3VudHMiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiTU9OVEhfS0VZUyIsICJnZXRDdXJyZW50WWVhciIsICJidWlsZENhc2hmbG93Um93cyIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJNT05USF9LRVlTIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgIk1PTlRIX05BTUVTIiwgIk1PTlRIX0tFWVMiLCAicmVhZEFjY291bnRzIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgIk1vZGFsIiwgInNob3dOb3RpY2UiLCAicmVxdWlyZV9iYXNrZXRzIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInJlY2FsY0Fzc2V0IiwgImZtIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInJlY2FsY0Fzc2V0IiwgInVwZGF0ZUFsbEFzc2V0UHJpY2VzIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInJlY2FsY0Fzc2V0IiwgImV4cG9ydHMiLCAibW9kdWxlIiwgIlBpY2tBc3NldE1vZGFsIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgIk1vZGFsIiwgInNob3dOb3RpY2UiLCAicmVjYWxjQXNzZXQiLCAicmVhZEFjY291bnRzIiwgIkFkZEFzc2V0TGluZU1vZGFsIiwgImZtIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgIk1vZGFsIiwgInNob3dOb3RpY2UiLCAicmVjYWxjQXNzZXQiLCAicmVhZEFjY291bnRzIiwgIkNyZWF0ZUFzc2V0TW9kYWwiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAic2hvd05vdGljZSIsICJ1cGRhdGVBbGxBc3NldFByaWNlcyIsICJyZW5kZXJEYXNoYm9hcmQiLCAiUGlja0Fzc2V0TW9kYWwiLCAiQWRkQXNzZXRMaW5lTW9kYWwiLCAiQ3JlYXRlQXNzZXRNb2RhbCIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJNT05USF9OQU1FUyIsICJnZXRDdXJyZW50WWVhciIsICJidWlsZENhc2hmbG93Um93cyIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJidWlsZENoYXRQcm9tcHQiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiTW9kYWwiLCAicmVhZEFjY291bnRzIiwgInJlYWRMZWRnZXJNdWx0aVllYXIiLCAiYnVpbGRDaGF0UHJvbXB0IiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgIk1vZGFsIiwgInNob3dOb3RpY2UiLCAicmVhZEFjY291bnRzIiwgIk9uYm9hcmRpbmdNb2RhbCIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJNb2RhbCIsICJzaG93Tm90aWNlIiwgIkFkZFRyYW5zYWN0aW9uTW9kYWwiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiTW9kYWwiLCAic2hvd05vdGljZSIsICJyZWFkQWNjb3VudHMiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAic2hvd05vdGljZSIsICJidWlsZENhc2hmbG93Um93cyIsICJyZW5kZXJEYXNoYm9hcmQiLCAiT25ib2FyZGluZ01vZGFsIiwgIkFkZFRyYW5zYWN0aW9uTW9kYWwiLCAiUENfTEVER0VSX1ZJRVciLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiTW9kYWwiLCAiTU9OVEhfTkFNRVMiLCAiTU9OVEhfS0VZUyIsICJzaG93Tm90aWNlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgIk1vZGFsIiwgInNob3dOb3RpY2UiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiTU9OVEhfS0VZUyIsICJNT05USF9OQU1FUyIsICJnZXRDdXJyZW50WWVhciIsICJyZWFkTGVkZ2VyTXVsdGlZZWFyIiwgInJlYWRBY2NvdW50cyIsICJidWlsZENhc2hmbG93Um93cyIsICJyZW5kZXJVbmlmaWVkTGVkZ2VyIiwgIkFkZFRyYW5zYWN0aW9uTW9kYWwiLCAiUGlja0Fzc2V0TW9kYWwiLCAiQWRkQXNzZXRMaW5lTW9kYWwiLCAiQ3JlYXRlQXNzZXRNb2RhbCIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJyZW5kZXJVbmlmaWVkTGVkZ2VyIiwgIlBDX0xFREdFUl9WSUVXIiwgIlBDTGVkZ2VyVmlldyIsICJleHBvcnRzIiwgIm1vZHVsZSIsICJNb2RhbCIsICJzaG93Tm90aWNlIiwgImV4cG9ydHMiLCAibW9kdWxlIiwgInNob3dOb3RpY2UiLCAicmVhZEFjY291bnRzIiwgIlBlcnNvbmFsQ2FwaXRhbFNldHRpbmdUYWIiLCAiZXhwb3J0cyIsICJtb2R1bGUiLCAiTU9OVEhfS0VZUyIsICJzaG93Tm90aWNlIiwgInJ1bk1pZ3JhdGlvbiIsICJsZWFmIl0KfQo=
