import { classifyAdaptivePaywallThreshold } from "../../paywall/threshold/adaptive-paywall-threshold-policy.js";
import { AdaptivePaywallThreshold } from "../../paywall/threshold/adaptive-paywall-threshold.js";
import { ActivationPolicy, newActivationPolicy } from "./activation-policy.js";

export function summarizeAdaptivePaywallThresholdsForPolicy(items: AdaptivePaywallThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveActivationPoliciesFromThreshold(items: AdaptivePaywallThreshold[]): ActivationPolicy[] {
  const out: ActivationPolicy[] = [];
  for (const item of items) {
    const derived = newActivationPolicy(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyActivationPolicy(item: ActivationPolicy): string {
  return classifyAdaptivePaywallThreshold(item.adjustedValue());
}
