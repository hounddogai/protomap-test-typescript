import { conversionBudgetWeight } from "../../conversion/proposal/conversion-budget-policy.js";
import { ConversionBudget } from "../../conversion/proposal/conversion-budget.js";
import { WindowGroup, newWindowGroup } from "./window-group.js";

export function summarizeConversionBudgetsForGroup(items: ConversionBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveWindowGroupsFromBudget(items: ConversionBudget[]): WindowGroup[] {
  const out: WindowGroup[] = [];
  for (const item of items) {
    const derived = newWindowGroup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeWindowGroup(item: WindowGroup): number {
  return conversionBudgetWeight(2, true);
}
