import { LegacyCreditSchedule } from "../../credit/agreement/legacy-credit-schedule.js";
import { classifyManualCreditAgreement } from "../../credit/agreement/manual-credit-agreement-policy.js";
import { WeightedWindowReview, newWeightedWindowReview } from "./weighted-window-review.js";

export function summarizeLegacyCreditSchedulesForReview(items: LegacyCreditSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveWeightedWindowReviewsFromSchedule(items: LegacyCreditSchedule[]): WeightedWindowReview[] {
  const out: WeightedWindowReview[] = [];
  for (const item of items) {
    const derived = newWeightedWindowReview(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateWeightedWindowReview(item: WeightedWindowReview): string {
  return classifyManualCreditAgreement(item.projectedTotal());
}
