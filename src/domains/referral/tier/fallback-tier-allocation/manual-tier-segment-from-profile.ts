import { inviteDraftWeight } from "../../invite/draft/invite-draft-policy.js";
import { WeightedInviteProfile } from "../../invite/draft/weighted-invite-profile.js";
import { ManualTierSegment, newManualTierSegment } from "./manual-tier-segment.js";

export function summarizeWeightedInviteProfilesForSegment(items: WeightedInviteProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveManualTierSegmentsFromProfile(items: WeightedInviteProfile[]): ManualTierSegment[] {
  const out: ManualTierSegment[] = [];
  for (const item of items) {
    const derived = newManualTierSegment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeManualTierSegment(item: ManualTierSegment): number {
  return inviteDraftWeight(3, true);
}
