import { AdaptiveBounceAdjustment } from "../summary/adaptive-bounce-adjustment.js";
import { bounceSummaryWeight } from "../summary/bounce-summary-policy.js";
import { BounceMapping, newBounceMapping } from "./bounce-mapping.js";

export function summarizeAdaptiveBounceAdjustmentsForMapping(items: AdaptiveBounceAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveBounceMappingsFromAdjustment(items: AdaptiveBounceAdjustment[]): BounceMapping[] {
  const out: BounceMapping[] = [];
  for (const item of items) {
    const derived = newBounceMapping(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchBounceMapping(item: BounceMapping): number {
  return bounceSummaryWeight(5, true);
}
