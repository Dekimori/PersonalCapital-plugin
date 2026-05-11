// ───────────────────────────────────────────────────────────────────
// CUSTOM ITEM VIEWS (tab views without backing files)
// ───────────────────────────────────────────────────────────────────

import { ItemView } from "obsidian";
import type { WorkspaceLeaf } from "obsidian";
import { renderUnifiedLedger } from "../components/ledger-view";

export const PC_LEDGER_VIEW = "pc-ledger-view";

interface PluginLike {
  settings: unknown;
}

export class PCLedgerView extends ItemView {
  plugin: PluginLike;

  constructor(leaf: WorkspaceLeaf, plugin: PluginLike) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return PC_LEDGER_VIEW;
  }
  getDisplayText() {
    return "Ledger";
  }
  getIcon() {
    return "book-open";
  }
  async onOpen() {
    await renderUnifiedLedger(this.app, this.plugin.settings, this.contentEl, this.plugin);
  }
  async onClose() {
    this.contentEl.empty();
  }
}
