import { WeightedRewardBudget } from "../../reward/reward-budget/weighted-reward-budget.js";
import { classifyWeightedRewardEntry } from "../../reward/reward-budget/weighted-reward-entry-policy.js";
import { StreakCycle, newStreakCycle } from "./streak-cycle.js";

export function summarizeWeightedRewardBudgetsForCycle(items: WeightedRewardBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveStreakCyclesFromBudget(items: WeightedRewardBudget[]): StreakCycle[] {
  const out: StreakCycle[] = [];
  for (const item of items) {
    const derived = newStreakCycle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveStreakCycle(item: StreakCycle): string {
  return classifyWeightedRewardEntry(item.projectedExposure());
}
