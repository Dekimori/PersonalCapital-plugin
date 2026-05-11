const { SuggestModal } = require("obsidian");
const { fmt } = require("../../core/utils");

class PickAssetModal extends SuggestModal {
  constructor(app, plugin, onPick) {
    super(app);
    this.plugin = plugin;
    this.onPick = onPick;
  }

  getSuggestions(query) {
    const folder = this.plugin.settings.assetsFolder.toLowerCase().replace(/\/$/, "");
    const q = query.toLowerCase();
    return this.app.vault
      .getMarkdownFiles()
      .filter(
        (f) => f.path.toLowerCase().startsWith(folder + "/") && f.basename.toLowerCase().includes(q)
      );
  }

  renderSuggestion(item, el) {
    const cache = this.app.metadataCache.getFileCache(item);
    const fm = cache?.frontmatter ?? {};
    el.createEl("div", { text: item.basename });
    el.createEl("small", {
      text: `${fm.type ?? "?"} · ${fm.currency ?? "?"} · ${fmt(fm.current_value ?? 0, 2)} · ${fmt(fm.pl_pct ?? 0, 1)}%`,
    });
  }

  onChooseSuggestion(item) {
    this.onPick(item);
  }
}

module.exports = { PickAssetModal };
