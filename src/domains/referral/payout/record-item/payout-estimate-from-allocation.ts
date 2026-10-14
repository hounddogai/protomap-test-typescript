import { ManualTierAllocation } from "../../tier/tier-allocation/manual-tier-allocation.js";
import { normalizeTierClaimCode } from "../../tier/tier-allocation/tier-claim-policy.js";
import { PayoutEstimate, newPayoutEstimate } from "./payout-estimate.js";

export function summarizeManualTierAllocationsForEstimate(items: ManualTierAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePayoutEstimatesFromAllocation(items: ManualTierAllocation[]): PayoutEstimate[] {
  const out: PayoutEstimate[] = [];
  for (const item of items) {
    const derived = newPayoutEstimate(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcilePayoutEstimate(item: PayoutEstimate): string {
  return normalizeTierClaimCode(item.code);
}
