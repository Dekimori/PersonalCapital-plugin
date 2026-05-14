import { fmt } from "../../core/utils";
import type { BudgetSummary, ProjectedRow } from "../../domain/budget/summary";

export function renderProjected(
  container: HTMLElement,
  proj: ProjectedRow[],
  sym: string,
  budget: BudgetSummary
): void {
  if (proj.length === 0) {
    container.createEl("p", {
      cls: "pc-empty",
      text: "No recurring categories set. Mark categories as recurring in cashflow.",
    });
    return;
  }

  // Ticket card wrapper
  const ticket = container.createDiv({ cls: "pc-proj-ticket" });

  // Header row
  const hdr = ticket.createDiv({ cls: "pc-proj-ticket-header" });
  hdr.createEl("span", { cls: "pc-proj-ticket-title", text: "Projected" });
  hdr.createEl("span", { cls: "pc-proj-ticket-period", text: "next month" });

  const list = ticket.createEl("ul", { cls: "pc-projected-list" });

  // Group by type
  const grouped: Record<string, ProjectedRow[]> = {};
  for (const p of proj) {
    (grouped[p.type] = grouped[p.type] || []).push(p);
  }

  const typeLabel: Record<string, string> = {
    Income: "Income",
    Needs: "Needs",
    Wants: "Wants",
    Saves: "Saves",
  };

  for (const type of ["Income", "Needs", "Wants"]) {
    const items = grouped[type];
    if (!items) continue;

    const groupEl = list.createEl("li", { cls: "pc-proj-group" });
    groupEl.createEl("span", {
      cls: `pc-proj-group-label pc-proj-group--${type.toLowerCase()}`,
      text: typeLabel[type],
    });

    for (const item of items) {
      const row = groupEl.createEl("div", { cls: "pc-proj-row" });
      row.createEl("span", { cls: "pc-proj-name", text: item.category });
      row.createEl("span", { cls: "pc-proj-value", text: `${fmt(item.projected)} ${sym}` });
    }
  }

  // Saves (computed from strategy)
  const savesEl = list.createEl("li", { cls: "pc-proj-group" });
  savesEl.createEl("span", { cls: "pc-proj-group-label pc-proj-group--saves", text: "Saves" });
  const savesRow = savesEl.createEl("div", { cls: "pc-proj-row" });
  savesRow.createEl("span", { cls: "pc-proj-name", text: "Investments (target)" });
  savesRow.createEl("span", { cls: "pc-proj-value", text: `${fmt(budget.savesTarget)} ${sym}` });

  // Divider + total inside ticket
  ticket.createDiv({ cls: "pc-proj-tear" });
  let projTotal = 0;
  for (const p of proj) projTotal += p.projected ?? 0;
  projTotal -= budget.savesTarget;
  const totalRow = ticket.createDiv({ cls: "pc-proj-total-row" });
  totalRow.createEl("span", { cls: "pc-proj-total-label", text: "Net projected" });
  totalRow.createEl("span", {
    cls: `pc-proj-total-value ${projTotal >= 0 ? "pc-pos" : "pc-neg"}`,
    text: `${fmt(projTotal)} ${sym}`,
  });
}
