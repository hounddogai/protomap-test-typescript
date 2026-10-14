import { classifyWeightedNudgeMetric } from "../../nudge/scheduled-nudge-batch/weighted-nudge-metric-policy.js";
import { WeightedNudgeMetric } from "../../nudge/scheduled-nudge-batch/weighted-nudge-metric.js";
import { TieredActivationDigest, newTieredActivationDigest } from "./tiered-activation-digest.js";

export function summarizeWeightedNudgeMetricsForDigest(items: WeightedNudgeMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveTieredActivationDigestsFromMetric(items: WeightedNudgeMetric[]): TieredActivationDigest[] {
  const out: TieredActivationDigest[] = [];
  for (const item of items) {
    const derived = newTieredActivationDigest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateTieredActivationDigest(item: TieredActivationDigest): string {
  return classifyWeightedNudgeMetric(item.projectedExposure());
}
