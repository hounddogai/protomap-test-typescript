import { normalizeFallbackCreativePreferenceCode } from "../preference/fallback-creative-preference-policy.js";
import { ScheduledCreativePreference } from "../preference/scheduled-creative-preference.js";
import { ScheduledCreativeAssignment, newScheduledCreativeAssignment } from "./scheduled-creative-assignment.js";

export function summarizeScheduledCreativePreferencesForAssignment(items: ScheduledCreativePreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveScheduledCreativeAssignmentsFromPreference(items: ScheduledCreativePreference[]): ScheduledCreativeAssignment[] {
  const out: ScheduledCreativeAssignment[] = [];
  for (const item of items) {
    const derived = newScheduledCreativeAssignment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeScheduledCreativeAssignment(item: ScheduledCreativeAssignment): string {
  return normalizeFallbackCreativePreferenceCode(item.code);
}
