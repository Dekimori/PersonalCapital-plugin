// -------------------------------------------------------------------
// CAPITAL HISTORY + TIMELINE
// -------------------------------------------------------------------

import type { App } from "obsidian";
import { toNum } from "../../core/utils";
import type { PluginSettings } from "../../core/types";

export interface CapitalPoint {
  date: string;
  value: number;
}

interface AssetWithEvents {
  fx: number;
  logEvents?: Array<{ date: string; op: string; qty: number; val: number }>;
}

export async function readCapitalHistory(
  app: App,
  settings: PluginSettings
): Promise<CapitalPoint[]> {
  const path = settings.capitalHistoryPath;
  const file = app.vault.getAbstractFileByPath(path);
  if (!file) return [];

  const cache = app.metadataCache.getFileCache(file as never);
  const fm = cache?.frontmatter;
  if (!fm?.snapshots || !Array.isArray(fm.snapshots)) return [];

  return (fm.snapshots as Array<{ date: unknown; value: unknown }>)
    .filter((s) => s.date && s.value != null)
    .map((s) => ({ date: String(s.date), value: toNum(s.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Build capital timeline from asset log events.
 * O(E log E) merge-sort + O(E) linear walk — replaces the old O(A*D) nested loop.
 */
export function buildCapitalTimeline(
  assets: AssetWithEvents[],
  _settings?: PluginSettings
): CapitalPoint[] {
  // 1. Collect all events with asset index into a flat array
  const allEvents: Array<{
    date: string;
    op: string;
    qty: number;
    val: number;
    ai: number;
    fx: number;
  }> = [];
  for (let ai = 0; ai < assets.length; ai++) {
    const a = assets[ai];
    for (const ev of a.logEvents || []) {
      allEvents.push({ date: ev.date, op: ev.op, qty: ev.qty, val: ev.val, ai, fx: a.fx });
    }
  }
  if (allEvents.length === 0) return [];

  // 2. Sort all events by date (O(E log E))
  allEvents.sort((a, b) => a.date.localeCompare(b.date));

  // 3. Linear walk: maintain running per-asset state
  const assetState = assets.map(() => ({ qty: 0, lastPrice: 0 }));
  let runningTotal = 0;
  const dateValues = new Map<string, number>();

  for (const ev of allEvents) {
    const st = assetState[ev.ai];
    const oldContrib = st.qty * st.lastPrice * ev.fx;

    if (ev.op === "buy" || ev.op === "reinvest") {
      st.qty += ev.qty;
      st.lastPrice = ev.val;
    } else if (ev.op === "sell") {
      st.qty = Math.max(0, st.qty - ev.qty);
    } else if (ev.op === "price") {
      st.lastPrice = ev.val;
    }
    // div doesn't change position

    const newContrib = st.qty * st.lastPrice * ev.fx;
    runningTotal += newContrib - oldContrib;

    dateValues.set(ev.date, runningTotal);
  }

  // 4. Build timeline from unique dates
  const timeline: CapitalPoint[] = [];
  for (const [date, value] of dateValues) {
    timeline.push({ date, value });
  }

  // 5. Collapse to monthly and fill gaps
  const byMonth: Record<string, CapitalPoint> = {};
  for (const pt of timeline) {
    const mk = pt.date.slice(0, 7);
    byMonth[mk] = pt;
  }

  const months = Object.keys(byMonth).sort();
  if (months.length >= 2) {
    const [startY, startM] = months[0].split("-").map(Number);
    const [endY, endM] = months[months.length - 1].split("-").map(Number);
    let y = startY,
      m = startM;
    let lastVal = byMonth[months[0]].value;

    while (y < endY || (y === endY && m <= endM)) {
      const mk = `${y}-${String(m).padStart(2, "0")}`;
      if (byMonth[mk]) {
        lastVal = byMonth[mk].value;
      } else {
        byMonth[mk] = { date: `${mk}-15`, value: lastVal };
      }
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
  }

  return Object.values(byMonth).sort((a, b) => a.date.localeCompare(b.date));
}
