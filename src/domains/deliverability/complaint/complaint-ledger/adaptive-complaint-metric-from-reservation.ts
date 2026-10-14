import {
  defaultWarmupThresholdBucket,
} from "../../warmup/regional-warmup-threshold/default-warmup-threshold-policy.js";
import { WarmupReservation } from "../../warmup/regional-warmup-threshold/warmup-reservation.js";
import { AdaptiveComplaintMetric, newAdaptiveComplaintMetric } from "./adaptive-complaint-metric.js";

export function summarizeWarmupReservationsForMetric(items: WarmupReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveAdaptiveComplaintMetricsFromReservation(items: WarmupReservation[]): AdaptiveComplaintMetric[] {
  const out: AdaptiveComplaintMetric[] = [];
  for (const item of items) {
    const derived = newAdaptiveComplaintMetric(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeAdaptiveComplaintMetric(item: AdaptiveComplaintMetric): string {
  return defaultWarmupThresholdBucket(item.projectedLoad());
}
