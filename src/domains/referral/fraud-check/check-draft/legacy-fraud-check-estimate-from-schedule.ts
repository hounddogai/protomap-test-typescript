import { fallbackFraudCheckClaimWeight } from "../schedule/fallback-fraud-check-claim-policy.js";
import { FraudCheckSchedule } from "../schedule/fraud-check-schedule.js";
import { LegacyFraudCheckEstimate, newLegacyFraudCheckEstimate } from "./legacy-fraud-check-estimate.js";

export function summarizeFraudCheckSchedulesForEstimate(items: FraudCheckSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLegacyFraudCheckEstimatesFromSchedule(items: FraudCheckSchedule[]): LegacyFraudCheckEstimate[] {
  const out: LegacyFraudCheckEstimate[] = [];
  for (const item of items) {
    const derived = newLegacyFraudCheckEstimate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceLegacyFraudCheckEstimate(item: LegacyFraudCheckEstimate): number {
  return fallbackFraudCheckClaimWeight(4, true);
}
