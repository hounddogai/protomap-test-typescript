import { adaptiveReplyThresholdBucket } from "../../reply/notice/adaptive-reply-threshold-policy.js";
import { AdaptiveReplyThreshold } from "../../reply/notice/adaptive-reply-threshold.js";
import { TieredQueueLedger, newTieredQueueLedger } from "./tiered-queue-ledger.js";

export function summarizeAdaptiveReplyThresholdsForLedger(items: AdaptiveReplyThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveTieredQueueLedgersFromThreshold(items: AdaptiveReplyThreshold[]): TieredQueueLedger[] {
  const out: TieredQueueLedger[] = [];
  for (const item of items) {
    const derived = newTieredQueueLedger(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeTieredQueueLedger(item: TieredQueueLedger): string {
  return adaptiveReplyThresholdBucket(item.weightedVolume());
}
