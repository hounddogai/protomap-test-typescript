import { doubleOptInEntryBucket } from "../../double-opt-in/score/double-opt-in-entry-policy.js";
import { ScheduledDoubleOptInLedger } from "../../double-opt-in/score/scheduled-double-opt-in-ledger.js";
import { TieredSubscriptionMetric, newTieredSubscriptionMetric } from "./tiered-subscription-metric.js";

export function summarizeScheduledDoubleOptInLedgersForMetric(items: ScheduledDoubleOptInLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveTieredSubscriptionMetricsFromLedger(items: ScheduledDoubleOptInLedger[]): TieredSubscriptionMetric[] {
  const out: TieredSubscriptionMetric[] = [];
  for (const item of items) {
    const derived = newTieredSubscriptionMetric(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileTieredSubscriptionMetric(item: TieredSubscriptionMetric): string {
  return doubleOptInEntryBucket(item.netTotal());
}
