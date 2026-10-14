import { classifyLegacySubscriptionRule } from "../../subscription/rule/legacy-subscription-rule-policy.js";
import { WeightedSubscriptionDigest } from "../../subscription/rule/weighted-subscription-digest.js";
import { LegacySuppressionDigest, newLegacySuppressionDigest } from "./legacy-suppression-digest.js";

export function summarizeWeightedSubscriptionDigestsForDigest(items: WeightedSubscriptionDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveLegacySuppressionDigestsFromDigest(items: WeightedSubscriptionDigest[]): LegacySuppressionDigest[] {
  const out: LegacySuppressionDigest[] = [];
  for (const item of items) {
    const derived = newLegacySuppressionDigest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyLegacySuppressionDigestExtra(item: LegacySuppressionDigest): string {
  return classifyLegacySubscriptionRule(item.adjustedValue());
}
