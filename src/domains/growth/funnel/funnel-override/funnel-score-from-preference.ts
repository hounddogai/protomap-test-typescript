import { tieredPaywallPreferenceBucket } from "../../paywall/rule/tiered-paywall-preference-policy.js";
import { TieredPaywallPreference } from "../../paywall/rule/tiered-paywall-preference.js";
import { FunnelScore, newFunnelScore } from "./funnel-score.js";

export function summarizeTieredPaywallPreferencesForScore(items: TieredPaywallPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveFunnelScoresFromPreference(items: TieredPaywallPreference[]): FunnelScore[] {
  const out: FunnelScore[] = [];
  for (const item of items) {
    const derived = newFunnelScore(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeFunnelScore(item: FunnelScore): string {
  return tieredPaywallPreferenceBucket(item.weightedValue());
}
