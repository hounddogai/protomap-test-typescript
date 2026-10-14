import { NudgeBudget } from "../../nudge/metric/nudge-budget.js";
import { rollingNudgeSnapshotWeight } from "../../nudge/metric/rolling-nudge-snapshot-policy.js";
import { ActivationScore, newActivationScore } from "./activation-score.js";

export function summarizeNudgeBudgetsForScore(items: NudgeBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveActivationScoresFromBudget(items: NudgeBudget[]): ActivationScore[] {
  const out: ActivationScore[] = [];
  for (const item of items) {
    const derived = newActivationScore(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleActivationScore(item: ActivationScore): number {
  return rollingNudgeSnapshotWeight(9, true);
}
