import { normalizeFallbackRewardDraftCode } from "../../reward/reward-draft/fallback-reward-draft-policy.js";
import { PendingRewardMetric } from "../../reward/reward-draft/pending-reward-metric.js";
import { SeasonalStreakBundle, newSeasonalStreakBundle } from "./seasonal-streak-bundle.js";

export function summarizePendingRewardMetricsForBundle(items: PendingRewardMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalStreakBundlesFromMetric(items: PendingRewardMetric[]): SeasonalStreakBundle[] {
  const out: SeasonalStreakBundle[] = [];
  for (const item of items) {
    const derived = newSeasonalStreakBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchSeasonalStreakBundle(item: SeasonalStreakBundle): string {
  return normalizeFallbackRewardDraftCode(item.code);
}
