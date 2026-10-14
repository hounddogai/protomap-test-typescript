import { globalRewardTargetBucket } from "../../reward/reward-profile/global-reward-target-policy.js";
import { RollingRewardAudit } from "../../reward/reward-profile/rolling-reward-audit.js";
import { AdaptiveStreakScore, newAdaptiveStreakScore } from "./adaptive-streak-score.js";

export function summarizeRollingRewardAuditsForScore(items: RollingRewardAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveAdaptiveStreakScoresFromAudit(items: RollingRewardAudit[]): AdaptiveStreakScore[] {
  const out: AdaptiveStreakScore[] = [];
  for (const item of items) {
    const derived = newAdaptiveStreakScore(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyAdaptiveStreakScore(item: AdaptiveStreakScore): string {
  return globalRewardTargetBucket(item.projectedTotal());
}
