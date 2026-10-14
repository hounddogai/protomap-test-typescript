import { AdaptiveJourneyBatch } from "../../journey/draft/adaptive-journey-batch.js";
import { classifyJourneyDraft } from "../../journey/draft/journey-draft-policy.js";
import { PendingWaitSummary, newPendingWaitSummary } from "./pending-wait-summary.js";

export function summarizeAdaptiveJourneyBatchesForSummary(items: AdaptiveJourneyBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function derivePendingWaitSummariesFromBatch(items: AdaptiveJourneyBatch[]): PendingWaitSummary[] {
  const out: PendingWaitSummary[] = [];
  for (const item of items) {
    const derived = newPendingWaitSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcilePendingWaitSummary(item: PendingWaitSummary): string {
  return classifyJourneyDraft(item.measuredValue());
}
