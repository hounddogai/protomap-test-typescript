import { legacyPaywallThresholdWeight } from "../../paywall/entry/legacy-paywall-threshold-policy.js";
import { PaywallEntry } from "../../paywall/entry/paywall-entry.js";
import { StrictActivationClaim, newStrictActivationClaim } from "./strict-activation-claim.js";

export function summarizePaywallEntriesForClaim(items: PaywallEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveStrictActivationClaimsFromEntry(items: PaywallEntry[]): StrictActivationClaim[] {
  const out: StrictActivationClaim[] = [];
  for (const item of items) {
    const derived = newStrictActivationClaim(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileStrictActivationClaim(item: StrictActivationClaim): number {
  return legacyPaywallThresholdWeight(7, true);
}
