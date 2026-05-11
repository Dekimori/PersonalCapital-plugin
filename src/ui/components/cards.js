const { fmt } = require("../../core/utils");
const { fitCardText } = require("./fit-text");

function renderBudgetCards(container, budget, sym) {
  const needsPct = budget.totalIncome > 0 ? (Math.abs(budget.needs) / budget.totalIncome) * 100 : 0;
  const savesPct = budget.savesRate ?? 0; // savings rate = saves / totalIncome
  const liquidOk = budget.left >= 0;

  const SEGS = 22;
  const wantsAbs = Math.abs(budget.wants);
  const wantsOver = wantsAbs > budget.comfortBudget;
  const wantsFilled =
    budget.comfortBudget > 0
      ? Math.min(SEGS, Math.round((wantsAbs / budget.comfortBudget) * SEGS))
      : 0;

  const cards = [
    {
      id: "needs",
      label: "Needs",
      icon: "🏠",
      main: `${fmt(needsPct, 0)}%`,
      sub: "of income",
      status: liquidOk ? "ok" : "over",
    },
    {
      id: "saves",
      label: "Saves",
      icon: "📈",
      main: `${fmt(savesPct, 0)}%`,
      sub: `${fmt(Math.abs(budget.saves))} ${sym} invested`,
      status: budget.savesOnTrack ? "ok" : budget.saves > 0 ? "partial" : "empty",
    },
    {
      id: "wants",
      label: "Wants",
      icon: "✨",
      status: wantsOver ? "over" : "ok",
      segbar: true,
    },
    {
      id: "left",
      label: "Left",
      icon: "💰",
      main: `${fmt(budget.left)} ${sym}`,
      fitText: true,
      noBadge: true,
      leftCard: true,
      status: budget.left >= 0 ? "ok" : "over",
    },
  ];

  const badgeText = {
    ok: "On track",
    over: "Over budget",
    partial: "Behind",
    neutral: "—",
    empty: "No data",
  };

  for (const card of cards) {
    const el = container.createDiv({ cls: `pc-card pc-card--${card.id}` });

    // Top row
    const top = el.createDiv({ cls: "pc-card-top" });
    const labelRow = top.createDiv({ cls: "pc-card-label-row" });
    labelRow.createEl("span", { cls: "pc-card-icon", text: card.icon });
    labelRow.createEl("span", { cls: "pc-card-label", text: card.label });
    if (!card.noBadge) {
      top.createEl("span", {
        cls: `pc-card-badge pc-badge--${card.status}`,
        text: badgeText[card.status] ?? "",
      });
    }

    if (card.segbar) {
      // Wants: segmented bar + x/y numbers
      const body = el.createDiv({ cls: "pc-card-body pc-card-body--bar" });
      const bar = body.createDiv({ cls: "pc-segbar" });
      for (let i = 0; i < SEGS; i++) {
        const lit = i < wantsFilled;
        bar.createDiv({
          cls: `pc-seg ${lit ? (wantsOver ? "pc-seg--over" : "pc-seg--on") : "pc-seg--off"}`,
        });
      }
      const nums = body.createDiv({ cls: "pc-segbar-nums" });
      nums.createEl("span", {
        cls: wantsOver ? "pc-segbar-over" : "pc-segbar-val",
        text: fmt(wantsAbs),
      });
      nums.createEl("span", { text: ` / ${fmt(budget.comfortBudget)} ${sym}` });
    } else if (card.leftCard) {
      // Left: "Available liquidity" title + number
      const body = el.createDiv({ cls: "pc-card-body pc-card-body--left" });
      body.createEl("span", { cls: "pc-card-liquidity-label", text: "Available liquidity" });
      const mainEl = body.createEl("div", { cls: "pc-card-main", text: card.main });
      if (card.fitText) fitCardText(mainEl);
    } else {
      // Standard: big centred hero + optional sub line
      const body = el.createDiv({ cls: "pc-card-body" });
      const mainEl = body.createEl("div", { cls: "pc-card-main", text: card.main });
      if (card.fitText) fitCardText(mainEl);
      if (card.sub) body.createEl("div", { cls: "pc-card-sub", text: card.sub });
    }
  }
}

module.exports = { renderBudgetCards };
