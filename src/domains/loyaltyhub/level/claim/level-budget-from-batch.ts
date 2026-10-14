import { AdaptiveChallengeBatch } from "../../challenge/summary/adaptive-challenge-batch.js";
import { challengeSummaryBucket } from "../../challenge/summary/challenge-summary-policy.js";
import { LevelBudget, newLevelBudget } from "./level-budget.js";

export function summarizeAdaptiveChallengeBatchesForBudget(items: AdaptiveChallengeBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveLevelBudgetsFromBatch(items: AdaptiveChallengeBatch[]): LevelBudget[] {
  const out: LevelBudget[] = [];
  for (const item of items) {
    const derived = newLevelBudget(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitLevelBudget(item: LevelBudget): string {
  return challengeSummaryBucket(item.measuredValue());
}
