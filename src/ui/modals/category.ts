// @ts-nocheck — transitional; types incremental per file
import { Modal } from "obsidian";
import { showNotice } from "../../core/utils";

class AddCategoryModal extends Modal {
  constructor(app, settings, onDone) {
    super(app);
    this.settings = settings;
    this.onDone = onDone;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText("New category");

    const form = contentEl.createDiv({ cls: "personal-capital-form" });

    const nameWrap = form.createDiv();
    nameWrap.createEl("label", { text: "Name" });
    const nameIn = nameWrap.createEl("input", { type: "text", cls: "personal-capital-input" });
    nameIn.placeholder = "e.g. Groceries";

    const typeWrap = form.createDiv();
    typeWrap.createEl("label", { text: "Type" });
    const typeSel = typeWrap.createEl("select", { cls: "personal-capital-input" });
    for (const t of ["Income", "Needs", "Wants"]) {
      typeSel.createEl("option", { text: t, value: t });
    }
    typeSel.value = "Wants";

    const emojiWrap = form.createDiv();
    emojiWrap.createEl("label", { text: "Emoji" });
    const emojiIn = emojiWrap.createEl("input", { type: "text", cls: "personal-capital-input" });
    emojiIn.placeholder = "🛒";
    emojiIn.maxLength = 4;

    const recWrap = form.createDiv();
    const recLbl = recWrap.createEl("label", { text: "Recurring (feeds Projected section) " });
    const recIn = recLbl.createEl("input", { type: "checkbox" });

    const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
    const saveBtn = btns.createEl("button", { text: "Create", cls: "mod-cta" });
    const cancelBtn = btns.createEl("button", { text: "Cancel" });

    saveBtn.onclick = async () => {
      const name = nameIn.value.trim();
      if (!name) {
        showNotice("Name is required");
        return;
      }
      if (/[\\/:*?"<>|]/.test(name)) {
        showNotice("Invalid characters in name");
        return;
      }

      const folder = this.settings.categoriesFolder || "finance/Data/categories";
      const path = `${folder}/${name}.md`;

      if (this.app.vault.getAbstractFileByPath(path)) {
        showNotice(`Category "${name}" already exists`);
        return;
      }
      if (!this.app.vault.getAbstractFileByPath(folder)) {
        await this.app.vault.createFolder(folder).catch(() => {});
      }

      const type = typeSel.value;
      const emoji = emojiIn.value.trim();
      const recurring = !!recIn.checked;
      const fm = [
        "---",
        `category: ${name}`,
        `type: ${type}`,
        `emoji: ${emoji}`,
        `recurring: ${recurring}`,
        "---",
        "",
      ].join("\n");

      await this.app.vault.create(path, fm);
      showNotice(`✓ Created category "${name}"`);
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

export { AddCategoryModal };
