import { mentionExceptionBucket } from "../score/mention-exception-policy.js";
import { PendingMentionScore } from "../score/pending-mention-score.js";
import { WeightedMentionException, newWeightedMentionException } from "./weighted-mention-exception.js";

export function summarizePendingMentionScoresForException(items: PendingMentionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveWeightedMentionExceptionsFromScore(items: PendingMentionScore[]): WeightedMentionException[] {
  const out: WeightedMentionException[] = [];
  for (const item of items) {
    const derived = newWeightedMentionException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchWeightedMentionExceptionExtra(item: WeightedMentionException): string {
  return mentionExceptionBucket(item.weightedValue());
}
