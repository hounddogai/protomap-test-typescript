import { activationMappingBucket } from "../ledger/activation-mapping-policy.js";
import { ActivationMapping } from "../ledger/activation-mapping.js";
import { PendingActivationReview, newPendingActivationReview } from "./pending-activation-review.js";

export function summarizeActivationMappingsForReview(items: ActivationMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePendingActivationReviewsFromMapping(items: ActivationMapping[]): PendingActivationReview[] {
  const out: PendingActivationReview[] = [];
  for (const item of items) {
    const derived = newPendingActivationReview(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocatePendingActivationReview(item: PendingActivationReview): string {
  return activationMappingBucket(item.effectiveLoad());
}
