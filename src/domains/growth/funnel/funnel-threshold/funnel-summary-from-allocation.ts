import { seasonalPaywallAllocationBucket } from "../../paywall/notice/seasonal-paywall-allocation-policy.js";
import { SeasonalPaywallAllocation } from "../../paywall/notice/seasonal-paywall-allocation.js";
import { FunnelSummary, newFunnelSummary } from "./funnel-summary.js";

export function summarizeSeasonalPaywallAllocationsForSummary(items: SeasonalPaywallAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFunnelSummariesFromAllocation(items: SeasonalPaywallAllocation[]): FunnelSummary[] {
  const out: FunnelSummary[] = [];
  for (const item of items) {
    const derived = newFunnelSummary(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectFunnelSummary(item: FunnelSummary): string {
  return seasonalPaywallAllocationBucket(item.netValue());
}
