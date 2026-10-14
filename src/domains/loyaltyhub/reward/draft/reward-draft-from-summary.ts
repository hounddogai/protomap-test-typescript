import { StreakSummary } from "../../streak/rollup/streak-summary.js";
import { normalizeTieredStreakSummaryCode } from "../../streak/rollup/tiered-streak-summary-policy.js";
import { RewardDraft, newRewardDraft } from "./reward-draft.js";

export function summarizeStreakSummariesForDraft(items: StreakSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveRewardDraftsFromSummary(items: StreakSummary[]): RewardDraft[] {
  const out: RewardDraft[] = [];
  for (const item of items) {
    const derived = newRewardDraft(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateRewardDraft(item: RewardDraft): string {
  return normalizeTieredStreakSummaryCode(item.code);
}
