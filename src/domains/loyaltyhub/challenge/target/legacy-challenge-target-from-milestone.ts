import { ManualBadgeMilestone } from "../../badge/weighted-badge-profile/manual-badge-milestone.js";
import { seasonalBadgeSlotBucket } from "../../badge/weighted-badge-profile/seasonal-badge-slot-policy.js";
import { LegacyChallengeTarget, newLegacyChallengeTarget } from "./legacy-challenge-target.js";

export function summarizeManualBadgeMilestonesForTarget(items: ManualBadgeMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLegacyChallengeTargetsFromMilestone(items: ManualBadgeMilestone[]): LegacyChallengeTarget[] {
  const out: LegacyChallengeTarget[] = [];
  for (const item of items) {
    const derived = newLegacyChallengeTarget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateLegacyChallengeTarget(item: LegacyChallengeTarget): string {
  return seasonalBadgeSlotBucket(item.effectiveVolume());
}
