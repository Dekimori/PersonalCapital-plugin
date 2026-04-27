# Personal Capital — Obsidian plugin

Cashflow tracking, asset management, and dividend logging for your Obsidian vault. Designed for personal investors and FIRE practitioners who want their financial data in plain text inside Obsidian rather than locked into a third-party app.

> **Auditable.** The full plugin code is `main.js` in this branch — single bundled file, no minification. Open it in any editor and search for `fetch(` to see exactly which network endpoints the plugin calls (only public market-data and FX-rate APIs, all read-only). Your financial data never leaves your vault.

---

## Install

### Option A — BRAT (recommended)

1. Install the **BRAT** plugin from Obsidian Community Plugins.
2. In BRAT settings → "Add Beta plugin" → paste this repo URL.
3. Activate **Personal Capital** in Settings → Community plugins.

### Option B — manual

1. In your vault, create folder `.obsidian/plugins/personal-capital/`.
2. Download `main.js`, `manifest.json`, `styles.css` from the latest [Release](../../releases).
3. Drop all three into the folder.
4. Obsidian → Settings → Community plugins → enable **Personal Capital**.

A `finance/` folder will be scaffolded in your vault on first activation, with an empty dashboard ready for onboarding.

---

## Features

- **Dashboard** — net worth, P&L, asset breakdown, account balances, monthly cashflow.
- **Ledger** — single-source-of-truth JSONL log of every money movement (buy / sell / dividend / expense / income / transfer / reconciliation). One file per year, plain text, version-control-friendly.
- **Assets** — shares, bonds, deposits, cash. Auto-fetch prices (MOEX, Yahoo Finance), auto-log dividends to ledger, deposit interest accrual via templates.
- **Cashflow** — categorised monthly income/expense view, budget basket allocation (needs / wants / savings).
- **Reconciliation** — diff your real account balance against the ledger, find missing entries.
- **FX** — multi-currency support with auto-fetch rates.

---

## Privacy & network access

The plugin runs entirely locally. Your financial data never leaves your vault. Outbound requests:

- **MOEX** (`iss.moex.com`) — share/bond prices and dividend history.
- **Yahoo Finance** (`query1.finance.yahoo.com`) — fallback for non-Russian tickers.
- **CBR** (`cbr.ru`) — FX rates against RUB.

All public, read-only, no auth. No telemetry. No analytics. Verify by grepping `main.js` for `fetch(`.

---

## Compatibility

Obsidian 1.0.0+. Desktop and mobile.

## License

MIT — see [LICENSE](LICENSE).
