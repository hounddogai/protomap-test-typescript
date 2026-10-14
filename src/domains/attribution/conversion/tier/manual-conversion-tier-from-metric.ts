import { BatchedCreditMetric } from "../../credit/cycle/batched-credit-metric.js";
import { normalizeCreditCycleCode } from "../../credit/cycle/credit-cycle-policy.js";
import { ManualConversionTier, newManualConversionTier } from "./manual-conversion-tier.js";

export function summarizeBatchedCreditMetricsForTier(items: BatchedCreditMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveManualConversionTiersFromMetric(items: BatchedCreditMetric[]): ManualConversionTier[] {
  const out: ManualConversionTier[] = [];
  for (const item of items) {
    const derived = newManualConversionTier(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveManualConversionTier(item: ManualConversionTier): string {
  return normalizeCreditCycleCode(item.code);
}
