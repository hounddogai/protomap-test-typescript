import { ManualProofQuota } from "../slot/manual-proof-quota.js";
import { classifyWeightedProofMetric } from "../slot/weighted-proof-metric-policy.js";
import { FallbackProofAdjustment, newFallbackProofAdjustment } from "./fallback-proof-adjustment.js";

export function summarizeManualProofQuotasForAdjustment(items: ManualProofQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveFallbackProofAdjustmentsFromQuota(items: ManualProofQuota[]): FallbackProofAdjustment[] {
  const out: FallbackProofAdjustment[] = [];
  for (const item of items) {
    const derived = newFallbackProofAdjustment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeFallbackProofAdjustment(item: FallbackProofAdjustment): string {
  return classifyWeightedProofMetric(item.adjustedTotal());
}
