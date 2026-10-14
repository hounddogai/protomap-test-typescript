import { BounceRecord } from "../../bounce/record-item/bounce-record.js";
import { bounceThresholdWeight } from "../../bounce/record-item/bounce-threshold-policy.js";
import { WarmupBudget, newWarmupBudget } from "./warmup-budget.js";

export function summarizeBounceRecordsForBudget(items: BounceRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWarmupBudgetsFromRecord(items: BounceRecord[]): WarmupBudget[] {
  const out: WarmupBudget[] = [];
  for (const item of items) {
    const derived = newWarmupBudget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceWarmupBudget(item: WarmupBudget): number {
  return bounceThresholdWeight(1, true);
}
