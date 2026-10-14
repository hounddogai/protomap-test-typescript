import { AdaptiveOptOutAdjustment } from "../../opt-out/request/adaptive-opt-out-adjustment.js";
import { classifyCappedOptOutRequest } from "../../opt-out/request/capped-opt-out-request-policy.js";
import { SeasonalSubscriptionSegment, newSeasonalSubscriptionSegment } from "./seasonal-subscription-segment.js";

export function summarizeAdaptiveOptOutAdjustmentsForSegment(items: AdaptiveOptOutAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveSeasonalSubscriptionSegmentsFromAdjustment(items: AdaptiveOptOutAdjustment[]): SeasonalSubscriptionSegment[] {
  const out: SeasonalSubscriptionSegment[] = [];
  for (const item of items) {
    const derived = newSeasonalSubscriptionSegment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateSeasonalSubscriptionSegment(item: SeasonalSubscriptionSegment): string {
  return classifyCappedOptOutRequest(item.adjustedTotal());
}
