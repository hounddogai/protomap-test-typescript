import { classifyGlobalInsightThreshold } from "../../insight/insight-threshold/global-insight-threshold-policy.js";
import { GlobalInsightThreshold } from "../../insight/insight-threshold/global-insight-threshold.js";
import { MentionBatch, newMentionBatch } from "./mention-batch.js";

export function summarizeGlobalInsightThresholdsForBatch(items: GlobalInsightThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveMentionBatchesFromThreshold(items: GlobalInsightThreshold[]): MentionBatch[] {
  const out: MentionBatch[] = [];
  for (const item of items) {
    const derived = newMentionBatch(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileMentionBatch(item: MentionBatch): string {
  return classifyGlobalInsightThreshold(item.netValue());
}
