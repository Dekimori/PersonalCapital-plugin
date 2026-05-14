// @ts-nocheck — transitional; types incremental per file
import { Modal } from "obsidian";
import { toNum, showNotice, killWheelChange, getOrAssignAssetId } from "../../core/utils";
import { recalcAsset } from "../../domain/assets/recalc";
import { writeLedgerEntry } from "../../domain/ledger/io";
import { readAccounts } from "../../domain/accounts/io";

class AddAssetLineModal extends Modal {
  constructor(app, file, plugin) {
    super(app);
    this.file = file;
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl, file } = this;
    contentEl.empty();

    // Read frontmatter once — deposit vs generic asset changes op labels,
    // field visibility, and what "close" means in the archive prompt.
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    const isDeposit = String(fm.type || "").toLowerCase() === "deposit";
    const principal = toNum(fm.total_invested);
    const expectedClose = toNum(fm.current_value) || principal;
    // Use actual current qty for deposit close — a deposit that was topped up
    // (buy qty=1 repeated) has qty>1, and forcing qty=1 on close would leave
    // the position non-zero. Default to 1 when unset (brand-new deposit).
    const depositQty = Math.max(1, toNum(fm.current_qty) || 1);

    contentEl.createEl("h2", {
      text: (isDeposit ? "Update deposit: " : "Update ") + file.basename,
    });

    const today = new Date().toISOString().slice(0, 10);
    const form = contentEl.createDiv({ cls: "personal-capital-form" });
    const row = (label, input) => {
      const d = form.createDiv();
      d.createEl("label", { text: label });
      d.appendChild(input);
      return input;
    };

    const dateIn = row("Date", contentEl.createEl("input", { type: "date" }));
    dateIn.value = today;
    dateIn.addClass("personal-capital-input");

    // Deposit ops use human language; hide reinvest/price (no market concept).
    const opIn = row("Operation", contentEl.createEl("select"));
    const opOptions = isDeposit
      ? [
          ["buy", "Top up deposit"],
          ["sell", "Close deposit"],
          ["div", "Interest paid to account"],
        ]
      : [
          ["buy", "Buy \u2014 purchase shares/units"],
          ["sell", "Sell \u2014 liquidate shares/units"],
          ["div", "Div \u2014 dividend / coupon / interest (cash received)"],
          ["reinvest", "Reinvest \u2014 auto-reinvested (no cash flow)"],
          ["adjust", "Adjust \u2014 correct cost basis (no qty change)"],
          ["price", "Price \u2014 update current price (no transaction)"],
        ];
    opOptions.forEach(([val, label]) => {
      const o = opIn.createEl("option", { text: label });
      o.value = val;
    });
    opIn.addClass("personal-capital-input");

    const qtyWrap = form.createDiv();
    qtyWrap.createEl("label", { text: "Quantity (units)" });
    const qtyIn = qtyWrap.createEl("input", { type: "number", step: "any" });
    qtyIn.placeholder = "e.g. 5";
    qtyIn.addClass("personal-capital-input");
    killWheelChange(qtyIn);

    const priceWrap = form.createDiv();
    priceWrap.createEl("label", { text: "Price per unit / total amount" });
    const priceIn = priceWrap.createEl("input", { type: "number", step: "any" });
    priceIn.placeholder = "e.g. 186.50";
    priceIn.addClass("personal-capital-input");
    killWheelChange(priceIn);

    // "Set as current price" — lets users correct current_price inline when
    // recording a buy/sell/reinvest, instead of having to add a separate
    // `price` op. When checked, emits a body price line alongside the main
    // line at submit. Hidden for deposits (no market price concept) and for
    // div/price ops where it's nonsense.
    const setCurrentPriceWrap = form.createDiv();
    const setCurrentPriceLabel = setCurrentPriceWrap.createEl("label");
    const setCurrentPriceIn = setCurrentPriceLabel.createEl("input", { type: "checkbox" });
    setCurrentPriceLabel.appendText(" Set as current price");

    // Commission / fee (optional) — affects cash flow on the account.
    // For buys, cost basis grows by fee. For sells, proceeds shrink by fee.
    const feeWrap = form.createDiv();
    feeWrap.createEl("label", { text: "Commission / fee (optional)" });
    const feeIn = feeWrap.createEl("input", { type: "number", step: "any" });
    feeIn.placeholder = "0";
    feeIn.addClass("personal-capital-input");
    killWheelChange(feeIn);

    // Account picker (source for buys, destination for sells/divs)
    const acctWrap = form.createDiv();
    acctWrap.createEl("label", { text: "Account" });
    const acctIn = acctWrap.createEl("select");
    acctIn.createEl("option", { text: "\u2014 none \u2014", value: "" });
    acctIn.addClass("personal-capital-input");
    readAccounts(this.app, this.plugin.settings).then((accts) => {
      for (const a of accts) acctIn.createEl("option", { text: a.name, value: a.name });
    });

