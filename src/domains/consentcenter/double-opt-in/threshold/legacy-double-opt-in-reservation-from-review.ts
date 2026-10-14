import { DoubleOptInReview } from "../segment/double-opt-in-review.js";
import { seasonalDoubleOptInSegmentWeight } from "../segment/seasonal-double-opt-in-segment-policy.js";
import { LegacyDoubleOptInReservation, newLegacyDoubleOptInReservation } from "./legacy-double-opt-in-reservation.js";

export function summarizeDoubleOptInReviewsForReservation(items: DoubleOptInReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyDoubleOptInReservationsFromReview(items: DoubleOptInReview[]): LegacyDoubleOptInReservation[] {
  const out: LegacyDoubleOptInReservation[] = [];
  for (const item of items) {
    const derived = newLegacyDoubleOptInReservation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectLegacyDoubleOptInReservation(item: LegacyDoubleOptInReservation): number {
  return seasonalDoubleOptInSegmentWeight(3, true);
}
