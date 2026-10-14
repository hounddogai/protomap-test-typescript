import { cohortMilestoneBucket } from "../../cohort/cohort-variance/cohort-milestone-policy.js";
import { CohortTier } from "../../cohort/cohort-variance/cohort-tier.js";
import { ActivationRecord, newActivationRecord } from "./activation-record.js";

export function summarizeCohortTiersForRecord(items: CohortTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveActivationRecordsFromTier(items: CohortTier[]): ActivationRecord[] {
  const out: ActivationRecord[] = [];
  for (const item of items) {
    const derived = newActivationRecord(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planActivationRecord(item: ActivationRecord): string {
  return cohortMilestoneBucket(item.measuredValue());
}
