import { payoutBatchBucket } from "../../payout/allocation/payout-batch-policy.js";
import { WeightedPayoutAllocation } from "../../payout/allocation/weighted-payout-allocation.js";
import { ManualTierAllocation, newManualTierAllocation } from "./manual-tier-allocation.js";

export function summarizeWeightedPayoutAllocationsForAllocation(items: WeightedPayoutAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveManualTierAllocationsFromAllocation(items: WeightedPayoutAllocation[]): ManualTierAllocation[] {
  const out: ManualTierAllocation[] = [];
  for (const item of items) {
    const derived = newManualTierAllocation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeManualTierAllocationExtra(item: ManualTierAllocation): string {
  return payoutBatchBucket(item.effectiveValue());
}
