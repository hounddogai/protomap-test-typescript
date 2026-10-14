import { AdaptiveSlaMapping } from "../../sla/sla-mapping/adaptive-sla-mapping.js";
import { slaProposalWeight } from "../../sla/sla-mapping/sla-proposal-policy.js";
import { WeightedDeflectionAssignment, newWeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

export function summarizeAdaptiveSlaMappingsForAssignment(items: AdaptiveSlaMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveWeightedDeflectionAssignmentsFromMapping(items: AdaptiveSlaMapping[]): WeightedDeflectionAssignment[] {
  const out: WeightedDeflectionAssignment[] = [];
  for (const item of items) {
    const derived = newWeightedDeflectionAssignment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileWeightedDeflectionAssignment(item: WeightedDeflectionAssignment): number {
  return slaProposalWeight(1, true);
}
