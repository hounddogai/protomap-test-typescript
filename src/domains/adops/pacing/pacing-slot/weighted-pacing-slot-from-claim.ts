import { LegacyFlightClaim } from "../../flight/checkpoint/legacy-flight-claim.js";
import { classifyLenientFlightMetric } from "../../flight/checkpoint/lenient-flight-metric-policy.js";
import { WeightedPacingSlot, newWeightedPacingSlot } from "./weighted-pacing-slot.js";

export function summarizeLegacyFlightClaimsForSlot(items: LegacyFlightClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveWeightedPacingSlotsFromClaim(items: LegacyFlightClaim[]): WeightedPacingSlot[] {
  const out: WeightedPacingSlot[] = [];
  for (const item of items) {
    const derived = newWeightedPacingSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceWeightedPacingSlot(item: WeightedPacingSlot): string {
  return classifyLenientFlightMetric(item.effectiveLoad());
}
