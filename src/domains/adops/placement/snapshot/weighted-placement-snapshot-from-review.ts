import { TieredPacingReview } from "../../pacing/pacing-slot/tiered-pacing-review.js";
import { weightedPacingSlotWeight } from "../../pacing/pacing-slot/weighted-pacing-slot-policy.js";
import { WeightedPlacementSnapshot, newWeightedPlacementSnapshot } from "./weighted-placement-snapshot.js";

export function summarizeTieredPacingReviewsForSnapshot(items: TieredPacingReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveWeightedPlacementSnapshotsFromReview(items: TieredPacingReview[]): WeightedPlacementSnapshot[] {
  const out: WeightedPlacementSnapshot[] = [];
  for (const item of items) {
    const derived = newWeightedPlacementSnapshot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceWeightedPlacementSnapshot(item: WeightedPlacementSnapshot): number {
  return weightedPacingSlotWeight(5, true);
}
