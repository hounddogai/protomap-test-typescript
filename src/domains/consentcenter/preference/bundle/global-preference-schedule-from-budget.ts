import { preferenceBudgetWeight } from "../budget/preference-budget-policy.js";
import { PreferenceBudget } from "../budget/preference-budget.js";
import { GlobalPreferenceSchedule, newGlobalPreferenceSchedule } from "./global-preference-schedule.js";

export function summarizePreferenceBudgetsForSchedule(items: PreferenceBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveGlobalPreferenceSchedulesFromBudget(items: PreferenceBudget[]): GlobalPreferenceSchedule[] {
  const out: GlobalPreferenceSchedule[] = [];
  for (const item of items) {
    const derived = newGlobalPreferenceSchedule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitGlobalPreferenceSchedule(item: GlobalPreferenceSchedule): number {
  return preferenceBudgetWeight(5, true);
}
