import { normalizeCappedRewardRuleNoticeCode } from "../rule-threshold/capped-reward-rule-notice-policy.js";
import { RewardRuleSchedule } from "../rule-threshold/reward-rule-schedule.js";
import { LegacyRewardRuleCycle, newLegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

export function summarizeRewardRuleSchedulesForCycle(items: RewardRuleSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveLegacyRewardRuleCyclesFromSchedule(items: RewardRuleSchedule[]): LegacyRewardRuleCycle[] {
  const out: LegacyRewardRuleCycle[] = [];
  for (const item of items) {
    const derived = newLegacyRewardRuleCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateLegacyRewardRuleCycle(item: LegacyRewardRuleCycle): string {
  return normalizeCappedRewardRuleNoticeCode(item.code);
}
