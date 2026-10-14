import {
  scheduledTouchpointPreferenceBucket,
} from "../../touchpoint/touchpoint-estimate/scheduled-touchpoint-preference-policy.js";
import {
  ScheduledTouchpointPreference,
} from "../../touchpoint/touchpoint-estimate/scheduled-touchpoint-preference.js";
import { FallbackPathBatch, newFallbackPathBatch } from "./fallback-path-batch.js";

export function summarizeScheduledTouchpointPreferencesForBatch(items: ScheduledTouchpointPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveFallbackPathBatchesFromPreference(items: ScheduledTouchpointPreference[]): FallbackPathBatch[] {
  const out: FallbackPathBatch[] = [];
  for (const item of items) {
    const derived = newFallbackPathBatch(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeFallbackPathBatch(item: FallbackPathBatch): string {
  return scheduledTouchpointPreferenceBucket(item.effectiveTotal());
}
