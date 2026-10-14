import { ActivationOverride } from "../../activation/activation-summary/activation-override.js";
import { activationRequestWeight } from "../../activation/activation-summary/activation-request-policy.js";
import { FunnelRule, newFunnelRule } from "./funnel-rule.js";

export function summarizeActivationOverridesForRule(items: ActivationOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveFunnelRulesFromOverride(items: ActivationOverride[]): FunnelRule[] {
  const out: FunnelRule[] = [];
  for (const item of items) {
    const derived = newFunnelRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function assignFunnelRule(item: FunnelRule): number {
  return activationRequestWeight(9, true);
}
