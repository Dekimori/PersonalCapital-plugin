// @ts-nocheck — transitional; types incremental per file
import { Modal } from "obsidian";
import { ASSET_TYPES } from "../../core/constants";
import { toNum, showNotice, fmt, killWheelChange, makeAssetId } from "../../core/utils";
import { recalcAsset } from "../../domain/assets/recalc";
import { writeLedgerEntry } from "../../domain/ledger/io";
import { readAccounts } from "../../domain/accounts/io";
import { resolveSpec } from "../../domain/assets/futures-specs";

class CreateAssetModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Add new asset" });

    const form = contentEl.createDiv({ cls: "personal-capital-form" });
    const row = (label, input) => {
      const d = form.createDiv();
      d.createEl("label", { text: label });
      d.appendChild(input);
      return input;
    };

    // Type first — drives field visibility, so user picks this before anything
    // else. Prevents "why is this field here" confusion for deposits/bonds.
    const typeIn = row("Type", contentEl.createEl("select"));
    ASSET_TYPES.forEach((t) => {
      const o = typeIn.createEl("option", { text: t });
      o.value = t;
    });
    typeIn.addClass("personal-capital-input");

    const nameIn = row("Ticker / Name", contentEl.createEl("input", { type: "text" }));
    nameIn.placeholder = "e.g. SBER, AAPL, MyDeposit";
    nameIn.addClass("personal-capital-input");

    const tickerIn = row(
      "Exchange ticker (optional)",
      contentEl.createEl("input", { type: "text" })
    );
    tickerIn.placeholder = "e.g. T for Т-Технологии, SPBE for SPB Exchange";
    tickerIn.addClass("personal-capital-input");

    const currIn = row("Currency", contentEl.createEl("input", { type: "text" }));
    currIn.value = "RUB";
    currIn.addClass("personal-capital-input");

    // Face value wrapper — visible only for bonds.
    const faceWrap = form.createDiv();
    faceWrap.createEl("label", { text: "Face value (bonds only)" });
    const faceIn = faceWrap.createEl("input", { type: "number", step: "any" });
    faceIn.placeholder = "1000 (default for Russian bonds)";
    faceIn.addClass("personal-capital-input");
    killWheelChange(faceIn);

    // Futures: multiplier (currency per point). Auto-suggested from MOEX ISS
    // or bundled global table when user enters a ticker. Editable override.
    const multiplierWrap = form.createDiv();
    const multiplierLabelRow = multiplierWrap.createDiv({ cls: "pc-multiplier-label-row" });
    multiplierLabelRow.createEl("label", { text: "Multiplier (per point)" });
    const multiplierHint = multiplierLabelRow.createEl("span", {
      cls: "pc-multiplier-hint",
      text: "",
    });
    const multiplierIn = multiplierWrap.createEl("input", { type: "number", step: "any" });
    multiplierIn.placeholder = "auto or manual";
    multiplierIn.addClass("personal-capital-input");
    killWheelChange(multiplierIn);

    // Futures: expiry date (informational).
    const expiryWrap = form.createDiv();
    expiryWrap.createEl("label", { text: "Expiry date (optional)" });
    const expiryIn = expiryWrap.createEl("input", { type: "date" });
    expiryIn.addClass("personal-capital-input");

    // Auto-suggest multiplier when ticker changes and type is futures.
    let fetchingSpec = false;
    const suggestMultiplier = async () => {
      const ticker = (tickerIn.value || nameIn.value).trim();
      if (!ticker || typeIn.value !== "futures" || fetchingSpec) return;
      fetchingSpec = true;
      multiplierHint.textContent = "looking up…";
      try {
        const spec = await resolveSpec(ticker, currIn.value);
        if (spec) {
          if (!multiplierIn.value) multiplierIn.value = String(spec.multiplier);
          multiplierHint.textContent = spec.description;
        } else {
          multiplierHint.textContent = "not found, enter manually";
        }
      } catch {
        multiplierHint.textContent = "lookup failed";
      }
      fetchingSpec = false;
    };
    tickerIn.addEventListener("blur", suggestMultiplier);
    nameIn.addEventListener("blur", () => {
      if (!tickerIn.value.trim()) suggestMultiplier();
    });

    const priceIn = row(
      "Initial price / value",
      contentEl.createEl("input", { type: "number", step: "any" })
    );
    priceIn.placeholder = "e.g. 185.50";
    priceIn.addClass("personal-capital-input");
    killWheelChange(priceIn);

    const qtyIn = row(
      "Initial quantity",
      contentEl.createEl("input", { type: "number", step: "any" })
    );
    qtyIn.placeholder = "e.g. 10";
    qtyIn.addClass("personal-capital-input");
    killWheelChange(qtyIn);

    const feeIn = row(
      "Commission / fee (optional)",
      contentEl.createEl("input", { type: "number", step: "any" })
    );
    feeIn.placeholder = "0";
    feeIn.addClass("personal-capital-input");
    killWheelChange(feeIn);

    const dateIn = row("Initial date", contentEl.createEl("input", { type: "date" }));
    dateIn.value = new Date().toISOString().slice(0, 10);
    dateIn.addClass("personal-capital-input");

    // Source account picker
    const srcWrap = form.createDiv();
    srcWrap.createEl("label", { text: "Source account" });
    const srcIn = srcWrap.createEl("select");
    srcIn.createEl("option", { text: "— none —", value: "" });
    srcIn.addClass("personal-capital-input");

    // Manual-only toggle — skips this asset during "Update prices".
    const manualWrap = form.createDiv();
    const manualLabel = manualWrap.createEl("label");
    const manualIn = manualLabel.createEl("input", { type: "checkbox" });
    manualLabel.appendText(" Manual only (skip auto price updates)");

    // Dividend routing (hidden for bonds — coupons are always cash).
    const divPolicyWrap = form.createDiv();
    divPolicyWrap.createEl("label", { text: "Dividend policy" });
    const divPolicyIn = divPolicyWrap.createEl("select");
    [
      ["cash", "Cash \u2014 pay out to account"],
      ["reinvest", "Reinvest \u2014 auto-buy more units"],
    ].forEach(([val, label]) => {
      const o = divPolicyIn.createEl("option", { text: label });
      o.value = val;
    });
    divPolicyIn.addClass("personal-capital-input");

    // Dividend destination account (defaults to source account; user can override).
    const divAcctWrap = form.createDiv();
    divAcctWrap.createEl("label", { text: "Dividend account" });
    const divAcctIn = divAcctWrap.createEl("select");
    divAcctIn.createEl("option", { text: "— none —", value: "" });
    divAcctIn.addClass("personal-capital-input");

    // Load accounts into both src + divAcct selects
    readAccounts(this.app, this.plugin.settings).then((accts) => {
      for (const a of accts) {
        srcIn.createEl("option", { text: a.name, value: a.name });
        divAcctIn.createEl("option", { text: a.name, value: a.name });
      }
    });

    // Mirror src → divAcct when user picks source (so dividends default to
    // where cash came from). User can still override manually.
    let divAcctTouched = false;
    divAcctIn.addEventListener("change", () => {
      divAcctTouched = true;
    });
    srcIn.addEventListener("change", () => {
      if (!divAcctTouched) divAcctIn.value = srcIn.value;
    });

    // Deposit auto-log template — opt-in via "Add template" button. When the
    // user reveals the section and fills it, the deposit's frontmatter carries
    // a `template:` block; the "Update prices" pipeline then auto-logs periodic
    // interest ops (cash → div + ledger entry; capitalize → principal grows).
    // Whole section hidden unless type=deposit (see updateTypeFields).
    const tplWrap = form.createDiv({ cls: "pc-template-wrap" });
    const tplToggleBtn = tplWrap.createEl("button", {
      text: "+ Add auto-log template",
      cls: "pc-action-btn pc-template-toggle",
    });
    tplToggleBtn.type = "button"; // avoid accidental form submit
    const tplFields = tplWrap.createDiv({ cls: "pc-template-fields" });
    tplFields.style.display = "none";
    tplFields.createEl("p", {
      text: "The plugin will auto-log interest payments each time you click \u201CUpdate prices\u201D. You can still record or override entries manually at any time.",
      cls: "pc-template-hint",
    });

    const tplRateRow = tplFields.createDiv();
    tplRateRow.createEl("label", { text: "Interest rate (% per year)" });
    const tplRateIn = tplRateRow.createEl("input", { type: "number", step: "any" });
    tplRateIn.placeholder = "e.g. 18.5";
    tplRateIn.addClass("personal-capital-input");
    killWheelChange(tplRateIn);

    const tplFreqRow = tplFields.createDiv();
    tplFreqRow.createEl("label", { text: "Payment every N days" });
    const tplFreqIn = tplFreqRow.createEl("input", { type: "number", step: "1" });
    tplFreqIn.placeholder = "30";
    tplFreqIn.addClass("personal-capital-input");
    killWheelChange(tplFreqIn);

    const tplModeRow = tplFields.createDiv();
    tplModeRow.createEl("label", { text: "Payout mode" });
    const tplModeIn = tplModeRow.createEl("select");
    [
      ["cash", "Paid to account (cash)"],
      ["capitalize", "Capitalized (added to deposit)"],
    ].forEach(([val, label]) => {
      const o = tplModeIn.createEl("option", { text: label });
      o.value = val;
    });
    tplModeIn.addClass("personal-capital-input");

    const tplFirstRow = tplFields.createDiv();
    tplFirstRow.createEl("label", { text: "First payment date" });
    const tplFirstIn = tplFirstRow.createEl("input", { type: "date" });
    tplFirstIn.addClass("personal-capital-input");

    // Maturity / end date — when set, the template engine stops accruing on
    // this date, pays the final partial period, returns principal to the
    // source account, and archives the deposit. Optional: blank means
    // open-ended (legacy behaviour).
    const tplEndRow = tplFields.createDiv();
    tplEndRow.createEl("label", { text: "Maturity date (optional)" });
    const tplEndIn = tplEndRow.createEl("input", { type: "date" });
    tplEndIn.addClass("personal-capital-input");

    let tplEnabled = false;
    tplToggleBtn.onclick = (e) => {
      e.preventDefault();
      tplEnabled = !tplEnabled;
      tplFields.style.display = tplEnabled ? "" : "none";
      tplToggleBtn.textContent = tplEnabled
        ? "\u00D7 Remove auto-log template"
        : "+ Add auto-log template";
      if (tplEnabled && !tplFirstIn.value) {
        // Sensible default: first payment 30 days after the deposit's start date.
        const startDate = dateIn.value || new Date().toISOString().slice(0, 10);
        const d = new Date(startDate);
        d.setDate(d.getDate() + 30);
        tplFirstIn.value = d.toISOString().slice(0, 10);
      }
      if (tplEnabled && !tplFreqIn.value) tplFreqIn.value = "30";
    };

    // Show/hide fields based on asset type. Mirrors updateFields() pattern
    // from asset-line.js — single source of truth for field visibility.
    const updateTypeFields = () => {
      const t = typeIn.value;
      const isDeposit = t === "deposit";
      const isFutures = t === "futures";
      faceWrap.style.display = t === "bond" ? "" : "none";
      multiplierWrap.style.display = isFutures ? "" : "none";
      expiryWrap.style.display = isFutures ? "" : "none";
      tplWrap.style.display = isDeposit ? "" : "none";
      // Bonds: coupons are always cash (you can't reinvest a coupon into the
      // same bond issue). Deposits: interest always cash. Materials/crypto:
      // no dividends either, but we keep the field in case of future edge cases.
      divPolicyWrap.style.display = t === "bond" || isDeposit || isFutures ? "none" : "";
      // Deposit-mode UI: ticker + qty are meaningless (single-position asset),
      // dividend_account is redundant (always = source). Hide them and relabel
      // the remaining fields in plain human language.
      tickerIn.parentElement.style.display = isDeposit ? "none" : "";
      qtyIn.parentElement.style.display = isDeposit ? "none" : "";
      divAcctWrap.style.display = isDeposit ? "none" : "";
      // Dynamic labels — swap to deposit-friendly wording.
      nameIn.parentElement.querySelector("label").textContent = isDeposit
        ? "Deposit name"
        : isFutures
          ? "Contract name"
          : "Ticker / Name";
      priceIn.parentElement.querySelector("label").textContent = isDeposit
        ? "Deposit amount"
        : isFutures
          ? "Entry price (points)"
          : "Initial price / value";
      nameIn.placeholder = isDeposit
        ? "e.g. Tinkoff \u0432\u043A\u043B\u0430\u0434"
        : isFutures
          ? "e.g. SFM6, SiZ6"
          : "e.g. SBER, AAPL, MyDeposit";
      priceIn.placeholder = isDeposit ? "e.g. 500000" : isFutures ? "e.g. 735.9" : "e.g. 185.50";
      // Button label follows context too.
      if (create) create.textContent = isDeposit ? "Open deposit" : "Create";
    };
    typeIn.addEventListener("change", updateTypeFields);

    const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
    const create = btns.createEl("button", { text: "Create", cls: "mod-cta" });
    const cancel = btns.createEl("button", { text: "Cancel" });
    cancel.onclick = () => this.close();

    // Initial visibility — now that `create` exists, let updateTypeFields
    // set the button label too. Called here (not right after definition) so
    // the `if (create)` guard sees a real button reference on first paint.
    updateTypeFields();

    create.onclick = async () => {
      const rawName = nameIn.value.trim();
      if (!rawName) {
        showNotice("Name is required");
        return;
      }
      const name = rawName.replace(/[\\/:]/g, "-");
      if (name !== rawName) {
        showNotice(`Renamed to "${name}" (filenames can't contain \\ / :)`);
        nameIn.value = name;
      }

      const assetsFolder = this.plugin.settings.assetsFolder;
      const folderFile = this.app.vault.getAbstractFileByPath(assetsFolder);
      if (!folderFile) await this.app.vault.createFolder(assetsFolder);

      const path = `${assetsFolder}/${name}.md`;
      if (this.app.vault.getAbstractFileByPath(path)) {
        showNotice("Asset already exists: " + name);
        return;
      }

      // Deposit = single-position asset, qty field is hidden and forced to 1
      // so the "buy 1 @ amount" record models the opening deposit correctly.
      const assetType = typeIn.value;
      const qty = assetType === "deposit" ? "1" : qtyIn.value.trim();
      const price = priceIn.value.trim();
      const date = dateIn.value.trim();

      // Build frontmatter. `id` is the canonical join key for ledger entries —
      // generated once at creation, never edited, decoupled from the file name
      // so users can rename the .md file without orphaning historical entries.
      const assetId = makeAssetId();
      const tickerVal = tickerIn.value.trim();
      const faceVal = faceIn.value.trim();
      const fmLines = ["---", `id: ${assetId}`, `name: ${name}`];
      if (tickerVal) fmLines.push(`ticker: ${tickerVal}`);
      fmLines.push(`type: ${assetType}`, `currency: ${currIn.value.toUpperCase().trim() || "RUB"}`);
      if (assetType === "bond" && faceVal) fmLines.push(`face_value: ${faceVal}`);
      if (assetType === "futures") {
        const mult = toNum(multiplierIn.value);
        if (mult > 0) fmLines.push(`multiplier: ${mult}`);
        const expiry = expiryIn.value.trim();
        if (expiry) fmLines.push(`expiry: ${expiry}`);
      }
      // Dividend routing: bonds/deposits skip policy (always cash by nature).
      // Other types default to `cash` unless user chose `reinvest`.
      if (assetType !== "bond" && assetType !== "deposit") {
        fmLines.push(`dividend_policy: ${divPolicyIn.value}`);
      }
      // Default dividend destination = source account unless user overrode.
      const dividendAccount = divAcctIn.value || srcIn.value;
      if (dividendAccount) fmLines.push(`dividend_account: ${dividendAccount}`);

      // Deposit auto-log template — YAML nested block. The template engine
      // (src/assets/templates.js) reads this on "Update prices" and writes
      // periodic div/capitalize ops up to today.
      if (assetType === "deposit" && tplEnabled) {
        const tplRate = toNum(tplRateIn.value);
        const tplFreq = Math.max(1, Math.round(toNum(tplFreqIn.value) || 30));
        const tplMode = tplModeIn.value;
        const tplFirst = tplFirstIn.value.trim();
        const tplEnd = tplEndIn.value.trim();
        if (tplRate > 0 && tplFirst) {
          fmLines.push("template:");
          fmLines.push(`  rate: ${tplRate}`);
          fmLines.push(`  freq_days: ${tplFreq}`);
          fmLines.push(`  mode: ${tplMode}`);
          if (tplMode === "cash" && srcIn.value) fmLines.push(`  account: ${srcIn.value}`);
          fmLines.push(`  next_due: ${tplFirst}`);
          if (tplEnd) fmLines.push(`  end_date: ${tplEnd}`);
        }
      }

      if (manualIn.checked) fmLines.push("auto_update: false");

      fmLines.push(
        "current_qty:",
        "avg_cost:",
        "total_invested:",
        "current_price:",
        "current_value:",
        "pl_amount:",
        "pl_pct:",
        "passive_income_total:",
        `initial_date: ${date}`,
        `last_updated: ${date}`,
        "---"
      );
      const fm = fmLines.join("\n");

      const feeNum = Math.max(0, toNum(feeIn.value));

      // Build initial log line if qty + price provided
      const logLine =
        qty && price
          ? feeNum > 0
            ? `\n${date} | buy | ${qty} | ${price} | fee=${feeNum}\n`
            : `\n${date} | buy | ${qty} | ${price}\n`
          : "\n";

      await this.app.vault.create(path, fm + logLine);

      // Recalculate frontmatter from log line
      const newFile = this.app.vault.getAbstractFileByPath(path);
      if (newFile) await recalcAsset(this.app, newFile, this.plugin.settings);

      // Write to ledger. `asset_id` is the canonical join key; `asset` stays
      // for human readability (greppable JSONL, ledger-view labels) and as
      // fallback during the legacy migration window.
      if (qty && price) {
        const q = parseFloat(qty),
          p = parseFloat(price);
        // Futures: ledger amt in home currency (points × multiplier)
        const mult = assetType === "futures" ? toNum(multiplierIn.value) : 0;
        const amt = mult > 0 ? q * p * mult + feeNum : q * p + feeNum;
        const entry = {
          d: date,
          type: "buy",
          asset: name,
          asset_id: assetId,
          qty: q,
          price: p,
          amt,
        };
        if (feeNum > 0) entry.fee = feeNum;
        if (srcIn.value) entry.from = srcIn.value;
        await writeLedgerEntry(this.app, this.plugin.settings, entry);
      }

      showNotice("Created: " + name);
      this.close();
    };
  }
}

export { CreateAssetModal };
