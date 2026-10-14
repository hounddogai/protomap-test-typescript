import { RewardMetric } from "../../reward/schedule/reward-metric.js";
import { rewardScheduleBucket } from "../../reward/schedule/reward-schedule-policy.js";
import { DefaultLevelSnapshot, newDefaultLevelSnapshot } from "./default-level-snapshot.js";

export function summarizeRewardMetricsForSnapshot(items: RewardMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDefaultLevelSnapshotsFromMetric(items: RewardMetric[]): DefaultLevelSnapshot[] {
  const out: DefaultLevelSnapshot[] = [];
  for (const item of items) {
    const derived = newDefaultLevelSnapshot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveDefaultLevelSnapshot(item: DefaultLevelSnapshot): string {
  return rewardScheduleBucket(item.effectiveVolume());
}
