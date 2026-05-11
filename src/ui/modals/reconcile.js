// ───────────────────────────────────────────────────────────────────
// RECONCILE ACCOUNTS MODAL — close-the-books style.
// ───────────────────────────────────────────────────────────────────
// Shows every account on one screen: ledger-expected balance vs. the
// actual balance the user types in. Leave a row blank to skip.
// On Reconcile: writes a single `reconciliation` ledger entry per
// non-zero diff (category = "Reconciliation", note auto-filled) and
// stamps `last_reconciled` on every account the user filled in.

const { Modal } = require("obsidian");
const { toNum, fmt, showNotice, killWheelChange } = require("../../core/utils");
const { readAllLedger, writeLedgerEntry } = require("../../domain/ledger/io");
const { readAccounts, updateLastReconciled } = require("../../domain/accounts/io");
const { getAccountBalance } = require("../../domain/accounts/balance");

class ReconcileAllModal extends Modal {
  constructor(app, plugin, onDone) {
    super(app);
    this.plugin = plugin;
    this.onDone = onDone;
    this.rows = []; // { account, expected, actualInput, diffEl }
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("Reconcile accounts");
    this.modalEl.addClass("pc-reconcile-modal");

    const intro = contentEl.createEl("p", { cls: "setting-item-description" });
    intro.textContent =
      "Type the balance you actually see on each account right now. " +
      "Any mismatch between the ledger and reality is written as a single " +
      "reconciliation adjustment. Leave a row blank to skip.";

    // Date row
    const dateRow = contentEl.createDiv({ cls: "pc-reconcile-date-row" });
    dateRow.createEl("label", { text: "Reconciliation date" });
    const dateIn = dateRow.createEl("input", { type: "date", cls: "personal-capital-input" });
    dateIn.value = new Date().toISOString().slice(0, 10);
    this.dateIn = dateIn;

    // Table
    const table = contentEl.createEl("table", { cls: "pc-reconcile-table" });
    const thead = table.createEl("thead");
    const htr = thead.createEl("tr");
    ["Account", "Expected", "Actual", "Diff"].forEach((h) => htr.createEl("th", { text: h }));
    const tbody = table.createEl("tbody");

    // Load data
    let accounts = [],
      ledger = [];
    try {
      [accounts, ledger] = await Promise.all([
        readAccounts(this.app, this.plugin.settings),
        readAllLedger(this.app, this.plugin.settings),
      ]);
    } catch (e) {
      console.error("[PC] reconcile: load failed:", e);
      contentEl.createEl("p", { text: "Failed to load accounts/ledger: " + (e.message || e) });
      return;
    }

    if (accounts.length === 0) {
      tbody.createEl("tr").createEl("td", { attr: { colspan: 4 }, text: "No accounts." });
    }

    // Priority: never-reconciled first, then stale, then by name.
    const staleDays = Math.max(1, toNum(this.plugin.settings.reconcileStaleDays) || 30);
    const now = Date.now();
    accounts.sort((a, b) => {
      const pa = a.lastReconciled
        ? Math.max(0, Math.floor((now - Date.parse(a.lastReconciled)) / 86400000))
        : Infinity;
      const pb = b.lastReconciled
        ? Math.max(0, Math.floor((now - Date.parse(b.lastReconciled)) / 86400000))
        : Infinity;
      if (pa !== pb) return pb - pa;
      return a.name.localeCompare(b.name);
    });

    const summaryEl = contentEl.createDiv({ cls: "pc-reconcile-summary" });

    const updateSummary = () => {
      let filled = 0,
        diffTotal = 0,
        diffCount = 0;
      for (const r of this.rows) {
        if (!r.actualInput.value.trim()) continue;
        filled += 1;
        const actual = toNum(r.actualInput.value);
        const diff = actual - r.expected;
        if (Math.abs(diff) >= 0.005) {
          diffCount += 1;
          diffTotal += diff;
        }
      }
      summaryEl.empty();
      if (filled === 0) {
        summaryEl.createEl("span", { cls: "pc-text-muted", text: "Fill in any row to reconcile." });
      } else if (diffCount === 0) {
        summaryEl.createEl("span", {
          cls: "pc-reconcile-diff--zero",
          text: `\u2713 ${filled} account(s) match the ledger.`,
        });
      } else {
        const sign = diffTotal >= 0 ? "+" : "−";
        const cls = diffTotal >= 0 ? "pc-reconcile-diff--pos" : "pc-reconcile-diff--neg";
        const lead = summaryEl.createEl("span", { cls });
        lead.textContent = `${diffCount} mismatch(es) · net ${sign}${fmt(Math.abs(diffTotal))}`;
        summaryEl.createEl("span", {
          cls: "pc-text-muted",
          text: ` across ${filled} account(s) checked`,
        });
      }
    };

    for (const a of accounts) {
      const expected = getAccountBalance(a, ledger);
      const tr = tbody.createEl("tr");

      // Account name + stale badge.
      const nameTd = tr.createEl("td");
      nameTd.createEl("span", { text: a.name });
      if (!a.lastReconciled) {
        nameTd.createEl("span", { cls: "pc-reconcile-stale-badge", text: " never" });
      } else {
        const days = Math.floor((now - Date.parse(a.lastReconciled)) / 86400000);
        if (Number.isFinite(days) && days >= staleDays) {
          nameTd.createEl("span", { cls: "pc-reconcile-stale-badge", text: ` ${days}d` });
        }
      }

      // Expected.
      const expTd = tr.createEl("td", { cls: "pc-reconcile-num" });
      expTd.textContent = `${fmt(expected)} ${a.currency}`;

      // Actual input.
      const actTd = tr.createEl("td");
      const actIn = actTd.createEl("input", { type: "number", cls: "personal-capital-input" });
      actIn.step = "0.01";
      actIn.placeholder = String(Math.round(expected));
      killWheelChange(actIn);

      // Diff cell.
      const diffTd = tr.createEl("td", { cls: "pc-reconcile-num pc-reconcile-diff-cell" });
      diffTd.textContent = "—";

      const updateDiff = () => {
        const raw = actIn.value.trim();
        if (!raw) {
          diffTd.textContent = "—";
          diffTd.classList.remove(
            "pc-reconcile-diff--zero",
            "pc-reconcile-diff--pos",
            "pc-reconcile-diff--neg"
          );
          updateSummary();
          return;
        }
        const actual = toNum(raw);
        const diff = actual - expected;
        diffTd.classList.remove(
          "pc-reconcile-diff--zero",
          "pc-reconcile-diff--pos",
          "pc-reconcile-diff--neg"
        );
        if (Math.abs(diff) < 0.005) {
          diffTd.textContent = `\u2713 match`;
          diffTd.classList.add("pc-reconcile-diff--zero");
        } else {
          diffTd.textContent = `${diff >= 0 ? "+" : "−"} ${fmt(Math.abs(diff))}`;
          diffTd.classList.add(diff > 0 ? "pc-reconcile-diff--pos" : "pc-reconcile-diff--neg");
        }
        updateSummary();
      };
      actIn.oninput = updateDiff;

      this.rows.push({ account: a, expected, actualInput: actIn });
    }

    updateSummary();

    // Buttons.
    const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
    const okBtn = btns.createEl("button", { text: "Reconcile", cls: "mod-cta" });
    const cancelBtn = btns.createEl("button", { text: "Cancel" });

    okBtn.onclick = async () => {
      const d = this.dateIn.value || new Date().toISOString().slice(0, 10);
      let wrote = 0,
        stamped = 0,
        errors = 0;

      okBtn.disabled = true;
      okBtn.textContent = "Reconciling\u2026";

      for (const r of this.rows) {
        const raw = r.actualInput.value.trim();
        if (!raw) continue;
        const actual = toNum(raw);
        const diff = actual - r.expected;

        try {
          if (Math.abs(diff) >= 0.005) {
            const entry = {
              d,
              type: "reconciliation",
              amt: Math.abs(diff),
              cat: "Reconciliation",
              note: `Auto-adjust ${r.account.name}: ${diff >= 0 ? "+" : "−"}${fmt(Math.abs(diff))}`,
            };
            if (diff > 0) entry.to = r.account.name;
            else entry.from = r.account.name;
            await writeLedgerEntry(this.app, this.plugin.settings, entry);
            wrote += 1;
          }
          await updateLastReconciled(this.app, r.account.file, d);
          stamped += 1;
        } catch (e) {
          console.error("[PC] reconcile row failed:", r.account.name, e);
          errors += 1;
        }
      }

      if (stamped === 0) {
        showNotice("Nothing to reconcile — fill in at least one row.", 3000);
        okBtn.disabled = false;
        okBtn.textContent = "Reconcile";
        return;
      }

      const msg =
        wrote === 0
          ? `\u2713 Stamped ${stamped} account(s) — all matched`
          : `\u2713 Stamped ${stamped}, wrote ${wrote} adjustment(s)`;
      showNotice(errors > 0 ? `${msg} · ${errors} failed` : msg, 4000);
      this.close();
      if (this.onDone) await this.onDone();
    };

    cancelBtn.onclick = () => this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}

module.exports = { ReconcileAllModal };
