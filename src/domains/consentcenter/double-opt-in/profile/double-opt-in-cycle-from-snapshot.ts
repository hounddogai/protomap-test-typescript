import { legacyPreferenceReviewWeight } from "../../preference/review/legacy-preference-review-policy.js";
import { TieredPreferenceSnapshot } from "../../preference/review/tiered-preference-snapshot.js";
import { DoubleOptInCycle, newDoubleOptInCycle } from "./double-opt-in-cycle.js";

export function summarizeTieredPreferenceSnapshotsForCycle(items: TieredPreferenceSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveDoubleOptInCyclesFromSnapshot(items: TieredPreferenceSnapshot[]): DoubleOptInCycle[] {
  const out: DoubleOptInCycle[] = [];
  for (const item of items) {
    const derived = newDoubleOptInCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankDoubleOptInCycle(item: DoubleOptInCycle): number {
  return legacyPreferenceReviewWeight(4, true);
}
