import { InviteAdjustment } from "../../invite/invite-segment/invite-adjustment.js";
import { lenientInviteSegmentWeight } from "../../invite/invite-segment/lenient-invite-segment-policy.js";
import { RewardRuleTarget, newRewardRuleTarget } from "./reward-rule-target.js";

export function summarizeInviteAdjustmentsForTarget(items: InviteAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRewardRuleTargetsFromAdjustment(items: InviteAdjustment[]): RewardRuleTarget[] {
  const out: RewardRuleTarget[] = [];
  for (const item of items) {
    const derived = newRewardRuleTarget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceRewardRuleTarget(item: RewardRuleTarget): number {
  return lenientInviteSegmentWeight(7, true);
}
