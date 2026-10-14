import { LegacyChallengeOverride } from "../../challenge/primary-challenge-override/legacy-challenge-override.js";
import {
  classifyTieredChallengeAudit,
} from "../../challenge/primary-challenge-override/tiered-challenge-audit-policy.js";
import { RewardCheckpoint, newRewardCheckpoint } from "./reward-checkpoint.js";

export function summarizeLegacyChallengeOverridesForCheckpoint(items: LegacyChallengeOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRewardCheckpointsFromOverride(items: LegacyChallengeOverride[]): RewardCheckpoint[] {
  const out: RewardCheckpoint[] = [];
  for (const item of items) {
    const derived = newRewardCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyRewardCheckpoint(item: RewardCheckpoint): string {
  return classifyTieredChallengeAudit(item.measuredValue());
}
