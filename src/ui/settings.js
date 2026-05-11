// ───────────────────────────────────────────────────────────────────
// SETTINGS TAB
// ───────────────────────────────────────────────────────────────────

const { PluginSettingTab, Setting, Modal } = require("obsidian");
const { toNum, fmt, showNotice, killWheelChange } = require("../core/utils");
const { COUNTRY_CURRENCY, COUNTRY_LIST } = require("./modals/onboarding");
const { CreateAccountModal } = require("./modals/account-create");
const { ReconcileAllModal } = require("./modals/reconcile");
const { readAccounts } = require("../domain/accounts/io");
const { readAllLedger, writeLedgerEntries } = require("../domain/ledger/io");
const { getAccountBalance } = require("../domain/accounts/balance");
const { updateFxRates } = require("../domain/assets/fx");
const { exportToFile, importFromFile, readCategories, buildFullMap } = require("../io");

class PersonalCapitalSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Personal Capital Settings" });

    // ── Folders ──
    containerEl.createEl("h3", { text: "Folders", cls: "pc-settings-section" });
    const folders = [
      ["categoriesFolder", "Categories folder", "finance/Data/categories"],
      ["assetsFolder", "Assets folder", "finance/Data/assets"],
      ["archiveFolder", "Archive folder", "finance/Data/archive"],
      ["strategyPath", "Strategy file", "finance/strategy.md"],
      ["dashboardPath", "Dashboard note", "finance/Dashboard.md"],
    ];
    for (const [key, name, placeholder] of folders) {
      new Setting(containerEl).setName(name).addText((t) =>
        t
          .setPlaceholder(placeholder)
          .setValue(this.plugin.settings[key] ?? "")
          .onChange(async (v) => {
            this.plugin.settings[key] = v.trim() || placeholder;
            await this.plugin.saveSettings();
          })
      );
    }

    // ── Currency (country-based) ──
    containerEl.createEl("h3", { text: "Currency", cls: "pc-settings-section" });
    new Setting(containerEl)
      .setName("Country")
      .setDesc("Sets the default home currency")
      .addDropdown((d) => {
        d.addOption("", "Select…");
        for (const c of COUNTRY_LIST) {
          const cur = COUNTRY_CURRENCY[c];
          d.addOption(c, `${c} (${cur.symbol})`);
        }
        const curSym = this.plugin.settings.homeCurrencySymbol ?? "₽";
        const match = COUNTRY_LIST.find((c) => COUNTRY_CURRENCY[c].symbol === curSym);
        if (match) d.setValue(match);
        d.onChange(async (v) => {
          const cur = COUNTRY_CURRENCY[v];
          if (cur) {
            this.plugin.settings.homeCurrency = cur.code;
            this.plugin.settings.homeCurrencySymbol = cur.symbol;
            await this.plugin.saveSettings();
            this.display();
          }
        });
      });
    new Setting(containerEl)
      .setName("Home currency symbol")
      .setDesc("Override if needed")
      .addText((t) =>
        t.setValue(this.plugin.settings.homeCurrencySymbol ?? "₽").onChange(async (v) => {
          this.plugin.settings.homeCurrencySymbol = v;
          await this.plugin.saveSettings();
        })
      );

    // FX Rates — auto-fetched (read-only) + manual overrides
    containerEl.createEl("h4", { text: "FX rates \u2192 home currency" });

    new Setting(containerEl)
      .setName("Auto-fetch FX rates")
      .setDesc(
        "On \u21BB Update prices: CBR for RUB home, Yahoo otherwise. Manual overrides always win."
      )
      .addToggle((t) =>
        t.setValue(this.plugin.settings.fxAutoFetch !== false).onChange(async (v) => {
          this.plugin.settings.fxAutoFetch = v;
          await this.plugin.saveSettings();
        })
      );

    const fxStatus = containerEl.createDiv({ cls: "pc-settings-fx-status" });
    const renderFxStatus = () => {
      fxStatus.empty();
      const label = this.plugin.settings.fxSourceLabel || "\u2014";
      const updated = this.plugin.settings.fxRatesUpdated
        ? new Date(this.plugin.settings.fxRatesUpdated).toLocaleString()
        : "never";
      fxStatus.createEl("span", {
        cls: "pc-text-muted",
        text: `Source: ${label} \u00B7 Updated: ${updated}`,
      });
    };
    renderFxStatus();

    new Setting(containerEl).setName("Refresh FX now").addButton((b) =>
      b.setButtonText("\u21BB Refresh").onClick(async () => {
        b.setDisabled(true);
        b.setButtonText("Fetching\u2026");
        try {
          const r = await updateFxRates(this.plugin.settings);
          if (r.updated) {
            await this.plugin.saveSettings();
            showNotice(`\u2713 FX ${r.source}`, 3000);
            this.display();
            return;
          }
          showNotice(r.error || r.reason || "No change", 3000);
        } catch (e) {
          showNotice("FX failed: " + (e.message || e), 3500);
        }
        b.setDisabled(false);
        b.setButtonText("\u21BB Refresh");
      })
    );

    // Auto rates (read-only)
    containerEl.createEl("div", { cls: "pc-settings-fx-subhead", text: "Auto (read-only)" });
    const autoRates = this.plugin.settings.fxRatesAuto ?? {};
    const autoGrid = containerEl.createDiv({ cls: "pc-settings-fx-grid" });
    const home = String(this.plugin.settings.homeCurrency || "RUB").toUpperCase();
    const autoCodes = Object.keys(autoRates)
      .filter((c) => c.toUpperCase() !== home)
      .sort();
    if (autoCodes.length === 0) {
      autoGrid.createEl("span", {
        cls: "pc-text-muted",
        text: "No auto rates yet. Click Refresh or \u21BB Update prices.",
      });
    } else {
      for (const code of autoCodes) {
        const row = autoGrid.createDiv({ cls: "pc-settings-fx-row" });
        row.createEl("span", { text: code });
        const val = row.createEl("span", { cls: "pc-text-muted" });
        val.textContent = String(autoRates[code]);
      }
    }

    // Manual overrides (always win)
    containerEl.createEl("div", { cls: "pc-settings-fx-subhead", text: "Manual overrides" });
    const manualDesc = containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Set a number to override the auto rate. Leave empty to use auto.",
    });
    void manualDesc;
    const manual = this.plugin.settings.fxRatesManual ?? {};
    const codesUnion = Array.from(new Set([...Object.keys(autoRates), ...Object.keys(manual)]))
      .map((c) => c.toUpperCase())
      .filter((c) => c !== home)
      .sort();
    const manualGrid = containerEl.createDiv({ cls: "pc-settings-fx-grid" });
    for (const code of codesUnion) {
      const row = manualGrid.createDiv({ cls: "pc-settings-fx-row" });
      row.createEl("span", { text: code });
      const inp = row.createEl("input", { type: "number", step: "any" });
      inp.addClass("personal-capital-input");
      killWheelChange(inp);
      inp.placeholder = autoRates[code] != null ? String(autoRates[code]) : "";
      inp.value = manual[code] != null ? String(manual[code]) : "";
      inp.onchange = async () => {
        this.plugin.settings.fxRatesManual = this.plugin.settings.fxRatesManual ?? {};
        const v = parseFloat(inp.value);
        if (!Number.isFinite(v) || v <= 0) {
          delete this.plugin.settings.fxRatesManual[code];
        } else {
          this.plugin.settings.fxRatesManual[code] = v;
        }
        await this.plugin.saveSettings();
      };
    }

    new Setting(containerEl)
      .setName("Add manual override")
      .addText((t) => {
        t.setPlaceholder("e.g. AED");
        t.inputEl.addClass("pc-settings-fx-add-code");
        t.inputEl.dataset.role = "code";
      })
      .addText((t) => {
        t.setPlaceholder("rate");
        t.inputEl.type = "number";
        t.inputEl.step = "any";
        t.inputEl.dataset.role = "rate";
        killWheelChange(t.inputEl);
      })
      .addButton((b) =>
        b.setButtonText("Add").onClick(async () => {
          const row = b.buttonEl.closest(".setting-item");
          const codeEl = row?.querySelector('input[data-role="code"]');
          const rateEl = row?.querySelector('input[data-role="rate"]');
          const code = String(codeEl?.value || "")
            .toUpperCase()
            .trim();
          const rate = parseFloat(rateEl?.value || "");
          if (!code || !Number.isFinite(rate) || rate <= 0) {
            showNotice("Code + positive rate required", 2500);
            return;
          }
          this.plugin.settings.fxRatesManual = this.plugin.settings.fxRatesManual ?? {};
          this.plugin.settings.fxRatesManual[code] = rate;
          await this.plugin.saveSettings();
          this.display();
        })
      );

    // ── Accounts ──
    containerEl.createEl("h3", { text: "Accounts", cls: "pc-settings-section" });
    containerEl.createEl("p", {
      text: "Your cash accounts. Each is a .md file in the accounts folder. Balances are derived from the ledger.",
      cls: "setting-item-description",
    });

    const acctFolder = this.plugin.settings.accountsFolder || "finance/Data/accounts";
    const acctFiles = this.app.vault
      .getMarkdownFiles()
      .filter((f) => f.path.toLowerCase().startsWith(acctFolder.toLowerCase() + "/"));
    if (acctFiles.length > 0) {
      const acctList = containerEl.createDiv({ cls: "pc-settings-acct-list" });
      // Render fast with frontmatter values; enrich with derived balance + stale flag async.
      const rowsByName = new Map();
      for (const f of acctFiles) {
        const cache = this.app.metadataCache.getFileCache(f);
        const fm = cache?.frontmatter ?? {};
        const name = fm.name || f.basename;
        const acctRow = acctList.createDiv({ cls: "pc-settings-acct-row" });
        const nameSpan = acctRow.createEl("span", { cls: "pc-settings-acct-name", text: name });
        const meta = acctRow.createEl("span", { cls: "pc-text-muted" });
        meta.textContent = ` \u00B7 ${fm.type || "?"} \u00B7 ${fm.liquid !== false ? "Liquid" : "Locked"} \u00B7 Balance: ${fmt(toNum(fm.initial_balance))}`;
        const btnWrap = acctRow.createDiv({ cls: "pc-settings-acct-btns" });
        const openBtn = btnWrap.createEl("button", { text: "Open", cls: "pc-settings-acct-btn" });
        openBtn.onclick = () => {
          const leaf = this.app.workspace.getLeaf("tab");
          leaf.openFile(f);
        };
        rowsByName.set(name, { meta, nameSpan });
      }

      // Enrich asynchronously — derived balance + stale indicator.
      (async () => {
        try {
          const [accounts, ledger] = await Promise.all([
            readAccounts(this.app, this.plugin.settings),
            readAllLedger(this.app, this.plugin.settings),
          ]);
          const staleDays = Math.max(1, toNum(this.plugin.settings.reconcileStaleDays) || 30);
          const now = Date.now();
          for (const a of accounts) {
            const entry = rowsByName.get(a.name);
            if (!entry) continue;
            const bal = getAccountBalance(a, ledger);
            entry.meta.textContent = ` \u00B7 ${a.type} \u00B7 ${a.liquid ? "Liquid" : "Locked"} \u00B7 Balance: ${fmt(bal)} ${a.currency}`;
            if (a.lastReconciled) {
              const days = Math.floor((now - Date.parse(a.lastReconciled)) / 86400000);
              if (Number.isFinite(days)) {
                if (days >= staleDays) {
                  const icon = entry.nameSpan.createEl("span", {
                    cls: "pc-account-stale-icon",
                    text: " \u27F3",
                  });
                  icon.title = `Last reconciled ${days}d ago`;
                }
                entry.meta.textContent += ` \u00B7 reconciled ${days}d ago`;
              }
            } else {
              const icon = entry.nameSpan.createEl("span", {
                cls: "pc-account-stale-icon",
                text: " \u27F3",
              });
              icon.title = "Never reconciled";
              entry.meta.textContent += " \u00B7 never reconciled";
            }
          }
        } catch (e) {
          console.warn("[PC] settings account enrich failed:", e);
        }
      })();
    } else {
      containerEl.createEl("p", {
        text: "No account files found. Complete onboarding or create files in " + acctFolder,
        cls: "pc-text-muted",
      });
    }

    new Setting(containerEl)
      .setName("Accounts actions")
      .addButton((b) =>
        b
          .setButtonText("\u2696 Reconcile accounts")
          .setCta()
          .onClick(() => {
            new ReconcileAllModal(this.app, this.plugin, () => this.display()).open();
          })
      )
      .addButton((b) =>
        b.setButtonText("\uFF0B New account").onClick(() => {
          new CreateAccountModal(this.app, this.plugin, () => this.display()).open();
        })
      );

    new Setting(containerEl).setName("Accounts folder").addText((t) =>
      t
        .setPlaceholder("finance/Data/accounts")
        .setValue(this.plugin.settings.accountsFolder ?? "")
        .onChange(async (v) => {
          this.plugin.settings.accountsFolder = v.trim() || "finance/Data/accounts";
          await this.plugin.saveSettings();
        })
    );

    // ── Views ──
    containerEl.createEl("h3", { text: "Views", cls: "pc-settings-section" });
    containerEl.createEl("p", {
      text: "Optional: create a standalone note page for the unified Ledger view (Classic ↔ Monthly toggle). The dashboard button works without this note.",
      cls: "setting-item-description",
    });

    const ledgerPath = this.plugin.settings.ledgerNotePath || "finance/Ledger.md";
    const ledgerExists = !!this.app.vault.getAbstractFileByPath(ledgerPath);
    new Setting(containerEl)
      .setName("Ledger view")
      .setDesc(ledgerExists ? `✓ ${ledgerPath}` : "Not created yet")
      .addText((t) =>
        t
          .setPlaceholder("finance/Ledger.md")
          .setValue(this.plugin.settings.ledgerNotePath ?? "")
          .onChange(async (v) => {
            this.plugin.settings.ledgerNotePath = v.trim();
            await this.plugin.saveSettings();
          })
      )
      .addButton((b) =>
        b
          .setButtonText(ledgerExists ? "Open" : "Create")
          .setCta(!ledgerExists)
          .onClick(async () => {
            const p = this.plugin.settings.ledgerNotePath || "finance/Ledger.md";
            let f = this.app.vault.getAbstractFileByPath(p);
            if (!f) {
              const dir = p.split("/").slice(0, -1).join("/");
              if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
                await this.app.vault.createFolder(dir).catch(() => {});
              }
              await this.app.vault.create(
                p,
                "---\ncssclasses: [pc-dashboard]\n---\n```personal-capital-ledger\n```\n"
              );
              this.plugin.settings.ledgerNotePath = p;
              await this.plugin.saveSettings();
              showNotice("Ledger note created");
              this.display();
              return;
            }
            const leaf = this.app.workspace.getLeaf("tab");
            await leaf.openFile(f, { state: { mode: "preview" } });
          })
      );

    // ── Strategy ──
    containerEl.createEl("h3", { text: "Strategy defaults", cls: "pc-settings-section" });
    new Setting(containerEl).setName("Saves target % of income").addText((t) =>
      t.setValue(String(this.plugin.settings.savesTargetPct ?? 30)).onChange(async (v) => {
        this.plugin.settings.savesTargetPct = parseFloat(v) || 30;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl).setName("Comfort budget (Wants ceiling)").addText((t) =>
      t.setValue(String(this.plugin.settings.comfortBudget ?? 100000)).onChange(async (v) => {
        this.plugin.settings.comfortBudget = parseFloat(v) || 100000;
        await this.plugin.saveSettings();
      })
    );

    // ── Personal Context (for AI) ──
    containerEl.createEl("h3", { text: "Personal context", cls: "pc-settings-section" });
    containerEl.createEl("p", {
      text: "Free text included in every AI analysis prompt. Describe your situation, constraints, goals.",
      cls: "setting-item-description",
    });
    const ctxArea = containerEl.createEl("textarea", {
      cls: "personal-capital-input",
      placeholder:
        "e.g. I have an IP with 4M idle. Transfer limit 400K/month. Income is irregular.",
    });
    ctxArea.style.width = "100%";
    ctxArea.style.minHeight = "120px";
    ctxArea.style.resize = "vertical";
    ctxArea.value = this.plugin.settings.personalContext ?? "";
    ctxArea.onchange = async () => {
      this.plugin.settings.personalContext = ctxArea.value;
      await this.plugin.saveSettings();
    };

    // ── Import / Export ──
    // Single feature block: bordered top separator, collapsible sub-sections
    // via <details><summary>. Native HTML accordion — no JS state to manage,
    // open/close persists across re-renders only if the user keeps the tab open.
    const ieBlock = containerEl.createDiv({ cls: "pc-settings-block pc-ie-block" });
    ieBlock.createEl("h3", { text: "Import / Export", cls: "pc-ie-title" });
    ieBlock.createEl("p", {
      text: "Sync your ledger with hledger or beancount. Click a section to expand.",
      cls: "setting-item-description pc-ie-intro",
    });

    // ── Account Mapping (collapsible) ──
    const mapDetails = ieBlock.createEl("details", { cls: "pc-ie-accordion" });
    mapDetails.createEl("summary", { text: "Account mapping", cls: "pc-ie-summary" });
    mapDetails.createEl("p", {
      text: "Override auto-generated paths. Leave empty to use defaults. Format: Assets:Bank:Name or Expenses:Category.",
      cls: "setting-item-description",
    });

    const mapGrid = mapDetails.createDiv({ cls: "pc-settings-map-grid" });
    const renderMap = async () => {
      mapGrid.empty();
      const [accounts, categories] = await Promise.all([
        readAccounts(this.app, this.plugin.settings),
        readCategories(this.app, this.plugin.settings),
      ]);
      const currentMap = this.plugin.settings.accountMap || {};
      const fullMap = buildFullMap(this.plugin.settings, accounts, categories, "hledger");

      const allNames = [
        ...accounts.map((a) => ({ name: a.name, kind: "account", type: a.type })),
        ...categories.map((c) => ({ name: c.name, kind: "category", type: c.type })),
      ].sort((a, b) => a.name.localeCompare(b.name));

      for (const item of allNames) {
        const row = mapGrid.createDiv({ cls: "pc-settings-map-row" });
        row.createEl("span", { text: item.name, cls: "pc-settings-map-name" });
        const autoPath = fullMap[item.name] || "";
        const inp = row.createEl("input", { type: "text" });
        inp.addClass("personal-capital-input");
        inp.placeholder = autoPath;
        inp.value = currentMap[item.name] || "";
        inp.style.width = "60%";
        inp.onchange = async () => {
          this.plugin.settings.accountMap = this.plugin.settings.accountMap || {};
          const v = inp.value.trim();
          if (!v) {
            delete this.plugin.settings.accountMap[item.name];
          } else {
            this.plugin.settings.accountMap[item.name] = v;
          }
          await this.plugin.saveSettings();
        };
        const resetBtn = row.createEl("button", {
          text: "↺",
          cls: "pc-settings-map-reset",
          title: "Reset to auto",
        });
        resetBtn.onclick = async () => {
          delete (this.plugin.settings.accountMap || {})[item.name];
          inp.value = "";
          await this.plugin.saveSettings();
        };
      }
    };
    renderMap();

    // ── Export (collapsible) ──
    const exportDetails = ieBlock.createEl("details", { cls: "pc-ie-accordion" });
    exportDetails.createEl("summary", { text: "Export", cls: "pc-ie-summary" });
    exportDetails.createEl("p", {
      text: "Writes all ledger entries to a file in your vault.",
      cls: "setting-item-description",
    });
    new Setting(exportDetails)
      .setName("Export to hledger")
      .setDesc("Writes all ledger entries as a .journal file")
      .addText((t) => {
        t.setPlaceholder("export.journal");
        t.setValue(this.plugin.settings._exportHledgerPath || "export.journal");
        t.inputEl.dataset.role = "hledger-path";
        t.onChange((v) => {
          this.plugin.settings._exportHledgerPath = v;
        });
      })
      .addButton((b) =>
        b
          .setButtonText("Export")
          .setCta()
          .onClick(async () => {
            b.setDisabled(true);
            b.setButtonText("Exporting…");
            try {
              const path = this.plugin.settings._exportHledgerPath || "export.journal";
              const result = await exportToFile(this.app, this.plugin.settings, "hledger", path);
              showNotice(`✓ Exported ${result.entryCount} entries to ${result.path}`, 4000);
              if (result.warnings.length > 0) showNotice(result.warnings.join("\n"), 5000);
            } catch (e) {
              showNotice("Export failed: " + (e.message || e), 4000);
            }
            b.setDisabled(false);
            b.setButtonText("Export");
          })
      );

    new Setting(exportDetails)
      .setName("Export to beancount")
      .setDesc("Writes all ledger entries as a .beancount file")
      .addText((t) => {
        t.setPlaceholder("export.beancount");
        t.setValue(this.plugin.settings._exportBeancountPath || "export.beancount");
        t.inputEl.dataset.role = "beancount-path";
        t.onChange((v) => {
          this.plugin.settings._exportBeancountPath = v;
        });
      })
      .addButton((b) =>
        b
          .setButtonText("Export")
          .setCta()
          .onClick(async () => {
            b.setDisabled(true);
            b.setButtonText("Exporting…");
            try {
              const path = this.plugin.settings._exportBeancountPath || "export.beancount";
              const result = await exportToFile(this.app, this.plugin.settings, "beancount", path);
              showNotice(`✓ Exported ${result.entryCount} entries to ${result.path}`, 4000);
              if (result.warnings.length > 0) showNotice(result.warnings.join("\n"), 5000);
            } catch (e) {
              showNotice("Export failed: " + (e.message || e), 4000);
            }
            b.setDisabled(false);
            b.setButtonText("Export");
          })
      );

    // ── Import (collapsible) ──
    const importDetails = ieBlock.createEl("details", { cls: "pc-ie-accordion" });
    importDetails.createEl("summary", { text: "Import", cls: "pc-ie-summary" });
    importDetails.createEl("p", {
      text: "Adds entries to your ledger. Duplicates are skipped by date+type+amount matching.",
      cls: "setting-item-description",
    });

    new Setting(importDetails)
      .setName("Import from hledger")
      .setDesc("Parse a .journal file and add entries to ledger")
      .addText((t) => {
        t.setPlaceholder("import.journal");
        t.setValue(this.plugin.settings._importHledgerPath || "");
        t.inputEl.dataset.role = "import-hledger-path";
        t.onChange((v) => {
          this.plugin.settings._importHledgerPath = v;
        });
      })
      .addButton((b) =>
        b.setButtonText("Import").onClick(async () => {
          const path = this.plugin.settings._importHledgerPath;
          if (!path) {
            showNotice("Enter file path first", 2500);
            return;
          }
          b.setDisabled(true);
          b.setButtonText("Importing…");
          try {
            const result = await importFromFile(this.app, this.plugin.settings, path, "hledger");
            new ImportPreviewModal(this.app, this.plugin, result).open();
          } catch (e) {
            showNotice("Import failed: " + (e.message || e), 4000);
          }
          b.setDisabled(false);
          b.setButtonText("Import");
        })
      );

    new Setting(importDetails)
      .setName("Import from beancount")
      .setDesc("Parse a .beancount file and add entries to ledger")
      .addText((t) => {
        t.setPlaceholder("import.beancount");
        t.setValue(this.plugin.settings._importBeancountPath || "");
        t.inputEl.dataset.role = "import-beancount-path";
        t.onChange((v) => {
          this.plugin.settings._importBeancountPath = v;
        });
      })
      .addButton((b) =>
        b.setButtonText("Import").onClick(async () => {
          const path = this.plugin.settings._importBeancountPath;
          if (!path) {
            showNotice("Enter file path first", 2500);
            return;
          }
          b.setDisabled(true);
          b.setButtonText("Importing…");
          try {
            const result = await importFromFile(this.app, this.plugin.settings, path, "beancount");
            new ImportPreviewModal(this.app, this.plugin, result).open();
          } catch (e) {
            showNotice("Import failed: " + (e.message || e), 4000);
          }
          b.setDisabled(false);
          b.setButtonText("Import");
        })
      );
  }
}

