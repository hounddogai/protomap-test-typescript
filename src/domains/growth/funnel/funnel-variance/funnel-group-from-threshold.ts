import { classifyScheduledFunnelThreshold } from "../funnel-threshold/scheduled-funnel-threshold-policy.js";
import { ScheduledFunnelThreshold } from "../funnel-threshold/scheduled-funnel-threshold.js";
import { FunnelGroup, newFunnelGroup } from "./funnel-group.js";

export function summarizeScheduledFunnelThresholdsForGroup(items: ScheduledFunnelThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFunnelGroupsFromThreshold(items: ScheduledFunnelThreshold[]): FunnelGroup[] {
  const out: FunnelGroup[] = [];
  for (const item of items) {
    const derived = newFunnelGroup(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreFunnelGroup(item: FunnelGroup): string {
  return classifyScheduledFunnelThreshold(item.weightedVolume());
}
