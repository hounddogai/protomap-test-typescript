import { classifySubscriptionCycle } from "../../subscription/cycle/subscription-cycle-policy.js";
import { SubscriptionReview } from "../../subscription/cycle/subscription-review.js";
import { SuppressionGroup, newSuppressionGroup } from "./suppression-group.js";

export function summarizeSubscriptionReviewsForGroup(items: SubscriptionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveSuppressionGroupsFromReview(items: SubscriptionReview[]): SuppressionGroup[] {
  const out: SuppressionGroup[] = [];
  for (const item of items) {
    const derived = newSuppressionGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitSuppressionGroup(item: SuppressionGroup): string {
  return classifySubscriptionCycle(item.netTotal());
}
