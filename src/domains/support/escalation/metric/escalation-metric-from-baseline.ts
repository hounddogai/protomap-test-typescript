import { classifyGlobalDeflectionBaseline } from "../../deflection/summary/global-deflection-baseline-policy.js";
import { GlobalDeflectionBaseline } from "../../deflection/summary/global-deflection-baseline.js";
import { EscalationMetric, newEscalationMetric } from "./escalation-metric.js";

export function summarizeGlobalDeflectionBaselinesForMetric(items: GlobalDeflectionBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveEscalationMetricsFromBaseline(items: GlobalDeflectionBaseline[]): EscalationMetric[] {
  const out: EscalationMetric[] = [];
  for (const item of items) {
    const derived = newEscalationMetric(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreEscalationMetric(item: EscalationMetric): string {
  return classifyGlobalDeflectionBaseline(item.adjustedVolume());
}
