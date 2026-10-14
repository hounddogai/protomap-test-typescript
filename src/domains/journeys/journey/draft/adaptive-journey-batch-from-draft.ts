import { CappedEnrollmentDraft } from "../../enrollment/rollup/capped-enrollment-draft.js";
import { enrollmentRollupBucket } from "../../enrollment/rollup/enrollment-rollup-policy.js";
import { AdaptiveJourneyBatch, newAdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

export function summarizeCappedEnrollmentDraftsForBatch(items: CappedEnrollmentDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveAdaptiveJourneyBatchesFromDraft(items: CappedEnrollmentDraft[]): AdaptiveJourneyBatch[] {
  const out: AdaptiveJourneyBatch[] = [];
  for (const item of items) {
    const derived = newAdaptiveJourneyBatch(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignAdaptiveJourneyBatch(item: AdaptiveJourneyBatch): string {
  return enrollmentRollupBucket(item.weightedValue());
}
