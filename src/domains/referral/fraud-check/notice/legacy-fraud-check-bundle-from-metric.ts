import { rewardRuleMetricWeight } from "../../reward-rule/metric/reward-rule-metric-policy.js";
import { RewardRuleMetric } from "../../reward-rule/metric/reward-rule-metric.js";
import { LegacyFraudCheckBundle, newLegacyFraudCheckBundle } from "./legacy-fraud-check-bundle.js";

export function summarizeRewardRuleMetricsForBundle(items: RewardRuleMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyFraudCheckBundlesFromMetric(items: RewardRuleMetric[]): LegacyFraudCheckBundle[] {
  const out: LegacyFraudCheckBundle[] = [];
  for (const item of items) {
    const derived = newLegacyFraudCheckBundle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLegacyFraudCheckBundle(item: LegacyFraudCheckBundle): number {
  return rewardRuleMetricWeight(5, true);
}
