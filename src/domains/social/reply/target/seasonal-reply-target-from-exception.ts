import { classifyBatchedReplyException } from "../reply-draft/batched-reply-exception-policy.js";
import { BatchedReplyException } from "../reply-draft/batched-reply-exception.js";
import { SeasonalReplyTarget, newSeasonalReplyTarget } from "./seasonal-reply-target.js";

export function summarizeBatchedReplyExceptionsForTarget(items: BatchedReplyException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveSeasonalReplyTargetsFromException(items: BatchedReplyException[]): SeasonalReplyTarget[] {
  const out: SeasonalReplyTarget[] = [];
  for (const item of items) {
    const derived = newSeasonalReplyTarget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchSeasonalReplyTarget(item: SeasonalReplyTarget): string {
  return classifyBatchedReplyException(item.weightedLoad());
}
