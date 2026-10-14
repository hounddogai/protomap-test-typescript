import { primarySubscriptionRequestBucket } from "../../subscription/bundle/primary-subscription-request-policy.js";
import { SubscriptionBundle } from "../../subscription/bundle/subscription-bundle.js";
import { RollingProofAllocation, newRollingProofAllocation } from "./rolling-proof-allocation.js";

export function summarizeSubscriptionBundlesForAllocation(items: SubscriptionBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingProofAllocationsFromBundle(items: SubscriptionBundle[]): RollingProofAllocation[] {
  const out: RollingProofAllocation[] = [];
  for (const item of items) {
    const derived = newRollingProofAllocation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planRollingProofAllocation(item: RollingProofAllocation): string {
  return primarySubscriptionRequestBucket(item.effectiveValue());
}
