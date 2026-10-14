import { classifyWeightedWaitSlot } from "../../wait/pending-wait-policy/weighted-wait-slot-policy.js";
import { WeightedWaitSlot } from "../../wait/pending-wait-policy/weighted-wait-slot.js";
import { EnrollmentSegment, newEnrollmentSegment } from "./enrollment-segment.js";

export function summarizeWeightedWaitSlotsForSegment(items: WeightedWaitSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveEnrollmentSegmentsFromSlot(items: WeightedWaitSlot[]): EnrollmentSegment[] {
  const out: EnrollmentSegment[] = [];
  for (const item of items) {
    const derived = newEnrollmentSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleEnrollmentSegment(item: EnrollmentSegment): string {
  return classifyWeightedWaitSlot(item.netLoad());
}
