import { pendingBouncePreferenceWeight } from "../../bounce/preference/pending-bounce-preference-policy.js";
import { SeasonalBouncePreference } from "../../bounce/preference/seasonal-bounce-preference.js";
import { AdaptiveDomainSchedule, newAdaptiveDomainSchedule } from "./adaptive-domain-schedule.js";

export function summarizeSeasonalBouncePreferencesForSchedule(items: SeasonalBouncePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveAdaptiveDomainSchedulesFromPreference(items: SeasonalBouncePreference[]): AdaptiveDomainSchedule[] {
  const out: AdaptiveDomainSchedule[] = [];
  for (const item of items) {
    const derived = newAdaptiveDomainSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeAdaptiveDomainSchedule(item: AdaptiveDomainSchedule): number {
  return pendingBouncePreferenceWeight(5, true);
}
