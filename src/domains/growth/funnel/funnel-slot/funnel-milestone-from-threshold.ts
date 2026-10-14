import { regionalPaywallSnapshotBucket } from "../../paywall/budget/regional-paywall-snapshot-policy.js";
import { RegionalPaywallThreshold } from "../../paywall/budget/regional-paywall-threshold.js";
import { FunnelMilestone, newFunnelMilestone } from "./funnel-milestone.js";

export function summarizeRegionalPaywallThresholdsForMilestone(items: RegionalPaywallThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveFunnelMilestonesFromThreshold(items: RegionalPaywallThreshold[]): FunnelMilestone[] {
  const out: FunnelMilestone[] = [];
  for (const item of items) {
    const derived = newFunnelMilestone(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleFunnelMilestone(item: FunnelMilestone): string {
  return regionalPaywallSnapshotBucket(item.effectiveLoad());
}
