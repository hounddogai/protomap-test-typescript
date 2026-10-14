import { fraudCheckEstimateWeight } from "../../fraud-check/estimate/fraud-check-estimate-policy.js";
import { RollingFraudCheckTier } from "../../fraud-check/estimate/rolling-fraud-check-tier.js";
import { PayoutSchedule, newPayoutSchedule } from "./payout-schedule.js";

export function summarizeRollingFraudCheckTiersForSchedule(items: RollingFraudCheckTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePayoutSchedulesFromTier(items: RollingFraudCheckTier[]): PayoutSchedule[] {
  const out: PayoutSchedule[] = [];
  for (const item of items) {
    const derived = newPayoutSchedule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolvePayoutSchedule(item: PayoutSchedule): number {
  return fraudCheckEstimateWeight(3, true);
}
