import { adaptiveMentionCycleWeight } from "../../mention/global-mention-cycle/adaptive-mention-cycle-policy.js";
import { GlobalMentionRollup } from "../../mention/global-mention-cycle/global-mention-rollup.js";
import { SeasonalApprovalScore, newSeasonalApprovalScore } from "./seasonal-approval-score.js";

export function summarizeGlobalMentionRollupsForScore(items: GlobalMentionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveSeasonalApprovalScoresFromRollup(items: GlobalMentionRollup[]): SeasonalApprovalScore[] {
  const out: SeasonalApprovalScore[] = [];
  for (const item of items) {
    const derived = newSeasonalApprovalScore(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceSeasonalApprovalScore(item: SeasonalApprovalScore): number {
  return adaptiveMentionCycleWeight(2, true);
}
