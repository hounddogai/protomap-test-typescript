import { ComplaintLedger } from "../../complaint/ledger/complaint-ledger.js";
import { rollingComplaintLedgerBucket } from "../../complaint/ledger/rolling-complaint-ledger-policy.js";
import { WeightedSenderSegment, newWeightedSenderSegment } from "./weighted-sender-segment.js";

export function summarizeComplaintLedgersForSegment(items: ComplaintLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedSenderSegmentsFromLedger(items: ComplaintLedger[]): WeightedSenderSegment[] {
  const out: WeightedSenderSegment[] = [];
  for (const item of items) {
    const derived = newWeightedSenderSegment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedSenderSegment(item: WeightedSenderSegment): string {
  return rollingComplaintLedgerBucket(item.effectiveExposure());
}
