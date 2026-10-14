import { weightedProofAssignmentWeight } from "../../proof/tier/weighted-proof-assignment-policy.js";
import { WeightedProofAssignment } from "../../proof/tier/weighted-proof-assignment.js";
import { SeasonalSuppressionTier, newSeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

export function summarizeWeightedProofAssignmentsForTier(items: WeightedProofAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveSeasonalSuppressionTiersFromAssignment(items: WeightedProofAssignment[]): SeasonalSuppressionTier[] {
  const out: SeasonalSuppressionTier[] = [];
  for (const item of items) {
    const derived = newSeasonalSuppressionTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planSeasonalSuppressionTier(item: SeasonalSuppressionTier): number {
  return weightedProofAssignmentWeight(4, true);
}
