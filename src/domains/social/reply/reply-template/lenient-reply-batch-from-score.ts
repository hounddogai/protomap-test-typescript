import { regionalInsightScoreWeight } from "../../insight/agreement/regional-insight-score-policy.js";
import { RegionalInsightScore } from "../../insight/agreement/regional-insight-score.js";
import { LenientReplyBatch, newLenientReplyBatch } from "./lenient-reply-batch.js";

export function summarizeRegionalInsightScoresForBatch(items: RegionalInsightScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveLenientReplyBatchesFromScore(items: RegionalInsightScore[]): LenientReplyBatch[] {
  const out: LenientReplyBatch[] = [];
  for (const item of items) {
    const derived = newLenientReplyBatch(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectLenientReplyBatch(item: LenientReplyBatch): number {
  return regionalInsightScoreWeight(6, true);
}
