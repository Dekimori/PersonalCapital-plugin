const { fmt } = require("../../core/utils");
const { BASKET_META, buildBasketData } = require("../../domain/budget/baskets");

// ── Render Baskets — compact 3-column ──
function renderBaskets(container, assets, settings, sym, app, plugin, accounts, allLedger) {
  // Lazy require to avoid circular dependency
  const { StrategyModal } = require("../modals/strategy");

  const { baskets, total } = buildBasketData(assets, settings, accounts, allLedger);
  const hasTargets =
    (settings.targetCore || 0) + (settings.targetFlash || 0) + (settings.targetReserve || 0) > 0;

  const wrap = container.createDiv({ cls: "pc-baskets" });

  // Header row with strategy button
  const hdr = wrap.createDiv({ cls: "pc-baskets-header" });
  hdr.createEl("div", { cls: "pc-baskets-title", text: "Allocation" });
  const stratBtn = hdr.createEl("button", { cls: "pc-strategy-btn", text: "\u2699 Strategy" });
  stratBtn.onclick = () => new StrategyModal(app, plugin, () => {}).open();

  // 3-column grid
  const grid = wrap.createDiv({ cls: "pc-baskets-grid" });

  for (const [key, meta] of Object.entries(BASKET_META)) {
    const bk = baskets[key];
    const onTarget = hasTargets && bk.target > 0 && Math.abs(bk.pct - bk.target) < 5;
    const over = hasTargets && bk.target > 0 && bk.pct > bk.target;

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
    panel.createEl("div", { cls: pctCls, text: `${fmt(bk.pct, 1)}%` });

    if (hasTargets && bk.target > 0) {
      const barWrap = panel.createDiv({ cls: "pc-basket-bar-wrap" });
      const barFill = barWrap.createDiv({ cls: "pc-basket-bar-fill" });
      barFill.style.width = `${Math.min((bk.pct / bk.target) * 100, 100)}%`;
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

module.exports = { renderBaskets };
