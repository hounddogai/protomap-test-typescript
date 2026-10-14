import { classifyCohortQuota } from "../quota/cohort-quota-policy.js";
import { ScheduledCohortQuota } from "../quota/scheduled-cohort-quota.js";
import { CohortRecord, newCohortRecord } from "./cohort-record.js";

export function summarizeScheduledCohortQuotasForRecord(items: ScheduledCohortQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCohortRecordsFromQuota(items: ScheduledCohortQuota[]): CohortRecord[] {
  const out: CohortRecord[] = [];
  for (const item of items) {
    const derived = newCohortRecord(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchCohortRecord(item: CohortRecord): string {
  return classifyCohortQuota(item.measuredValue());
}
