const { Modal } = require("obsidian");
const { toNum, showNotice, killWheelChange } = require("../../core/utils");

const INVALID_PATH = /[\\/:*?"<>|]|\.\./;

class CreateAccountModal extends Modal {
  constructor(app, plugin, onDone) {
    super(app);
    this.plugin = plugin;
    this.onDone = onDone;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("New account");

    const form = contentEl.createDiv({ cls: "personal-capital-form" });

    const nameWrap = form.createDiv();
    nameWrap.createEl("label", { text: "Name" });
    const nameIn = nameWrap.createEl("input", { type: "text", cls: "personal-capital-input" });
    nameIn.placeholder = "e.g. T-Bank Debit";

    const typeWrap = form.createDiv();
    typeWrap.createEl("label", { text: "Type" });
    const typeSel = typeWrap.createEl("select", { cls: "personal-capital-input" });
    for (const t of ["bank", "broker", "cash", "savings", "credit", "other"]) {
      typeSel.createEl("option", { text: t, value: t });
    }
    typeSel.value = "bank";

    const curWrap = form.createDiv();
    curWrap.createEl("label", { text: "Currency" });
    const curIn = curWrap.createEl("input", { type: "text", cls: "personal-capital-input" });
    curIn.value = this.plugin.settings.homeCurrency || "RUB";
    curIn.maxLength = 8;

    const balWrap = form.createDiv();
    balWrap.createEl("label", { text: "Initial balance" });
    const balIn = balWrap.createEl("input", { type: "number", cls: "personal-capital-input" });
    balIn.placeholder = "0";
    balIn.step = "0.01";
    killWheelChange(balIn);

    const liquidWrap = form.createDiv();
    const liquidLbl = liquidWrap.createEl("label", {
      text: "Liquid (counts toward available cash) ",
    });
    const liquidIn = liquidLbl.createEl("input", { type: "checkbox" });
    liquidIn.checked = true;

    const lockedWrap = form.createDiv();
    const lockedLbl = lockedWrap.createEl("label", { text: "Locked (e.g. deposit/escrow) " });
    const lockedIn = lockedLbl.createEl("input", { type: "checkbox" });

    const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
    const saveBtn = btns.createEl("button", { text: "Create", cls: "mod-cta" });
    const cancelBtn = btns.createEl("button", { text: "Cancel" });

    saveBtn.onclick = async () => {
      const name = nameIn.value.trim();
      if (!name) {
        showNotice("Name is required");
        return;
      }
      if (INVALID_PATH.test(name)) {
        showNotice("Invalid account name — avoid special characters");
        return;
      }

      const folder = this.plugin.settings.accountsFolder || "finance/Data/accounts";
      const path = `${folder}/${name}.md`;

      if (this.app.vault.getAbstractFileByPath(path)) {
        showNotice(`Account "${name}" already exists`);
        return;
      }
      if (!this.app.vault.getAbstractFileByPath(folder)) {
        await this.app.vault.createFolder(folder).catch(() => {});
      }

      const currency = (
        curIn.value.trim() ||
        this.plugin.settings.homeCurrency ||
        "RUB"
      ).toUpperCase();
      const balance = toNum(balIn.value) || 0;
      const liquid = !!liquidIn.checked;
      const locked = !!lockedIn.checked;

      const content = [
        "---",
        `name: "${name}"`,
        `type: ${typeSel.value}`,
        `currency: ${currency}`,
        `liquid: ${liquid}`,
        `locked: ${locked}`,
        `initial_balance: ${balance}`,
        `last_reconciled: "${new Date().toISOString().slice(0, 10)}"`,
        "---",
        "",
      ].join("\n");

      await this.app.vault.create(path, content);
      showNotice(`✓ Created account "${name}"`);
      this.close();
      if (this.onDone) await this.onDone();
    };

    cancelBtn.onclick = () => this.close();
    nameIn.focus();
  }

  onClose() {
    this.contentEl.empty();
  }
}

module.exports = { CreateAccountModal };
