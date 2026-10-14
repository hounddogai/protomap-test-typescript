import { EnrollmentOverride } from "../override-item/enrollment-override.js";
import { enrollmentTargetBucket } from "../override-item/enrollment-target-policy.js";
import { EnrollmentMapping, newEnrollmentMapping } from "./enrollment-mapping.js";

export function summarizeEnrollmentOverridesForMapping(items: EnrollmentOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveEnrollmentMappingsFromOverride(items: EnrollmentOverride[]): EnrollmentMapping[] {
  const out: EnrollmentMapping[] = [];
  for (const item of items) {
    const derived = newEnrollmentMapping(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchEnrollmentMapping(item: EnrollmentMapping): string {
  return enrollmentTargetBucket(item.effectiveTotal());
}
