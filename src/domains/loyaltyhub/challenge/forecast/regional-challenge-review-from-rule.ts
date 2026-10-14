import { RedemptionRule } from "../../redemption/rule/redemption-rule.js";
import { classifyRedemptionSnapshot } from "../../redemption/rule/redemption-snapshot-policy.js";
import { RegionalChallengeReview, newRegionalChallengeReview } from "./regional-challenge-review.js";

export function summarizeRedemptionRulesForReview(items: RedemptionRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveRegionalChallengeReviewsFromRule(items: RedemptionRule[]): RegionalChallengeReview[] {
  const out: RegionalChallengeReview[] = [];
  for (const item of items) {
    const derived = newRegionalChallengeReview(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRegionalChallengeReview(item: RegionalChallengeReview): string {
  return classifyRedemptionSnapshot(item.projectedExposure());
}
