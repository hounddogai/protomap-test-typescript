import { AdaptiveWaitAdjustment } from "../../wait/baseline/adaptive-wait-adjustment.js";
import { normalizeRollingWaitBaselineCode } from "../../wait/baseline/rolling-wait-baseline-policy.js";
import { BatchedEnrollmentSlot, newBatchedEnrollmentSlot } from "./batched-enrollment-slot.js";

export function summarizeAdaptiveWaitAdjustmentsForSlot(items: AdaptiveWaitAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBatchedEnrollmentSlotsFromAdjustment(items: AdaptiveWaitAdjustment[]): BatchedEnrollmentSlot[] {
  const out: BatchedEnrollmentSlot[] = [];
  for (const item of items) {
    const derived = newBatchedEnrollmentSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignBatchedEnrollmentSlot(item: BatchedEnrollmentSlot): string {
  return normalizeRollingWaitBaselineCode(item.code);
}
