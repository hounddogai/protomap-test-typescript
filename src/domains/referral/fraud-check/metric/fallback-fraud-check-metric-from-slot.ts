import { manualTierWindowWeight } from "../../tier/window/manual-tier-window-policy.js";
import { TierSlot } from "../../tier/window/tier-slot.js";
import { FallbackFraudCheckMetric, newFallbackFraudCheckMetric } from "./fallback-fraud-check-metric.js";

export function summarizeTierSlotsForMetric(items: TierSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveFallbackFraudCheckMetricsFromSlot(items: TierSlot[]): FallbackFraudCheckMetric[] {
  const out: FallbackFraudCheckMetric[] = [];
  for (const item of items) {
    const derived = newFallbackFraudCheckMetric(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planFallbackFraudCheckMetric(item: FallbackFraudCheckMetric): number {
  return manualTierWindowWeight(3, true);
}
