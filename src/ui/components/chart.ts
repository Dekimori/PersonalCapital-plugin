// @ts-nocheck — transitional; types incremental per file
import { toNum, fmt, fmtSigned } from "../../core/utils";
import { getLiquidTotal } from "../../domain/accounts/balance";
import { buildCapitalTimeline } from "../../domain/budget/timeline";

// ── Grain canvas — pixel-level noise (ported from React GrainCanvas) ──
function paintGrainCanvas(container, w, h) {
  const canvas = document.createElement("canvas");
  canvas.className = "pc-grain-canvas";
  canvas.width = w * 2; // 2x for retina
  canvas.height = h * 2;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cw = canvas.width,
    ch = canvas.height;
  const imageData = ctx.createImageData(cw, ch);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const py = Math.floor(i / 4 / cw);
    const px = (i / 4) % cw;
    const ny = py / ch;

    // Grain fades in from 30% height and fades out at 85%
    const fadeIn = Math.max(0, (ny - 0.3) / 0.5);
    const fadeOut = Math.max(0, 1 - (ny - 0.85) / 0.15);
    const grainStrength = Math.min(fadeIn, fadeOut);

    if (grainStrength > 0 && Math.random() < grainStrength * 0.25) {
      const brightness = Math.random() * 140 + 60;
      const isTinted = Math.random() > 0.4;
      if (isTinted) {
        // Teal-green tinted particle
        d[i] = brightness * 0.3;
        d[i + 1] = brightness * 0.7;
        d[i + 2] = brightness * 0.4;
        d[i + 3] = Math.floor(grainStrength * (25 + Math.random() * 40));
      } else {
        // Neutral warm particle
        d[i] = brightness * 0.5;
        d[i + 1] = brightness * 0.7;
        d[i + 2] = brightness * 0.55;
        d[i + 3] = Math.floor(grainStrength * (12 + Math.random() * 25));
      }
    }

    // Subtle fold highlights for extra depth
    const fold1Center = 0.55;
    const fold1 = Math.max(0, 1 - Math.abs(ny - fold1Center) / 0.04);
    const fold1X = px / cw;
    const fold1XFade =
      fold1X > 0.15 && fold1X < 0.5 ? Math.sin(((fold1X - 0.15) / 0.35) * Math.PI) : 0;
    const fold2Center = 0.7;
    const fold2 = Math.max(0, 1 - Math.abs(ny - fold2Center) / 0.03);
    const fold2XFade =
      fold1X > 0.3 && fold1X < 0.7 ? Math.sin(((fold1X - 0.3) / 0.4) * Math.PI) : 0;
    const foldIntensity = fold1 * fold1XFade * 0.18 + fold2 * fold2XFade * 0.14;

    if (foldIntensity > 0.01) {
      d[i] = Math.min(255, d[i] + 120 * foldIntensity);
      d[i + 1] = Math.min(255, d[i + 1] + 180 * foldIntensity);
      d[i + 2] = Math.min(255, d[i + 2] + 130 * foldIntensity);
      d[i + 3] = Math.max(d[i + 3], Math.floor(foldIntensity * 255));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  container.appendChild(canvas);
}

// ── Interpolate sparse data into smooth curve (clean linear, no synthetic noise) ──
function interpolateSmooth(points) {
  if (points.length < 2)
    return points.map((p, i) => ({
      ...p,
      isReal: true,
      realIdx: i,
      realDate: p.date,
      realValue: p.value,
    }));

  const totalSteps = 120;
  const out = [];

  for (let s = 0; s <= totalSteps; s++) {
    const t = s / totalSteps;
    const realT = t * (points.length - 1);
    const idx0 = Math.min(Math.floor(realT), points.length - 2);
    const frac = realT - idx0;
    const value = points[idx0].value + (points[idx0 + 1].value - points[idx0].value) * frac;

    const nearestReal = Math.round(realT);
    const isOnReal = Math.abs(realT - nearestReal) < 0.5 / (points.length - 1);
    const rp = isOnReal ? points[nearestReal] : null;

    out.push({
      date: rp ? rp.date : points[idx0].date,
      value: value,
      isReal: !!rp,
      realIdx: rp ? nearestReal : -1,
      realDate: rp ? rp.date : null,
      realValue: rp ? rp.value : null,
    });
  }
  return out;
}

// ── Growth chart — area gradient + grain canvas + thin line ──
function renderGrowthChart(container, points, sym, periodMonths) {
  const W = 800,
    H = 256;
  const PAD = { top: 10, right: 0, bottom: 36, left: 0 };
  const cW = W;
  const cH = H - PAD.top - PAD.bottom;
  const ns = "http://www.w3.org/2000/svg";
  const uid = Date.now();

  // Interpolate into smooth fluid wave
  const wave = interpolateSmooth(points);

  const vals = wave.map((p) => p.value);
  const dataMin = Math.min(...vals);
  const dataMax = Math.max(...vals);
  const dataRange = dataMax - dataMin || dataMax * 0.1 || 1;
  // Position wave so it occupies roughly the top 40-60% of chart height
  // This leaves visible gradient fill below and space above peaks
  const minV = dataMin - dataRange * 1.2; // push floor well below data
  const maxV = dataMax + dataRange * 0.3; // small headroom above
  const range = maxV - minV || 1;

  const xOf = (i) => (i / Math.max(wave.length - 1, 1)) * cW;
  const yOf = (v) => PAD.top + cH - ((v - minV) / range) * cH;
  const bottomY = H;

  // Build Catmull-Rom spline → cubic bezier for perfectly smooth curve
  // Catmull-Rom guarantees C1 continuity (no kinks at junctions)
  const wx = wave.map((_, i) => xOf(i));
  const wy = wave.map((p) => yOf(p.value));
  const n = wave.length;
  const alpha = 1 / 6; // tension factor

  let lineD = `M${wx[0]},${wy[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? i - 1 : 0;
    const p3 = i + 2 < n ? i + 2 : n - 1;

    const cp1x = wx[i] + (wx[i + 1] - wx[p0]) * alpha;
    const cp1y = wy[i] + (wy[i + 1] - wy[p0]) * alpha;
    const cp2x = wx[i + 1] - (wx[p3] - wx[i]) * alpha;
    const cp2y = wy[i + 1] - (wy[p3] - wy[i]) * alpha;

    lineD += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${wx[i + 1]},${wy[i + 1]}`;
  }
  const areaD = lineD + ` L${cW},${bottomY} L0,${bottomY} Z`;

  // SVG — stretches to fill container (no aspect ratio constraints)
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "pc-growth-svg");
  svg.setAttribute("preserveAspectRatio", "none");

  // Area gradient
  const defs = document.createElementNS(ns, "defs");
  const gradId = "ag" + uid;
  const grad = document.createElementNS(ns, "linearGradient");
  grad.setAttribute("id", gradId);
  grad.setAttribute("x1", "0");
  grad.setAttribute("y1", "0");
  grad.setAttribute("x2", "0");
  grad.setAttribute("y2", "1");
  const stops = [
    ["0%", "hsl(155, 35%, 45%)", "0.55"],
    ["35%", "hsl(155, 28%, 30%)", "0.30"],
    ["70%", "hsl(155, 20%, 18%)", "0.10"],
    ["100%", "hsl(240, 15%, 4%)", "0"],
  ];
  for (const [off, color, op] of stops) {
    const s = document.createElementNS(ns, "stop");
    s.setAttribute("offset", off);
    s.setAttribute("stop-color", color);
    s.setAttribute("stop-opacity", op);
    grad.appendChild(s);
  }
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Area fill
  const area = document.createElementNS(ns, "path");
  area.setAttribute("d", areaD);
  area.setAttribute("fill", `url(#${gradId})`);
  area.setAttribute("stroke", "none");
  svg.appendChild(area);

  // Line — thin edge
  const line = document.createElementNS(ns, "path");
  line.setAttribute("d", lineD);
  line.setAttribute("class", "pc-growth-line");
  svg.appendChild(line);

  // X-axis labels — evenly spaced, fixed
  // 12M mode: all 12 months JAN..DEC
  // ALL mode: year labels (2024, 2025, 2026...)
  const MNAMES = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const labelPad = 30; // px from edges
  if (periodMonths > 0) {
    // Month view — show all 12 months evenly spaced
    for (let m = 0; m < 12; m++) {
      const x = labelPad + (m / 11) * (cW - labelPad * 2);
      const lbl = document.createElementNS(ns, "text");
      lbl.setAttribute("x", x);
      lbl.setAttribute("y", H - 12);
      lbl.setAttribute("class", "pc-growth-month-label");
      lbl.textContent = MNAMES[m];
      svg.appendChild(lbl);
    }
  } else {
    // ALL mode — show year labels
    const firstDate = points[0].date;
    const lastDate = points[points.length - 1].date;
    const firstYear = parseInt(firstDate.slice(0, 4));
    const lastYear = parseInt(lastDate.slice(0, 4));
    const years = [];
    for (let y = firstYear; y <= lastYear; y++) years.push(y);
    if (years.length < 2) years.push(lastYear); // at least 2 labels
    for (let i = 0; i < years.length; i++) {
      const x = labelPad + (i / Math.max(years.length - 1, 1)) * (cW - labelPad * 2);
      const lbl = document.createElementNS(ns, "text");
      lbl.setAttribute("x", x);
      lbl.setAttribute("y", H - 12);
      lbl.setAttribute("class", "pc-growth-month-label");
      lbl.textContent = String(years[i]);
      svg.appendChild(lbl);
    }
  }

  // Dot (no vertical line — reference doesn't have one)
  const dot = document.createElementNS(ns, "circle");
  dot.setAttribute("r", "4");
  dot.setAttribute("class", "pc-growth-dot");
  dot.style.display = "none";
  svg.appendChild(dot);

  // Hit area
  const hitArea = document.createElementNS(ns, "rect");
  hitArea.setAttribute("x", "0");
  hitArea.setAttribute("y", "0");
  hitArea.setAttribute("width", W);
  hitArea.setAttribute("height", H);
  hitArea.setAttribute("fill", "transparent");
  hitArea.style.cursor = "default";
  svg.appendChild(hitArea);

  container.appendChild(svg);

  // Grain canvas
  requestAnimationFrame(() => {
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      paintGrainCanvas(container, Math.round(rect.width), Math.round(rect.height));
    }
  });

  // Tooltip
  const tooltip = container.createDiv({ cls: "pc-growth-tooltip" });
  tooltip.style.display = "none";

  const fmtVal = (v) => (v >= 1000000 ? `${fmt(v / 1000000, 2)}M` : fmt(v));
  const fmtD = (d) => {
    const parts = d.split("-");
    if (parts.length < 3) return d;
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    return months[parseInt(parts[1]) - 1];
  };

  // Precompute coordinates for wave points
  const waveCoords = wave.map((p, i) => ({ x: xOf(i), y: yOf(p.value) }));
  const PROX = 20;

  function nearestIdx(mouseX) {
    const svgRect = svg.getBoundingClientRect();
    const scaleX = W / svgRect.width;
    const svgX = (mouseX - svgRect.left) * scaleX;
    let best = 0,
      bestDist = Infinity;
    for (let i = 0; i < wave.length; i++) {
      const dd = Math.abs(waveCoords[i].x - svgX);
      if (dd < bestDist) {
        bestDist = dd;
        best = i;
      }
    }
    return best;
  }

  function showDot(idx) {
    const cx = waveCoords[idx].x,
      cy = waveCoords[idx].y;
    const wp = wave[idx];
    // Show real value if this is a real point, otherwise show interpolated
    const dispVal = wp.realValue != null ? wp.realValue : wp.value;
    const dispDate = wp.realDate || wp.date;

    dot.setAttribute("cx", cx);
    dot.setAttribute("cy", cy);
    dot.style.display = "";

    tooltip.empty();
    tooltip.createEl("p", { cls: "pc-growth-tt-date", text: fmtD(dispDate) });
    tooltip.createEl("p", { cls: "pc-growth-tt-val", text: `${sym}${fmtVal(dispVal)}` });
    tooltip.style.display = "block";

    const svgRect = svg.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const dotScreenX = svgRect.left + (cx / W) * svgRect.width - containerRect.left;
    const dotScreenY = svgRect.top + (cy / H) * svgRect.height - containerRect.top;

    let tx = dotScreenX + 14;
    let ty = dotScreenY - 50;
    if (tx + 140 > containerRect.width) tx = dotScreenX - 150;
    if (ty < 0) ty = dotScreenY + 20;
    tooltip.style.left = tx + "px";
    tooltip.style.top = ty + "px";
  }

  function hideDot() {
    dot.style.display = "none";
    tooltip.style.display = "none";
  }

  hitArea.addEventListener("mousemove", (e) => {
    const svgRect = svg.getBoundingClientRect();
    const scaleY = H / svgRect.height;
    const svgY = (e.clientY - svgRect.top) * scaleY;
    const idx = nearestIdx(e.clientX);
    const dy = Math.abs(svgY - waveCoords[idx].y);
    if (dy < PROX) {
      hitArea.style.cursor = "crosshair";
      showDot(idx);
    } else {
      hitArea.style.cursor = "default";
      hideDot();
    }
  });
  hitArea.addEventListener("mouseleave", hideDot);
  hitArea.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (e.touches[0]) showDot(nearestIdx(e.touches[0].clientX));
  });
  hitArea.addEventListener("touchend", hideDot);
}

