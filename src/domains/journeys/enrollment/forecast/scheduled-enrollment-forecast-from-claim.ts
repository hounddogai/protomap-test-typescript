import { EnrollmentClaim } from "../variance/enrollment-claim.js";
import { seasonalEnrollmentPolicyWeight } from "../variance/seasonal-enrollment-policy-policy.js";
import { ScheduledEnrollmentForecast, newScheduledEnrollmentForecast } from "./scheduled-enrollment-forecast.js";

export function summarizeEnrollmentClaimsForForecast(items: EnrollmentClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveScheduledEnrollmentForecastsFromClaim(items: EnrollmentClaim[]): ScheduledEnrollmentForecast[] {
  const out: ScheduledEnrollmentForecast[] = [];
  for (const item of items) {
    const derived = newScheduledEnrollmentForecast(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateScheduledEnrollmentForecast(item: ScheduledEnrollmentForecast): number {
  return seasonalEnrollmentPolicyWeight(7, true);
}
