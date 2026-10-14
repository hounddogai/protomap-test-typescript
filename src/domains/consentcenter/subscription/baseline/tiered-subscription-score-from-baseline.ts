import { preferenceBaselineBucket } from "../../preference/baseline/preference-baseline-policy.js";
import { PreferenceBaseline } from "../../preference/baseline/preference-baseline.js";
import { TieredSubscriptionScore, newTieredSubscriptionScore } from "./tiered-subscription-score.js";

export function summarizePreferenceBaselinesForScore(items: PreferenceBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveTieredSubscriptionScoresFromBaseline(items: PreferenceBaseline[]): TieredSubscriptionScore[] {
  const out: TieredSubscriptionScore[] = [];
  for (const item of items) {
    const derived = newTieredSubscriptionScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchTieredSubscriptionScore(item: TieredSubscriptionScore): string {
  return preferenceBaselineBucket(item.effectiveValue());
}
