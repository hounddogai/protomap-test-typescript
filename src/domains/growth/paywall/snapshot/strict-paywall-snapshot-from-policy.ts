import { classifySeasonalPaywallPolicy } from "../policy/seasonal-paywall-policy-policy.js";
import { SeasonalPaywallPolicy } from "../policy/seasonal-paywall-policy.js";
import { StrictPaywallSnapshot, newStrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

export function summarizeSeasonalPaywallPoliciesForSnapshot(items: SeasonalPaywallPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictPaywallSnapshotsFromPolicy(items: SeasonalPaywallPolicy[]): StrictPaywallSnapshot[] {
  const out: StrictPaywallSnapshot[] = [];
  for (const item of items) {
    const derived = newStrictPaywallSnapshot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateStrictPaywallSnapshot(item: StrictPaywallSnapshot): string {
  return classifySeasonalPaywallPolicy(item.netLoad());
}
