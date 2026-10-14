import { TierCheckpoint } from "../../tier/checkpoint/tier-checkpoint.js";
import { tierDigestBucket } from "../../tier/checkpoint/tier-digest-policy.js";
import { FraudCheckMetric, newFraudCheckMetric } from "./fraud-check-metric.js";

export function summarizeTierCheckpointsForMetric(items: TierCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFraudCheckMetricsFromCheckpoint(items: TierCheckpoint[]): FraudCheckMetric[] {
  const out: FraudCheckMetric[] = [];
  for (const item of items) {
    const derived = newFraudCheckMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyFraudCheckMetric(item: FraudCheckMetric): string {
  return tierDigestBucket(item.measuredValue());
}
