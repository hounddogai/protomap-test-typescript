import { InviteEntry } from "../../invite/baseline/invite-entry.js";
import { inviteSlotWeight } from "../../invite/baseline/invite-slot-policy.js";
import { RewardRuleMapping, newRewardRuleMapping } from "./reward-rule-mapping.js";

export function summarizeInviteEntriesForMapping(items: InviteEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRewardRuleMappingsFromEntry(items: InviteEntry[]): RewardRuleMapping[] {
  const out: RewardRuleMapping[] = [];
  for (const item of items) {
    const derived = newRewardRuleMapping(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateRewardRuleMapping(item: RewardRuleMapping): number {
  return inviteSlotWeight(3, true);
}