    // Show/hide qty based on op
    const updateFields = () => {
      const op = opIn.value;
      // Qty hidden for div/price/adjust (no units involved) and for deposit sell
      // (always 1 — user only enters the actual amount received).
      qtyWrap.style.display =
        op === "div" || op === "price" || op === "adjust" || (isDeposit && op === "sell")
          ? "none"
          : "";
      // Price label & placeholder — deposit mode uses plain-language wording.
      const priceLabel = priceWrap.querySelector("label");
      if (isDeposit) {
        priceLabel.textContent =
          op === "sell"
            ? "Actual amount received"
            : op === "div"
              ? "Interest amount"
              : op === "buy"
                ? "Top-up amount"
                : "Amount";
        priceIn.placeholder =
          op === "sell" && expectedClose > 0
            ? `expected ≈ ${expectedClose}`
            : op === "div"
              ? "e.g. 6250"
              : "e.g. 500000";
      } else {
        priceLabel.textContent =
          op === "div"
            ? "Total amount received"
            : op === "price"
              ? "Current price"
              : op === "adjust"
                ? "Adjustment amount"
                : "Price per unit";
        priceIn.placeholder = op === "adjust" ? "e.g. 1407 (added to cost basis)" : "e.g. 186.50";
      }
      // Reinvest = no cash flow, so the account picker makes no sense there.
      // Hiding it also removes the temptation to set `entry.from` which would
      // phantom-drain the chosen account.
      acctWrap.style.display = op === "price" || op === "reinvest" || op === "adjust" ? "none" : "";
      const acctLabel = acctWrap.querySelector("label");
      if (isDeposit) {
        acctLabel.textContent =
          op === "sell" ? "To account" : op === "div" ? "To account" : "From account";
      } else {
        acctLabel.textContent =
          op === "sell" || op === "div" ? "Destination account" : "Source account";
      }
      // Fee only applies to actual transactions against an account.
      feeWrap.style.display = op === "buy" || op === "sell" ? "" : "none";
      // "Set as current price" not relevant for adjust.

      // Inline "set as current price" — makes sense only for non-deposit
      // buy/sell/reinvest (those carry a unit price). Hidden otherwise.
      setCurrentPriceWrap.style.display =
        !isDeposit && (op === "buy" || op === "sell" || op === "reinvest") ? "" : "none";
    };
    opIn.addEventListener("change", updateFields);
    updateFields();

    const btns = contentEl.createDiv({ cls: "personal-capital-buttons" });
    const addBtn = btns.createEl("button", { text: "Add", cls: "mod-cta" });
    const cancel = btns.createEl("button", { text: "Cancel" });
    cancel.onclick = () => this.close();

