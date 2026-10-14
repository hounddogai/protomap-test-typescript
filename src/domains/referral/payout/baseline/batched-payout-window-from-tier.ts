import { weightedPayoutTierWeight } from "../tier/weighted-payout-tier-policy.js";
import { WeightedPayoutTier } from "../tier/weighted-payout-tier.js";
import { BatchedPayoutWindow, newBatchedPayoutWindow } from "./batched-payout-window.js";

export function summarizeWeightedPayoutTiersForWindow(items: WeightedPayoutTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveBatchedPayoutWindowsFromTier(items: WeightedPayoutTier[]): BatchedPayoutWindow[] {
  const out: BatchedPayoutWindow[] = [];
  for (const item of items) {
    const derived = newBatchedPayoutWindow(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchBatchedPayoutWindow(item: BatchedPayoutWindow): number {
  return weightedPayoutTierWeight(6, true);
}
