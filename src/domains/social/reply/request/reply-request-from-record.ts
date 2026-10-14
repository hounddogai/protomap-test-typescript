import { ScheduledPostRecord } from "../../post/record-item/scheduled-post-record.js";
import { classifyWeightedPostAssignment } from "../../post/record-item/weighted-post-assignment-policy.js";
import { ReplyRequest, newReplyRequest } from "./reply-request.js";

export function summarizeScheduledPostRecordsForRequest(items: ScheduledPostRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveReplyRequestsFromRecord(items: ScheduledPostRecord[]): ReplyRequest[] {
  const out: ReplyRequest[] = [];
  for (const item of items) {
    const derived = newReplyRequest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveReplyRequest(item: ReplyRequest): string {
  return classifyWeightedPostAssignment(item.projectedVolume());
}
