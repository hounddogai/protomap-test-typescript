import { PendingBouncePreference } from "../../bounce/preference/pending-bounce-preference.js";
import { classifySeasonalBouncePreference } from "../../bounce/preference/seasonal-bounce-preference-policy.js";
import { WeightedReputationException, newWeightedReputationException } from "./weighted-reputation-exception.js";

export function summarizePendingBouncePreferencesForException(items: PendingBouncePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveWeightedReputationExceptionsFromPreference(items: PendingBouncePreference[]): WeightedReputationException[] {
  const out: WeightedReputationException[] = [];
  for (const item of items) {
    const derived = newWeightedReputationException(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchWeightedReputationException(item: WeightedReputationException): string {
  return classifySeasonalBouncePreference(item.netExposure());
}
