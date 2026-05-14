// @ts-nocheck — transitional; types incremental per file
import { Modal } from "obsidian";
import { MONTH_NAMES, MONTH_KEYS } from "../../core/constants";
import { toNum, showNotice, fmt, killWheelChange } from "../../core/utils";
import { readLedger, writeLedgerEntry, deleteLedgerEntry } from "../../domain/ledger/io";

class CashflowCellModal extends Modal {
  constructor(app, settings, opts) {
    super(app);
    this.settings = settings;
    this.year = opts.year;
    this.monthIdx = opts.monthIdx;
    this.category = opts.category;
    this.isIncome = !!opts.isIncome;
    this.accounts = opts.accounts || [];
    this.onSaved = opts.onSaved;
    // Working row state: { entry: original|null, draft: {d,amt,acct,note}, deleted: bool }
    this.rows = [];
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const monthName = MONTH_NAMES[this.monthIdx];
    this.titleEl.setText(`${monthName} ${this.year} · ${this.category}`);

    // Load existing ledger entries for this (year, month, category)
    const all = await readLedger(this.app, this.settings, this.year);
    const mm = String(this.monthIdx + 1).padStart(2, "0");
    const prefix = `${this.year}-${mm}`;
    const matching = all.filter(
      (e) =>
        e &&
        e.d &&
        e.d.startsWith(prefix) &&
        e.cat === this.category &&
        (e.type === "expense" || e.type === "income")
    );

    for (const e of matching) {
      this.rows.push({
        entry: e,
        draft: {
          d: e.d,
          amt: Math.abs(toNum(e.amt)),
          acct: (this.isIncome ? e.to : e.from) || "",
          note: e.note || "",
        },
        deleted: false,
      });
    }

    const tableWrap = contentEl.createDiv({ cls: "pc-cell-modal" });
    const table = tableWrap.createEl("table", { cls: "pc-cell-modal-table" });
    const thead = table.createEl("thead");
    const hr = thead.createEl("tr");
    ["Date", "Amount", this.isIncome ? "To account" : "From account", "Note", ""].forEach((h) =>
      hr.createEl("th", { text: h })
    );
    const tbody = table.createEl("tbody");

    const renderRows = () => {
      tbody.empty();
      const visible = this.rows.filter((r) => !r.deleted);
      if (visible.length === 0) {
        const emptyTr = tbody.createEl("tr");
        emptyTr.createEl("td", {
          text: "No entries yet.",
          attr: { colspan: "5" },
          cls: "pc-cell-modal-empty",
        });
      }
      this.rows.forEach((r, idx) => {
        if (r.deleted) return;
        const tr = tbody.createEl("tr", { cls: "pc-cell-modal-row" });

        const dateTd = tr.createEl("td");
        const dateIn = dateTd.createEl("input", { type: "date", cls: "personal-capital-input" });
        dateIn.value = r.draft.d;
        dateIn.onchange = () => {
          r.draft.d = dateIn.value;
        };

        const syncErr = () => tr.classList.toggle("pc-row-error", r.draft.amt > 0 && !r.draft.acct);

        const amtTd = tr.createEl("td");
        const amtIn = amtTd.createEl("input", { type: "number", cls: "personal-capital-input" });
        amtIn.step = "any";
        amtIn.value = r.draft.amt ? String(r.draft.amt) : "";
        killWheelChange(amtIn);
        amtIn.oninput = () => {
          r.draft.amt = parseFloat(amtIn.value) || 0;
          syncErr();
          updateSaveState();
        };

        const acctTd = tr.createEl("td");
        const acctSel = acctTd.createEl("select", { cls: "personal-capital-input" });
        acctSel.createEl("option", { text: "— select —", value: "" });
        for (const a of this.accounts) acctSel.createEl("option", { text: a.name, value: a.name });
        acctSel.value = r.draft.acct;
        acctSel.onchange = () => {
          r.draft.acct = acctSel.value;
          syncErr();
          updateSaveState();
        };
        syncErr();

        const noteTd = tr.createEl("td");
        const noteIn = noteTd.createEl("input", { type: "text", cls: "personal-capital-input" });
        noteIn.value = r.draft.note || "";
        noteIn.oninput = () => {
          r.draft.note = noteIn.value;
        };

        const delTd = tr.createEl("td");
        const delBtn = delTd.createEl("button", { text: "✕", cls: "pc-cell-modal-del" });
        delBtn.onclick = () => {
          r.deleted = true;
          renderRows();
          updateSaveState();
        };
      });

      // Add row
      const addTr = tbody.createEl("tr", { cls: "pc-cell-modal-addrow" });
      const addTd = addTr.createEl("td", { text: "+ Add entry", attr: { colspan: "5" } });
      addTd.onclick = () => {
        const defaultDate = `${this.year}-${mm}-15`;
        this.rows.push({
          entry: null,
          draft: { d: defaultDate, amt: 0, acct: "", note: "" },
          deleted: false,
        });
        renderRows();
        updateSaveState();
      };
    };

    const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
    const saveBtn = btns.createEl("button", { text: "Save", cls: "mod-cta" });
    const cancelBtn = btns.createEl("button", { text: "Cancel" });

    const updateSaveState = () => {
      const hasInvalid = this.rows.some((r) => !r.deleted && r.draft.amt > 0 && !r.draft.acct);
      saveBtn.disabled = hasInvalid;
      saveBtn.classList.toggle("is-disabled", hasInvalid);
    };

    saveBtn.onclick = async () => {
      saveBtn.disabled = true;

      // 1) Process deletions and updates
      for (const r of this.rows) {
        if (r.entry && r.deleted) {
          await deleteLedgerEntry(this.app, this.settings, r.entry);
          continue;
        }
        if (r.entry && !r.deleted) {
          const orig = r.entry;
          const origAcct = (this.isIncome ? orig.to : orig.from) || "";
          const changed =
            orig.d !== r.draft.d ||
            Math.abs(toNum(orig.amt)) !== r.draft.amt ||
            (orig.note || "") !== (r.draft.note || "") ||
            origAcct !== r.draft.acct;
          if (!changed) continue;
          await deleteLedgerEntry(this.app, this.settings, orig);
          const entry = {
            d: r.draft.d,
            type: this.isIncome ? "income" : "expense",
            cat: this.category,
            amt: r.draft.amt,
          };
          if (this.isIncome) entry.to = r.draft.acct;
          else entry.from = r.draft.acct;
          if (r.draft.note) entry.note = r.draft.note;
          await writeLedgerEntry(this.app, this.settings, entry);
          continue;
        }
        if (!r.entry && !r.deleted && r.draft.amt > 0 && r.draft.acct) {
          const entry = {
            d: r.draft.d,
            type: this.isIncome ? "income" : "expense",
            cat: this.category,
            amt: r.draft.amt,
          };
          if (this.isIncome) entry.to = r.draft.acct;
          else entry.from = r.draft.acct;
          if (r.draft.note) entry.note = r.draft.note;
          await writeLedgerEntry(this.app, this.settings, entry);
        }
      }

      this.close();
      if (this.onSaved) await this.onSaved();
    };

    cancelBtn.onclick = () => this.close();

    renderRows();
    updateSaveState();
  }

  onClose() {
    this.contentEl.empty();
  }
}

export { CashflowCellModal };
