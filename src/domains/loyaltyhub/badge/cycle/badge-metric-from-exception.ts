import { manualStreakExceptionBucket } from "../../streak/exception/manual-streak-exception-policy.js";
import { ManualStreakException } from "../../streak/exception/manual-streak-exception.js";
import { BadgeMetric, newBadgeMetric } from "./badge-metric.js";

export function summarizeManualStreakExceptionsForMetric(items: ManualStreakException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveBadgeMetricsFromException(items: ManualStreakException[]): BadgeMetric[] {
  const out: BadgeMetric[] = [];
  for (const item of items) {
    const derived = newBadgeMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankBadgeMetric(item: BadgeMetric): string {
  return manualStreakExceptionBucket(item.projectedExposure());
}
