import { adaptiveChallengeTemplateBucket } from "../challenge-proposal/adaptive-challenge-template-policy.js";
import { AdaptiveChallengeTemplate } from "../challenge-proposal/adaptive-challenge-template.js";
import { RollingChallengeCheckpoint, newRollingChallengeCheckpoint } from "./rolling-challenge-checkpoint.js";

export function summarizeAdaptiveChallengeTemplatesForCheckpoint(items: AdaptiveChallengeTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRollingChallengeCheckpointsFromTemplate(items: AdaptiveChallengeTemplate[]): RollingChallengeCheckpoint[] {
  const out: RollingChallengeCheckpoint[] = [];
  for (const item of items) {
    const derived = newRollingChallengeCheckpoint(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveRollingChallengeCheckpoint(item: RollingChallengeCheckpoint): string {
  return adaptiveChallengeTemplateBucket(item.projectedValue());
}
