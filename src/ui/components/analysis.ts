import type { App } from "obsidian";
import { InsightsModal } from "../modals/insights";
import type { PluginSettings } from "../../core/types";

export function renderAnalysisBlock(
  container: HTMLElement,
  app: App,
  settings: PluginSettings
): void {
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
    text: "Adjust the prompt as you like. This tool does not provide investment recommendations — always use your own judgment.",
  });
}
