import {
  normalizeScheduledBadgeMilestoneCode,
} from "../../badge/badge-exception/scheduled-badge-milestone-policy.js";
import { TieredBadgeSummary } from "../../badge/badge-exception/tiered-badge-summary.js";
import { ScheduledRewardProfile, newScheduledRewardProfile } from "./scheduled-reward-profile.js";

export function summarizeTieredBadgeSummariesForProfile(items: TieredBadgeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveScheduledRewardProfilesFromSummary(items: TieredBadgeSummary[]): ScheduledRewardProfile[] {
  const out: ScheduledRewardProfile[] = [];
  for (const item of items) {
    const derived = newScheduledRewardProfile(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileScheduledRewardProfile(item: ScheduledRewardProfile): string {
  return normalizeScheduledBadgeMilestoneCode(item.code);
}
