// ───────────────────────────────────────────────────────────────────
// PRICE FETCHER — MOEX (RUB assets) + Yahoo Finance (international)
// ───────────────────────────────────────────────────────────────────

import { requestUrl } from "obsidian";
import type { App, TFile } from "obsidian";
import { toNum, getOrAssignAssetId } from "../../core/utils";
import { recalcAsset } from "./recalc";
import { writeLedgerEntries } from "../ledger/io";
import type { LedgerEntry, PluginSettings } from "../../core/types";

type StatusCb = ((msg: string) => void) | undefined;

function resolveApiTicker(fm: any, filename: string): string {
  if (fm.ticker) return String(fm.ticker).trim();
  const name = String(fm.name || filename).trim();
  return name.replace(/@+$/, "");
}

async function moexDiscoverMarket(ticker: string): Promise<any> {
  const url =
    `https://iss.moex.com/iss/securities/${encodeURIComponent(ticker)}.json` +
    `?iss.meta=off&iss.only=boards&boards.columns=secid,boardid,market,engine,is_primary`;
  try {
    const resp = await requestUrl({ url, method: "GET" });
    const rows = resp.json?.boards?.data;
    if (!rows || rows.length === 0) return null;
    const primary = rows.find((r: any) => r[4] === 1) || rows[0];
    return { engine: primary[3], market: primary[2], board: primary[1] };
  } catch (e) {
    console.warn(`[PC] MOEX discover failed for ${ticker}:`, e);
    return null;
  }
}

async function moexGetFaceValue(ticker: string): Promise<number> {
  const url =
    `https://iss.moex.com/iss/securities/${encodeURIComponent(ticker)}.json` +
    `?iss.meta=off&iss.only=description&description.columns=name,value`;
  try {
    const resp = await requestUrl({ url, method: "GET" });
    const rows = resp.json?.description?.data;
    if (!rows) return 1000;
    const fv = rows.find((r: any) => r[0] === "FACEVALUE");
    return fv ? toNum(fv[1]) : 1000;
  } catch {
    return 1000;
  }
}

// Real-time / current marketdata for ticker. MOEX history endpoint only
// returns completed sessions (T-1 close), so prices appear stale to users
// looking at their broker app. This endpoint returns intraday LAST plus
// ACCRUEDINT (НКД) for bonds — broker's dirty price = clean + accrued.
//
// Returns { price, accruedInt, faceValue } where price is the raw quote
// (NOT face-adjusted for bonds — caller multiplies by face/100).
async function fetchMoexCurrent(ticker: string, marketInfo: any): Promise<any> {
  if (!marketInfo) return null;
  const { engine, market, board } = marketInfo;
  const url =
    `https://iss.moex.com/iss/engines/${engine}/markets/${market}/boards/${board}/securities/${encodeURIComponent(ticker)}.json` +
    `?iss.meta=off&iss.only=securities,marketdata` +
    `&securities.columns=SECID,FACEVALUE,ACCRUEDINT,PREVPRICE` +
    `&marketdata.columns=SECID,LAST,LCURRENTPRICE,MARKETPRICE,LCLOSEPRICE,UPDATETIME`;
  try {
    const resp = await requestUrl({ url, method: "GET" });
    const data = resp.json;
    const secCols = data?.securities?.columns ?? [];
    const secRow = data?.securities?.data?.[0];
    const mdCols = data?.marketdata?.columns ?? [];
    const mdRow = data?.marketdata?.data?.[0];
    if (!secRow && !mdRow) return null;
    const sec = secRow
      ? Object.fromEntries(secCols.map((c: string, i: number) => [c, secRow[i]]))
      : {};
    const md = mdRow ? Object.fromEntries(mdCols.map((c: string, i: number) => [c, mdRow[i]])) : {};

    // Cascading fallback: MOEX evening sessions / illiquid tickers may have
    // null LAST. Walk through alternatives until something positive is found.
    const rawPrice = [
      md.LAST,
      md.LCURRENTPRICE,
      md.MARKETPRICE,
      md.LCLOSEPRICE,
      sec.PREVPRICE,
    ].find((v) => v != null && v > 0);
    if (rawPrice == null) return null;

    return {
      price: Number(rawPrice),
      accruedInt: Number(sec.ACCRUEDINT) || 0,
      faceValue: Number(sec.FACEVALUE) || null,
      updateTime: md.UPDATETIME || null,
    };
  } catch (e) {
    console.warn(`[PC] MOEX current failed for ${ticker}:`, e);
    return null;
  }
}

