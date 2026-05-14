// @ts-nocheck — transitional; types incremental per file
import { Modal } from "obsidian";
import { fmt, showNotice, killWheelChange } from "../../core/utils";
import { readAccounts } from "../../domain/accounts/io";

// Country → currency mapping
const COUNTRY_CURRENCY = {
  Russia: { code: "RUB", symbol: "₽" },
  USA: { code: "USD", symbol: "$" },
  UK: { code: "GBP", symbol: "£" },
  Japan: { code: "JPY", symbol: "¥" },
  China: { code: "CNY", symbol: "¥" },
  EU: { code: "EUR", symbol: "€" },
  Germany: { code: "EUR", symbol: "€" },
  France: { code: "EUR", symbol: "€" },
  Italy: { code: "EUR", symbol: "€" },
  Spain: { code: "EUR", symbol: "€" },
  Netherlands: { code: "EUR", symbol: "€" },
  Canada: { code: "CAD", symbol: "C$" },
  Australia: { code: "AUD", symbol: "A$" },
  India: { code: "INR", symbol: "₹" },
  Brazil: { code: "BRL", symbol: "R$" },
  Turkey: { code: "TRY", symbol: "₺" },
  "South Korea": { code: "KRW", symbol: "₩" },
  Switzerland: { code: "CHF", symbol: "CHF" },
  Israel: { code: "ILS", symbol: "₪" },
  UAE: { code: "AED", symbol: "AED" },
};
const COUNTRY_LIST = Object.keys(COUNTRY_CURRENCY);

