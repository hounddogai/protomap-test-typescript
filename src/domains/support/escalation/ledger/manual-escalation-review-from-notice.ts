import {
  adaptiveEscalationReservationWeight,
} from "../escalation-reservation/adaptive-escalation-reservation-policy.js";
import { BatchedEscalationNotice } from "../escalation-reservation/batched-escalation-notice.js";
import { ManualEscalationReview, newManualEscalationReview } from "./manual-escalation-review.js";

export function summarizeBatchedEscalationNoticesForReview(items: BatchedEscalationNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveManualEscalationReviewsFromNotice(items: BatchedEscalationNotice[]): ManualEscalationReview[] {
  const out: ManualEscalationReview[] = [];
  for (const item of items) {
    const derived = newManualEscalationReview(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreManualEscalationReview(item: ManualEscalationReview): number {
  return adaptiveEscalationReservationWeight(9, true);
}
