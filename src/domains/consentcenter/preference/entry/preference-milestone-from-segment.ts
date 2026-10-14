import { doubleOptInReservationWeight } from "../../double-opt-in/reservation/double-opt-in-reservation-policy.js";
import { DoubleOptInSegment } from "../../double-opt-in/reservation/double-opt-in-segment.js";
import { PreferenceMilestone, newPreferenceMilestone } from "./preference-milestone.js";

export function summarizeDoubleOptInSegmentsForMilestone(items: DoubleOptInSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePreferenceMilestonesFromSegment(items: DoubleOptInSegment[]): PreferenceMilestone[] {
  const out: PreferenceMilestone[] = [];
  for (const item of items) {
    const derived = newPreferenceMilestone(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePreferenceMilestone(item: PreferenceMilestone): number {
  return doubleOptInReservationWeight(5, true);
}
