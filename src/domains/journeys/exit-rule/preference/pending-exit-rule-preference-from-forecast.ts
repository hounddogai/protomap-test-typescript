import { WaitForecast } from "../../wait/milestone/wait-forecast.js";
import { waitSummaryWeight } from "../../wait/milestone/wait-summary-policy.js";
import { PendingExitRulePreference, newPendingExitRulePreference } from "./pending-exit-rule-preference.js";

export function summarizeWaitForecastsForPreference(items: WaitForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePendingExitRulePreferencesFromForecast(items: WaitForecast[]): PendingExitRulePreference[] {
  const out: PendingExitRulePreference[] = [];
  for (const item of items) {
    const derived = newPendingExitRulePreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectPendingExitRulePreference(item: PendingExitRulePreference): number {
  return waitSummaryWeight(6, true);
}
