import { payoutBatchWeight } from "../../payout/allocation/payout-batch-policy.js";
import { PayoutBatch } from "../../payout/allocation/payout-batch.js";
import { CappedFraudCheckClaim, newCappedFraudCheckClaim } from "./capped-fraud-check-claim.js";

export function summarizePayoutBatchesForClaim(items: PayoutBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveCappedFraudCheckClaimsFromBatch(items: PayoutBatch[]): CappedFraudCheckClaim[] {
  const out: CappedFraudCheckClaim[] = [];
  for (const item of items) {
    const derived = newCappedFraudCheckClaim(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyCappedFraudCheckClaim(item: CappedFraudCheckClaim): number {
  return payoutBatchWeight(8, true);
}
