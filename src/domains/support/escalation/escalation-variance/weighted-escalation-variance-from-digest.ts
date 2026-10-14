import { seasonalEscalationDigestWeight } from "../estimate/seasonal-escalation-digest-policy.js";
import { SeasonalEscalationDigest } from "../estimate/seasonal-escalation-digest.js";
import { WeightedEscalationVariance, newWeightedEscalationVariance } from "./weighted-escalation-variance.js";

export function summarizeSeasonalEscalationDigestsForVariance(items: SeasonalEscalationDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveWeightedEscalationVariancesFromDigest(items: SeasonalEscalationDigest[]): WeightedEscalationVariance[] {
  const out: WeightedEscalationVariance[] = [];
  for (const item of items) {
    const derived = newWeightedEscalationVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileWeightedEscalationVarianceExtra(item: WeightedEscalationVariance): number {
  return seasonalEscalationDigestWeight(1, true);
}
