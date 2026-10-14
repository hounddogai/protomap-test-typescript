import { adaptiveSenderReviewBucket } from "../../sender/threshold/adaptive-sender-review-policy.js";
import { LegacySenderEntry } from "../../sender/threshold/legacy-sender-entry.js";
import { RollingBounceRequest, newRollingBounceRequest } from "./rolling-bounce-request.js";

export function summarizeLegacySenderEntriesForRequest(items: LegacySenderEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRollingBounceRequestsFromEntry(items: LegacySenderEntry[]): RollingBounceRequest[] {
  const out: RollingBounceRequest[] = [];
  for (const item of items) {
    const derived = newRollingBounceRequest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyRollingBounceRequest(item: RollingBounceRequest): string {
  return adaptiveSenderReviewBucket(item.netLoad());
}
