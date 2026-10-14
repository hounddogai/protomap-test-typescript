import { classifyFrequencyMetric } from "../../frequency/metric/frequency-metric-policy.js";
import { FrequencyMetric } from "../../frequency/metric/frequency-metric.js";
import { PlacementAgreement, newPlacementAgreement } from "./placement-agreement.js";

export function summarizeFrequencyMetricsForAgreement(items: FrequencyMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePlacementAgreementsFromMetric(items: FrequencyMetric[]): PlacementAgreement[] {
  const out: PlacementAgreement[] = [];
  for (const item of items) {
    const derived = newPlacementAgreement(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planPlacementAgreement(item: PlacementAgreement): string {
  return classifyFrequencyMetric(item.weightedTotal());
}
