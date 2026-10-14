import { normalizeBounceClaimCode } from "../claim/bounce-claim-policy.js";
import { ManualBounceMilestone } from "../claim/manual-bounce-milestone.js";
import { SeasonalBouncePreference, newSeasonalBouncePreference } from "./seasonal-bounce-preference.js";

export function summarizeManualBounceMilestonesForPreference(items: ManualBounceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSeasonalBouncePreferencesFromMilestone(items: ManualBounceMilestone[]): SeasonalBouncePreference[] {
  const out: SeasonalBouncePreference[] = [];
  for (const item of items) {
    const derived = newSeasonalBouncePreference(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSeasonalBouncePreference(item: SeasonalBouncePreference): string {
  return normalizeBounceClaimCode(item.code);
}
