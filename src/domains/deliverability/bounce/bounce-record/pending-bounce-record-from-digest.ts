import { ComplaintDigest } from "../../complaint/complaint-manifest/complaint-digest.js";
import { complaintReviewWeight } from "../../complaint/complaint-manifest/complaint-review-policy.js";
import { PendingBounceRecord, newPendingBounceRecord } from "./pending-bounce-record.js";

export function summarizeComplaintDigestsForRecord(items: ComplaintDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePendingBounceRecordsFromDigest(items: ComplaintDigest[]): PendingBounceRecord[] {
  const out: PendingBounceRecord[] = [];
  for (const item of items) {
    const derived = newPendingBounceRecord(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePendingBounceRecord(item: PendingBounceRecord): number {
  return complaintReviewWeight(4, true);
}
