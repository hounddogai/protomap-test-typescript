import { AdaptivePayoutNotice } from "../../payout/payout-notice/adaptive-payout-notice.js";
import { fallbackPayoutNoticeBucket } from "../../payout/payout-notice/fallback-payout-notice-policy.js";
import { RewardRuleMetric, newRewardRuleMetric } from "./reward-rule-metric.js";

export function summarizeAdaptivePayoutNoticesForMetric(items: AdaptivePayoutNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRewardRuleMetricsFromNotice(items: AdaptivePayoutNotice[]): RewardRuleMetric[] {
  const out: RewardRuleMetric[] = [];
  for (const item of items) {
    const derived = newRewardRuleMetric(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateRewardRuleMetric(item: RewardRuleMetric): string {
  return fallbackPayoutNoticeBucket(item.measuredValue());
}
