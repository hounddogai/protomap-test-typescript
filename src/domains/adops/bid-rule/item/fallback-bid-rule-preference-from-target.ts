import { pendingPacingTargetWeight } from "../../pacing/preference/pending-pacing-target-policy.js";
import { PendingPacingTarget } from "../../pacing/preference/pending-pacing-target.js";
import { FallbackBidRulePreference, newFallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

export function summarizePendingPacingTargetsForPreference(items: PendingPacingTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFallbackBidRulePreferencesFromTarget(items: PendingPacingTarget[]): FallbackBidRulePreference[] {
  const out: FallbackBidRulePreference[] = [];
  for (const item of items) {
    const derived = newFallbackBidRulePreference(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeFallbackBidRulePreference(item: FallbackBidRulePreference): number {
  return pendingPacingTargetWeight(4, true);
}
