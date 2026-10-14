import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as table from "../../../../kit/table.js";
import { LeaderboardPreference } from "./leaderboard-preference.js";

/** Totals of leaderboard preferences by locale. */
export class LeaderboardPreferenceReport {
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

export function buildLeaderboardPreferenceReport(title: string, items: LeaderboardPreference[], clockValue: clock.Clock): LeaderboardPreferenceReport {
  const groups = collections.groupBy(items, (entry: LeaderboardPreference): string => entry.groupKey());
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const key of [...groups.keys()].sort()) {
    const members = groups.get(key)!;
    totals.set(key, Math.round(collections.sumBy(members, (entry: LeaderboardPreference): number => entry.netValue()) * 100) / 100);
    counts.set(key, members.length);
  }
  return new LeaderboardPreferenceReport(title, totals, counts, clockValue.now());
}
