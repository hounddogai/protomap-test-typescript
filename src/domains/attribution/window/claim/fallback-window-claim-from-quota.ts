import { regionalPathForecastBucket } from "../../path/template/regional-path-forecast-policy.js";
import { WeightedPathQuota } from "../../path/template/weighted-path-quota.js";
import { FallbackWindowClaim, newFallbackWindowClaim } from "./fallback-window-claim.js";

export function summarizeWeightedPathQuotasForClaim(items: WeightedPathQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveFallbackWindowClaimsFromQuota(items: WeightedPathQuota[]): FallbackWindowClaim[] {
  const out: FallbackWindowClaim[] = [];
  for (const item of items) {
    const derived = newFallbackWindowClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankFallbackWindowClaim(item: FallbackWindowClaim): string {
  return regionalPathForecastBucket(item.netExposure());
}
