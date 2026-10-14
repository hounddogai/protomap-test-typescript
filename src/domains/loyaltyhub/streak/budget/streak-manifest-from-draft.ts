import { RewardDraft } from "../../reward/draft/reward-draft.js";
import { rewardSegmentWeight } from "../../reward/draft/reward-segment-policy.js";
import { StreakManifest, newStreakManifest } from "./streak-manifest.js";

export function summarizeRewardDraftsForManifest(items: RewardDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveStreakManifestsFromDraft(items: RewardDraft[]): StreakManifest[] {
  const out: StreakManifest[] = [];
  for (const item of items) {
    const derived = newStreakManifest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateStreakManifest(item: StreakManifest): number {
  return rewardSegmentWeight(9, true);
}