class OnboardingModal extends Modal {
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
      broker: "",
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
      () => this.renderStepOverview(contentEl),
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
      text: "Select your country to set the default currency.",
    });

    // Country dropdown
    const countryRow = el.createDiv({ cls: "pc-onboard-row" });
    countryRow.createEl("label", { text: "🌍  Country" });
    const countrySelect = countryRow.createEl("select", { cls: "personal-capital-input" });
    countrySelect.createEl("option", { text: "Select…", value: "" });
    for (const c of COUNTRY_LIST) {
      const opt = countrySelect.createEl("option", { text: c, value: c });
      if (this.data.country === c) opt.selected = true;
    }
    countrySelect.addEventListener("change", () => {
      this.data.country = countrySelect.value;
    });

    // Broker
    const brokerRow = el.createDiv({ cls: "pc-onboard-row" });
    brokerRow.createEl("label", { text: "📊  Broker" });
    const brokerInp = brokerRow.createEl("input", {
      type: "text",
      placeholder: "e.g. T-Bank, Interactive Brokers",
      cls: "personal-capital-input",
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
    const sym = cur ? cur.symbol : (this.plugin.settings.homeCurrencySymbol ?? "₽");

    el.createDiv({ cls: "pc-onboard-step-indicator", text: `2 / ${this.totalSteps}` });
    el.createEl("div", { cls: "pc-onboard-title", text: "Count your money" });
    el.createEl("p", {
      cls: "pc-onboard-desc",
      text: "Sum up what you have right now. This is your starting capital position.",
    });

    const pools = [
      ["liquidBank", "💳  Bank accounts", "All bank accounts total"],
      ["liquidBrokerCash", "📊  Broker free cash", "Uninvested cash on broker"],
      ["liquidCash", "💵  Physical cash", "Cash at hand"],
      ["liquidBusiness", "🏢  Business account", "Optional — leave 0 if none"],
    ];

    const inputs = {};
    for (const [key, label, placeholder] of pools) {
      const row = el.createDiv({ cls: "pc-onboard-row" });
      row.createEl("label", { text: label });
      const inp = row.createEl("input", {
        type: "number",
        placeholder,
        cls: "personal-capital-input",
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
    const sym = cur ? cur.symbol : (this.plugin.settings.homeCurrencySymbol ?? "₽");

    el.createDiv({
      cls: "pc-onboard-step-indicator",
      text: `${this.totalSteps} / ${this.totalSteps}`,
    });
    el.createEl("div", { cls: "pc-onboard-title", text: "Overview" });
    el.createEl("p", {
      cls: "pc-onboard-desc",
      text: "Review your setup. Everything stays local. Editable in Settings.",
    });

    // Setup summary
    const setupSection = el.createDiv({ cls: "pc-onboard-summary-section" });
    setupSection.createEl("div", { cls: "pc-onboard-summary-label", text: "Setup" });
    if (this.data.country) {
      const cRow = setupSection.createDiv({ cls: "pc-onboard-summary-row" });
      cRow.createEl("span", { text: "Country" });
      cRow.createEl("span", {
        cls: "pc-onboard-summary-val",
        text: `${this.data.country} (${cur ? cur.symbol : "?"})`,
      });
    }
    if (this.data.broker) {
      const bRow = setupSection.createDiv({ cls: "pc-onboard-summary-row" });
      bRow.createEl("span", { text: "Broker" });
      bRow.createEl("span", { cls: "pc-onboard-summary-val", text: this.data.broker });
    }

    // Liquid pools summary
    const poolsSection = el.createDiv({ cls: "pc-onboard-summary-section" });
    poolsSection.createEl("div", { cls: "pc-onboard-summary-label", text: "Liquid capital" });
    const poolItems = [
      ["Bank accounts", this.data.liquidBank],
      ["Broker free cash", this.data.liquidBrokerCash],
      ["Physical cash", this.data.liquidCash],
      ["Business account", this.data.liquidBusiness],
    ];
    let poolTotal = 0;
    for (const [name, val] of poolItems) {
      if (!val) continue;
      poolTotal += val;
      const row = poolsSection.createDiv({
        cls: "pc-onboard-summary-row pc-onboard-summary-row--money",
      });
      row.createEl("span", { text: name });
      row.createEl("span", { cls: "pc-onboard-summary-val", text: `${fmt(val)} ${sym}` });
    }
    const totalRow = poolsSection.createDiv({
      cls: "pc-onboard-summary-row pc-onboard-summary-row--money pc-onboard-summary-total",
    });
    totalRow.createEl("span", { text: "Total" });
    totalRow.createEl("span", { cls: "pc-onboard-summary-val", text: `${fmt(poolTotal)} ${sym}` });

    this.renderNav(el, { next: false, done: true });
  }

  // ── Navigation bar ──
  renderNav(el, opts = {}) {
    const nav = el.createDiv({ cls: "pc-onboard-nav" });

    if (opts.back !== false && this.step > 0) {
      const backBtn = nav.createEl("button", { text: "← Back", cls: "pc-onboard-nav-btn" });
      backBtn.onclick = () => {
        this.step--;
        this.render();
      };
    } else {
      nav.createDiv(); // spacer
    }

    if (opts.done) {
      const doneBtn = nav.createEl("button", {
        text: "Done — open dashboard",
        cls: "mod-cta pc-onboard-nav-btn",
      });
      doneBtn.onclick = () => this.finish();
    } else if (opts.next !== false) {
      const nextBtn = nav.createEl("button", { text: "Next →", cls: "mod-cta pc-onboard-nav-btn" });
      nextBtn.onclick = () => {
        this.step++;
        this.render();
      };
    }

    // Skip link
    const skip = nav.createEl("div", { cls: "pc-onboard-skip", text: "skip for now" });
    skip.onclick = () => this.close();
  }

  async finish() {
    // Save legacy liquid pools (for backward compat)
    this.plugin.settings.liquidBank = this.data.liquidBank;
    this.plugin.settings.liquidBrokerCash = this.data.liquidBrokerCash;
    this.plugin.settings.liquidCash = this.data.liquidCash;
    this.plugin.settings.liquidBusiness = this.data.liquidBusiness;

    // Apply country → currency
    const cur = COUNTRY_CURRENCY[this.data.country];
    if (cur) {
      this.plugin.settings.homeCurrency = cur.code;
      this.plugin.settings.homeCurrencySymbol = cur.symbol;
    }

    // Save broker + country to personal context (replace existing lines, don't duplicate)
    let ctx = (this.plugin.settings.personalContext ?? "").trim();
    ctx = ctx
      .split("\n")
      .filter((l) => !l.startsWith("Country:") && !l.startsWith("Broker:"))
      .join("\n")
      .trim();
    const ctxParts = [];
    if (this.data.country) ctxParts.push(`Country: ${this.data.country}`);
    if (this.data.broker) ctxParts.push(`Broker: ${this.data.broker}`);
    if (ctxParts.length > 0) {
      this.plugin.settings.personalContext = ctx
        ? ctxParts.join("\n") + "\n" + ctx
        : ctxParts.join("\n");
    }

    this.plugin.settings.onboardingDone = true;
    await this.plugin.saveSettings();
    await this.plugin._scaffoldVault();

    // Create account files from pool values
    const accountsFolder = this.plugin.settings.accountsFolder || "finance/Data/accounts";
    if (!this.app.vault.getAbstractFileByPath(accountsFolder)) {
      await this.app.vault.createFolder(accountsFolder).catch(() => {});
    }
    const acctCur = cur ? cur.code : this.plugin.settings.homeCurrency || "RUB";
    const poolDefs = [
      { val: this.data.liquidBank, name: "Bank", type: "bank", liquid: true },
      { val: this.data.liquidBrokerCash, name: "Broker Cash", type: "broker", liquid: true },
      { val: this.data.liquidCash, name: "Cash", type: "cash", liquid: true },
      { val: this.data.liquidBusiness, name: "Business", type: "business", liquid: false },
    ];
    const today = new Date().toISOString().slice(0, 10);
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
          "",
        ].join("\n");
        await this.app.vault.create(path, content);
      }
    }

    // Mark migration done (accounts created, ledger will populate as user uses the system)
    this.plugin.settings.migrationDone = true;
    await this.plugin.saveSettings();
    this.close();
    if (this.onDone) {
      this.onDone();
    } else {
      this.plugin._openDashboardNote();
    }
  }
}

export { OnboardingModal, COUNTRY_CURRENCY, COUNTRY_LIST };
