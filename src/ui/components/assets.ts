// @ts-nocheck — transitional; types incremental per file
import { fmt, fmtSigned, showNotice, makeInteractive } from "../../core/utils";
import { updateAllAssetPrices } from "../../domain/assets/prices";
import { updateFxRates } from "../../domain/assets/fx";
import { applyTemplates } from "../../domain/assets/templates";

// Compute financial metrics for display
function computeAssetMetrics(a) {
  const invested = a.currentValue - a.plAmount; // total cost basis
  const totalReturn = invested > 0 ? ((a.plAmount + a.passiveIncomeTot) / invested) * 100 : 0;

  // Yield on Cost = total passive income / invested × 100
  const yieldOnCost = invested > 0 ? (a.passiveIncomeTot / invested) * 100 : 0;

  // CAGR = ((current_value + passive_income) / invested)^(1/years) − 1
  let cagr = 0;
  if (a.initialDate && invested > 0) {
    const startDate = new Date(a.initialDate);
    const now = new Date();
    const years = (now - startDate) / (365.25 * 24 * 3600 * 1000);
    if (years >= 0.1) {
      // need at least ~1 month
      const totalValue = a.currentValue + a.passiveIncomeTot;
      cagr = (Math.pow(totalValue / invested, 1 / years) - 1) * 100;
    }
  }

  return {
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    yieldOnCost: parseFloat(yieldOnCost.toFixed(2)),
    cagr: parseFloat(cagr.toFixed(2)),
    invested: parseFloat(invested.toFixed(2)),
  };
}

