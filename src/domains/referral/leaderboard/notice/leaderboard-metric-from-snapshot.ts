import { tieredFraudCheckSnapshotBucket } from "../../fraud-check/draft/tiered-fraud-check-snapshot-policy.js";
import { TieredFraudCheckSnapshot } from "../../fraud-check/draft/tiered-fraud-check-snapshot.js";
import { LeaderboardMetric, newLeaderboardMetric } from "./leaderboard-metric.js";

export function summarizeTieredFraudCheckSnapshotsForMetric(items: TieredFraudCheckSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveLeaderboardMetricsFromSnapshot(items: TieredFraudCheckSnapshot[]): LeaderboardMetric[] {
  const out: LeaderboardMetric[] = [];
  for (const item of items) {
    const derived = newLeaderboardMetric(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateLeaderboardMetric(item: LeaderboardMetric): string {
  return tieredFraudCheckSnapshotBucket(item.adjustedExposure());
}
