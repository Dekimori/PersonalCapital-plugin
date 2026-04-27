<div align="center">

# Personal Capital

**Personal finance for Obsidian.**
Cashflow, assets, dividends, deposits, FX — all in plain text inside your vault.

![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0%2B-7c3aed?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Platform](https://img.shields.io/badge/platform-desktop%20%7C%20mobile-blue?style=flat-square)

</div>

---

<div align="center">

![Dashboard overview](assets/dashboard-overview.jpg)

</div>

## Why

Most personal-finance apps lock your data into a service. Subscriptions expire, companies pivot, accounts get archived — and your decade of financial history goes with them.

**Personal Capital** keeps everything in your Obsidian vault as plain text:

- A JSONL ledger is the single source of truth — one file per year, version-control-friendly.
- The dashboard is rendered live from the ledger. No hidden state, no migrations, no lock-in.
- The plugin is a single bundled `main.js` — readable, auditable, no minification.

Your financial data never leaves your vault.

---

## Install

### Recommended: BRAT

1. Install [**BRAT**](https://github.com/TfTHacker/obsidian42-brat) from Community plugins.
2. Open BRAT settings → **Add Beta plugin** → paste this repo URL.
3. Settings → Community plugins → enable **Personal Capital**.

BRAT will auto-update the plugin whenever a new release is published.

### Manual

1. Download `main.js`, `manifest.json`, `styles.css` from the latest [Release](../../releases).
2. Place them in `.obsidian/plugins/personal-capital/` inside your vault.
3. Settings → Community plugins → enable **Personal Capital**.

A `finance/` folder is scaffolded on first activation with an empty dashboard ready for onboarding.

---

## Features

<div align="center">

![Capital, allocation, instruments](assets/dashboard-overview2.jpg)

</div>

- **Dashboard** — net worth, P&L, capital growth chart, allocation, instruments, account balances, monthly cashflow.
- **Ledger** — JSONL append-only log of every money movement: buy / sell / dividend / expense / income / transfer / reconciliation. One file per year.
- **Assets** — shares, bonds, deposits, cash. Auto-fetch prices, auto-log dividends to the ledger, deposit interest accrual.
- **Cashflow** — categorised income/expense view with monthly basket budgeting (needs / wants / savings).
- **Reconciliation** — diff real account balances against the ledger to find missing entries.
- **FX** — multi-currency support with auto-fetched rates.

---

## Privacy & network

Everything runs locally. Outbound requests are limited to public, read-only market-data endpoints:

| Endpoint | Purpose |
|---|---|
| `iss.moex.com` | Share/bond prices and dividend history |
| `query1.finance.yahoo.com` | Fallback for non-Russian tickers |
| `cbr.ru` | FX rates against RUB |

No telemetry. No analytics. No accounts. Verify by grepping `main.js` for `fetch(`.

---

## Compatibility

Obsidian **1.0.0+**, desktop and mobile.

## License

[MIT](LICENSE) — © 2026
