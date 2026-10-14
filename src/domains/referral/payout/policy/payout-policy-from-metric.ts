import { seasonalTierBaselineWeight } from "../../tier/metric/seasonal-tier-baseline-policy.js";
import { TierMetric } from "../../tier/metric/tier-metric.js";
import { PayoutPolicy, newPayoutPolicy } from "./payout-policy.js";

export function summarizeTierMetricsForPolicy(items: TierMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function derivePayoutPoliciesFromMetric(items: TierMetric[]): PayoutPolicy[] {
  const out: PayoutPolicy[] = [];
  for (const item of items) {
    const derived = newPayoutPolicy(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolvePayoutPolicy(item: PayoutPolicy): number {
  return seasonalTierBaselineWeight(5, true);
}
