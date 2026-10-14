import { RewardRuleAgreement } from "../../reward-rule/policy/reward-rule-agreement.js";
import { rewardRuleEntryBucket } from "../../reward-rule/policy/reward-rule-entry-policy.js";
import { InviteSummary, newInviteSummary } from "./invite-summary.js";

export function summarizeRewardRuleAgreementsForSummary(items: RewardRuleAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveInviteSummariesFromAgreement(items: RewardRuleAgreement[]): InviteSummary[] {
  const out: InviteSummary[] = [];
  for (const item of items) {
    const derived = newInviteSummary(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeInviteSummary(item: InviteSummary): string {
  return rewardRuleEntryBucket(item.adjustedExposure());
}
