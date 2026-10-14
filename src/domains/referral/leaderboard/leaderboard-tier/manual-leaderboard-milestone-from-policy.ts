import { normalizeRollingRewardRuleLedgerCode } from "../../reward-rule/ledger/rolling-reward-rule-ledger-policy.js";
import { ScheduledRewardRulePolicy } from "../../reward-rule/ledger/scheduled-reward-rule-policy.js";
import { ManualLeaderboardMilestone, newManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

export function summarizeScheduledRewardRulePoliciesForMilestone(items: ScheduledRewardRulePolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualLeaderboardMilestonesFromPolicy(items: ScheduledRewardRulePolicy[]): ManualLeaderboardMilestone[] {
  const out: ManualLeaderboardMilestone[] = [];
  for (const item of items) {
    const derived = newManualLeaderboardMilestone(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankManualLeaderboardMilestone(item: ManualLeaderboardMilestone): string {
  return normalizeRollingRewardRuleLedgerCode(item.code);
}
