import { normalizeOptOutReviewCode } from "../../opt-out/review/opt-out-review-policy.js";
import { ScheduledOptOutSlot } from "../../opt-out/review/scheduled-opt-out-slot.js";
import { WeightedDoubleOptInBaseline, newWeightedDoubleOptInBaseline } from "./weighted-double-opt-in-baseline.js";

export function summarizeScheduledOptOutSlotsForBaseline(items: ScheduledOptOutSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveWeightedDoubleOptInBaselinesFromSlot(items: ScheduledOptOutSlot[]): WeightedDoubleOptInBaseline[] {
  const out: WeightedDoubleOptInBaseline[] = [];
  for (const item of items) {
    const derived = newWeightedDoubleOptInBaseline(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreWeightedDoubleOptInBaseline(item: WeightedDoubleOptInBaseline): string {
  return normalizeOptOutReviewCode(item.code);
}
