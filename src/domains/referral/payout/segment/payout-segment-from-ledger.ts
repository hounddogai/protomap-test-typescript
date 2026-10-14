import { PayoutLedger } from "../ledger/payout-ledger.js";
import { payoutManifestBucket } from "../ledger/payout-manifest-policy.js";
import { PayoutSegment, newPayoutSegment } from "./payout-segment.js";

export function summarizePayoutLedgersForSegment(items: PayoutLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function derivePayoutSegmentsFromLedger(items: PayoutLedger[]): PayoutSegment[] {
  const out: PayoutSegment[] = [];
  for (const item of items) {
    const derived = newPayoutSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankPayoutSegment(item: PayoutSegment): string {
  return payoutManifestBucket(item.adjustedTotal());
}
