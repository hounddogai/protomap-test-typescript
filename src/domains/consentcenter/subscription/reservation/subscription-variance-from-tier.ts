import { rollingProofTierWeight } from "../../proof/adjustment/rolling-proof-tier-policy.js";
import { RollingProofTier } from "../../proof/adjustment/rolling-proof-tier.js";
import { SubscriptionVariance, newSubscriptionVariance } from "./subscription-variance.js";

export function summarizeRollingProofTiersForVariance(items: RollingProofTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveSubscriptionVariancesFromTier(items: RollingProofTier[]): SubscriptionVariance[] {
  const out: SubscriptionVariance[] = [];
  for (const item of items) {
    const derived = newSubscriptionVariance(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileSubscriptionVariance(item: SubscriptionVariance): number {
  return rollingProofTierWeight(1, true);
}
