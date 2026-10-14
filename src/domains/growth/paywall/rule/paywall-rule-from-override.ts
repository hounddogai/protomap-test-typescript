import { LenientActivationOverride } from "../../activation/override-item/lenient-activation-override.js";
import { weightedActivationBatchBucket } from "../../activation/override-item/weighted-activation-batch-policy.js";
import { PaywallRule, newPaywallRule } from "./paywall-rule.js";

export function summarizeLenientActivationOverridesForRule(items: LenientActivationOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePaywallRulesFromOverride(items: LenientActivationOverride[]): PaywallRule[] {
  const out: PaywallRule[] = [];
  for (const item of items) {
    const derived = newPaywallRule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePaywallRule(item: PaywallRule): string {
  return weightedActivationBatchBucket(item.adjustedValue());
}
