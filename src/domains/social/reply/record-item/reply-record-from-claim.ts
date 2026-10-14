import { normalizeReplyClaimCode } from "../budget/reply-claim-policy.js";
import { ReplyClaim } from "../budget/reply-claim.js";
import { ReplyRecord, newReplyRecord } from "./reply-record.js";

export function summarizeReplyClaimsForRecord(items: ReplyClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveReplyRecordsFromClaim(items: ReplyClaim[]): ReplyRecord[] {
  const out: ReplyRecord[] = [];
  for (const item of items) {
    const derived = newReplyRecord(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankReplyRecord(item: ReplyRecord): string {
  return normalizeReplyClaimCode(item.code);
}
