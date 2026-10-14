import { seasonalStreakQuotaWeight } from "../../streak/streak-quota/seasonal-streak-quota-policy.js";
import { SeasonalStreakQuota } from "../../streak/streak-quota/seasonal-streak-quota.js";
import { TieredRedemptionBatch, newTieredRedemptionBatch } from "./tiered-redemption-batch.js";

export function summarizeSeasonalStreakQuotasForBatch(items: SeasonalStreakQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveTieredRedemptionBatchesFromQuota(items: SeasonalStreakQuota[]): TieredRedemptionBatch[] {
  const out: TieredRedemptionBatch[] = [];
  for (const item of items) {
    const derived = newTieredRedemptionBatch(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchTieredRedemptionBatch(item: TieredRedemptionBatch): number {
  return seasonalStreakQuotaWeight(7, true);
}
