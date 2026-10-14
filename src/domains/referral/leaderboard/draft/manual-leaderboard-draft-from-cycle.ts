import { legacyRewardRuleCycleWeight } from "../../reward-rule/cycle/legacy-reward-rule-cycle-policy.js";
import { LegacyRewardRuleCycle } from "../../reward-rule/cycle/legacy-reward-rule-cycle.js";
import { ManualLeaderboardDraft, newManualLeaderboardDraft } from "./manual-leaderboard-draft.js";

export function summarizeLegacyRewardRuleCyclesForDraft(items: LegacyRewardRuleCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveManualLeaderboardDraftsFromCycle(items: LegacyRewardRuleCycle[]): ManualLeaderboardDraft[] {
  const out: ManualLeaderboardDraft[] = [];
  for (const item of items) {
    const derived = newManualLeaderboardDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeManualLeaderboardDraft(item: ManualLeaderboardDraft): number {
  return legacyRewardRuleCycleWeight(2, true);
}
