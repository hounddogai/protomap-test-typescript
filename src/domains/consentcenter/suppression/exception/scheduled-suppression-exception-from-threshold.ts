import { rollingSuppressionThresholdWeight } from "../suppression-request/rolling-suppression-threshold-policy.js";
import { RollingSuppressionThreshold } from "../suppression-request/rolling-suppression-threshold.js";
import {
  ScheduledSuppressionException,
  newScheduledSuppressionException,
} from "./scheduled-suppression-exception.js";

export function summarizeRollingSuppressionThresholdsForException(items: RollingSuppressionThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveScheduledSuppressionExceptionsFromThreshold(items: RollingSuppressionThreshold[]): ScheduledSuppressionException[] {
  const out: ScheduledSuppressionException[] = [];
  for (const item of items) {
    const derived = newScheduledSuppressionException(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeScheduledSuppressionException(item: ScheduledSuppressionException): number {
  return rollingSuppressionThresholdWeight(7, true);
}
