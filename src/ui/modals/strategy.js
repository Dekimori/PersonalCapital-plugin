const { Modal } = require("obsidian");
const { showNotice, killWheelChange } = require("../../core/utils");

class StrategyModal extends Modal {
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
    wrap.createEl("p", {
      cls: "pc-strategy-desc",
      text: "Set target allocation for each basket. Leave at 0 to skip. Alerts appear here and in reports when allocation drifts more than 5% from target.",
    });

    const fields = [
      { key: "targetCore", label: "🏛 Core (bonds, ETFs, index)", val: s.targetCore || 0 },
      { key: "targetFlash", label: "⚡ Flash (shares, crypto)", val: s.targetFlash || 0 },
      { key: "targetReserve", label: "🛡 Reserve (deposits, cash)", val: s.targetReserve || 0 },
    ];

    const inputs = {};
    for (const f of fields) {
      const row = wrap.createDiv({ cls: "pc-strategy-row" });
      row.createEl("label", { cls: "pc-strategy-label", text: f.label });
      const inp = row.createEl("input", {
        cls: "pc-strategy-input",
        type: "number",
        attr: { min: "0", max: "100", step: "1" },
      });
      inp.value = String(f.val);
      killWheelChange(inp);
      inputs[f.key] = inp;
      row.createEl("span", { cls: "pc-strategy-pct", text: "%" });
    }

    // Total indicator
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

    // Show current alerts inside modal
    const alertWrap = wrap.createDiv({ cls: "pc-strategy-alerts" });
    // We need current basket data — read from settings + approximate
    const hasTargets = (s.targetCore || 0) + (s.targetFlash || 0) + (s.targetReserve || 0) > 0;
    if (hasTargets) {
      alertWrap.createEl("p", { cls: "pc-strategy-alert-title", text: "Current Alerts" });
      alertWrap.createEl("p", {
        cls: "pc-strategy-alert-note",
        text: "Refresh dashboard to see updated alerts after saving.",
      });
    }

    // Buttons
    const btnRow = wrap.createDiv({ cls: "pc-strategy-btn-row" });
    const clearBtn = btnRow.createEl("button", {
      cls: "pc-strategy-clear-btn",
      text: "Clear targets",
    });
    clearBtn.onclick = async () => {
      this.plugin.settings.targetCore = 0;
      this.plugin.settings.targetFlash = 0;
      this.plugin.settings.targetReserve = 0;
      this.plugin.settings.strategyEnabled = false;
      await this.plugin.saveSettings();
      showNotice("Strategy targets cleared");
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
      showNotice("✓ Strategy targets saved");
      this.close();
      if (this.onSave) this.onSave();
    };
  }
  onClose() {
    this.contentEl.empty();
  }
}

module.exports = { StrategyModal };
