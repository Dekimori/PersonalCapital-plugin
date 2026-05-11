function renderAnalysisBlock(container, app, settings) {
  // Lazy require to avoid circular dependency
  const { InsightsModal } = require("../modals/insights");

  const desc = container.createEl("p", { cls: "pc-analysis-desc" });
  desc.textContent = "Need insights on your capital? Prepare a prompt for your AI.";

  const btnRow = container.createDiv({ cls: "pc-analysis-btn-row" });
  const btn = btnRow.createEl("button", {
    cls: "pc-analysis-btn",
    text: "Prepare Analysis",
  });
  btn.onclick = () => new InsightsModal(app, settings).open();

  const tip = container.createDiv({ cls: "pc-analysis-tip" });
  tip.createEl("span", {
    text: "Adjust the prompt as you like. This tool does not provide investment recommendations \u2014 always use your own judgment.",
  });
}

module.exports = { renderAnalysisBlock };
