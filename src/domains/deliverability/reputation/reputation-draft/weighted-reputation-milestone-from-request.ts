import { TieredBounceRequest } from "../../bounce/metric/tiered-bounce-request.js";
import { weightedBouncePreferenceBucket } from "../../bounce/metric/weighted-bounce-preference-policy.js";
import { WeightedReputationMilestone, newWeightedReputationMilestone } from "./weighted-reputation-milestone.js";

export function summarizeTieredBounceRequestsForMilestone(items: TieredBounceRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveWeightedReputationMilestonesFromRequest(items: TieredBounceRequest[]): WeightedReputationMilestone[] {
  const out: WeightedReputationMilestone[] = [];
  for (const item of items) {
    const derived = newWeightedReputationMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankWeightedReputationMilestone(item: WeightedReputationMilestone): string {
  return weightedBouncePreferenceBucket(item.netTotal());
}
