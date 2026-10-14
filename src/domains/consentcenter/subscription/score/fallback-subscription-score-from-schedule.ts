import { doubleOptInAllocationBucket } from "../../double-opt-in/allocation/double-opt-in-allocation-policy.js";
import { DoubleOptInSchedule } from "../../double-opt-in/allocation/double-opt-in-schedule.js";
import { FallbackSubscriptionScore, newFallbackSubscriptionScore } from "./fallback-subscription-score.js";

export function summarizeDoubleOptInSchedulesForScore(items: DoubleOptInSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveFallbackSubscriptionScoresFromSchedule(items: DoubleOptInSchedule[]): FallbackSubscriptionScore[] {
  const out: FallbackSubscriptionScore[] = [];
  for (const item of items) {
    const derived = newFallbackSubscriptionScore(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveFallbackSubscriptionScore(item: FallbackSubscriptionScore): string {
  return doubleOptInAllocationBucket(item.adjustedLoad());
}
