import { classifyLenientPayoutSegment } from "../../payout/segment/lenient-payout-segment-policy.js";
import { PayoutSummary } from "../../payout/segment/payout-summary.js";
import { WeightedFraudCheckMapping, newWeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

export function summarizePayoutSummariesForMapping(items: PayoutSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveWeightedFraudCheckMappingsFromSummary(items: PayoutSummary[]): WeightedFraudCheckMapping[] {
  const out: WeightedFraudCheckMapping[] = [];
  for (const item of items) {
    const derived = newWeightedFraudCheckMapping(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreWeightedFraudCheckMapping(item: WeightedFraudCheckMapping): string {
  return classifyLenientPayoutSegment(item.projectedVolume());
}
