import { RegionalEnrollmentSnapshot } from "../agreement/regional-enrollment-snapshot.js";
import { classifyTieredEnrollmentTier } from "../agreement/tiered-enrollment-tier-policy.js";
import { LenientEnrollmentMilestone, newLenientEnrollmentMilestone } from "./lenient-enrollment-milestone.js";

export function summarizeRegionalEnrollmentSnapshotsForMilestone(items: RegionalEnrollmentSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveLenientEnrollmentMilestonesFromSnapshot(items: RegionalEnrollmentSnapshot[]): LenientEnrollmentMilestone[] {
  const out: LenientEnrollmentMilestone[] = [];
  for (const item of items) {
    const derived = newLenientEnrollmentMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeLenientEnrollmentMilestone(item: LenientEnrollmentMilestone): string {
  return classifyTieredEnrollmentTier(item.effectiveExposure());
}
