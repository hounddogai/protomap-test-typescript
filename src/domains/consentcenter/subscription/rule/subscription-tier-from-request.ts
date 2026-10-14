import { classifyPreferenceLedger } from "../../preference/ledger/preference-ledger-policy.js";
import { WeightedPreferenceRequest } from "../../preference/ledger/weighted-preference-request.js";
import { SubscriptionTier, newSubscriptionTier } from "./subscription-tier.js";

export function summarizeWeightedPreferenceRequestsForTier(items: WeightedPreferenceRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSubscriptionTiersFromRequest(items: WeightedPreferenceRequest[]): SubscriptionTier[] {
  const out: SubscriptionTier[] = [];
  for (const item of items) {
    const derived = newSubscriptionTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSubscriptionTier(item: SubscriptionTier): string {
  return classifyPreferenceLedger(item.netTotal());
}
