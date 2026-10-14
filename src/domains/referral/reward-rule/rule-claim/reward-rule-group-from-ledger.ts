import { normalizeAdaptiveInviteSummaryCode } from "../../invite/ledger/adaptive-invite-summary-policy.js";
import { InviteLedger } from "../../invite/ledger/invite-ledger.js";
import { RewardRuleGroup, newRewardRuleGroup } from "./reward-rule-group.js";

export function summarizeInviteLedgersForGroup(items: InviteLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRewardRuleGroupsFromLedger(items: InviteLedger[]): RewardRuleGroup[] {
  const out: RewardRuleGroup[] = [];
  for (const item of items) {
    const derived = newRewardRuleGroup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectRewardRuleGroup(item: RewardRuleGroup): string {
  return normalizeAdaptiveInviteSummaryCode(item.code);
}
