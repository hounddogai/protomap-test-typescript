import { batchedEnrollmentSlotWeight } from "../../enrollment/enrollment-slot/batched-enrollment-slot-policy.js";
import { StrictEnrollmentAdjustment } from "../../enrollment/enrollment-slot/strict-enrollment-adjustment.js";
import { LegacyWaitCheckpoint, newLegacyWaitCheckpoint } from "./legacy-wait-checkpoint.js";

export function summarizeStrictEnrollmentAdjustmentsForCheckpoint(items: StrictEnrollmentAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveLegacyWaitCheckpointsFromAdjustment(items: StrictEnrollmentAdjustment[]): LegacyWaitCheckpoint[] {
  const out: LegacyWaitCheckpoint[] = [];
  for (const item of items) {
    const derived = newLegacyWaitCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceLegacyWaitCheckpoint(item: LegacyWaitCheckpoint): number {
  return batchedEnrollmentSlotWeight(8, true);
}