async function fetchMoexPrices(ticker: string, fromDate: string, marketInfo?: any): Promise<any> {
  if (!marketInfo) return [];
  const { engine, market, board } = marketInfo;
  const results = [];
  let start = 0;
  const from = fromDate || "2020-01-01";

  while (true) {
    const url =
      `https://iss.moex.com/iss/history/engines/${engine}/markets/${market}/boards/${board}/securities/${encodeURIComponent(ticker)}.json` +
      `?from=${from}&till=2099-12-31&start=${start}&iss.meta=off&history.columns=TRADEDATE,CLOSE,NUMTRADES`;

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
      const [date, close] = row;
      if (close != null && close > 0) {
        results.push({ date, close });
      }
    }

    if (rows.length < 100) break;
    start += 100;
  }

  return results;
}

async function fetchMoexDividends(ticker: string, afterDate?: string): Promise<any[]> {
  const url = `https://iss.moex.com/iss/securities/${encodeURIComponent(ticker)}/dividends.json?iss.meta=off`;
  try {
    const resp = await requestUrl({ url, method: "GET" });
    const rows = resp.json?.dividends?.data;
    if (!rows) return [];
    const cutoff = afterDate || "";
    return rows
      .filter((r: any) => r[2] > cutoff && r[3] != null && r[3] > 0)
      .map((r: any) => ({ date: r[2], perShare: r[3] }));
  } catch (e) {
    console.warn(`[PC] MOEX dividends failed for ${ticker}:`, e);
    return [];
  }
}

async function fetchMoexCoupons(ticker: string, afterDate?: string): Promise<any[]> {
  const url =
    `https://iss.moex.com/iss/securities/${encodeURIComponent(ticker)}/bondization.json` +
    `?iss.meta=off&iss.only=coupons&coupons.columns=coupondate,value_rub`;
  try {
    const resp = await requestUrl({ url, method: "GET" });
    const rows = resp.json?.coupons?.data;
    if (!rows) return [];
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = afterDate || "";
    return rows
      .filter((r: any) => r[0] > cutoff && r[0] <= today && r[1] != null && r[1] > 0)
      .map((r: any) => ({ date: r[0], perBond: r[1] }));
  } catch (e) {
    console.warn(`[PC] MOEX coupons failed for ${ticker}:`, e);
    return [];
  }
}

