import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as table from "../../../../kit/table.js";
import { AdaptiveLeaderboardBaseline } from "./adaptive-leaderboard-baseline.js";

/** Totals of adaptive leaderboard baselines by segment. */
export class AdaptiveLeaderboardBaselineReport {
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
    const tableValue = table.newTable(this.title, ["segment", "count", "total", "share"]);
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

export function buildAdaptiveLeaderboardBaselineReport(title: string, items: AdaptiveLeaderboardBaseline[], clockValue: clock.Clock): AdaptiveLeaderboardBaselineReport {
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const item of items) {
    // Closed records count too.
    const key = item.groupKey();
    totals.set(key, (totals.get(key) ?? 0) + item.weightedValue());
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new AdaptiveLeaderboardBaselineReport(title, totals, counts, clockValue.now());
}
