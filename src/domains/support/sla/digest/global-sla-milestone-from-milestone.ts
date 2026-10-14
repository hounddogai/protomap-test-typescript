import { slaMetricBucket } from "../metric/sla-metric-policy.js";
import { StrictSlaMilestone } from "../metric/strict-sla-milestone.js";
import { GlobalSlaMilestone, newGlobalSlaMilestone } from "./global-sla-milestone.js";

export function summarizeStrictSlaMilestonesForMilestone(items: StrictSlaMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveGlobalSlaMilestonesFromMilestone(items: StrictSlaMilestone[]): GlobalSlaMilestone[] {
  const out: GlobalSlaMilestone[] = [];
  for (const item of items) {
    const derived = newGlobalSlaMilestone(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveGlobalSlaMilestone(item: GlobalSlaMilestone): string {
  return slaMetricBucket(item.weightedVolume());
}
