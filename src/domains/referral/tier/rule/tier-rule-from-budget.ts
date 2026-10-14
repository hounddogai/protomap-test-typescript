import { defaultPayoutTargetBucket } from "../../payout/assignment/default-payout-target-policy.js";
import { LenientPayoutBudget } from "../../payout/assignment/lenient-payout-budget.js";
import { TierRule, newTierRule } from "./tier-rule.js";

export function summarizeLenientPayoutBudgetsForRule(items: LenientPayoutBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveTierRulesFromBudget(items: LenientPayoutBudget[]): TierRule[] {
  const out: TierRule[] = [];
  for (const item of items) {
    const derived = newTierRule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeTierRule(item: TierRule): string {
  return defaultPayoutTargetBucket(item.effectiveExposure());
}
