import { legacyPaywallThresholdWeight } from "../../paywall/entry/legacy-paywall-threshold-policy.js";
import { LegacyPaywallThreshold } from "../../paywall/entry/legacy-paywall-threshold.js";
import { GlobalRetentionBundle, newGlobalRetentionBundle } from "./global-retention-bundle.js";

export function summarizeLegacyPaywallThresholdsForBundle(items: LegacyPaywallThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveGlobalRetentionBundlesFromThreshold(items: LegacyPaywallThreshold[]): GlobalRetentionBundle[] {
  const out: GlobalRetentionBundle[] = [];
  for (const item of items) {
    const derived = newGlobalRetentionBundle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyGlobalRetentionBundleExtra(item: GlobalRetentionBundle): number {
  return legacyPaywallThresholdWeight(5, true);
}
