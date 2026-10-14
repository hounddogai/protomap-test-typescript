import { levelSummaryBucket } from "../../level/summary/level-summary-policy.js";
import { LevelSummary } from "../../level/summary/level-summary.js";
import { StreakSnapshot, newStreakSnapshot } from "./streak-snapshot.js";

export function summarizeLevelSummariesForSnapshot(items: LevelSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStreakSnapshotsFromSummary(items: LevelSummary[]): StreakSnapshot[] {
  const out: StreakSnapshot[] = [];
  for (const item of items) {
    const derived = newStreakSnapshot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchStreakSnapshot(item: StreakSnapshot): string {
  return levelSummaryBucket(item.weightedValue());
}
