import { cappedRewardRuleBatchBucket } from "../../reward-rule/rule-cycle/capped-reward-rule-batch-policy.js";
import { LegacyRewardRuleSchedule } from "../../reward-rule/rule-cycle/legacy-reward-rule-schedule.js";
import { TieredFraudCheckPolicy, newTieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

export function summarizeLegacyRewardRuleSchedulesForPolicy(items: LegacyRewardRuleSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveTieredFraudCheckPoliciesFromSchedule(items: LegacyRewardRuleSchedule[]): TieredFraudCheckPolicy[] {
  const out: TieredFraudCheckPolicy[] = [];
  for (const item of items) {
    const derived = newTieredFraudCheckPolicy(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceTieredFraudCheckPolicy(item: TieredFraudCheckPolicy): string {
  return cappedRewardRuleBatchBucket(item.projectedExposure());
}
