import { classifySubscriptionCycle } from "../../subscription/cycle/subscription-cycle-policy.js";
import { SubscriptionReview } from "../../subscription/cycle/subscription-review.js";
import { CappedProofRule, newCappedProofRule } from "./capped-proof-rule.js";

export function summarizeSubscriptionReviewsForRule(items: SubscriptionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveCappedProofRulesFromReview(items: SubscriptionReview[]): CappedProofRule[] {
  const out: CappedProofRule[] = [];
  for (const item of items) {
    const derived = newCappedProofRule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCappedProofRule(item: CappedProofRule): string {
  return classifySubscriptionCycle(item.adjustedTotal());
}
