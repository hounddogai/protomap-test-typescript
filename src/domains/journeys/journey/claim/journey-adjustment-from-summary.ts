import { PendingWaitSummary } from "../../wait/metric/pending-wait-summary.js";
import { strictWaitMetricWeight } from "../../wait/metric/strict-wait-metric-policy.js";
import { JourneyAdjustment, newJourneyAdjustment } from "./journey-adjustment.js";

export function summarizePendingWaitSummariesForAdjustment(items: PendingWaitSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveJourneyAdjustmentsFromSummary(items: PendingWaitSummary[]): JourneyAdjustment[] {
  const out: JourneyAdjustment[] = [];
  for (const item of items) {
    const derived = newJourneyAdjustment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeJourneyAdjustment(item: JourneyAdjustment): number {
  return strictWaitMetricWeight(4, true);
}
