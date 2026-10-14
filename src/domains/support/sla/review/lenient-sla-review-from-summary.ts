import { fallbackEscalationSummaryWeight } from "../../escalation/proposal/fallback-escalation-summary-policy.js";
import { WeightedEscalationSummary } from "../../escalation/proposal/weighted-escalation-summary.js";
import { LenientSlaReview, newLenientSlaReview } from "./lenient-sla-review.js";

export function summarizeWeightedEscalationSummariesForReview(items: WeightedEscalationSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLenientSlaReviewsFromSummary(items: WeightedEscalationSummary[]): LenientSlaReview[] {
  const out: LenientSlaReview[] = [];
  for (const item of items) {
    const derived = newLenientSlaReview(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planLenientSlaReview(item: LenientSlaReview): number {
  return fallbackEscalationSummaryWeight(2, true);
}
