import { CappedPreferenceOverride } from "../../preference/override-item/capped-preference-override.js";
import { preferenceSummaryWeight } from "../../preference/override-item/preference-summary-policy.js";
import { BatchedOptOutScore, newBatchedOptOutScore } from "./batched-opt-out-score.js";

export function summarizeCappedPreferenceOverridesForScore(items: CappedPreferenceOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveBatchedOptOutScoresFromOverride(items: CappedPreferenceOverride[]): BatchedOptOutScore[] {
  const out: BatchedOptOutScore[] = [];
  for (const item of items) {
    const derived = newBatchedOptOutScore(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankBatchedOptOutScore(item: BatchedOptOutScore): number {
  return preferenceSummaryWeight(5, true);
}
