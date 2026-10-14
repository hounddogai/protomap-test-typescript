import {
  fallbackPlacementGroupWeight,
} from "../../placement/seasonal-placement-group/fallback-placement-group-policy.js";
import { FallbackPlacementGroup } from "../../placement/seasonal-placement-group/fallback-placement-group.js";
import { FrequencyQuota, newFrequencyQuota } from "./frequency-quota.js";

export function summarizeFallbackPlacementGroupsForQuota(items: FallbackPlacementGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveFrequencyQuotasFromGroup(items: FallbackPlacementGroup[]): FrequencyQuota[] {
  const out: FrequencyQuota[] = [];
  for (const item of items) {
    const derived = newFrequencyQuota(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeFrequencyQuota(item: FrequencyQuota): number {
  return fallbackPlacementGroupWeight(8, true);
}
