import { PreferenceGroup } from "../group/preference-group.js";
import { preferenceReservationWeight } from "../group/preference-reservation-policy.js";
import { DefaultPreferenceMilestone, newDefaultPreferenceMilestone } from "./default-preference-milestone.js";

export function summarizePreferenceGroupsForMilestone(items: PreferenceGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveDefaultPreferenceMilestonesFromGroup(items: PreferenceGroup[]): DefaultPreferenceMilestone[] {
  const out: DefaultPreferenceMilestone[] = [];
  for (const item of items) {
    const derived = newDefaultPreferenceMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleDefaultPreferenceMilestone(item: DefaultPreferenceMilestone): number {
  return preferenceReservationWeight(2, true);
}
