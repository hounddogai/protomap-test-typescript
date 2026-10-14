import { AdaptiveFunnelEstimate } from "../../funnel/lenient-funnel-request/adaptive-funnel-estimate.js";
import { tieredFunnelMappingWeight } from "../../funnel/lenient-funnel-request/tiered-funnel-mapping-policy.js";
import { ManualActivationBatch, newManualActivationBatch } from "./manual-activation-batch.js";

export function summarizeAdaptiveFunnelEstimatesForBatch(items: AdaptiveFunnelEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveManualActivationBatchesFromEstimate(items: AdaptiveFunnelEstimate[]): ManualActivationBatch[] {
  const out: ManualActivationBatch[] = [];
  for (const item of items) {
    const derived = newManualActivationBatch(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchManualActivationBatch(item: ManualActivationBatch): number {
  return tieredFunnelMappingWeight(5, true);
}
