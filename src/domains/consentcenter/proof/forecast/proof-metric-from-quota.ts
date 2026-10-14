import { AdaptiveOptOutQuota } from "../../opt-out/out-baseline/adaptive-opt-out-quota.js";
import { normalizeBatchedOptOutBaselineCode } from "../../opt-out/out-baseline/batched-opt-out-baseline-policy.js";
import { ProofMetric, newProofMetric } from "./proof-metric.js";

export function summarizeAdaptiveOptOutQuotasForMetric(items: AdaptiveOptOutQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveProofMetricsFromQuota(items: AdaptiveOptOutQuota[]): ProofMetric[] {
  const out: ProofMetric[] = [];
  for (const item of items) {
    const derived = newProofMetric(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveProofMetric(item: ProofMetric): string {
  return normalizeBatchedOptOutBaselineCode(item.code);
}
