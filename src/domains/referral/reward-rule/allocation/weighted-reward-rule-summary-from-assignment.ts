import { normalizeAdaptivePayoutAssignmentCode } from "../../payout/assignment/adaptive-payout-assignment-policy.js";
import { AdaptivePayoutAssignment } from "../../payout/assignment/adaptive-payout-assignment.js";
import { WeightedRewardRuleSummary, newWeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

export function summarizeAdaptivePayoutAssignmentsForSummary(items: AdaptivePayoutAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveWeightedRewardRuleSummariesFromAssignment(items: AdaptivePayoutAssignment[]): WeightedRewardRuleSummary[] {
  const out: WeightedRewardRuleSummary[] = [];
  for (const item of items) {
    const derived = newWeightedRewardRuleSummary(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedRewardRuleSummary(item: WeightedRewardRuleSummary): string {
  return normalizeAdaptivePayoutAssignmentCode(item.code);
}
