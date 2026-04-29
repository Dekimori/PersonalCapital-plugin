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
    function makeAssetId() {
      if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
      return "ast_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
    async function getOrAssignAssetId(app, file) {
      const cache = app.metadataCache.getFileCache(file);
      let id = cache?.frontmatter?.id;
      if (id) return String(id);
      id = makeAssetId();
      await app.fileManager.processFrontMatter(file, (fm) => {
        fm.id = id;
      });
      return id;
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
      killWheelChange,
      makeAssetId,
      getOrAssignAssetId
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
        const assetId = fm.id ? String(fm.id) : null;
        const currency = String(fm.currency || "RUB").toUpperCase();
        const fxRaw = resolveFxRate(currency, settings);
        const fx = fxRaw ?? 0;
        const fxMissing = fxRaw == null;
        const type = String(fm.type || "shares").toLowerCase();
        const assetEntries = allLedger.filter((e) => {
          if (assetId && e.asset_id) return e.asset_id === assetId;
          return e.asset === assetName;
        });
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
          if (!lastDivDate || dateStr > lastDivDate) lastDivDate = dateStr;
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
      const depositRate = toNum(fm.interest_rate) || toNum(fm.template?.rate);
      if (String(fm.type).toLowerCase() === "deposit" && depositRate > 0) {
        const principal = stats.totalInvested;
        const rate = depositRate / 100;
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
        fm2.current_price = stats.currentPrice ?? fm2.current_price ?? null;
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
    var { getOrAssignAssetId } = require_utils();
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
      const assetId = await getOrAssignAssetId(app, file);
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
                  asset_id: assetId,
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
                  asset_id: assetId,
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
            asset_id: assetId,
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
    var { toNum, getOrAssignAssetId } = require_utils();
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
      const assetId = await getOrAssignAssetId(app, file);
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
              asset_id: assetId,
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
    var { toNum, showNotice: showNotice2, killWheelChange, getOrAssignAssetId } = require_utils();
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
          const assetId = op !== "price" ? await getOrAssignAssetId(this.app, file) : null;
          if (op !== "price") {
            const entry = { d: date, asset: file.basename, asset_id: assetId };
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
                  asset_id: assetId,
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
    var { toNum, showNotice: showNotice2, fmt, killWheelChange, makeAssetId } = require_utils();
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
          const assetId = makeAssetId();
          const tickerVal = tickerIn.value.trim();
          const faceVal = faceIn.value.trim();
          const fmLines = [
            "---",
            `id: ${assetId}`,
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
              asset_id: assetId,
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
