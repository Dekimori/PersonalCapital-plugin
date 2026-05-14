// @ts-nocheck — transitional; types incremental per file
import { MONTH_KEYS, MONTH_NAMES, MONTH_SHORT } from "../../core/constants";
const {
  toNum,
  fmt,
  getCurrentYear,
  getCurrentMonthKey,
  makeInteractive,
} = require("../../core/utils");
import { readAllLedger, readLedgerMultiYear } from "../../domain/ledger/io";
import { readAccounts } from "../../domain/accounts/io";
import { getAccountBalance } from "../../domain/accounts/balance";
import { buildCashflowRows } from "../../domain/budget/cashflow";

async function renderLedgerClassic(app, settings, container, plugin, onChange) {
  container.empty();
  container.addClass("pc-ledger-view");

  const entries = await readAllLedger(app, settings);
  const accounts = await readAccounts(app, settings);
  const sym = settings.homeCurrencySymbol;

  // Filter bar
  const filterBar = container.createDiv({ cls: "pc-ledger-filters" });
  let filterType = "";
  let filterAccount = "";
  const typeSelect = filterBar.createEl("select", {
    cls: "personal-capital-input pc-ledger-filter-select",
  });
  typeSelect.createEl("option", { text: "All types", value: "" });
  for (const t of [
    "buy",
    "sell",
    "dividend",
    "close",
    "expense",
    "income",
    "transfer",
    "reconciliation",
  ]) {
    typeSelect.createEl("option", { text: t, value: t });
  }

  // Accounts summary — clickable to filter
  const acctBar = container.createDiv({ cls: "pc-ledger-accounts" });
  const allTag = acctBar.createDiv({ cls: "pc-ledger-acct-tag pc-ledger-acct-active" });
  allTag.createEl("span", { cls: "pc-ledger-acct-name", text: "All" });
  allTag.createEl("span", { cls: "pc-ledger-acct-bal", text: `${entries.length}` });

  const acctTags = [{ el: allTag, name: "" }];
  const staleDays = Math.max(1, toNum(settings.reconcileStaleDays) || 30);
  const nowMs = Date.now();
  for (const a of accounts) {
    const bal = getAccountBalance(a, entries);
    const tag = acctBar.createDiv({
      cls: `pc-ledger-acct-tag ${a.locked ? "pc-ledger-acct-locked" : ""}`,
    });
    const nameEl = tag.createEl("span", { cls: "pc-ledger-acct-name", text: a.name });
    // Staleness: append ⟳ if never reconciled or beyond threshold.
    let staleText = null;
    if (!a.lastReconciled) {
      staleText = "Never reconciled";
    } else {
      const days = Math.floor((nowMs - Date.parse(a.lastReconciled)) / 86400000);
      if (Number.isFinite(days) && days >= staleDays) staleText = `Last reconciled ${days}d ago`;
    }
    if (staleText) {
      const icon = nameEl.createEl("span", { cls: "pc-account-stale-icon", text: " \u27F3" });
      icon.title = staleText;
    }
    tag.createEl("span", { cls: "pc-ledger-acct-bal", text: `${fmt(bal)} ${sym}` });
    acctTags.push({ el: tag, name: a.name });
  }

  // "Unassigned" tag for migrated entries without from/to
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

  // Table
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

    const typeIcons = {
      buy: "\uD83D\uDCC8",
      sell: "\uD83D\uDCC9",
      dividend: "\uD83D\uDCB0",
      close: "\uD83D\uDD12",
      expense: "\uD83D\uDD34",
      income: "\uD83D\uDFE2",
      transfer: "\u21D4\uFE0F",
      reconciliation: "\u2696\uFE0F",
    };

    for (const e of shown) {
      const row = table.createDiv({ cls: "pc-ledger-row" });
      row.createEl("span", { cls: "pc-ledger-date", text: e.d });
      row.createEl("span", {
        cls: "pc-ledger-type",
        text: `${typeIcons[e.type] || "\u00B7"} ${e.type}`,
      });
      row.createEl("span", { cls: "pc-ledger-desc", text: e.asset || e.cat || e.note || "\u2014" });
      const amtCls =
        e.type === "income" || e.type === "sell" || e.type === "dividend"
          ? "pc-pos"
          : e.type === "expense" || e.type === "buy"
            ? "pc-neg"
            : "";
      const amt = toNum(e.amt);
      const amtDec = amt !== 0 && Math.abs(amt) < 10 ? 2 : 0;
      row.createEl("span", { cls: `pc-ledger-amt ${amtCls}`, text: `${fmt(amt, amtDec)} ${sym}` });
      // Source/destination column
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

// ───────────────────────────────────────────────────────────────────
// LEDGER — MONTHLY MODE (cashflow category grid)
// ───────────────────────────────────────────────────────────────────

async function renderLedgerMonthly(app, settings, container, plugin, onChange) {
  // Lazy requires to avoid circular dependencies
  const { CashflowCellModal } = require("../modals/cashflow-cell");
  const { AddCategoryModal } = require("../modals/category");

  container.empty();
  container.addClass("pc-cashflow-grid-view");

  const curYear = getCurrentYear();
  const allLedger = await readLedgerMultiYear(app, settings, [curYear]);
  const accounts = await readAccounts(app, settings);
  const rows = buildCashflowRows(app, settings, allLedger);
  const sym = settings.homeCurrencySymbol;
  const curMk = getCurrentMonthKey();
  const rerender = () => renderLedgerMonthly(app, settings, container, plugin, onChange);

  // Table
  const tbl = container.createEl("table", { cls: "pc-cf-table" });

  // Header row
  const thead = tbl.createEl("thead");
  const hrow = thead.createEl("tr");
  hrow.createEl("th", { text: "Type" });
  hrow.createEl("th", { text: "Category" });
  for (const mn of MONTH_SHORT) hrow.createEl("th", { text: mn, cls: "pc-cf-month-th" });
  hrow.createEl("th", { text: "Total" });

  // Body
  const tbody = tbl.createEl("tbody");

  // Group by type
  let currentType = "";
  const typeIncome = 0,
    typeNeeds = 0,
    typeWants = 0;
  const monthTotals = {};
  MONTH_KEYS.forEach((k) => {
    monthTotals[k] = 0;
  });
  let grandTotal = 0;

  for (const r of rows) {
    // Type separator
    if (r.type !== currentType) {
      currentType = r.type;
      const sepRow = tbody.createEl("tr", { cls: "pc-cf-type-row" });
      sepRow.createEl("td", { text: r.type, attr: { colspan: String(MONTH_KEYS.length + 3) } });
    }

    const tr = tbody.createEl("tr");
    tr.createEl("td", { cls: "pc-cf-type-cell", text: "" });
    tr.createEl("td", { cls: "pc-cf-cat-cell", text: `${r.emoji} ${r.category}` });

    for (let mi = 0; mi < MONTH_KEYS.length; mi++) {
      const mk = MONTH_KEYS[mi];
      const val = r.months[mk];
      const td = tr.createEl("td", {
        cls: `pc-cf-val-cell ${mk === curMk ? "pc-cf-current" : ""}`,
      });

      if (val != null && val !== 0) {
        td.textContent = fmt(val);
        td.classList.add(val > 0 ? "pc-pos" : "pc-neg");
        monthTotals[mk] += val;
        grandTotal += val;
      } else {
        td.textContent = "\u2014";
        td.classList.add("pc-cf-empty");
      }

      // Click to open cell detail modal (list + add + edit + delete)
      td.classList.add("pc-cf-clickable");
      makeInteractive(td);
      td.onclick = () => {
        new CashflowCellModal(app, settings, {
          year: curYear,
          monthIdx: mi,
          category: r.category,
          isIncome: r.type === "Income",
          accounts,
          onSaved: rerender,
        }).open();
      };
    }

    tr.createEl("td", {
      cls: `pc-cf-total-cell ${r.total >= 0 ? "pc-pos" : "pc-neg"}`,
      text: fmt(r.total),
    });
  }

  // "+ Add category" row
  const addCatTr = tbody.createEl("tr", { cls: "pc-cf-addcat-row" });
  const addCatTd = addCatTr.createEl("td", {
    text: "+ Add category",
    attr: { colspan: String(MONTH_KEYS.length + 3) },
  });
  makeInteractive(addCatTd);
  addCatTd.onclick = () => {
    new AddCategoryModal(app, settings, rerender).open();
  };

  // Footer totals
  const tfoot = tbl.createEl("tfoot");
  const frow = tfoot.createEl("tr");
  frow.createEl("td", { text: "" });
  frow.createEl("td", { text: "Total", cls: "pc-cf-total-label" });
  for (const mk of MONTH_KEYS) {
    const v = monthTotals[mk];
    frow.createEl("td", {
      cls: `pc-cf-val-cell pc-cf-total-cell ${v >= 0 ? "pc-pos" : "pc-neg"}`,
      text: v !== 0 ? fmt(v) : "\u2014",
    });
  }
  frow.createEl("td", {
    cls: `pc-cf-total-cell ${grandTotal >= 0 ? "pc-pos" : "pc-neg"}`,
    text: fmt(grandTotal),
  });
}

// ───────────────────────────────────────────────────────────────────
// LEDGER — UNIFIED VIEW (Classic ↔ Monthly toggle)
// ───────────────────────────────────────────────────────────────────

async function renderUnifiedLedger(app, settings, container, plugin) {
  // Lazy requires to avoid circular dependencies
  const { AddTransactionModal } = require("../modals/transaction");
  const { PickAssetModal } = require("../modals/asset-pick");
  const { AddAssetLineModal } = require("../modals/asset-line");
  const { CreateAssetModal } = require("../modals/asset-create");

  container.empty();
  container.addClass("pc-dashboard-root");
  container.addClass("pc-ledger-unified");

  const accounts = await readAccounts(app, settings);

  // Shared top bar: title + Classic/Monthly toggle + Transaction button
  const topBar = container.createDiv({ cls: "pc-ledger-toggle-bar" });
  topBar.createEl("div", { cls: "pc-block-title", text: "Ledger" });

  const toggleWrap = topBar.createDiv({ cls: "pc-ledger-toggle" });
  toggleWrap.createDiv({ cls: "pc-ledger-toggle-thumb" });
  const classicBtn = toggleWrap.createEl("button", { cls: "pc-toggle-btn", text: "Classic" });
  const monthlyBtn = toggleWrap.createEl("button", { cls: "pc-toggle-btn", text: "Monthly" });

  const addTxBtn = topBar.createEl("button", { cls: "pc-action-btn", text: "\uFF0B Transaction" });
  addTxBtn.onclick = () =>
    new AddTransactionModal(app, plugin, accounts, () => {
      renderMode();
    }).open();

  const updAssetBtn = topBar.createEl("button", {
    cls: "pc-action-btn",
    text: "\u21BB Asset action",
  });
  updAssetBtn.onclick = () => {
    new PickAssetModal(app, plugin, (file) => {
      const modal = new AddAssetLineModal(app, file, plugin);
      const origClose = modal.onClose ? modal.onClose.bind(modal) : null;
      modal.onClose = function () {
        if (origClose) origClose();
        renderMode();
      };
      modal.open();
    }).open();
  };

  const newAssetBtn = topBar.createEl("button", { cls: "pc-action-btn", text: "\uFF0B Asset" });
  newAssetBtn.onclick = () => {
    const modal = new CreateAssetModal(app, plugin);
    const origClose = modal.onClose ? modal.onClose.bind(modal) : null;
    modal.onClose = function () {
      if (origClose) origClose();
      renderMode();
    };
    modal.open();
  };

  // Mode-content container (replaced on toggle)
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

export { renderLedgerClassic, renderLedgerMonthly, renderUnifiedLedger };
