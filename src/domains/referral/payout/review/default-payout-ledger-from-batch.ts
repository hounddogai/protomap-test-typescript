import { cappedTierVarianceWeight } from "../../tier/tier-variance/capped-tier-variance-policy.js";
import { TierBatch } from "../../tier/tier-variance/tier-batch.js";
import { DefaultPayoutLedger, newDefaultPayoutLedger } from "./default-payout-ledger.js";

export function summarizeTierBatchesForLedger(items: TierBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDefaultPayoutLedgersFromBatch(items: TierBatch[]): DefaultPayoutLedger[] {
  const out: DefaultPayoutLedger[] = [];
  for (const item of items) {
    const derived = newDefaultPayoutLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveDefaultPayoutLedger(item: DefaultPayoutLedger): number {
  return cappedTierVarianceWeight(4, true);
}
