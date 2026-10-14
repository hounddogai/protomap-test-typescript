import { stepCycleBucket } from "../../step/adjustment/step-cycle-policy.js";
import { StepMetric } from "../../step/adjustment/step-metric.js";
import { JourneyMapping, newJourneyMapping } from "./journey-mapping.js";

export function summarizeStepMetricsForMapping(items: StepMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveJourneyMappingsFromMetric(items: StepMetric[]): JourneyMapping[] {
  const out: JourneyMapping[] = [];
  for (const item of items) {
    const derived = newJourneyMapping(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeJourneyMapping(item: JourneyMapping): string {
  return stepCycleBucket(item.measuredValue());
}
