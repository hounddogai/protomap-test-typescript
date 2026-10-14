import { ScheduledSlaPreference } from "../baseline/scheduled-sla-preference.js";
import { slaSummaryBucket } from "../baseline/sla-summary-policy.js";
import { SlaThreshold, newSlaThreshold } from "./sla-threshold.js";

export function summarizeScheduledSlaPreferencesForThreshold(items: ScheduledSlaPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveSlaThresholdsFromPreference(items: ScheduledSlaPreference[]): SlaThreshold[] {
  const out: SlaThreshold[] = [];
  for (const item of items) {
    const derived = newSlaThreshold(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignSlaThreshold(item: SlaThreshold): string {
  return slaSummaryBucket(item.effectiveVolume());
}
