import { ScheduledSlaPreference } from "../../sla/baseline/scheduled-sla-preference.js";
import { normalizeSlaSummaryCode } from "../../sla/baseline/sla-summary-policy.js";
import { DeflectionGroup, newDeflectionGroup } from "./deflection-group.js";

export function summarizeScheduledSlaPreferencesForGroup(items: ScheduledSlaPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveDeflectionGroupsFromPreference(items: ScheduledSlaPreference[]): DeflectionGroup[] {
  const out: DeflectionGroup[] = [];
  for (const item of items) {
    const derived = newDeflectionGroup(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveDeflectionGroup(item: DeflectionGroup): string {
  return normalizeSlaSummaryCode(item.code);
}
