import { ManualSlaPlan } from "../../sla/reservation/manual-sla-plan.js";
import { slaReservationBucket } from "../../sla/reservation/sla-reservation-policy.js";
import { MacroReview, newMacroReview } from "./macro-review.js";

export function summarizeManualSlaPlansForReview(items: ManualSlaPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveMacroReviewsFromPlan(items: ManualSlaPlan[]): MacroReview[] {
  const out: MacroReview[] = [];
  for (const item of items) {
    const derived = newMacroReview(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyMacroReview(item: MacroReview): string {
  return slaReservationBucket(item.weightedLoad());
}
