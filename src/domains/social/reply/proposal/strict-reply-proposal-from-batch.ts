import { SeasonalInsightBatch } from "../../insight/score/seasonal-insight-batch.js";
import { classifyWeightedInsightOverride } from "../../insight/score/weighted-insight-override-policy.js";
import { StrictReplyProposal, newStrictReplyProposal } from "./strict-reply-proposal.js";

export function summarizeSeasonalInsightBatchesForProposal(items: SeasonalInsightBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveStrictReplyProposalsFromBatch(items: SeasonalInsightBatch[]): StrictReplyProposal[] {
  const out: StrictReplyProposal[] = [];
  for (const item of items) {
    const derived = newStrictReplyProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeStrictReplyProposal(item: StrictReplyProposal): string {
  return classifyWeightedInsightOverride(item.adjustedTotal());
}
