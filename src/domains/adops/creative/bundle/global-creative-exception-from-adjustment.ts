import { frequencySegmentWeight } from "../../frequency/adjustment/frequency-segment-policy.js";
import { ScheduledFrequencyAdjustment } from "../../frequency/adjustment/scheduled-frequency-adjustment.js";
import { GlobalCreativeException, newGlobalCreativeException } from "./global-creative-exception.js";

export function summarizeScheduledFrequencyAdjustmentsForException(items: ScheduledFrequencyAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveGlobalCreativeExceptionsFromAdjustment(items: ScheduledFrequencyAdjustment[]): GlobalCreativeException[] {
  const out: GlobalCreativeException[] = [];
  for (const item of items) {
    const derived = newGlobalCreativeException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateGlobalCreativeException(item: GlobalCreativeException): number {
  return frequencySegmentWeight(6, true);
}
