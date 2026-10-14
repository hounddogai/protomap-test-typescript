import * as clock from "../../../../kit/clock.js";
import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as table from "../../../../kit/table.js";
import { RollingStepEntry } from "./rolling-step-entry.js";

/** Totals of rolling step entries by title. */
export class RollingStepEntryReport {
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
    const tableValue = table.newTable(this.title, ["title", "count", "total", "share"]);
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

export function buildRollingStepEntryReport(title: string, items: RollingStepEntry[], clockValue: clock.Clock): RollingStepEntryReport {
  const groups = collections.groupBy(items, (entry: RollingStepEntry): string => entry.groupKey());
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const key of [...groups.keys()].sort()) {
    const members = groups.get(key)!;
    totals.set(key, Math.round(collections.sumBy(members, (entry: RollingStepEntry): number => entry.measuredValue()) * 100) / 100);
    counts.set(key, members.length);
  }
  return new RollingStepEntryReport(title, totals, counts, clockValue.now());
}
