import { BadgeDraft } from "../../badge/badge-profile/badge-draft.js";
import { cappedBadgeSlotBucket } from "../../badge/badge-profile/capped-badge-slot-policy.js";
import { RollingRewardPreference, newRollingRewardPreference } from "./rolling-reward-preference.js";

export function summarizeBadgeDraftsForPreference(items: BadgeDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveRollingRewardPreferencesFromDraft(items: BadgeDraft[]): RollingRewardPreference[] {
  const out: RollingRewardPreference[] = [];
  for (const item of items) {
    const derived = newRollingRewardPreference(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileRollingRewardPreference(item: RollingRewardPreference): string {
  return cappedBadgeSlotBucket(item.measuredValue());
}
