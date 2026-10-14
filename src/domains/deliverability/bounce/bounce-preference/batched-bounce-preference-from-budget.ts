import { lenientWarmupMilestoneBucket } from "../../warmup/milestone/lenient-warmup-milestone-policy.js";
import { SeasonalWarmupBudget } from "../../warmup/milestone/seasonal-warmup-budget.js";
import { BatchedBouncePreference, newBatchedBouncePreference } from "./batched-bounce-preference.js";

export function summarizeSeasonalWarmupBudgetsForPreference(items: SeasonalWarmupBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveBatchedBouncePreferencesFromBudget(items: SeasonalWarmupBudget[]): BatchedBouncePreference[] {
  const out: BatchedBouncePreference[] = [];
  for (const item of items) {
    const derived = newBatchedBouncePreference(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedBouncePreference(item: BatchedBouncePreference): string {
  return lenientWarmupMilestoneBucket(item.netLoad());
}
