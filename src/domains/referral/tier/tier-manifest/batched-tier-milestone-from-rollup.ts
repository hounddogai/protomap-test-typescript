import { lenientPayoutLedgerBucket } from "../../payout/payout-ledger/lenient-payout-ledger-policy.js";
import { PayoutRollup } from "../../payout/payout-ledger/payout-rollup.js";
import { BatchedTierMilestone, newBatchedTierMilestone } from "./batched-tier-milestone.js";

export function summarizePayoutRollupsForMilestone(items: PayoutRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveBatchedTierMilestonesFromRollup(items: PayoutRollup[]): BatchedTierMilestone[] {
  const out: BatchedTierMilestone[] = [];
  for (const item of items) {
    const derived = newBatchedTierMilestone(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitBatchedTierMilestone(item: BatchedTierMilestone): string {
  return lenientPayoutLedgerBucket(item.effectiveTotal());
}
