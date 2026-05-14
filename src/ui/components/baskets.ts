import type { App } from "obsidian";
import { fmt } from "../../core/utils";
import { BASKET_META, buildBasketData } from "../../domain/budget/baskets";
import { StrategyModal } from "../modals/strategy";
import type { BasketKey } from "../../domain/budget/baskets";
import type { Account, LedgerEntry, PluginSettings } from "../../core/types";

export function renderBaskets(
  container: HTMLElement,
  assets: any[],
  settings: PluginSettings,
  sym: string,
  app: App,
  plugin: any,
  accounts?: Account[] | null,
  allLedger?: LedgerEntry[] | null
): void {
  const { baskets } = buildBasketData(assets, settings, accounts, allLedger);
  const hasTargets =
    (settings.targetCore || 0) + (settings.targetFlash || 0) + (settings.targetReserve || 0) > 0;

  const wrap = container.createDiv({ cls: "pc-baskets" });

  // Header row with strategy button
  const hdr = wrap.createDiv({ cls: "pc-baskets-header" });
  hdr.createEl("div", { cls: "pc-baskets-title", text: "Allocation" });
  const stratBtn = hdr.createEl("button", { cls: "pc-strategy-btn", text: "⚙ Strategy" });
  stratBtn.onclick = () => new StrategyModal(app, plugin, () => {}).open();

  // 3-column grid
  const grid = wrap.createDiv({ cls: "pc-baskets-grid" });

  for (const [key, meta] of Object.entries(BASKET_META)) {
    const bk = baskets[key as BasketKey];
    const pct = bk.pct ?? 0;
    const onTarget = hasTargets && bk.target > 0 && Math.abs(pct - bk.target) < 5;
    const over = hasTargets && bk.target > 0 && pct > bk.target;

    const panel = grid.createDiv({ cls: "pc-basket-panel" });

    const phdr = panel.createDiv({ cls: "pc-basket-hdr" });
    phdr.createEl("span", { cls: "pc-basket-icon", text: meta.icon });
    phdr.createEl("span", { cls: "pc-basket-name", text: meta.label });

    const pctCls =
      hasTargets && bk.target > 0
        ? onTarget
          ? "pc-basket-pct pc-basket-pct--ok"
          : over
            ? "pc-basket-pct pc-basket-pct--over"
            : "pc-basket-pct"
        : "pc-basket-pct";
    panel.createEl("div", { cls: pctCls, text: `${fmt(pct, 1)}%` });

    if (hasTargets && bk.target > 0) {
      const barWrap = panel.createDiv({ cls: "pc-basket-bar-wrap" });
      const barFill = barWrap.createDiv({ cls: "pc-basket-bar-fill" });
      barFill.style.width = `${Math.min((pct / bk.target) * 100, 100)}%`;
      barFill.style.background = meta.color;
      barWrap.createDiv({ cls: "pc-basket-bar-marker" }).style.left = "100%";
    }

    const foot = panel.createDiv({ cls: "pc-basket-foot" });
    foot.createEl("span", { cls: "pc-basket-value", text: `${fmt(bk.value)} ${sym}` });
    if (hasTargets && bk.target > 0) {
      foot.createEl("span", { cls: "pc-basket-target", text: `/ ${bk.target}%` });
    }

    panel.createEl("div", {
      cls: "pc-basket-count",
      text: `${bk.assets.length} instrument${bk.assets.length !== 1 ? "s" : ""}`,
    });
  }
}
