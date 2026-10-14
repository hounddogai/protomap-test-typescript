import { fallbackRewardRequestBucket } from "../../reward/adjustment/fallback-reward-request-policy.js";
import { RewardTier } from "../../reward/adjustment/reward-tier.js";
import { LevelMapping, newLevelMapping } from "./level-mapping.js";

export function summarizeRewardTiersForMapping(items: RewardTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveLevelMappingsFromTier(items: RewardTier[]): LevelMapping[] {
  const out: LevelMapping[] = [];
  for (const item of items) {
    const derived = newLevelMapping(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileLevelMapping(item: LevelMapping): string {
  return fallbackRewardRequestBucket(item.adjustedExposure());
}
