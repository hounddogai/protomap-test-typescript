import { EnrollmentCycle } from "../digest/enrollment-cycle.js";
import { enrollmentQuotaWeight } from "../digest/enrollment-quota-policy.js";
import { EnrollmentAllocation, newEnrollmentAllocation } from "./enrollment-allocation.js";

export function summarizeEnrollmentCyclesForAllocation(items: EnrollmentCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveEnrollmentAllocationsFromCycle(items: EnrollmentCycle[]): EnrollmentAllocation[] {
  const out: EnrollmentAllocation[] = [];
  for (const item of items) {
    const derived = newEnrollmentAllocation(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateEnrollmentAllocation(item: EnrollmentAllocation): number {
  return enrollmentQuotaWeight(6, true);
}
