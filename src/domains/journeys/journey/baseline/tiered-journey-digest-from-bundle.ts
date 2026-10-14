import { classifyEnrollmentBundle } from "../../enrollment/milestone/enrollment-bundle-policy.js";
import { EnrollmentBundle } from "../../enrollment/milestone/enrollment-bundle.js";
import { TieredJourneyDigest, newTieredJourneyDigest } from "./tiered-journey-digest.js";

export function summarizeEnrollmentBundlesForDigest(items: EnrollmentBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveTieredJourneyDigestsFromBundle(items: EnrollmentBundle[]): TieredJourneyDigest[] {
  const out: TieredJourneyDigest[] = [];
  for (const item of items) {
    const derived = newTieredJourneyDigest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitTieredJourneyDigest(item: TieredJourneyDigest): string {
  return classifyEnrollmentBundle(item.netVolume());
}
