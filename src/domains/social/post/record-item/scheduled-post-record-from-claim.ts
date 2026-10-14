import { BatchedReplyClaim } from "../../reply/reply-claim/batched-reply-claim.js";
import { normalizeScheduledReplyLedgerCode } from "../../reply/reply-claim/scheduled-reply-ledger-policy.js";
import { ScheduledPostRecord, newScheduledPostRecord } from "./scheduled-post-record.js";

export function summarizeBatchedReplyClaimsForRecord(items: BatchedReplyClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveScheduledPostRecordsFromClaim(items: BatchedReplyClaim[]): ScheduledPostRecord[] {
  const out: ScheduledPostRecord[] = [];
  for (const item of items) {
    const derived = newScheduledPostRecord(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeScheduledPostRecord(item: ScheduledPostRecord): string {
  return normalizeScheduledReplyLedgerCode(item.code);
}
