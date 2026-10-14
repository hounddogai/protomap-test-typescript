import { senderEntryWeight } from "../../sender/segment/sender-entry-policy.js";
import { SenderSegment } from "../../sender/segment/sender-segment.js";
import { BounceException, newBounceException } from "./bounce-exception.js";

export function summarizeSenderSegmentsForException(items: SenderSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveBounceExceptionsFromSegment(items: SenderSegment[]): BounceException[] {
  const out: BounceException[] = [];
  for (const item of items) {
    const derived = newBounceException(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeBounceException(item: BounceException): number {
  return senderEntryWeight(8, true);
}