async function fetchYahooPrices(ticker: string, fromDate?: string): Promise<any> {
  const from = fromDate ? Math.floor(new Date(fromDate).getTime() / 1000) : 0;
  const to = Math.floor(Date.now() / 1000);
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?period1=${from}&period2=${to}&interval=1d&events=div`;

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
    const d = new Date(timestamps[i] * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    prices.push({ date: dateStr, close: parseFloat(closes[i].toFixed(4)) });
  }

  const dividends = [];
  const divEvents = result.events?.dividends;
  if (divEvents) {
    for (const key of Object.keys(divEvents)) {
      const ev = divEvents[key];
      const d = new Date(ev.date * 1000);
      dividends.push({
        date: d.toISOString().slice(0, 10),
        perShare: parseFloat(ev.amount.toFixed(4)),
      });
    }
  }

  return { prices, dividends };
}

// Routing rule:
//   1. type === "bond"            → MOEX  (covers замещайки: USD face value,
//                                          RUB settlement, MOEX-only).
//   2. ticker matches RU ISIN     → MOEX  (/^RU\d{3}[A-Z0-9]+$/ — globally unique,
//                                          never collides with Yahoo tickers).
//   3. currency === "RUB"         → MOEX
//   4. otherwise                  → Yahoo
function getAssetSource(currency: string, type: string, ticker: string): string {
  if (String(type || "").toLowerCase() === "bond") return "moex";
  if (ticker && /^RU\d{3}[A-Z0-9]+$/i.test(String(ticker))) return "moex";
  return String(currency || "").toUpperCase() === "RUB" ? "moex" : "yahoo";
}

async function updateSingleAssetPrice(
  app: App,
  file: TFile,
  settings: PluginSettings,
  statusCb?: StatusCb
): Promise<any> {
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
  const faceValue = toNum(fm.face_value) || 1000;
  // Dividend routing — see asset-create modal. Bonds/deposits always cash by nature.
  const divPolicy = String(fm.dividend_policy || "cash").toLowerCase();
  const dividendAcct = fm.dividend_account ? String(fm.dividend_account) : null;
  const assetName = String(fm.name || file.basename);
  // Stable id for ledger join — fall back to live cache then assign one if
  // the asset predates the id rollout.
  const assetId = await getOrAssignAssetId(app, file);

  const nextDay = new Date(lastUp);
  nextDay.setDate(nextDay.getDate() + 1);
  const fromDate = nextDay.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  if (fromDate > today) {
    return { updated: false, ticker: apiTicker, error: "already up to date" };
  }

  if (statusCb) statusCb(apiTicker);

  const source = getAssetSource(currency, type, apiTicker);
  let latestPrice = null;
  // Rich div records — kept as {date,total} so we can route to ledger later.
  const newDivs = [];
  let newPriceLine = null;
  // Price series for "price on dividend date" lookup during reinvest.
  // For bonds it's {date, close%} — but reinvest is blocked for bonds so not used.
  // For shares (MOEX + Yahoo) it's {date, close} in asset currency.
  let pricesSeries = [];
  // Накопленный купонный доход per bond. Persisted to fm.accrued_interest so
  // recalc/flows can compute dirty value (broker convention) instead of clean.
  // Stays null for non-bonds (don't touch fm).
  let accruedInt = null;

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
        latestPrice = parseFloat(((latest.close / 100) * faceValue).toFixed(2));
      } else {
        latestPrice = latest.close;
      }
      newPriceLine = `${latest.date} | price | — | ${latestPrice}`;
    }

    // Real-time override — MOEX history is T-1 close, broker shows intraday.
    // Replace `latestPrice` and `newPriceLine` with current marketdata when
    // available. For bonds, also pull ACCRUEDINT (НКД) to match broker's
    // dirty price (clean + accrued).
    const current = await fetchMoexCurrent(apiTicker, marketInfo);
    if (current && current.price > 0) {
      const effectiveFace = current.faceValue || faceValue;
      const computed =
        type === "bond"
          ? parseFloat(((current.price / 100) * effectiveFace).toFixed(2))
          : parseFloat(Number(current.price).toFixed(4));
      // Only override when the realtime quote actually differs from the
      // history-derived close — otherwise we'd churn a same-value `price` op
      // each run, defeating body dedup.
      if (computed !== latestPrice) {
        latestPrice = computed;
        newPriceLine = `${today} | price | — | ${latestPrice}`;
      }
      if (type === "bond") {
        accruedInt = parseFloat(Number(current.accruedInt || 0).toFixed(2));
      }
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
      newPriceLine = `${latest.date} | price | — | ${latestPrice}`;
    }
  }

  if (!newPriceLine && newDivs.length === 0) {
    return { updated: false, ticker: apiTicker, error: "no new data" };
  }

  const body = raw.slice(fmEnd + 3).replace(/^\n/, "");
  const existingLines = body.split("\n").filter((l) => l.trim());
  const existingSet = new Set(existingLines.map((l) => l.replace(/\s+/g, " ").trim()));

  // Pick closest price ≤ targetDate from pricesSeries; fallback to latestPrice.
  // pricesSeries is ascending by date (MOEX pagination & Yahoo natural order).
  const priceOnOrBefore = (targetDate: string): number | null => {
    let chosen = null;
    for (const p of pricesSeries) {
      if (p.date <= targetDate) chosen = p.close;
      else break;
    }
    return chosen ?? latestPrice;
  };

  const linesToAdd = [];
  const ledgerEntriesToWrite: LedgerEntry[] = [];

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

  // Process divs newest-first for stable body ordering.
  newDivs.sort((a, b) => b.date.localeCompare(a.date));

  // Reinvest is only meaningful for non-bond, non-deposit assets. Bonds' coupons
  // are always cash (can't partially reinvest into the same issue); deposits
  // have no dividend stream at all. Force cash routing for those to avoid
  // accidentally applying stale policy metadata from a legacy frontmatter.
  const effectivePolicy = type === "bond" || type === "deposit" ? "cash" : divPolicy;

  let divsAdded = 0;
  let reinvestsMade = 0;

  for (const d of newDivs) {
    const divLine = `${d.date} | div | — | ${d.total}`;
    const divKey = divLine.replace(/\s+/g, " ").trim();
    if (existingSet.has(divKey)) continue;

    if (effectivePolicy === "reinvest") {
      const priceOnDate = priceOnOrBefore(d.date);
      if (priceOnDate && priceOnDate > 0) {
        // Whole-kopeck qty so body line stays clean (2 decimals in qty field).
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
              note: "reinvest: fetcher",
            });
            reinvestsMade += 1;
          }
          // Leftover kopecks — book as passive income on the dividend account
          // if one is configured. Without an account we'd phantom the cash,
          // so fold remainder into the buy note and skip the entry.
          if (remainder > 0.005 && dividendAcct) {
            ledgerEntriesToWrite.push({
              d: d.date,
              type: "dividend",
              asset: assetName,
              asset_id: assetId,
              amt: remainder,
              to: dividendAcct,
              note: "reinvest remainder: fetcher",
            });
          }
          continue;
        }
      }
      // Price lookup failed or qty rounded to zero — fall through to cash path
      // so the dividend isn't lost. User can redistribute manually if needed.
    }

    // Cash policy (or reinvest fallback): keep the body div line.
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
        note: "fetcher",
      });
    } else {
      // Silent compat with legacy assets — body grows, ledger doesn't.
      console.warn(`[PC] ${apiTicker}: dividend skipped (no dividend_account configured)`);
    }
  }

  // Accrued-only update path: bond price body line was deduped (same value as
  // existing) but НКД changed — still need to persist accrued_interest to fm
  // and rerun recalc so currentValue reflects today's dirty price.
  const accruedChanged =
    type === "bond" && accruedInt != null && accruedInt !== Number(fm.accrued_interest || 0);

  if (linesToAdd.length === 0 && !accruedChanged) {
    return { updated: false, ticker: apiTicker, error: "already up to date" };
  }

  if (linesToAdd.length > 0) {
    const allLines = [...linesToAdd, ...existingLines];
    const newBody = allLines.join("\n") + "\n";
    const fmSection = raw.slice(0, fmEnd + 3);
    await app.vault.modify(file, fmSection + "\n" + newBody);
  }

  // Ledger write AFTER body lockstep — if vault.modify throws, we don't leave
  // orphan ledger entries. If ledger write fails, body is already updated so
  // the next fetcher run will skip the dup divs and user can manually reconcile.
  if (ledgerEntriesToWrite.length > 0 && settings) {
    try {
      await writeLedgerEntries(app, settings, ledgerEntriesToWrite);
    } catch (e) {
      console.warn(`[PC] ${apiTicker}: ledger write failed:`, e);
    }
  }

  // Persist НКД snapshot — recalc + flows.js read this to compute dirty
  // currentValue. Only write when bond endpoint actually returned a value;
  // skipping the call keeps stale data intact rather than zeroing it.
  if (type === "bond" && accruedInt != null) {
    await app.fileManager.processFrontMatter(file, (f) => {
      f.accrued_interest = accruedInt;
    });
  }

  await recalcAsset(app, file, settings);

  return {
    updated: true,
    ticker: apiTicker,
    newPrice: latestPrice,
    divsAdded: divsAdded + reinvestsMade,
  };
}

async function updateAllAssetPrices(
  app: App,
  settings: PluginSettings,
  statusCb?: StatusCb
): Promise<any> {
  const folder = settings.assetsFolder.toLowerCase().replace(/\/$/, "");
  const files = app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.toLowerCase().startsWith(folder + "/"));

  const results = [];
  for (const file of files) {
    try {
      const r = await updateSingleAssetPrice(app, file, settings, statusCb);
      results.push(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ updated: false, ticker: file.basename, error: msg });
    }
  }

  const updated = results.filter((r) => r.updated);
  const errors = results.filter((r) => !r.updated && r.error && r.error !== "already up to date");

  return { total: files.length, updated: updated.length, errors, results };
}

export {
  resolveApiTicker,
  moexDiscoverMarket,
  moexGetFaceValue,
  fetchMoexPrices,
  fetchMoexDividends,
  fetchMoexCoupons,
  fetchYahooPrices,
  getAssetSource,
  updateSingleAssetPrice,
  updateAllAssetPrices,
};
