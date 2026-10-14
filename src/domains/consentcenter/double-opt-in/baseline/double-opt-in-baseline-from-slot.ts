import { suppressionSegmentWeight } from "../../suppression/slot/suppression-segment-policy.js";
import { SuppressionSlot } from "../../suppression/slot/suppression-slot.js";
import { DoubleOptInBaseline, newDoubleOptInBaseline } from "./double-opt-in-baseline.js";

export function summarizeSuppressionSlotsForBaseline(items: SuppressionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveDoubleOptInBaselinesFromSlot(items: SuppressionSlot[]): DoubleOptInBaseline[] {
  const out: DoubleOptInBaseline[] = [];
  for (const item of items) {
    const derived = newDoubleOptInBaseline(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeDoubleOptInBaseline(item: DoubleOptInBaseline): number {
  return suppressionSegmentWeight(7, true);
}
