import { normalizePreferenceBudgetCode } from "../../preference/budget/preference-budget-policy.js";
import { PreferenceBudget } from "../../preference/budget/preference-budget.js";
import { SeasonalSuppressionBundle, newSeasonalSuppressionBundle } from "./seasonal-suppression-bundle.js";

export function summarizePreferenceBudgetsForBundle(items: PreferenceBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveSeasonalSuppressionBundlesFromBudget(items: PreferenceBudget[]): SeasonalSuppressionBundle[] {
  const out: SeasonalSuppressionBundle[] = [];
  for (const item of items) {
    const derived = newSeasonalSuppressionBundle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSeasonalSuppressionBundle(item: SeasonalSuppressionBundle): string {
  return normalizePreferenceBudgetCode(item.code);
}
