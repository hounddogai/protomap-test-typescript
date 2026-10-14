import { DefaultApprovalTier } from "../../approval/approval-rollup/default-approval-tier.js";
import { strictApprovalRollupWeight } from "../../approval/approval-rollup/strict-approval-rollup-policy.js";
import { PendingMentionScore, newPendingMentionScore } from "./pending-mention-score.js";

export function summarizeDefaultApprovalTiersForScore(items: DefaultApprovalTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePendingMentionScoresFromTier(items: DefaultApprovalTier[]): PendingMentionScore[] {
  const out: PendingMentionScore[] = [];
  for (const item of items) {
    const derived = newPendingMentionScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolvePendingMentionScore(item: PendingMentionScore): number {
  return strictApprovalRollupWeight(5, true);
}
