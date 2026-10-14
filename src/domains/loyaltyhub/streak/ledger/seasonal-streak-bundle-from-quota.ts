import { manualBadgeQuotaBucket } from "../../badge/audit/manual-badge-quota-policy.js";
import { ManualBadgeQuota } from "../../badge/audit/manual-badge-quota.js";
import { SeasonalStreakBundle, newSeasonalStreakBundle } from "./seasonal-streak-bundle.js";

export function summarizeManualBadgeQuotasForBundle(items: ManualBadgeQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveSeasonalStreakBundlesFromQuota(items: ManualBadgeQuota[]): SeasonalStreakBundle[] {
  const out: SeasonalStreakBundle[] = [];
  for (const item of items) {
    const derived = newSeasonalStreakBundle(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateSeasonalStreakBundle(item: SeasonalStreakBundle): string {
  return manualBadgeQuotaBucket(item.projectedExposure());
}
