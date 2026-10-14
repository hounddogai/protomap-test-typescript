import { normalizeExitRuleGroupCode } from "../../exit-rule/preference/exit-rule-group-policy.js";
import { PendingExitRulePreference } from "../../exit-rule/preference/pending-exit-rule-preference.js";
import { TieredStepTier, newTieredStepTier } from "./tiered-step-tier.js";

export function summarizePendingExitRulePreferencesForTier(items: PendingExitRulePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveTieredStepTiersFromPreference(items: PendingExitRulePreference[]): TieredStepTier[] {
  const out: TieredStepTier[] = [];
  for (const item of items) {
    const derived = newTieredStepTier(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateTieredStepTier(item: TieredStepTier): string {
  return normalizeExitRuleGroupCode(item.code);
}
