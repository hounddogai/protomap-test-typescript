import { tieredJourneyThresholdBucket } from "../../journey/journey-threshold/tiered-journey-threshold-policy.js";
import { TieredJourneyThreshold } from "../../journey/journey-threshold/tiered-journey-threshold.js";
import { TieredBranchSnapshot, newTieredBranchSnapshot } from "./tiered-branch-snapshot.js";

export function summarizeTieredJourneyThresholdsForSnapshot(items: TieredJourneyThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveTieredBranchSnapshotsFromThreshold(items: TieredJourneyThreshold[]): TieredBranchSnapshot[] {
  const out: TieredBranchSnapshot[] = [];
  for (const item of items) {
    const derived = newTieredBranchSnapshot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchTieredBranchSnapshot(item: TieredBranchSnapshot): string {
  return tieredJourneyThresholdBucket(item.measuredValue());
}
