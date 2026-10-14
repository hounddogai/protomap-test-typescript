import { normalizeSubscriptionCycleCode } from "../../subscription/cycle/subscription-cycle-policy.js";
import { SubscriptionReview } from "../../subscription/cycle/subscription-review.js";
import { DoubleOptInBaseline, newDoubleOptInBaseline } from "./double-opt-in-baseline.js";

export function summarizeSubscriptionReviewsForBaseline(items: SubscriptionReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveDoubleOptInBaselinesFromReview(items: SubscriptionReview[]): DoubleOptInBaseline[] {
  const out: DoubleOptInBaseline[] = [];
  for (const item of items) {
    const derived = newDoubleOptInBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveDoubleOptInBaseline(item: DoubleOptInBaseline): string {
  return normalizeSubscriptionCycleCode(item.code);
}
