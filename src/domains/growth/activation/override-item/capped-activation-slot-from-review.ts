import { normalizeLegacyActivationExceptionCode } from "../activation-review/legacy-activation-exception-policy.js";
import { WeightedActivationReview } from "../activation-review/weighted-activation-review.js";
import { CappedActivationSlot, newCappedActivationSlot } from "./capped-activation-slot.js";

export function summarizeWeightedActivationReviewsForSlot(items: WeightedActivationReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveCappedActivationSlotsFromReview(items: WeightedActivationReview[]): CappedActivationSlot[] {
  const out: CappedActivationSlot[] = [];
  for (const item of items) {
    const derived = newCappedActivationSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function applyCappedActivationSlot(item: CappedActivationSlot): string {
  return normalizeLegacyActivationExceptionCode(item.code);
}
