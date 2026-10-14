import { ManualRewardRuleAdjustment } from "../../reward-rule/draft/manual-reward-rule-adjustment.js";
import { normalizeRewardRuleCycleCode } from "../../reward-rule/draft/reward-rule-cycle-policy.js";
import { CappedPayoutQuota, newCappedPayoutQuota } from "./capped-payout-quota.js";

export function summarizeManualRewardRuleAdjustmentsForQuota(items: ManualRewardRuleAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveCappedPayoutQuotasFromAdjustment(items: ManualRewardRuleAdjustment[]): CappedPayoutQuota[] {
  const out: CappedPayoutQuota[] = [];
  for (const item of items) {
    const derived = newCappedPayoutQuota(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchCappedPayoutQuota(item: CappedPayoutQuota): string {
  return normalizeRewardRuleCycleCode(item.code);
}
