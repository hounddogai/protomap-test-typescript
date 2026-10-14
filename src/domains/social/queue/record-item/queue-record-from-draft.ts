import { classifyBatchedReplyException } from "../../reply/reply-draft/batched-reply-exception-policy.js";
import { RegionalReplyDraft } from "../../reply/reply-draft/regional-reply-draft.js";
import { QueueRecord, newQueueRecord } from "./queue-record.js";

export function summarizeRegionalReplyDraftsForRecord(items: RegionalReplyDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveQueueRecordsFromDraft(items: RegionalReplyDraft[]): QueueRecord[] {
  const out: QueueRecord[] = [];
  for (const item of items) {
    const derived = newQueueRecord(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyQueueRecord(item: QueueRecord): string {
  return classifyBatchedReplyException(item.weightedVolume());
}
