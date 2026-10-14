import { legacyRewardRuleCycleBucket } from "../cycle/legacy-reward-rule-cycle-policy.js";
import { PendingRewardRuleAdjustment } from "../cycle/pending-reward-rule-adjustment.js";
import { ScheduledRewardRuleLedger, newScheduledRewardRuleLedger } from "./scheduled-reward-rule-ledger.js";

export function summarizePendingRewardRuleAdjustmentsForLedger(items: PendingRewardRuleAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveScheduledRewardRuleLedgersFromAdjustment(items: PendingRewardRuleAdjustment[]): ScheduledRewardRuleLedger[] {
  const out: ScheduledRewardRuleLedger[] = [];
  for (const item of items) {
    const derived = newScheduledRewardRuleLedger(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignScheduledRewardRuleLedger(item: ScheduledRewardRuleLedger): string {
  return legacyRewardRuleCycleBucket(item.effectiveExposure());
}
