import { cohortRecordBucket } from "../../cohort/record-item/cohort-record-policy.js";
import { CohortRecord } from "../../cohort/record-item/cohort-record.js";
import { FallbackRetentionTier, newFallbackRetentionTier } from "./fallback-retention-tier.js";

export function summarizeCohortRecordsForTier(items: CohortRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFallbackRetentionTiersFromRecord(items: CohortRecord[]): FallbackRetentionTier[] {
  const out: FallbackRetentionTier[] = [];
  for (const item of items) {
    const derived = newFallbackRetentionTier(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceFallbackRetentionTier(item: FallbackRetentionTier): string {
  return cohortRecordBucket(item.adjustedLoad());
}
