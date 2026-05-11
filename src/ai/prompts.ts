// ───────────────────────────────────────────────────────────────────
// INSIGHTS PROMPT BUILDERS
// ───────────────────────────────────────────────────────────────────

import type { App, TFile } from "obsidian";
import { fmt } from "../core/utils";
import { getAccountBalance, getLiquidTotal } from "../domain/accounts/balance";
import { buildDataSnapshot } from "./snapshot";
import type { Account, LedgerEntry, PluginSettings } from "../core/types";

export type QData = Record<string, string> | null | undefined;

const Q_LABELS: Record<string, string> = {
  investExp: "Investing experience",
  goals: "Goals",
  obligations: "Obligations",
  concerns: "Concerns / risks",
};

function isFile(f: unknown): f is TFile {
  return !!f && typeof (f as TFile).extension === "string";
}

export async function buildChatPrompt(
  app: App,
  settings: PluginSettings,
  qData: QData
): Promise<string> {
  const { lines, totalCapital, curMonth, curYear } = await buildDataSnapshot(app, settings);
  const sym = settings.homeCurrencySymbol;
  const personalCtx = (settings.personalContext ?? "").trim();

  let strategyText = "";
  const stratFile = app.vault.getAbstractFileByPath(settings.strategyPath);
  if (isFile(stratFile)) strategyText = await app.vault.read(stratFile);

  const qLines: string[] = [];
  if (qData) {
    for (const [k, v] of Object.entries(qData)) {
      if (v && v.trim()) qLines.push(`- ${Q_LABELS[k] || k}: ${v.trim()}`);
    }
  }

  const prompt = [
    `# Role`,
    `You are a personal finance advisor and capital growth consultant.`,
    ``,
    personalCtx ? `# User Profile\n${personalCtx}\n` : "",
    qLines.length > 0 ? `# Additional Context\n${qLines.join("\n")}\n` : "",
    strategyText ? `# Current Strategy\n${strategyText}\n\n---` : "",
    `# Financial Data — ${curMonth} ${curYear}`,
    ``,
    ...lines,
    `---`,
    ``,
    `Total capital: **${fmt(totalCapital)} ${sym}**`,
    ``,
    `Review the data above. Briefly summarize what you see — capital state, any notable changes or concerns. Then ask: "What would you like to focus on?"`,
    ``,
    `_Key files: strategy → \`${settings.strategyPath}\`_`,
  ].filter(Boolean);

  return prompt.join("\n");
}

export function buildAgentPrompt(
  settings: PluginSettings,
  qData: QData,
  accounts: Account[] | null | undefined,
  allLedger: LedgerEntry[] | null | undefined
): string {
  const personalCtx = (settings.personalContext ?? "").trim();
  const sym = settings.homeCurrencySymbol;
  const liquidTotal = getLiquidTotal(settings, accounts, allLedger);

  const qLines: string[] = [];
  if (qData) {
    for (const [k, v] of Object.entries(qData)) {
      if (v && v.trim()) qLines.push(`- ${Q_LABELS[k] || k}: ${v.trim()}`);
    }
  }

  const prompt = [
    `# Role`,
    `You are a personal finance advisor and capital growth consultant.`,
    `You have access to the user's Obsidian vault with financial data.`,
    ``,
    personalCtx ? `# User Profile\n${personalCtx}\n` : "",
    qLines.length > 0 ? `# Additional Context\n${qLines.join("\n")}\n` : "",
    `# Data Location`,
    `Read the following files to understand the user's financial position:`,
    ``,
    `- **Cashflow categories**: \`${settings.categoriesFolder}/\` — each .md file has YAML frontmatter with type (Income/Needs/Wants), monthly values (m01-m12)`,
    `- **Assets**: \`${settings.assetsFolder}/\` — each .md file has frontmatter (type, currency, qty, price) + log lines in body (YYYY-MM-DD | op | qty | price)`,
    `- **Strategy**: \`${settings.strategyPath}\` — current strategy document (may not exist yet)`,
    `- **Dashboard note**: \`${settings.dashboardPath}\``,
    ``,
    `# Accounts`,
    ...(accounts && accounts.length > 0
      ? [
          accounts
            .map(
              (a) =>
                `${a.name} ${fmt(getAccountBalance(a, allLedger || []))}${a.locked ? " 🔒" : ""}`
            )
            .join(", ") + ` — Total: ${fmt(liquidTotal)} ${sym}`,
        ]
      : [
          `Bank ${fmt(settings.liquidBank ?? 0)}, Broker ${fmt(settings.liquidBrokerCash ?? 0)}, Cash ${fmt(settings.liquidCash ?? 0)}, Business ${fmt(settings.liquidBusiness ?? 0)} — Total: ${fmt(liquidTotal)} ${sym}`,
        ]),
    ``,
    `# Ledger`,
    `Financial transaction log: \`${settings.ledgerFolder || "finance/Data"}/ledger-*.jsonl\``,
    ``,
    `# Instructions`,
    `1. Read the asset files and category files to understand the current state`,
    `2. Consider BOTH invested assets AND liquid pools — total capital is assets + liquid`,
    `3. Summarize what you see — capital structure, cashflow health, portfolio status`,
    `4. Ask: "What would you like to focus on?"`,
    ``,
    `When making changes to files, follow the existing format exactly.`,
  ].filter(Boolean);

  return prompt.join("\n");
}
