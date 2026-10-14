import { CappedBidRuleOverride } from "../../bid-rule/rule-notice/capped-bid-rule-override.js";
import {
  normalizeWeightedBidRuleOverrideCode,
} from "../../bid-rule/rule-notice/weighted-bid-rule-override-policy.js";
import { PrimaryFlightPolicy, newPrimaryFlightPolicy } from "./primary-flight-policy.js";

export function summarizeCappedBidRuleOverridesForPolicy(items: CappedBidRuleOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function derivePrimaryFlightPoliciesFromOverride(items: CappedBidRuleOverride[]): PrimaryFlightPolicy[] {
  const out: PrimaryFlightPolicy[] = [];
  for (const item of items) {
    const derived = newPrimaryFlightPolicy(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planPrimaryFlightPolicy(item: PrimaryFlightPolicy): string {
  return normalizeWeightedBidRuleOverrideCode(item.code);
}
