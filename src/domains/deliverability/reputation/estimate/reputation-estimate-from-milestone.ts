import {
  normalizeDefaultWarmupReviewCode,
} from "../../warmup/adaptive-warmup-milestone/default-warmup-review-policy.js";
import { ScheduledWarmupMilestone } from "../../warmup/adaptive-warmup-milestone/scheduled-warmup-milestone.js";
import { ReputationEstimate, newReputationEstimate } from "./reputation-estimate.js";

export function summarizeScheduledWarmupMilestonesForEstimate(items: ScheduledWarmupMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveReputationEstimatesFromMilestone(items: ScheduledWarmupMilestone[]): ReputationEstimate[] {
  const out: ReputationEstimate[] = [];
  for (const item of items) {
    const derived = newReputationEstimate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planReputationEstimate(item: ReputationEstimate): string {
  return normalizeDefaultWarmupReviewCode(item.code);
}
