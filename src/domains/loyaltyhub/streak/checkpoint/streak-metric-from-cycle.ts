import { challengeCycleBucket } from "../../challenge/challenge-manifest/challenge-cycle-policy.js";
import { ChallengeCycle } from "../../challenge/challenge-manifest/challenge-cycle.js";
import { StreakMetric, newStreakMetric } from "./streak-metric.js";

export function summarizeChallengeCyclesForMetric(items: ChallengeCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStreakMetricsFromCycle(items: ChallengeCycle[]): StreakMetric[] {
  const out: StreakMetric[] = [];
  for (const item of items) {
    const derived = newStreakMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyStreakMetricExtra(item: StreakMetric): string {
  return challengeCycleBucket(item.projectedValue());
}
