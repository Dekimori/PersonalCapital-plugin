// -------------------------------------------------------------------
// PERSONAL CAPITAL — Obsidian Plugin entry point
// -------------------------------------------------------------------

import { Plugin, Modal } from "obsidian";
import type { TFile, WorkspaceLeaf } from "obsidian";
import { DEFAULT_SETTINGS, MONTH_KEYS, MONTH_NAMES } from "./core/constants";
import { showNotice, getCurrentYear } from "./core/utils";
import type { PluginSettings } from "./core/types";
import { renderDashboard } from "./ui/components/dashboard";
import { renderUnifiedLedger } from "./ui/components/ledger-view";
import { PC_LEDGER_VIEW, PCLedgerView } from "./ui/views/ledger-tab";
import { PersonalCapitalSettingTab } from "./ui/settings";
import { OnboardingModal } from "./ui/modals/onboarding";
import { CreateAssetModal } from "./ui/modals/asset-create";
import { PickAssetModal } from "./ui/modals/asset-pick";
import { AddAssetLineModal } from "./ui/modals/asset-line";
import { AddTransactionModal } from "./ui/modals/transaction";
import { runMigration } from "./migration";
import { recalcAsset } from "./domain/assets/recalc";
import { updateAllAssetPrices } from "./domain/assets/prices";
import { readAccounts } from "./domain/accounts/io";
import { buildChatPrompt } from "./ai/prompts";
import { readLedgerMultiYear } from "./domain/ledger/io";
import { buildCashflowRows } from "./domain/budget/cashflow";

// -------------------------------------------------------------------
// DASHBOARD NOTE TEMPLATE (written when note doesn't exist)
// -------------------------------------------------------------------

const DASHBOARD_NOTE_CONTENT = `---
cssclasses:
  - pc-dashboard
---
\`\`\`personal-capital-dashboard
\`\`\`
`;

// -------------------------------------------------------------------
// STARTER CATEGORIES (created on first onboarding)
// -------------------------------------------------------------------
// [name, type, emoji, recurring]

type StarterCategory = [string, string, string, boolean];

const STARTER_CATEGORIES: StarterCategory[] = [
  // Income
  ["Wages", "Income", "\u{1F4BC}", true],
  ["Freelance", "Income", "\u{1F4BB}", false],
  ["Gifts & Bonus", "Income", "\u{1F381}", false],
  // Needs
  ["Rent", "Needs", "\u{1F3E0}", true],
  ["Groceries", "Needs", "\u{1F6D2}", true],
  ["Bills", "Needs", "\u{1F4C4}", true],
  ["Health", "Needs", "\u{1F48A}", false],
  ["Transport", "Needs", "\u{1F68C}", true],
  // Wants
  ["Eat Out", "Wants", "\u{1F354}", false],
  ["Entertainment", "Wants", "\u{1F3AE}", false],
  ["Clothing", "Wants", "\u{1F455}", false],
  ["Subscriptions", "Wants", "\u{1F4F1}", true],
  ["Vacation", "Wants", "✈️", false],
];

function isFile(f: unknown): f is TFile {
  return !!f && typeof (f as TFile).extension === "string";
}

// -------------------------------------------------------------------
// PLUGIN CLASS
// -------------------------------------------------------------------

export default class PersonalCapitalPlugin extends Plugin {
  settings!: PluginSettings;

