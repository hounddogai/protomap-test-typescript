import { CappedEnrollmentEstimate } from "../enrollment-estimate/capped-enrollment-estimate.js";
import { fallbackEnrollmentAllocationBucket } from "../enrollment-estimate/fallback-enrollment-allocation-policy.js";
import { EnrollmentProfile, newEnrollmentProfile } from "./enrollment-profile.js";

export function summarizeCappedEnrollmentEstimatesForProfile(items: CappedEnrollmentEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveEnrollmentProfilesFromEstimate(items: CappedEnrollmentEstimate[]): EnrollmentProfile[] {
  const out: EnrollmentProfile[] = [];
  for (const item of items) {
    const derived = newEnrollmentProfile(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateEnrollmentProfile(item: EnrollmentProfile): string {
  return fallbackEnrollmentAllocationBucket(item.projectedVolume());
}
