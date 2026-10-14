import { scheduledEnrollmentForecastBucket } from "../../enrollment/forecast/scheduled-enrollment-forecast-policy.js";
import { ScheduledEnrollmentForecast } from "../../enrollment/forecast/scheduled-enrollment-forecast.js";
import { ManualStepRecord, newManualStepRecord } from "./manual-step-record.js";

export function summarizeScheduledEnrollmentForecastsForRecord(items: ScheduledEnrollmentForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveManualStepRecordsFromForecast(items: ScheduledEnrollmentForecast[]): ManualStepRecord[] {
  const out: ManualStepRecord[] = [];
  for (const item of items) {
    const derived = newManualStepRecord(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeManualStepRecord(item: ManualStepRecord): string {
  return scheduledEnrollmentForecastBucket(item.adjustedExposure());
}
