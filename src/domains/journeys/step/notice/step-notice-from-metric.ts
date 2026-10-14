import { classifyStepBundle } from "../adjustment/step-bundle-policy.js";
import { StepMetric } from "../adjustment/step-metric.js";
import { StepNotice, newStepNotice } from "./step-notice.js";

export function summarizeStepMetricsForNotice(items: StepMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveStepNoticesFromMetric(items: StepMetric[]): StepNotice[] {
  const out: StepNotice[] = [];
  for (const item of items) {
    const derived = newStepNotice(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreStepNotice(item: StepNotice): string {
  return classifyStepBundle(item.adjustedLoad());
}
