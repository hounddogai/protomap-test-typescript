import {
  normalizeRollingChallengeCheckpointCode,
} from "../../challenge/schedule/rolling-challenge-checkpoint-policy.js";
import { RollingChallengeCheckpoint } from "../../challenge/schedule/rolling-challenge-checkpoint.js";
import { GlobalRedemptionEstimate, newGlobalRedemptionEstimate } from "./global-redemption-estimate.js";

export function summarizeRollingChallengeCheckpointsForEstimate(items: RollingChallengeCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveGlobalRedemptionEstimatesFromCheckpoint(items: RollingChallengeCheckpoint[]): GlobalRedemptionEstimate[] {
  const out: GlobalRedemptionEstimate[] = [];
  for (const item of items) {
    const derived = newGlobalRedemptionEstimate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalRedemptionEstimate(item: GlobalRedemptionEstimate): string {
  return normalizeRollingChallengeCheckpointCode(item.code);
}
