import { fallbackPathQuotaBucket } from "../../path/milestone/fallback-path-quota-policy.js";
import { FallbackPathQuota } from "../../path/milestone/fallback-path-quota.js";
import { SeasonalWindowBundle, newSeasonalWindowBundle } from "./seasonal-window-bundle.js";

export function summarizeFallbackPathQuotasForBundle(items: FallbackPathQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveSeasonalWindowBundlesFromQuota(items: FallbackPathQuota[]): SeasonalWindowBundle[] {
  const out: SeasonalWindowBundle[] = [];
  for (const item of items) {
    const derived = newSeasonalWindowBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateSeasonalWindowBundle(item: SeasonalWindowBundle): string {
  return fallbackPathQuotaBucket(item.measuredValue());
}
