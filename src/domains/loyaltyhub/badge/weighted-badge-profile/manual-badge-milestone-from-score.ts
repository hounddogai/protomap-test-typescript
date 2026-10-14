import { CappedRedemptionScore } from "../../redemption/redemption-policy/capped-redemption-score.js";
import {
  normalizeStrictRedemptionPolicyCode,
} from "../../redemption/redemption-policy/strict-redemption-policy-policy.js";
import { ManualBadgeMilestone, newManualBadgeMilestone } from "./manual-badge-milestone.js";

export function summarizeCappedRedemptionScoresForMilestone(items: CappedRedemptionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveManualBadgeMilestonesFromScore(items: CappedRedemptionScore[]): ManualBadgeMilestone[] {
  const out: ManualBadgeMilestone[] = [];
  for (const item of items) {
    const derived = newManualBadgeMilestone(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateManualBadgeMilestone(item: ManualBadgeMilestone): string {
  return normalizeStrictRedemptionPolicyCode(item.code);
}
