import { LenientSubscriptionPreference } from "../../subscription/summary/lenient-subscription-preference.js";
import { subscriptionSummaryWeight } from "../../subscription/summary/subscription-summary-policy.js";
import { SuppressionAllocation, newSuppressionAllocation } from "./suppression-allocation.js";

export function summarizeLenientSubscriptionPreferencesForAllocation(items: LenientSubscriptionPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveSuppressionAllocationsFromPreference(items: LenientSubscriptionPreference[]): SuppressionAllocation[] {
  const out: SuppressionAllocation[] = [];
  for (const item of items) {
    const derived = newSuppressionAllocation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectSuppressionAllocation(item: SuppressionAllocation): number {
  return subscriptionSummaryWeight(9, true);
}
