import { FallbackPreferenceEntry } from "../allocation/fallback-preference-entry.js";
import { scheduledPreferenceAllocationWeight } from "../allocation/scheduled-preference-allocation-policy.js";
import { GlobalPreferenceRollup, newGlobalPreferenceRollup } from "./global-preference-rollup.js";

export function summarizeFallbackPreferenceEntriesForRollup(items: FallbackPreferenceEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveGlobalPreferenceRollupsFromEntry(items: FallbackPreferenceEntry[]): GlobalPreferenceRollup[] {
  const out: GlobalPreferenceRollup[] = [];
  for (const item of items) {
    const derived = newGlobalPreferenceRollup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateGlobalPreferenceRollup(item: GlobalPreferenceRollup): number {
  return scheduledPreferenceAllocationWeight(9, true);
}
