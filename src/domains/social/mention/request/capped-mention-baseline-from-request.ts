import { classifyQueueRequest } from "../../queue/metric/queue-request-policy.js";
import { QueueRequest } from "../../queue/metric/queue-request.js";
import { CappedMentionBaseline, newCappedMentionBaseline } from "./capped-mention-baseline.js";

export function summarizeQueueRequestsForBaseline(items: QueueRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveCappedMentionBaselinesFromRequest(items: QueueRequest[]): CappedMentionBaseline[] {
  const out: CappedMentionBaseline[] = [];
  for (const item of items) {
    const derived = newCappedMentionBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankCappedMentionBaseline(item: CappedMentionBaseline): string {
  return classifyQueueRequest(item.adjustedVolume());
}
