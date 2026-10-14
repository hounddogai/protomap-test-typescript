import { normalizeRedemptionMetricCode } from "../../redemption/metric/redemption-metric-policy.js";
import { RedemptionMetric } from "../../redemption/metric/redemption-metric.js";
import { StreakLedger, newStreakLedger } from "./streak-ledger.js";

export function summarizeRedemptionMetricsForLedger(items: RedemptionMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveStreakLedgersFromMetric(items: RedemptionMetric[]): StreakLedger[] {
  const out: StreakLedger[] = [];
  for (const item of items) {
    const derived = newStreakLedger(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeStreakLedger(item: StreakLedger): string {
  return normalizeRedemptionMetricCode(item.code);
}
