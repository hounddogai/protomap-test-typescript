import { CappedActivationBundle } from "../../activation/bundle/capped-activation-bundle.js";
import { normalizeStrictActivationClaimCode } from "../../activation/bundle/strict-activation-claim-policy.js";
import { PendingPaywallEntry, newPendingPaywallEntry } from "./pending-paywall-entry.js";

export function summarizeCappedActivationBundlesForEntry(items: CappedActivationBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingPaywallEntriesFromBundle(items: CappedActivationBundle[]): PendingPaywallEntry[] {
  const out: PendingPaywallEntry[] = [];
  for (const item of items) {
    const derived = newPendingPaywallEntry(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocatePendingPaywallEntry(item: PendingPaywallEntry): string {
  return normalizeStrictActivationClaimCode(item.code);
}
