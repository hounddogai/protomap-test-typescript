import { LegacyPaywallMetric } from "../../paywall/paywall-metric/legacy-paywall-metric.js";
import { classifyPrimaryPaywallTemplate } from "../../paywall/paywall-metric/primary-paywall-template-policy.js";
import { FallbackRetentionBundle, newFallbackRetentionBundle } from "./fallback-retention-bundle.js";

export function summarizeLegacyPaywallMetricsForBundle(items: LegacyPaywallMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFallbackRetentionBundlesFromMetric(items: LegacyPaywallMetric[]): FallbackRetentionBundle[] {
  const out: FallbackRetentionBundle[] = [];
  for (const item of items) {
    const derived = newFallbackRetentionBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignFallbackRetentionBundle(item: FallbackRetentionBundle): string {
  return classifyPrimaryPaywallTemplate(item.weightedLoad());
}
