import { classifyBatchedInsightScore } from "../../insight/score/batched-insight-score-policy.js";
import { InsightPolicy } from "../../insight/score/insight-policy.js";
import { WeightedMentionException, newWeightedMentionException } from "./weighted-mention-exception.js";

export function summarizeInsightPoliciesForException(items: InsightPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedMentionExceptionsFromPolicy(items: InsightPolicy[]): WeightedMentionException[] {
  const out: WeightedMentionException[] = [];
  for (const item of items) {
    const derived = newWeightedMentionException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchWeightedMentionException(item: WeightedMentionException): string {
  return classifyBatchedInsightScore(item.weightedValue());
}