// ── Import Preview Modal ──
class ImportPreviewModal extends Modal {
  constructor(app, plugin, result) {
    super(app);
    this.plugin = plugin;
    this.result = result;
  }

  onOpen() {
    const { contentEl } = this;
    const { entries, accountsToCreate, categoriesToCreate, warnings } = this.result;

    contentEl.createEl("h2", { text: "Import Preview" });

    if (warnings.length > 0) {
      const warnDiv = contentEl.createDiv({ cls: "pc-import-warnings" });
      warnDiv.createEl("h4", { text: `⚠ ${warnings.length} warning(s)` });
      for (const w of warnings.slice(0, 20)) {
        warnDiv.createEl("p", { text: w, cls: "pc-text-muted" });
      }
      if (warnings.length > 20)
        warnDiv.createEl("p", {
          text: `...and ${warnings.length - 20} more`,
          cls: "pc-text-muted",
        });
    }

    contentEl.createEl("p", { text: `${entries.length} entries to import` });

    if (accountsToCreate.length > 0) {
      contentEl.createEl("p", { text: `New accounts to create: ${accountsToCreate.join(", ")}` });
    }
    if (categoriesToCreate.length > 0) {
      contentEl.createEl("p", {
        text: `New categories to create: ${categoriesToCreate.join(", ")}`,
      });
    }

    // Preview table (first 30 entries)
    if (entries.length > 0) {
      const table = contentEl.createEl("table", { cls: "pc-import-preview-table" });
      const thead = table.createEl("thead");
      const hr = thead.createEl("tr");
      hr.createEl("th", { text: "Date" });
      hr.createEl("th", { text: "Type" });
      hr.createEl("th", { text: "Amount" });
      hr.createEl("th", { text: "Details" });
      const tbody = table.createEl("tbody");
      for (const e of entries.slice(0, 30)) {
        const tr = tbody.createEl("tr");
        tr.createEl("td", { text: e.d || "" });
        tr.createEl("td", { text: e.type || "" });
        tr.createEl("td", { text: String(e.amt || "") });
        tr.createEl("td", { text: e.cat || e.asset || e.note || "" });
      }
      if (entries.length > 30) {
        contentEl.createEl("p", {
          text: `...and ${entries.length - 30} more entries`,
          cls: "pc-text-muted",
        });
      }
    }

    // Buttons
    const btnRow = contentEl.createDiv({ cls: "pc-import-btns" });
    const confirmBtn = btnRow.createEl("button", {
      text: `Import ${entries.length} entries`,
      cls: "mod-cta",
    });
    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Writing…";
      try {
        await writeLedgerEntries(this.app, this.plugin.settings, entries);
        showNotice(`✓ Imported ${entries.length} entries`, 4000);
        this.close();
      } catch (e) {
        showNotice("Write failed: " + (e.message || e), 4000);
        confirmBtn.disabled = false;
        confirmBtn.textContent = `Import ${entries.length} entries`;
      }
    };
    const cancelBtn = btnRow.createEl("button", { text: "Cancel" });
    cancelBtn.onclick = () => this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}

module.exports = { PersonalCapitalSettingTab };
