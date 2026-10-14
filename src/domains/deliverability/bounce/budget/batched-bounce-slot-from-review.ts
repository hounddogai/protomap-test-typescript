import { StrictDomainReview } from "../../domain/review/strict-domain-review.js";
import { classifyStrictDomainSchedule } from "../../domain/review/strict-domain-schedule-policy.js";
import { BatchedBounceSlot, newBatchedBounceSlot } from "./batched-bounce-slot.js";

export function summarizeStrictDomainReviewsForSlot(items: StrictDomainReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBatchedBounceSlotsFromReview(items: StrictDomainReview[]): BatchedBounceSlot[] {
  const out: BatchedBounceSlot[] = [];
  for (const item of items) {
    const derived = newBatchedBounceSlot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectBatchedBounceSlot(item: BatchedBounceSlot): string {
  return classifyStrictDomainSchedule(item.netLoad());
}
