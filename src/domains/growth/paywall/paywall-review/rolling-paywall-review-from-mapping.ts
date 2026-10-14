import { activationMappingWeight } from "../../activation/ledger/activation-mapping-policy.js";
import { ActivationMapping } from "../../activation/ledger/activation-mapping.js";
import { RollingPaywallReview, newRollingPaywallReview } from "./rolling-paywall-review.js";

export function summarizeActivationMappingsForReview(items: ActivationMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveRollingPaywallReviewsFromMapping(items: ActivationMapping[]): RollingPaywallReview[] {
  const out: RollingPaywallReview[] = [];
  for (const item of items) {
    const derived = newRollingPaywallReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateRollingPaywallReview(item: RollingPaywallReview): number {
  return activationMappingWeight(4, true);
}
