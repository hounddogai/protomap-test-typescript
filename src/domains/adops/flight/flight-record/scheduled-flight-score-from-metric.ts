import { classifyLenientFlightMetric } from "../checkpoint/lenient-flight-metric-policy.js";
import { LenientFlightMetric } from "../checkpoint/lenient-flight-metric.js";
import { ScheduledFlightScore, newScheduledFlightScore } from "./scheduled-flight-score.js";

export function summarizeLenientFlightMetricsForScore(items: LenientFlightMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveScheduledFlightScoresFromMetric(items: LenientFlightMetric[]): ScheduledFlightScore[] {
  const out: ScheduledFlightScore[] = [];
  for (const item of items) {
    const derived = newScheduledFlightScore(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeScheduledFlightScore(item: ScheduledFlightScore): string {
  return classifyLenientFlightMetric(item.measuredValue());
}