    addBtn.onclick = async () => {
      const date = dateIn.value || today;
      const op = opIn.value;
      let price = priceIn.value.trim();
      if (!price) {
        showNotice("Price/amount is required");
        return;
      }

      // Deposit close: user enters TOTAL amount received; convert to per-unit
      // price so qty * price math stays correct across the ledger and parser.
      if (isDeposit && op === "sell") {
        const total = toNum(price);
        const perUnit = total / depositQty;
        price = String(parseFloat(perUnit.toFixed(4)));
      }

      // Deposit sell = use the full current_qty so close zeros out cleanly
      // even when the deposit was topped up (qty > 1). Price field holds the
      // total amount received; we split it per unit below.
      const qty =
        op === "div" || op === "price"
          ? "\u2014"
          : isDeposit && op === "sell"
            ? String(depositQty)
            : qtyIn.value.trim() || "1";
      // Parse fee once — reused below for ledger amt AND for the body line.
      const numFee = Math.max(0, toNum(feeIn.value));

      // Write to ledger FIRST (source of truth) — except price updates.
      // Resolve asset_id once: assigns + persists one for legacy assets that
      // never went through the create modal or migration. Idempotent if id
      // already exists in fm.
      const assetId = op !== "price" ? await getOrAssignAssetId(this.app, file) : null;
      if (op !== "price") {
        const entry = { d: date, asset: file.basename, asset_id: assetId };
        const numQty = toNum(qty);
        const numPrice = toNum(price);
        if (op === "buy" || op === "reinvest") {
          entry.type = "buy";
          entry.qty = numQty;
          entry.price = numPrice;
          // amt is cash movement (incl. fee); cost basis stays qty*price — fee is
          // kept out of basis so P&L isn't skewed by broker commissions.
          entry.amt = numQty * numPrice + numFee;
          if (numFee > 0) entry.fee = numFee;
          // Only a real `buy` moves cash off a source account. Reinvest is a
          // non-cash unit increase (dividend → shares), so no `from`.
          if (op === "buy" && acctIn.value) entry.from = acctIn.value;
          if (op === "reinvest") entry.note = "reinvest";
        } else if (op === "sell") {
          entry.type = "sell";
          entry.qty = numQty;
          entry.price = numPrice;
          // Net proceeds hitting the account (gross − fee). Cost basis is
          // already fee-free, so P&L reflects fee impact only on sell side.
          entry.amt = Math.max(0, numQty * numPrice - numFee);
          if (numFee > 0) entry.fee = numFee;
          if (acctIn.value) entry.to = acctIn.value;
        } else if (op === "div") {
          entry.type = "dividend";
          entry.amt = numPrice;
          if (acctIn.value) entry.to = acctIn.value;
        } else if (op === "adjust") {
          entry.type = "adjust";
          entry.amt = numPrice;
          entry.note = "cost basis adjustment";
        }
        await writeLedgerEntry(this.app, this.plugin.settings, entry);
      }

      // Write body as derived view. Fee shown as 5th column for transparency;
      // parseAssetBody ignores anything past column 4, so this is safe.
      const line =
        (op === "buy" || op === "sell") && numFee > 0
          ? `${date} | ${op} | ${qty} | ${price} | fee=${numFee}`
          : `${date} | ${op} | ${qty} | ${price}`;
      // "Set as current price" inline — emits an extra price op after the main
      // line, so the asset's current_price reflects this transaction's price
      // without forcing users to add a separate `price` op manually.
      const extraPriceLine =
        !isDeposit &&
        setCurrentPriceIn.checked &&
        (op === "buy" || op === "sell" || op === "reinvest")
          ? `${date} | price | \u2014 | ${price}`
          : null;
      const insertedLines = extraPriceLine ? `${line}\n${extraPriceLine}` : line;
      const raw = await this.app.vault.read(file);
      const fmEnd = raw.indexOf("---", 3);
      let newContent;
      if (fmEnd === -1) {
        newContent = insertedLines + "\n" + raw.trimEnd() + "\n";
      } else {
        const afterFm = raw.slice(fmEnd + 3).replace(/^\n?/, "");
        newContent = raw.slice(0, fmEnd + 3) + "\n" + insertedLines + "\n" + afterFm;
      }
      await this.app.vault.modify(file, newContent);

      // Recalculate frontmatter — returns computed stats directly (no stale cache)
      const stats = await recalcAsset(this.app, file, this.plugin.settings);

      showNotice(`Added ${op} line to ${file.basename}`);

      // Close position detection: if sell and remaining qty = 0
      if (op === "sell") {
        const updatedQty = stats ? stats.currentQty : 1;
        if (updatedQty <= 0) {
          // Offer to archive
          const archiveModal = new Modal(this.app);
          archiveModal.titleEl.setText(isDeposit ? "Deposit closed" : "Position closed");
          archiveModal.contentEl.createEl("p", {
            text: isDeposit
              ? `${file.basename} has been closed. Archive this deposit?`
              : `${file.basename} has 0 units remaining. Archive this position?`,
          });
          const archBtns = archiveModal.contentEl.createDiv({ cls: "personal-capital-buttons" });
          const archBtn = archBtns.createEl("button", { text: "Archive", cls: "mod-cta" });
          archBtns.createEl("button", { text: "Keep" }).onclick = () => archiveModal.close();
          archBtn.onclick = async () => {
            // Write close entry to ledger. assetId is already resolved above
            // (sell path always reaches it) so reuse without another lookup.
            await writeLedgerEntry(this.app, this.plugin.settings, {
              d: date,
              type: "close",
              asset: file.basename,
              asset_id: assetId,
              amt: 0,
              note: "position closed",
            });
            // Move to archive
            const archFolder = this.plugin.settings.archiveFolder || "finance/Data/archive";
            if (!this.app.vault.getAbstractFileByPath(archFolder)) {
              await this.app.vault.createFolder(archFolder).catch(() => {});
            }
            const newPath = `${archFolder}/${file.basename}.md`;
            await this.app.fileManager.renameFile(file, newPath);
            // Update frontmatter
            const archivedFile = this.app.vault.getAbstractFileByPath(newPath);
            if (archivedFile) {
              await this.app.fileManager.processFrontMatter(archivedFile, (fm) => {
                fm.status = "closed";
                fm.closed_date = date;
                // Strip auto-log template — closed deposits shouldn't accrue
                // further. The engine already guards on currentQty<=0, but
                // cleaning up keeps archive files tidy and prevents confusion
                // if a user reopens the position later.
                if (fm.template) delete fm.template;
              });
            }
            showNotice(`\u2713 ${file.basename} archived`);
            archiveModal.close();
          };
          archiveModal.open();
        }
      }

      this.close();
    };
  }
}

export { AddAssetLineModal };
