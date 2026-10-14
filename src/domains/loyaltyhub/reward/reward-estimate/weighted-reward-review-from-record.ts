import { RegionalStreakRecord } from "../../streak/manifest/regional-streak-record.js";
import { scheduledStreakQuotaWeight } from "../../streak/manifest/scheduled-streak-quota-policy.js";
import { WeightedRewardReview, newWeightedRewardReview } from "./weighted-reward-review.js";

export function summarizeRegionalStreakRecordsForReview(items: RegionalStreakRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveWeightedRewardReviewsFromRecord(items: RegionalStreakRecord[]): WeightedRewardReview[] {
  const out: WeightedRewardReview[] = [];
  for (const item of items) {
    const derived = newWeightedRewardReview(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignWeightedRewardReview(item: WeightedRewardReview): number {
  return scheduledStreakQuotaWeight(6, true);
}
