import { levelAssignmentBucket } from "../../level/claim/level-assignment-policy.js";
import { LevelBudget } from "../../level/claim/level-budget.js";
import { RewardManifest, newRewardManifest } from "./reward-manifest.js";

export function summarizeLevelBudgetsForManifest(items: LevelBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRewardManifestsFromBudget(items: LevelBudget[]): RewardManifest[] {
  const out: RewardManifest[] = [];
  for (const item of items) {
    const derived = newRewardManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRewardManifest(item: RewardManifest): string {
  return levelAssignmentBucket(item.weightedVolume());
}
