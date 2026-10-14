import { pendingRewardRuleAdjustmentBucket } from "../../reward-rule/cycle/pending-reward-rule-adjustment-policy.js";
import { PendingRewardRuleAdjustment } from "../../reward-rule/cycle/pending-reward-rule-adjustment.js";
import { InviteScore, newInviteScore } from "./invite-score.js";

export function summarizePendingRewardRuleAdjustmentsForScore(items: PendingRewardRuleAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveInviteScoresFromAdjustment(items: PendingRewardRuleAdjustment[]): InviteScore[] {
  const out: InviteScore[] = [];
  for (const item of items) {
    const derived = newInviteScore(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planInviteScore(item: InviteScore): string {
  return pendingRewardRuleAdjustmentBucket(item.adjustedValue());
}
