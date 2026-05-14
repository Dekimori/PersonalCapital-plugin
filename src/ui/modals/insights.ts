// @ts-nocheck — transitional; types incremental per file
import { Modal } from "obsidian";
import { readAccounts } from "../../domain/accounts/io";
import { readLedgerMultiYear } from "../../domain/ledger/io";
import { buildChatPrompt, buildAgentPrompt } from "../../ai/prompts";

class InsightsModal extends Modal {
  constructor(app, settings) {
    super(app);
    this.settings = settings;
    this.qData = {};
    this.screen = 0; // 0 = context, 1 = cards
  }

  onOpen() {
    this.render();
  }

  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("pc-insights-modal");

    if (this.screen === 0) this.renderContextScreen(contentEl);
    else this.renderCardsScreen(contentEl);
  }

  // ── Screen 1: Optional context questionnaire ──
  renderContextScreen(el) {
    el.createEl("div", { cls: "pc-insights-title", text: "Prepare Analysis" });
    el.createEl("p", {
      cls: "pc-insights-desc",
      text: "Help the AI understand your situation better. Optional — skip if you prefer.",
    });

    const form = el.createDiv({ cls: "pc-insights-context-form" });
    const questions = [
      ["investExp", "Investing experience?", "e.g. beginner, 3 years active"],
      ["goals", "What are your goals?", "e.g. passive income, early retirement"],
      ["obligations", "What are your obligations?", "e.g. mortgage 30k/mo, IP tax"],
      ["concerns", "Concerns / risks?", "e.g. inflation, job instability"],
    ];
    for (const [key, label, placeholder] of questions) {
      const row = form.createDiv({ cls: "pc-insights-q-row" });
      row.createEl("label", { cls: "pc-insights-q-label", text: label });
      const inp = row.createEl("input", {
        type: "text",
        placeholder,
        cls: "personal-capital-input",
      });
      if (this.qData[key]) inp.value = this.qData[key];
      inp.addEventListener("input", () => {
        this.qData[key] = inp.value;
      });
    }

    form.createEl("p", {
      cls: "pc-insights-q-hint",
      text: "These answers are added to the prompt only. Nothing is saved or shared.",
    });

    const nav = el.createDiv({ cls: "pc-insights-nav" });
    const skipBtn = nav.createEl("button", { cls: "pc-insights-nav-btn", text: "Skip →" });
    skipBtn.onclick = () => {
      this.screen = 1;
      this.render();
    };
    const nextBtn = nav.createEl("button", {
      cls: "pc-insights-nav-btn mod-cta",
      text: "Continue →",
    });
    nextBtn.onclick = () => {
      this.screen = 1;
      this.render();
    };
  }

  // ── Screen 2: Chat / Agent cards ──
  renderCardsScreen(el) {
    el.createEl("div", { cls: "pc-insights-title", text: "Choose AI mode" });
    el.createEl("p", { cls: "pc-insights-desc", text: "No data is shared automatically." });

    const cards = el.createDiv({ cls: "pc-insights-cards" });

    // Card 1: AI Chat
    const chatCard = cards.createDiv({ cls: "pc-insights-card" });
    chatCard.createEl("div", { cls: "pc-insights-card-icon", text: "💬" });
    chatCard.createEl("div", { cls: "pc-insights-card-title", text: "AI Chat" });
    chatCard.createEl("p", {
      cls: "pc-insights-card-desc",
      text: "Copy prompt with all your data to paste into Claude, ChatGPT, or any AI chat.",
    });
    const chatStatus = chatCard.createDiv({ cls: "pc-insights-card-status" });
    const chatBtn = chatCard.createEl("button", {
      cls: "pc-insights-card-btn mod-cta",
      text: "Copy prompt",
    });

    chatBtn.onclick = async () => {
      chatBtn.disabled = true;
      chatStatus.textContent = "Building…";
      try {
        const ctx = await buildChatPrompt(this.app, this.settings, this.qData);
        await navigator.clipboard.writeText(ctx);
        await this._savePrompt(ctx, "chat_prompt.md");
        chatStatus.textContent = "✓ Copied!";
        chatStatus.classList.add("pc-insights-status--ok");
        chatBtn.textContent = "✓ Copied";
        setTimeout(() => this.close(), 1200);
      } catch (e) {
        chatStatus.textContent = "Error: " + e.message;
        chatBtn.disabled = false;
      }
    };

    // Card 2: AI Agent
    const agentCard = cards.createDiv({ cls: "pc-insights-card" });
    agentCard.createEl("div", { cls: "pc-insights-card-icon", text: "🤖" });
    agentCard.createEl("div", { cls: "pc-insights-card-title", text: "AI Agent" });
    agentCard.createEl("p", {
      cls: "pc-insights-card-desc",
      text: "Copy prompt with vault paths for Cursor, Claude Code, Copilot, or any agent with file access.",
    });
    const agentStatus = agentCard.createDiv({ cls: "pc-insights-card-status" });
    const agentBtn = agentCard.createEl("button", {
      cls: "pc-insights-card-btn",
      text: "Copy prompt",
    });

    agentBtn.onclick = async () => {
      agentBtn.disabled = true;
      agentStatus.textContent = "Building…";
      try {
        const accts = await readAccounts(this.app, this.settings);
        const ledg = await readLedgerMultiYear(this.app, this.settings, [new Date().getFullYear()]);
        const ctx = buildAgentPrompt(this.settings, this.qData, accts, ledg);
        await navigator.clipboard.writeText(ctx);
        await this._savePrompt(ctx, "agent_prompt.md");
        agentStatus.textContent = "✓ Copied!";
        agentStatus.classList.add("pc-insights-status--ok");
        agentBtn.textContent = "✓ Copied";
        setTimeout(() => this.close(), 1200);
      } catch (e) {
        agentStatus.textContent = "Error: " + e.message;
        agentBtn.disabled = false;
      }
    };

    // Back + tips
    const nav = el.createDiv({ cls: "pc-insights-nav" });
    const backBtn = nav.createEl("button", { cls: "pc-insights-nav-btn", text: "← Back" });
    backBtn.onclick = () => {
      this.screen = 0;
      this.render();
    };

    const tips = el.createDiv({ cls: "pc-insights-tips" });
    tips.createEl("p", {
      text: "💡 Adjust the prompt as you like — ask anything about your finances.",
    });
    tips.createEl("p", {
      text: "⚠️ AI may make mistakes. Don't follow recommendations blindly — it's always your call.",
    });
  }

  async _savePrompt(ctx, fileName) {
    const aiDir = this.settings.categoriesFolder.replace(/categories\/?$/, "ai_context");
    if (!this.app.vault.getAbstractFileByPath(aiDir)) {
      await this.app.vault.createFolder(aiDir).catch(() => {});
    }
    const outPath = `${aiDir}/${fileName}`;
    const existing = this.app.vault.getAbstractFileByPath(outPath);
    if (existing) await this.app.vault.modify(existing, ctx);
    else await this.app.vault.create(outPath, ctx);
  }
}

export { InsightsModal };
