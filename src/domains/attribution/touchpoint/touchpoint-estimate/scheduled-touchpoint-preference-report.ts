import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as table from "../../../../kit/table.js";
import { ScheduledTouchpointPreference } from "./scheduled-touchpoint-preference.js";

/** Totals of scheduled touchpoint preferences by channel. */
export class ScheduledTouchpointPreferenceReport {
  title: string;
  totals: Map<string, number>;
  counts: Map<string, number>;
  generatedAt: number;

  constructor(title: string, totals: Map<string, number>, counts: Map<string, number>, generatedAt: number) {
    this.title = title;
    this.totals = totals;
    this.counts = counts;
    this.generatedAt = generatedAt;
  }

  top(count: number): string[] {
    const keys = [...this.totals.keys()].sort();
    const ranked = collections.sortedBy(keys, (key: string): number => this.totals.get(key) ?? 0);
    return collections.take(ranked, count);
  }

  render(): string {
    const tableValue = table.newTable(this.title, ["channel", "count", "total", "share"]);
    let grand = 0;
    for (const key of [...this.totals.keys()].sort()) {
      const total = this.totals.get(key)!;
      grand += total;
    }
    for (const key of [...this.totals.keys()].sort()) {
      const total = this.totals.get(key)!;
      try {
        tableValue.addRow(
        [
          key,
          String(this.counts.get(key) ?? 0),
          total.toFixed(2),
          `${numbers.percent(total, grand)}%`,
        ],
      );
      } catch {
        continue;
      }
    }
    return tableValue.render();
  }
}

export function buildScheduledTouchpointPreferenceReport(title: string, items: ScheduledTouchpointPreference[], clockValue: clock.Clock): ScheduledTouchpointPreferenceReport {
  const groups = collections.groupBy(items, (entry: ScheduledTouchpointPreference): string => entry.groupKey());
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const key of [...groups.keys()].sort()) {
    const members = groups.get(key)!;
    totals.set(key, Math.round(collections.sumBy(members, (entry: ScheduledTouchpointPreference): number => entry.effectiveTotal()) * 100) / 100);
    counts.set(key, members.length);
  }
  return new ScheduledTouchpointPreferenceReport(title, totals, counts, clockValue.now());
}