function renderCapitalChart(container, history, assets, settings, budget, accounts, allLedger) {
  const sym = settings.homeCurrencySymbol;
  const investedCapital = assets.reduce((s, a) => s + a.currentValueRub, 0);
  const liquidTotal = getLiquidTotal(settings, accounts, allLedger);
  const totalCapital = investedCapital + liquidTotal;

  let allPoints = history.length >= 2 ? [...history] : buildCapitalTimeline(assets, settings);

  const today = new Date().toISOString().slice(0, 10);

  if (allPoints.length < 2 && investedCapital > 0) {
    const ago = new Date();
    ago.setMonth(ago.getMonth() - 6);
    allPoints = [
      { date: ago.toISOString().slice(0, 10), value: investedCapital * 0.95 },
      { date: today, value: investedCapital },
    ];
  }
  if (allPoints.length < 2) return;

  // ── Compute portfolio metrics ──
  const portfolioValue = investedCapital; // only instruments, no liquid
  const netProfit = assets.reduce((s, a) => s + toNum(a.plAmount) * a.fx, 0);
  const passiveTotal = assets.reduce((s, a) => s + toNum(a.passiveIncomeTot) * a.fx, 0);
  const totalReturn = netProfit + passiveTotal;
  const totalInvBasis = assets.reduce((s, a) => {
    const basis = a.currentValueRub - toNum(a.plAmount) * a.fx;
    return s + Math.max(basis, 0);
  }, 0);
  const returnPct = totalInvBasis > 0 ? (totalReturn / totalInvBasis) * 100 : 0;

  // Use only invested capital for timeline (not liquid pools)
  if (investedCapital > 0) {
    const todayMonth = today.slice(0, 7);
    const tidx = allPoints.findIndex((p) => p.date.startsWith(todayMonth));
    if (tidx >= 0) allPoints[tidx] = { date: today, value: investedCapital };
    else allPoints.push({ date: today, value: investedCapital });
  }

  // ── Glass card ──
  const card = container.createDiv({ cls: "pc-cap-card" });

  // Hero section
  const hero = card.createDiv({ cls: "pc-cap-hero" });
  hero.createEl("p", { cls: "pc-cap-hero-label", text: "PORTFOLIO" });

  // Portfolio value
  const valDiv = hero.createDiv({ cls: "pc-cap-hero-row" });
  valDiv.createEl("span", { cls: "pc-cap-hero-value", text: `${sym}${fmt(portfolioValue, 0)}` });

  // Metrics row: return + passive income
  const metricsRow = hero.createDiv({ cls: "pc-cap-metrics" });
  const arrow = totalReturn >= 0 ? "\u2197" : "\u2198";
  metricsRow.createEl("span", {
    cls: `pc-cap-metric-return ${totalReturn >= 0 ? "pc-pos" : "pc-neg"}`,
    text: `${arrow} ${totalReturn >= 0 ? "+" : ""}${fmt(totalReturn, 0)} ${sym}  (${returnPct >= 0 ? "+" : ""}${fmt(returnPct, 1)}%)`,
  });
  if (passiveTotal > 0) {
    metricsRow.createEl("span", {
      cls: "pc-cap-metric-passive",
      text: `\uD83D\uDCB0 ${fmt(passiveTotal, 0)} ${sym} income`,
    });
  }

  // Period buttons
  const periodBar = hero.createDiv({ cls: "pc-period-bar" });
  const periods = [
    { label: "12M", months: 12 },
    { label: "ALL", months: 0 },
  ];
  let activePeriod = "ALL";

  // Chart area (relative container for SVG + grain canvas + tooltip)
  const chartArea = card.createDiv({ cls: "pc-chart-area" });

  function filterPoints(months) {
    if (months === 0) return allPoints;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutStr = cutoff.toISOString().slice(0, 10);
    const filtered = allPoints.filter((p) => p.date >= cutStr);
    return filtered.length >= 2 ? filtered : allPoints;
  }

  function draw(periodMonths) {
    chartArea.empty();
    renderGrowthChart(chartArea, filterPoints(periodMonths), sym, periodMonths);
  }

  for (const p of periods) {
    const btn = periodBar.createEl("button", {
      cls: `pc-period-btn ${p.label === activePeriod ? "pc-period-btn--active" : ""}`,
      text: p.label,
    });
    btn.onclick = () => {
      activePeriod = p.label;
      periodBar
        .querySelectorAll(".pc-period-btn")
        .forEach((b) => b.classList.remove("pc-period-btn--active"));
      btn.classList.add("pc-period-btn--active");
      draw(p.months);
    };
  }

  draw(0);
}

export { paintGrainCanvas, interpolateSmooth, renderGrowthChart, renderCapitalChart };
