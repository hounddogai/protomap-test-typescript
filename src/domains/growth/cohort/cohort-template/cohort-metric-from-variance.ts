import { BatchedNudgeVariance } from "../../nudge/forecast/batched-nudge-variance.js";
import { normalizeLegacyNudgeForecastCode } from "../../nudge/forecast/legacy-nudge-forecast-policy.js";
import { CohortMetric, newCohortMetric } from "./cohort-metric.js";

export function summarizeBatchedNudgeVariancesForMetric(items: BatchedNudgeVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveCohortMetricsFromVariance(items: BatchedNudgeVariance[]): CohortMetric[] {
  const out: CohortMetric[] = [];
  for (const item of items) {
    const derived = newCohortMetric(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateCohortMetric(item: CohortMetric): string {
  return normalizeLegacyNudgeForecastCode(item.code);
}
