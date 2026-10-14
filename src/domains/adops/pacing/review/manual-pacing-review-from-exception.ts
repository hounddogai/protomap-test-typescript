import { classifyGlobalPacingAllocation } from "../exception/global-pacing-allocation-policy.js";
import { WeightedPacingException } from "../exception/weighted-pacing-exception.js";
import { ManualPacingReview, newManualPacingReview } from "./manual-pacing-review.js";

export function summarizeWeightedPacingExceptionsForReview(items: WeightedPacingException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveManualPacingReviewsFromException(items: WeightedPacingException[]): ManualPacingReview[] {
  const out: ManualPacingReview[] = [];
  for (const item of items) {
    const derived = newManualPacingReview(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileManualPacingReview(item: ManualPacingReview): string {
  return classifyGlobalPacingAllocation(item.measuredValue());
}
