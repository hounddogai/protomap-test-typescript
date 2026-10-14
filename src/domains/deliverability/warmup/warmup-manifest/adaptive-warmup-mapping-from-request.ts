import { rollingBounceRequestWeight } from "../../bounce/bounce-notice/rolling-bounce-request-policy.js";
import { RollingBounceRequest } from "../../bounce/bounce-notice/rolling-bounce-request.js";
import { AdaptiveWarmupMapping, newAdaptiveWarmupMapping } from "./adaptive-warmup-mapping.js";

export function summarizeRollingBounceRequestsForMapping(items: RollingBounceRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveAdaptiveWarmupMappingsFromRequest(items: RollingBounceRequest[]): AdaptiveWarmupMapping[] {
  const out: AdaptiveWarmupMapping[] = [];
  for (const item of items) {
    const derived = newAdaptiveWarmupMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateAdaptiveWarmupMapping(item: AdaptiveWarmupMapping): number {
  return rollingBounceRequestWeight(7, true);
}
