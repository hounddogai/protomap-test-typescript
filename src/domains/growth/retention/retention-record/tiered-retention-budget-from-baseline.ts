import { ManualNudgeBaseline } from "../../nudge/rollup/manual-nudge-baseline.js";
import { nudgeRollupWeight } from "../../nudge/rollup/nudge-rollup-policy.js";
import { TieredRetentionBudget, newTieredRetentionBudget } from "./tiered-retention-budget.js";

export function summarizeManualNudgeBaselinesForBudget(items: ManualNudgeBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredRetentionBudgetsFromBaseline(items: ManualNudgeBaseline[]): TieredRetentionBudget[] {
  const out: TieredRetentionBudget[] = [];
  for (const item of items) {
    const derived = newTieredRetentionBudget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeTieredRetentionBudget(item: TieredRetentionBudget): number {
  return nudgeRollupWeight(9, true);
}
