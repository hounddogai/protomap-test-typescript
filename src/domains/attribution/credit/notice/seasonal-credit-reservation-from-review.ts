import { classifyLenientModelManifest } from "../../model/model-record/lenient-model-manifest-policy.js";
import { ModelReview } from "../../model/model-record/model-review.js";
import { SeasonalCreditReservation, newSeasonalCreditReservation } from "./seasonal-credit-reservation.js";

export function summarizeModelReviewsForReservation(items: ModelReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveSeasonalCreditReservationsFromReview(items: ModelReview[]): SeasonalCreditReservation[] {
  const out: SeasonalCreditReservation[] = [];
  for (const item of items) {
    const derived = newSeasonalCreditReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankSeasonalCreditReservation(item: SeasonalCreditReservation): string {
  return classifyLenientModelManifest(item.netValue());
}
