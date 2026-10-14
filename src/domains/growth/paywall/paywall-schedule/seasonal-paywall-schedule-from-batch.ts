import { fallbackRetentionBatchBucket } from "../../retention/proposal/fallback-retention-batch-policy.js";
import { FallbackRetentionBatch } from "../../retention/proposal/fallback-retention-batch.js";
import { SeasonalPaywallSchedule, newSeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

export function summarizeFallbackRetentionBatchesForSchedule(items: FallbackRetentionBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSeasonalPaywallSchedulesFromBatch(items: FallbackRetentionBatch[]): SeasonalPaywallSchedule[] {
  const out: SeasonalPaywallSchedule[] = [];
  for (const item of items) {
    const derived = newSeasonalPaywallSchedule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileSeasonalPaywallSchedule(item: SeasonalPaywallSchedule): string {
  return fallbackRetentionBatchBucket(item.adjustedValue());
}
