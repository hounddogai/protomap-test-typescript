import { classifyBranchMetric } from "../../branch/entry/branch-metric-policy.js";
import { BranchMetric } from "../../branch/entry/branch-metric.js";
import { JourneyTier, newJourneyTier } from "./journey-tier.js";

export function summarizeBranchMetricsForTier(items: BranchMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveJourneyTiersFromMetric(items: BranchMetric[]): JourneyTier[] {
  const out: JourneyTier[] = [];
  for (const item of items) {
    const derived = newJourneyTier(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveJourneyTier(item: JourneyTier): string {
  return classifyBranchMetric(item.adjustedTotal());
}
