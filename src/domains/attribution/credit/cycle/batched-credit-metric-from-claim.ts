import { classifyFallbackWindowClaim } from "../../window/claim/fallback-window-claim-policy.js";
import { FallbackWindowClaim } from "../../window/claim/fallback-window-claim.js";
import { BatchedCreditMetric, newBatchedCreditMetric } from "./batched-credit-metric.js";

export function summarizeFallbackWindowClaimsForMetric(items: FallbackWindowClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveBatchedCreditMetricsFromClaim(items: FallbackWindowClaim[]): BatchedCreditMetric[] {
  const out: BatchedCreditMetric[] = [];
  for (const item of items) {
    const derived = newBatchedCreditMetric(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planBatchedCreditMetric(item: BatchedCreditMetric): string {
  return classifyFallbackWindowClaim(item.adjustedVolume());
}
