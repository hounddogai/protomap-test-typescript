import { BatchedPayoutBatch } from "../../payout/lenient-payout-ledger/batched-payout-batch.js";
import { seasonalPayoutLedgerWeight } from "../../payout/lenient-payout-ledger/seasonal-payout-ledger-policy.js";
import { ManualTierSegment, newManualTierSegment } from "./manual-tier-segment.js";

export function summarizeBatchedPayoutBatchesForSegment(items: BatchedPayoutBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveManualTierSegmentsFromBatch(items: BatchedPayoutBatch[]): ManualTierSegment[] {
  const out: ManualTierSegment[] = [];
  for (const item of items) {
    const derived = newManualTierSegment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchManualTierSegment(item: ManualTierSegment): number {
  return seasonalPayoutLedgerWeight(8, true);
}
