import { strictEnrollmentSummaryWeight } from "../window/strict-enrollment-summary-policy.js";
import { StrictEnrollmentSummary } from "../window/strict-enrollment-summary.js";
import { SeasonalEnrollmentPolicy, newSeasonalEnrollmentPolicy } from "./seasonal-enrollment-policy.js";

export function summarizeStrictEnrollmentSummariesForPolicy(items: StrictEnrollmentSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveSeasonalEnrollmentPoliciesFromSummary(items: StrictEnrollmentSummary[]): SeasonalEnrollmentPolicy[] {
  const out: SeasonalEnrollmentPolicy[] = [];
  for (const item of items) {
    const derived = newSeasonalEnrollmentPolicy(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreSeasonalEnrollmentPolicy(item: SeasonalEnrollmentPolicy): number {
  return strictEnrollmentSummaryWeight(2, true);
}
