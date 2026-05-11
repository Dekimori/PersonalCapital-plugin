// ───────────────────────────────────────────────────────────────────
// DASHBOARD RENDERER
// ───────────────────────────────────────────────────────────────────

const { MONTH_SHORT } = require("../../core/constants");
const { fmt, showNotice, makeInteractive } = require("../../core/utils");
const { buildAssetFlowsAsync } = require("../../domain/assets/flows");
const { buildCashflowRows } = require("../../domain/budget/cashflow");
const { buildBudgetSummary, buildProjected } = require("../../domain/budget/summary");
const { readCapitalHistory } = require("../../domain/budget/timeline");
const { getLiquidTotal } = require("../../domain/accounts/balance");
const { generateMonthlyReport } = require("../../report");
const { renderBudgetCards } = require("./cards");
const { renderProjected } = require("./projected");
const { renderCapitalChart } = require("./chart");
const { renderBaskets } = require("./baskets");
const { renderAssetCards } = require("./assets");
const { renderAnalysisBlock } = require("./analysis");
const { renderWantsQueue } = require("./wants");

async function renderDashboard(app, settings, container, plugin) {
  container.empty();
  container.addClass("pc-dashboard");

  // ── If onboarding not done, show placeholder ──────────────────
  if (!settings.onboardingDone) {
    const { OnboardingModal } = require("../modals/onboarding");
    const ph = container.createDiv({ cls: "pc-onboard-placeholder" });
    ph.createEl("div", { cls: "pc-onboard-placeholder-icon", text: "📊" });
    ph.createEl("h2", { cls: "pc-onboard-placeholder-title", text: "Welcome to Personal Capital" });
    ph.createEl("p", {
      cls: "pc-onboard-placeholder-desc",
      text: "Let's set up your capital tracking. It takes 30 seconds — just count what you have.",
    });
    const btn = ph.createEl("button", {
      cls: "pc-onboard-placeholder-btn mod-cta",
      text: "Start setup",
    });
    btn.onclick = () => {
      if (plugin) {
        new OnboardingModal(app, plugin, () => {
          renderDashboard(app, plugin.settings, container, plugin);
        }).open();
      }
    };
    return;
  }

  // Gather data
  const af = await buildAssetFlowsAsync(app, settings);
  const { passiveIncome, saves, assets, savesByMonthKey, accounts, allLedger } = af;
  const cfRows = buildCashflowRows(app, settings, allLedger);
  const budget = buildBudgetSummary(cfRows, settings, af);
  const proj = buildProjected(cfRows);
  const history = await readCapitalHistory(app, settings);
  const sym = settings.homeCurrencySymbol;

  // ── HEADER: LEFT (total) + RIGHT (actions) ─────────────────────
  const heroSection = container.createDiv({ cls: "pc-hero-section" });

  const investedCapital = assets.reduce((s, a) => s + a.currentValueRub, 0);
  const liquidTotal = getLiquidTotal(settings, accounts, allLedger);
  const totalCapital = investedCapital + liquidTotal;
  const heroLeft = heroSection.createDiv({ cls: "pc-hero-left" });
  heroLeft.createEl("div", { cls: "pc-hero-label", text: "Total Capital" });
  heroLeft.createEl("div", { cls: "pc-hero-value", text: `${fmt(totalCapital)} ${sym}` });
  const heroSub = heroLeft.createDiv({ cls: "pc-hero-sub" });
  heroSub.createEl("span", { text: `Invested ${fmt(investedCapital)} ${sym}` });
  heroSub.createEl("span", { text: " · " });
  heroSub.createEl("span", { text: `Accounts ${fmt(liquidTotal)} ${sym}` });

  // Right: Action buttons
  const heroRight = heroSection.createDiv({ cls: "pc-hero-right" });
  const now = new Date();

  // Lazy require modals to avoid circular deps
  const { AddTransactionModal } = require("../modals/transaction");
  const PC_LEDGER_VIEW = "pc-ledger-view";

  const reportBtn = heroRight.createEl("button", { cls: "pc-action-btn", text: "📋 Report" });
  reportBtn.onclick = async () => {
    reportBtn.disabled = true;
    reportBtn.textContent = "Generating…";
    try {
      const path = await generateMonthlyReport(app, settings, budget, assets, cfRows, sym);
      showNotice(`✓ Report saved: ${path}`, 4000);
    } catch (e) {
      showNotice("Report failed: " + (e.message || e), 4000);
    }
    reportBtn.disabled = false;
    reportBtn.textContent = "📋 Report";
  };

  const addTxBtn = heroRight.createEl("button", { cls: "pc-action-btn", text: "＋ Transaction" });
  addTxBtn.onclick = () => new AddTransactionModal(app, plugin, accounts).open();

  const ledgerBtn = heroRight.createEl("button", { cls: "pc-action-btn", text: "📒 Ledger" });
  ledgerBtn.onclick = async () => {
    const leaf = app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: PC_LEDGER_VIEW, active: true });
  };

  const { ReconcileAllModal } = require("../modals/reconcile");
  const reconcileBtn = heroRight.createEl("button", {
    cls: "pc-action-btn",
    text: "\u2696 Reconcile",
  });
  reconcileBtn.onclick = () =>
    new ReconcileAllModal(app, plugin, () =>
      renderDashboard(app, settings, container, plugin)
    ).open();

  const refreshBtn = heroRight.createEl("button", {
    cls: "pc-action-btn pc-action-btn--secondary",
    text: "↻ Refresh",
  });
  refreshBtn.onclick = () => renderDashboard(app, settings, container, plugin);

  // ── BLOCK 1: BUDGET CARDS ───────────────────────────────────────
  const b1 = container.createDiv({ cls: "pc-block" });
  b1.createEl("div", { cls: "pc-block-title", text: "Budget · " + MONTH_SHORT[now.getMonth()] });
  const b1body = b1.createDiv({ cls: "pc-block-body pc-cards-grid" });
  renderBudgetCards(b1body, budget, sym);

  // ── BLOCK 1b: WANTS QUEUE ───────────────────────────────────────
  const b1b = container.createDiv({ cls: "pc-block" });
  renderWantsQueue(b1b, app, settings);

  // ── BLOCK 2: PROJECTED NEXT MONTH ──────────────────────────────
  const b2 = container.createDiv({ cls: "pc-block" });
  b2.createEl("div", {
    cls: "pc-block-title",
    text: "Projected · " + MONTH_SHORT[(now.getMonth() + 1) % 12],
  });
  const b2body = b2.createDiv({ cls: "pc-block-body" });
  renderProjected(b2body, proj, sym, budget);

  // ── BLOCK 3: CAPITAL GROWTH CHART + ASSETS ────────────────────
  const b3 = container.createDiv({ cls: "pc-block" });
  const b3header = b3.createDiv({ cls: "pc-block-header" });
  b3header.createEl("div", { cls: "pc-block-title", text: "Capital Growth" });

  const b3body = b3.createDiv({ cls: "pc-block-body" });
  renderCapitalChart(b3body, history, assets, settings, budget, accounts, allLedger);
  renderBaskets(b3body, assets, settings, sym, app, plugin, accounts, allLedger);
  renderAssetCards(b3body, assets, settings, app, plugin, container);

  // ── BLOCK 4: ANALYSIS ──────────────────────────────────────────
  const b4 = container.createDiv({ cls: "pc-block" });
  b4.createEl("div", { cls: "pc-block-title", text: "Analysis Session" });
  const b4body = b4.createDiv({ cls: "pc-block-body" });
  renderAnalysisBlock(b4body, app, settings);

  // ── SETTINGS LINK ──────────────────────────────────────────────
  const settingsBtn = container.createDiv({ cls: "pc-settings-link" });
  makeInteractive(settingsBtn);
  settingsBtn.createEl("span", { text: "⚙" });
  settingsBtn.createEl("span", { text: "Settings" });
  settingsBtn.onclick = () => {
    app.setting.open();
    app.setting.openTabById("personal-capital");
  };
}

module.exports = { renderDashboard };
