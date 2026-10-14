import { CappedCsatSchedule } from "../csat-schedule/capped-csat-schedule.js";
import { classifyFallbackCsatQuota } from "../csat-schedule/fallback-csat-quota-policy.js";
import { WeightedCsatVariance, newWeightedCsatVariance } from "./weighted-csat-variance.js";

export function summarizeCappedCsatSchedulesForVariance(items: CappedCsatSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveWeightedCsatVariancesFromSchedule(items: CappedCsatSchedule[]): WeightedCsatVariance[] {
  const out: WeightedCsatVariance[] = [];
  for (const item of items) {
    const derived = newWeightedCsatVariance(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeWeightedCsatVariance(item: WeightedCsatVariance): string {
  return classifyFallbackCsatQuota(item.adjustedLoad());
}
