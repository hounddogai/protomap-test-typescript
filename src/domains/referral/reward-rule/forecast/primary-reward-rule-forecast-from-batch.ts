import { RewardRuleBatch } from "../bundle/reward-rule-batch.js";
import { rewardRuleBundleBucket } from "../bundle/reward-rule-bundle-policy.js";
import { PrimaryRewardRuleForecast, newPrimaryRewardRuleForecast } from "./primary-reward-rule-forecast.js";

export function summarizeRewardRuleBatchesForForecast(items: RewardRuleBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePrimaryRewardRuleForecastsFromBatch(items: RewardRuleBatch[]): PrimaryRewardRuleForecast[] {
  const out: PrimaryRewardRuleForecast[] = [];
  for (const item of items) {
    const derived = newPrimaryRewardRuleForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePrimaryRewardRuleForecast(item: PrimaryRewardRuleForecast): string {
  return rewardRuleBundleBucket(item.effectiveValue());
}