  async onload() {
    await this.loadSettings();

    // ── Migration + first-activation scaffold ──
    this.app.workspace.onLayoutReady(async () => {
      if (!this.settings.migrationDone && this.settings.onboardingDone) {
        await runMigration(this.app, this.settings, this);
      }
      const dashFile = this.app.vault.getAbstractFileByPath(this.settings.dashboardPath);
      if (!dashFile) {
        await this._scaffoldVault();
        await this._openDashboardNote();
      }
    });

    // ── Dashboard = code block processor (renders inside any note) ──
    this.registerMarkdownCodeBlockProcessor("personal-capital-dashboard", async (_source, el) => {
      el.classList.add("pc-dashboard-root");
      await renderDashboard(this.app, this.settings, el, this);
    });

    // ── Unified Ledger (Classic / Monthly) as a code block processor ──
    this.registerMarkdownCodeBlockProcessor("personal-capital-ledger", async (_source, el) => {
      await renderUnifiedLedger(this.app, this.settings, el, this);
    });

    // ── Unified Ledger as a tab view (opened from dashboard button) ──
    this.registerView(PC_LEDGER_VIEW, (leaf: WorkspaceLeaf) => new PCLedgerView(leaf, this));

    // ── Force reading view when Dashboard.md is opened ──
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf: any) => {
        if (!leaf?.view?.file) return;
        if (leaf.view.file.path !== this.settings.dashboardPath) return;
        this._forceDashboardPreview();
      })
    );
    this.registerEvent(
      this.app.workspace.on("file-open", (file: any) => {
        if (!file || file.path !== this.settings.dashboardPath) return;
        this._forceDashboardPreview();
      })
    );

    // ── Commands ──
    this.addCommand({
      id: "pc-open-dashboard",
      name: "Open Dashboard",
      callback: () => this._openDashboardNote(),
    });

    this.addCommand({
      id: "pc-setup",
      name: "Setup / Onboarding",
      callback: () => new OnboardingModal(this.app, this).open(),
    });

    this.addCommand({
      id: "pc-add-new-asset",
      name: "Add new asset",
      callback: () => new CreateAssetModal(this.app, this).open(),
    });

    this.addCommand({
      id: "pc-update-asset-pick",
      name: "Update asset (pick)",
      callback: () =>
        new PickAssetModal(this.app, this, (file: TFile) =>
          new AddAssetLineModal(this.app, file, this).open()
        ).open(),
    });

    this.addCommand({
      id: "pc-recalc-all-assets",
      name: "Recalculate all assets",
      callback: async () => {
        const folder = this.settings.assetsFolder.toLowerCase().replace(/\/$/, "");
        const files = this.app.vault
          .getMarkdownFiles()
          .filter((f) => f.path.toLowerCase().startsWith(folder + "/"));
        for (const f of files) await recalcAsset(this.app, f, this.settings);
        showNotice(`Recalculated ${files.length} asset(s)`);
      },
    });

    this.addCommand({
      id: "pc-update-all-prices",
      name: "Update all asset prices",
      callback: async () => {
        showNotice("Fetching prices…");
        const result = await updateAllAssetPrices(this.app, this.settings, (ticker: string) => {
          showNotice(`Fetching ${ticker}…`);
        });
        if (result.updated > 0) {
          const divTotal = result.results.reduce((s: number, r: any) => s + (r.divsAdded || 0), 0);
          let msg = `✓ Updated ${result.updated}/${result.total} asset(s)`;
          if (divTotal > 0) msg += `, ${divTotal} dividend(s)`;
          showNotice(msg, 4000);
        } else if (result.errors.length > 0) {
          showNotice("No updates. Check console for details.", 4000);
          console.warn("[PC] Price update errors:", result.errors);
        } else {
          showNotice("All assets already up to date");
        }
      },
    });

    this.addCommand({
      id: "pc-add-transaction",
      name: "Add transaction",
      callback: async () => {
        const accounts = await readAccounts(this.app, this.settings);
        new AddTransactionModal(this.app, this, accounts).open();
      },
    });

    this.addCommand({
      id: "pc-cashflow-erase-and-archive",
      name: "Cashflow: Erase & archive",
      callback: () => this.confirmEraseAndArchive(),
    });

    this.addCommand({
      id: "pc-copy-analysis-context",
      name: "Copy analysis context (for AI)",
      callback: async () => {
        showNotice("Building context…");
        const ctx = await buildChatPrompt(this.app, this.settings, null);
        await navigator.clipboard.writeText(ctx);
        showNotice("✓ Analysis context copied to clipboard");
      },
    });

    this.addSettingTab(new PersonalCapitalSettingTab(this.app, this));
  }

  // ── Force preview + read-only on any leaf showing Dashboard.md ──
  _forceDashboardPreview(): void {
    const path = this.settings.dashboardPath;
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const view: any = leaf.view;
      if (view?.file?.path !== path) continue;
      const state = leaf.getViewState() as any;
      if (state?.state?.mode === "preview") continue;
      state.state = state.state || {};
      state.state.mode = "preview";
      state.state.source = false;
      leaf.setViewState(state);
    }
  }

  // ── Open (or focus) the Dashboard.md note ──
  async _openDashboardNote(): Promise<void> {
    await this._scaffoldVault();
    const path = this.settings.dashboardPath;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!isFile(file)) return;

    // Check if already open in a tab — focus it instead of duplicating
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const view: any = leaf.view;
      if (view?.file?.path === path) {
        this.app.workspace.setActiveLeaf(leaf, { focus: true });
        this.app.workspace.revealLeaf(leaf);
        this._forceDashboardPreview();
        return;
      }
    }

    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file, { state: { mode: "preview" } });
  }

  // ── Create finance folder structure + all starter files if missing ──
  async _scaffoldVault(): Promise<void> {
    // 1. Folders
    const folders = [
      this.settings.categoriesFolder,
      this.settings.assetsFolder,
      this.settings.archiveFolder,
      this.settings.accountsFolder || "finance/Data/accounts",
    ];
    for (const f of folders) {
      if (!this.app.vault.getAbstractFileByPath(f)) {
        await this.app.vault.createFolder(f).catch(() => {});
      }
    }
    // Parent dirs for single files
    for (const p of [
      this.settings.capitalHistoryPath,
      this.settings.strategyPath,
      this.settings.dashboardPath,
    ]) {
      const dir = p.split("/").slice(0, -1).join("/");
      if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
        await this.app.vault.createFolder(dir).catch(() => {});
      }
    }

    // 2. Dashboard note
    if (!this.app.vault.getAbstractFileByPath(this.settings.dashboardPath)) {
      await this.app.vault.create(this.settings.dashboardPath, DASHBOARD_NOTE_CONTENT);
    }

    // 3. Starter category files (only if categories folder is empty)
    const catFolder = this.settings.categoriesFolder.toLowerCase().replace(/\/$/, "");
    const existingCats = this.app.vault
      .getMarkdownFiles()
      .filter((f) => f.path.toLowerCase().startsWith(catFolder + "/"));
    if (existingCats.length === 0) {
      for (const [name, type, emoji, recurring] of STARTER_CATEGORIES) {
        const path = `${this.settings.categoriesFolder}/${name}.md`;
        if (!this.app.vault.getAbstractFileByPath(path)) {
          const content = [
            "---",
            `type: ${type}`,
            `category: ${name}`,
            `emoji: ${emoji}`,
            `recurring: ${recurring}`,
            ...MONTH_KEYS.map((k) => `${k}:`),
            "---",
            "",
          ].join("\n");
          await this.app.vault.create(path, content);
        }
      }
    }
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<PluginSettings> & Record<string, unknown>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);

    // One-shot migration: legacy `fxRates` → `fxRatesAuto`
    const settingsAny = this.settings as any;
    if (settingsAny.fxRates && !this.settings.fxRatesUpdated) {
      this.settings.fxRatesAuto = Object.assign(
        {},
        DEFAULT_SETTINGS.fxRatesAuto,
        this.settings.fxRatesAuto ?? {},
        settingsAny.fxRates
      );
      delete settingsAny.fxRates;
    }

    // Deep-merge FX layers
    this.settings.fxRatesManual = Object.assign(
      {},
      DEFAULT_SETTINGS.fxRatesManual,
      this.settings.fxRatesManual ?? {}
    );
    this.settings.fxRatesAuto = Object.assign(
      {},
      DEFAULT_SETTINGS.fxRatesAuto,
      this.settings.fxRatesAuto ?? {}
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // ── Cashflow archive ──

  confirmEraseAndArchive(): void {
    const modal = new Modal(this.app);
    modal.titleEl.setText("Erase & archive cashflow");
    modal.contentEl.createEl("p", {
      text: "Export current year to archive, then clear all monthly values?",
    });
    const btns = modal.contentEl.createDiv({ cls: "personal-capital-buttons" });
    const yes = btns.createEl("button", { text: "Archive & clear", cls: "mod-cta" });
    const no = btns.createEl("button", { text: "Cancel" });
    no.onclick = () => modal.close();
    yes.onclick = async () => {
      modal.close();
      await this.exportCashflowToArchive();
    };
    modal.open();
  }

  async exportCashflowToArchive(): Promise<void> {
    const year = getCurrentYear();
    const ledger = await readLedgerMultiYear(this.app, this.settings, [year]);
    const rows = buildCashflowRows(this.app, this.settings, ledger);
    const header = ["Type", "Category", "Recurring", "Projected", "Total", ...MONTH_NAMES];
    const mdRows = [
      "| " + header.join(" | ") + " |",
      "|" + header.map(() => "---").join("|") + "|",
      ...rows.map((r) => {
        const cells = [
          r.type,
          (r.emoji ? r.emoji + " " : "") + r.category,
          r.recurring ? "✓" : "",
          r.projected != null ? String(r.projected) : "",
          String(r.total),
          ...MONTH_KEYS.map((k) => (r.months[k] != null ? String(r.months[k]) : "")),
        ];
        return "| " + cells.join(" | ") + " |";
      }),
    ];

    const archiveDir = this.settings.archiveFolder;
    if (!this.app.vault.getAbstractFileByPath(archiveDir)) {
      await this.app.vault.createFolder(archiveDir);
    }
    const outPath = `${archiveDir}/${year}_cashflow.md`;
    const content = `# Cashflow ${year}\n\n` + mdRows.join("\n") + "\n";
    const existing = this.app.vault.getAbstractFileByPath(outPath);
    if (isFile(existing)) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(outPath, content);
    }

    // Clear monthly values from all category files
    const folder = this.settings.categoriesFolder.toLowerCase().replace(/\/$/, "");
    const files = this.app.vault
      .getMarkdownFiles()
      .filter((f) => f.path.toLowerCase().startsWith(folder + "/"));
    for (const f of files) {
      await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        for (const k of MONTH_KEYS) fm[k] = null;
      });
    }

    showNotice(`Archived to ${outPath} and cleared.`);
  }
}