function renderAssetCards(container, assets, settings, app, plugin, dashContainer) {
  // Lazy requires to avoid circular dependencies
  const { renderDashboard } = require("./dashboard");
  const { PickAssetModal } = require("../modals/asset-pick");
  const { AddAssetLineModal } = require("../modals/asset-line");
  const { CreateAssetModal } = require("../modals/asset-create");

  if (assets.length === 0) {
    container.createEl("p", { cls: "pc-empty", text: "No assets yet." });
    return;
  }

  const instrHeader = container.createDiv({ cls: "pc-block-header" });
  instrHeader.createEl("div", { cls: "pc-block-title", text: "Instruments" });

  if (app && plugin && dashContainer) {
    const rerender = () => renderDashboard(app, settings, dashContainer, plugin);

    const btnGroup = instrHeader.createDiv({ cls: "pc-block-header-actions" });

    const assetActionBtn = btnGroup.createEl("button", {
      cls: "pc-action-btn",
      text: "\u21BB Asset action",
    });
    assetActionBtn.onclick = () => {
      new PickAssetModal(app, plugin, (file) => {
        const modal = new AddAssetLineModal(app, file, plugin);
        const origClose = modal.onClose ? modal.onClose.bind(modal) : null;
        modal.onClose = function () {
          if (origClose) origClose();
          rerender();
        };
        modal.open();
      }).open();
    };

    const newAssetBtn = btnGroup.createEl("button", { cls: "pc-action-btn", text: "\uFF0B Asset" });
    newAssetBtn.onclick = () => {
      const modal = new CreateAssetModal(app, plugin);
      const origClose = modal.onClose ? modal.onClose.bind(modal) : null;
      modal.onClose = function () {
        if (origClose) origClose();
        rerender();
      };
      modal.open();
    };

    const updateBtn = btnGroup.createEl("button", {
      cls: "pc-update-prices-btn",
      text: "\u21BB Update prices",
    });
    updateBtn.onclick = async () => {
      updateBtn.disabled = true;
      const notices = [];
      try {
        // Step 1: refresh FX rates (prerequisite for RUB conversions).
        updateBtn.textContent = "FX\u2026";
        let fxResult = { updated: false };
        try {
          fxResult = await updateFxRates(settings);
          if (fxResult.updated) {
            await plugin.saveSettings();
            notices.push(`\u2713 FX ${fxResult.source}`);
          } else if (fxResult.error) {
            notices.push(`\u26A0 FX: ${fxResult.error}`);
          }
        } catch (e) {
          console.warn("[PC] FX update threw:", e);
          notices.push(`\u26A0 FX: ${e.message || e}`);
        }

        // Step 2: update asset prices.
        updateBtn.textContent = "Updating\u2026";
        const result = await updateAllAssetPrices(app, settings, (ticker) => {
          updateBtn.textContent = `Fetching ${ticker}\u2026`;
        });
        if (result.updated > 0) {
          const divTotal = result.results.reduce((s, r) => s + (r.divsAdded || 0), 0);
          let msg = `\u2713 ${result.updated}/${result.total} asset(s)`;
          if (divTotal > 0) msg += `, ${divTotal} div(s)`;
          notices.push(msg);
          await renderDashboard(app, settings, dashContainer, plugin);
        } else if (result.errors.length > 0) {
          console.warn(
            "[PC] Price update issues:\n" +
              result.errors.map((e) => `${e.ticker}: ${e.error}`).join("\n")
          );
          notices.push("\u26A0 Prices: see console");
        } else {
          notices.push("Prices up to date");
          if (fxResult.updated) await renderDashboard(app, settings, dashContainer, plugin);
        }

        // Step 3: template catch-up — auto-log deposit interest etc. Runs
        // after prices so compounding uses the freshest totals. Best-effort:
        // any failure here is logged but doesn't fail the whole pipeline.
        updateBtn.textContent = "Templates\u2026";
        try {
          const tplResult = await applyTemplates(app, settings);
          if (tplResult.opsApplied > 0) {
            notices.push(
              `\u2713 ${tplResult.opsApplied} auto-op(s) / ${tplResult.depositsAffected} deposit(s)`
            );
            await renderDashboard(app, settings, dashContainer, plugin);
          }
        } catch (e) {
          console.warn("[PC] template catch-up threw:", e);
          notices.push(`\u26A0 templates: ${e.message || e}`);
        }

        showNotice(notices.join(" \u00B7 "), 4500);
      } catch (e) {
        showNotice("Update failed: " + (e.message || e), 4000);
      }
      updateBtn.disabled = false;
      updateBtn.textContent = "\u21BB Update prices";
    };
  }
  const grid = container.createDiv({ cls: "pc-asset-grid" });
  let openAsset = null;
  let openAccordion = null;
  const cardEls = [];

  for (const a of assets) {
    const m = computeAssetMetrics(a);
    const positive = a.plAmount >= 0;
    const sym = a.currency;

    // ── Card ──
    const card = grid.createDiv({
      cls: `pc-asset-card ${positive ? "pc-asset-card--pos" : "pc-asset-card--neg"}`,
    });
    makeInteractive(card);
    cardEls.push({ card, asset: a });

    // Header: ticker + type badge
    const hdr = card.createDiv({ cls: "pc-asset-hdr" });
    const hdrLeft = hdr.createDiv({ cls: "pc-asset-hdr-left" });
    hdrLeft.createEl("div", { cls: "pc-asset-ticker", text: a.name });
    hdrLeft.createEl("span", {
      cls: "pc-asset-sub",
      text: `${a.type} \u00B7 ${sym}` + (a.currentQty > 0 ? ` \u00D7${a.currentQty}` : ""),
    });

    // CAGR badge (top right) — only if meaningful
    if (Math.abs(m.cagr) > 0.01) {
      const cagrCls = m.cagr >= 0 ? "pc-pos" : "pc-neg";
      hdr.createEl("span", {
        cls: `pc-asset-cagr-badge ${cagrCls}`,
        text: `${m.cagr >= 0 ? "+" : ""}${fmt(m.cagr, 1)}% anum`,
      });
    }

    // Spacer
    card.createDiv({ cls: "pc-asset-spacer" });

    // Hero value
    card.createEl("div", { cls: "pc-asset-value", text: `${fmt(a.currentValue, 0)} ${sym}` });

    // P&L row
    const plArrow = positive ? "\u2191" : "\u2193";
    const plCls = positive ? "pc-pos" : "pc-neg";
    const plRow = card.createDiv({ cls: "pc-asset-pl-row" });
    plRow.createEl("span", {
      cls: `pc-asset-pl-amt ${plCls}`,
      text: `${fmtSigned(a.plAmount, 0)} ${sym}`,
    });
    plRow.createEl("span", {
      cls: `pc-asset-pl-pct ${plCls}`,
      text: `${plArrow} ${fmt(Math.abs(a.plPct), 1)}%`,
    });

    // ── Accordion panel (inserted right after card, spans full width) ──
    const accordion = grid.createDiv({ cls: "pc-asset-accordion" });
    accordion.style.display = "none";

    card.onclick = () => {
      const wasOpen = openAsset === a;

      // Close any open accordion
      cardEls.forEach((ce) => ce.card.classList.remove("pc-asset-card--open"));
      if (openAccordion) {
        openAccordion.style.display = "none";
        openAccordion = null;
      }

      if (wasOpen) {
        openAsset = null;
        return;
      }

      // Open this accordion
      openAsset = a;
      openAccordion = accordion;
      card.classList.add("pc-asset-card--open");
      accordion.empty();
      accordion.style.display = "block";

      // Detail header
      accordion.createEl("div", { cls: "pc-asset-detail-title", text: a.name });

      // Key metrics row (highlighted)
      const metricsRow = accordion.createDiv({ cls: "pc-asset-metrics" });
      const metricItems = [
        {
          label: "Total Return",
          value: `${m.totalReturn >= 0 ? "+" : ""}${fmt(m.totalReturn, 1)}%`,
          cls: m.totalReturn >= 0 ? "pc-pos" : "pc-neg",
        },
        { label: "Yield on Cost", value: `${fmt(m.yieldOnCost, 2)}%`, cls: "pc-neutral" },
        {
          label: "CAGR",
          value: `${m.cagr >= 0 ? "+" : ""}${fmt(m.cagr, 1)}%`,
          cls: m.cagr >= 0 ? "pc-pos" : "pc-neg",
        },
        { label: "Income Total", value: `${fmt(a.passiveIncomeTot, 0)} ${sym}`, cls: "pc-neutral" },
      ];
      for (const mi of metricItems) {
        const item = metricsRow.createDiv({ cls: "pc-asset-metric" });
        item.createEl("div", { cls: `pc-asset-metric-val ${mi.cls}`, text: mi.value });
        item.createEl("div", { cls: "pc-asset-metric-label", text: mi.label });
      }

      // Detail rows
      const rows = [
        ["Current price", a.currentPrice != null ? `${a.currentPrice} ${sym}` : "\u2014"],
        ["Avg cost", a.currentQty > 0 ? `${fmt(m.invested / a.currentQty, 2)} ${sym}` : "\u2014"],
        ["Total invested", `${fmt(m.invested, 0)} ${sym}`],
        ["P&L (price)", `${fmtSigned(a.plAmount, 0)} ${sym}`],
        ["Passive income", `${fmt(a.passiveIncomeTot, 0)} ${sym}`],
        ["Since", a.initialDate ?? "\u2014"],
        ["Last updated", a.lastUpdated ?? "\u2014"],
      ];

      const detailGrid = accordion.createDiv({ cls: "pc-asset-detail-grid" });
      for (const [k, v] of rows) {
        const row = detailGrid.createDiv({ cls: "pc-asset-detail-row" });
        row.createEl("span", { cls: "pc-asset-detail-key", text: k });
        row.createEl("span", { cls: "pc-asset-detail-val", text: String(v) });
      }
    };
  }
}

export { computeAssetMetrics, renderAssetCards };
