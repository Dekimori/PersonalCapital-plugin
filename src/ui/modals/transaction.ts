// @ts-nocheck — transitional; types incremental per file
import { Modal } from "obsidian";
import { showNotice, fmt, killWheelChange } from "../../core/utils";
import { writeLedgerEntry } from "../../domain/ledger/io";

class AddTransactionModal extends Modal {
  constructor(app, plugin, accounts, onDone) {
    super(app);
    this.plugin = plugin;
    this.accounts = accounts || [];
    this.onDone = onDone;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Add Transaction" });

    const settings = this.plugin ? this.plugin.settings : {};
    const form = contentEl.createDiv({ cls: "personal-capital-form" });
    const row = (label, input) => {
      const d = form.createDiv();
      d.createEl("label", { text: label });
      d.appendChild(input);
      return input;
    };

    // Type
    const typeIn = row("Type", contentEl.createEl("select"));
    [
      ["expense", "Expense — money out"],
      ["income", "Income — money in"],
      ["transfer", "Transfer — between accounts"],
    ].forEach(([val, label]) => {
      const o = typeIn.createEl("option", { text: label });
      o.value = val;
    });
    typeIn.addClass("personal-capital-input");

    // Date
    const dateIn = row("Date", contentEl.createEl("input", { type: "date" }));
    dateIn.value = new Date().toISOString().slice(0, 10);
    dateIn.addClass("personal-capital-input");

    // Amount
    const amtIn = row("Amount", contentEl.createEl("input", { type: "number", step: "any" }));
    amtIn.placeholder = "e.g. 5000";
    amtIn.addClass("personal-capital-input");
    killWheelChange(amtIn);

    // Category (for expense/income)
    const catWrap = form.createDiv();
    catWrap.createEl("label", { text: "Category" });
    const catIn = catWrap.createEl("input", { type: "text", placeholder: "e.g. Groceries, Wages" });
    catIn.addClass("personal-capital-input");

    // From account
    const fromWrap = form.createDiv();
    fromWrap.createEl("label", { text: "From account" });
    const fromIn = fromWrap.createEl("select");
    fromIn.createEl("option", { text: "— none —", value: "" });
    for (const a of this.accounts) fromIn.createEl("option", { text: a.name, value: a.name });
    fromIn.addClass("personal-capital-input");

    // To account
    const toWrap = form.createDiv();
    toWrap.createEl("label", { text: "To account" });
    const toIn = toWrap.createEl("select");
    toIn.createEl("option", { text: "— none —", value: "" });
    for (const a of this.accounts) toIn.createEl("option", { text: a.name, value: a.name });
    toIn.addClass("personal-capital-input");

    // Note
    const noteIn = row("Note (optional)", contentEl.createEl("input", { type: "text" }));
    noteIn.placeholder = "e.g. grocery store";
    noteIn.addClass("personal-capital-input");

    // Show/hide fields based on type
    const updateFields = () => {
      const t = typeIn.value;
      catWrap.style.display = t === "transfer" ? "none" : "";
      fromWrap.style.display = t === "income" ? "none" : "";
      toWrap.style.display = t === "expense" ? "none" : "";
    };
    typeIn.addEventListener("change", updateFields);
    updateFields();

    // Buttons
    const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
    const addBtn = btns.createEl("button", { text: "Add", cls: "mod-cta" });
    btns.createEl("button", { text: "Cancel" }).onclick = () => this.close();

    addBtn.onclick = async () => {
      const amt = parseFloat(amtIn.value) || 0;
      if (amt <= 0) {
        showNotice("Amount is required");
        return;
      }

      const entry = {
        d: dateIn.value || new Date().toISOString().slice(0, 10),
        type: typeIn.value,
        amt,
      };
      if (typeIn.value !== "transfer" && catIn.value.trim()) entry.cat = catIn.value.trim();
      if (fromIn.value) entry.from = fromIn.value;
      if (toIn.value) entry.to = toIn.value;
      if (noteIn.value.trim()) entry.note = noteIn.value.trim();

      const s = this.plugin ? this.plugin.settings : settings;
      await writeLedgerEntry(this.app, s, entry);
      showNotice(`✓ Added ${entry.type}: ${fmt(amt)}`);
      this.close();
      if (this.onDone) this.onDone();
    };
  }
}

export { AddTransactionModal };
