import { nudgeSummaryBucket } from "../../nudge/summary/nudge-summary-policy.js";
import { NudgeSummary } from "../../nudge/summary/nudge-summary.js";
import { FunnelPreference, newFunnelPreference } from "./funnel-preference.js";

export function summarizeNudgeSummariesForPreference(items: NudgeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveFunnelPreferencesFromSummary(items: NudgeSummary[]): FunnelPreference[] {
  const out: FunnelPreference[] = [];
  for (const item of items) {
    const derived = newFunnelPreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeFunnelPreference(item: FunnelPreference): string {
  return nudgeSummaryBucket(item.weightedLoad());
}
