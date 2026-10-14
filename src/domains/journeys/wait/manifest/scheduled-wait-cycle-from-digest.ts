import { EnrollmentDigest } from "../../enrollment/digest/enrollment-digest.js";
import { enrollmentQuotaWeight } from "../../enrollment/digest/enrollment-quota-policy.js";
import { ScheduledWaitCycle, newScheduledWaitCycle } from "./scheduled-wait-cycle.js";

export function summarizeEnrollmentDigestsForCycle(items: EnrollmentDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveScheduledWaitCyclesFromDigest(items: EnrollmentDigest[]): ScheduledWaitCycle[] {
  const out: ScheduledWaitCycle[] = [];
  for (const item of items) {
    const derived = newScheduledWaitCycle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileScheduledWaitCycle(item: ScheduledWaitCycle): number {
  return enrollmentQuotaWeight(2, true);
}
