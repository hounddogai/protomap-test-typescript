import { cappedSlaCheckpointBucket } from "../../sla/review/capped-sla-checkpoint-policy.js";
import { LenientSlaReview } from "../../sla/review/lenient-sla-review.js";
import { PendingEscalationSlot, newPendingEscalationSlot } from "./pending-escalation-slot.js";

export function summarizeLenientSlaReviewsForSlot(items: LenientSlaReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePendingEscalationSlotsFromReview(items: LenientSlaReview[]): PendingEscalationSlot[] {
  const out: PendingEscalationSlot[] = [];
  for (const item of items) {
    const derived = newPendingEscalationSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePendingEscalationSlot(item: PendingEscalationSlot): string {
  return cappedSlaCheckpointBucket(item.weightedLoad());
}
