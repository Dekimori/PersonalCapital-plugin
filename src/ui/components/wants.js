const { fmt, getCurrentMonthKey, makeInteractive, killWheelChange } = require("../../core/utils");
const { readWantsQueue, writeWantsQueue, cleanupDoneItems } = require("../../wants-queue");

function renderWantsQueue(container, app, settings, refreshDashboard) {
  let items = []; // loaded async below
  let saving = false;

  const wrap = container.createDiv({ cls: "pc-wq-wrap" });

  const save = async () => {
    if (saving) return;
    saving = true;
    await writeWantsQueue(app, settings, items);
    saving = false;
  };

  const rebuildList = () => {
    listEl.empty();
    const sym = settings.homeCurrencySymbol;
    const currentMk = getCurrentMonthKey();

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const isDone = !!it.done;
      const row = listEl.createDiv({ cls: `pc-wq-item ${isDone ? "pc-wq-item--done" : ""}` });

      // Checkbox
      const check = row.createEl("span", {
        cls: "pc-wq-check",
        text: isDone ? "\u2611" : "\u2610",
      });
      makeInteractive(check, "checkbox");
      check.onclick = async (e) => {
        e.stopPropagation();
        if (isDone) {
          it.done = null;
        } else {
          it.done = currentMk;
        }
        await save();
        rebuildList();
        updateFooter();
      };

      // Name
      row.createEl("span", { cls: "pc-wq-name", text: it.name });

      // Cost
      row.createEl("span", { cls: "pc-wq-cost", text: `${fmt(it.cost)} ${sym}` });

      // Remove button
      const rm = row.createEl("span", { cls: "pc-wq-rm", text: "\u00D7" });
      makeInteractive(rm);
      rm.onclick = async (e) => {
        e.stopPropagation();
        items.splice(i, 1);
        await save();
        rebuildList();
        updateFooter();
      };
    }

    if (items.length === 0) {
      listEl.createEl("span", { cls: "pc-wq-empty", text: "No planned purchases" });
    }
  };

  const updateFooter = () => {
    const pending = items.filter((it) => !it.done);
    const total = pending.reduce((s, it) => s + it.cost, 0);
    const sym = settings.homeCurrencySymbol;
    footerEl.textContent =
      pending.length > 0
        ? `${pending.length} item${pending.length > 1 ? "s" : ""} \u00B7 ${fmt(total)} ${sym}`
        : "";
  };

  // Header row
  const hdr = wrap.createDiv({ cls: "pc-wq-header" });
  hdr.createEl("span", { cls: "pc-wq-title", text: "Wants Queue" });
  const addBtn = hdr.createEl("span", { cls: "pc-wq-add", text: "+" });
  makeInteractive(addBtn);

  // List
  const listEl = wrap.createDiv({ cls: "pc-wq-list" });

  // Footer
  const footerEl = wrap.createDiv({ cls: "pc-wq-footer" });

  // Add item inline
  let addRowEl = null;
  addBtn.onclick = () => {
    if (addRowEl) {
      addRowEl.remove();
      addRowEl = null;
      return;
    }
    addRowEl = wrap.createDiv({ cls: "pc-wq-add-row" });
    const nameIn = addRowEl.createEl("input", {
      type: "text",
      placeholder: "What do you want?",
      cls: "pc-wq-input",
    });
    const costIn = addRowEl.createEl("input", {
      type: "number",
      placeholder: "Cost",
      cls: "pc-wq-input pc-wq-input--cost",
    });
    killWheelChange(costIn);
    const okBtn = addRowEl.createEl("button", { text: "Add", cls: "pc-wq-ok" });

    const doAdd = async () => {
      const name = nameIn.value.trim();
      const cost = parseFloat(costIn.value) || 0;
      if (!name || cost <= 0) return;
      items.push({ name, cost, done: null });
      await save();
      addRowEl.remove();
      addRowEl = null;
      rebuildList();
      updateFooter();
    };

    okBtn.onclick = doAdd;
    costIn.onkeydown = (e) => {
      if (e.key === "Enter") doAdd();
    };
    nameIn.onkeydown = (e) => {
      if (e.key === "Enter") costIn.focus();
    };

    // Insert before footer
    wrap.insertBefore(addRowEl, footerEl);
    nameIn.focus();
  };

  // Load data async
  readWantsQueue(app, settings).then((loaded) => {
    items = cleanupDoneItems(loaded);
    // If cleanup removed items, persist
    if (items.length !== loaded.length) save();
    rebuildList();
    updateFooter();
  });
}

module.exports = { renderWantsQueue };
