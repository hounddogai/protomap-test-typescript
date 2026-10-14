import { proofScheduleBucket } from "../../proof/allocation/proof-schedule-policy.js";
import { ProofSchedule } from "../../proof/allocation/proof-schedule.js";
import { SubscriptionReview, newSubscriptionReview } from "./subscription-review.js";

export function summarizeProofSchedulesForReview(items: ProofSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveSubscriptionReviewsFromSchedule(items: ProofSchedule[]): SubscriptionReview[] {
  const out: SubscriptionReview[] = [];
  for (const item of items) {
    const derived = newSubscriptionReview(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileSubscriptionReview(item: SubscriptionReview): string {
  return proofScheduleBucket(item.adjustedLoad());
}
