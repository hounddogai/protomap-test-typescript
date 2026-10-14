import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as table from "../../../../kit/table.js";
import { PreferenceSnapshot } from "./preference-snapshot.js";

/** Totals of preference snapshots by locale. */
export class PreferenceSnapshotReport {
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
    const tableValue = table.newTable(this.title, ["locale", "count", "total", "share"]);
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

export function buildPreferenceSnapshotReport(title: string, items: PreferenceSnapshot[], clockValue: clock.Clock): PreferenceSnapshotReport {
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const key = item.groupKey();
    totals.set(key, (totals.get(key) ?? 0) + item.netLoad());
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new PreferenceSnapshotReport(title, totals, counts, clockValue.now());
}
