import {
  manualEnrollmentAllocationBucket,
} from "../../enrollment/enrollment-mapping/manual-enrollment-allocation-policy.js";
import { ManualEnrollmentAllocation } from "../../enrollment/enrollment-mapping/manual-enrollment-allocation.js";
import { JourneyQuota, newJourneyQuota } from "./journey-quota.js";

export function summarizeManualEnrollmentAllocationsForQuota(items: ManualEnrollmentAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveJourneyQuotasFromAllocation(items: ManualEnrollmentAllocation[]): JourneyQuota[] {
  const out: JourneyQuota[] = [];
  for (const item of items) {
    const derived = newJourneyQuota(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitJourneyQuota(item: JourneyQuota): string {
  return manualEnrollmentAllocationBucket(item.weightedLoad());
}
