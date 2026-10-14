import { funnelPolicyBucket } from "../policy/funnel-policy-policy.js";
import { FunnelPreference } from "../policy/funnel-preference.js";
import { FunnelVariance, newFunnelVariance } from "./funnel-variance.js";

export function summarizeFunnelPreferencesForVariance(items: FunnelPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveFunnelVariancesFromPreference(items: FunnelPreference[]): FunnelVariance[] {
  const out: FunnelVariance[] = [];
  for (const item of items) {
    const derived = newFunnelVariance(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeFunnelVariance(item: FunnelVariance): string {
  return funnelPolicyBucket(item.weightedLoad());
}
