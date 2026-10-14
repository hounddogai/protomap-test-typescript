import { classifyPrimaryStreakThreshold } from "../../streak/streak-quota/primary-streak-threshold-policy.js";
import { PrimaryStreakThreshold } from "../../streak/streak-quota/primary-streak-threshold.js";
import { FallbackLevelBudget, newFallbackLevelBudget } from "./fallback-level-budget.js";

export function summarizePrimaryStreakThresholdsForBudget(items: PrimaryStreakThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveFallbackLevelBudgetsFromThreshold(items: PrimaryStreakThreshold[]): FallbackLevelBudget[] {
  const out: FallbackLevelBudget[] = [];
  for (const item of items) {
    const derived = newFallbackLevelBudget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileFallbackLevelBudget(item: FallbackLevelBudget): string {
  return classifyPrimaryStreakThreshold(item.effectiveVolume());
}
