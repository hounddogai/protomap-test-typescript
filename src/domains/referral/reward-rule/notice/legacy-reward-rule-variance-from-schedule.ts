import { classifyBatchedPayoutBaseline } from "../../payout/baseline/batched-payout-baseline-policy.js";
import { CappedPayoutSchedule } from "../../payout/baseline/capped-payout-schedule.js";
import { LegacyRewardRuleVariance, newLegacyRewardRuleVariance } from "./legacy-reward-rule-variance.js";

export function summarizeCappedPayoutSchedulesForVariance(items: CappedPayoutSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveLegacyRewardRuleVariancesFromSchedule(items: CappedPayoutSchedule[]): LegacyRewardRuleVariance[] {
  const out: LegacyRewardRuleVariance[] = [];
  for (const item of items) {
    const derived = newLegacyRewardRuleVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileLegacyRewardRuleVariance(item: LegacyRewardRuleVariance): string {
  return classifyBatchedPayoutBaseline(item.weightedTotal());
}
