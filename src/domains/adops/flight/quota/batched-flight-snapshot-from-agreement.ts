import { classifyBidRuleAgreement } from "../../bid-rule/agreement/bid-rule-agreement-policy.js";
import { BidRuleAgreement } from "../../bid-rule/agreement/bid-rule-agreement.js";
import { BatchedFlightSnapshot, newBatchedFlightSnapshot } from "./batched-flight-snapshot.js";

export function summarizeBidRuleAgreementsForSnapshot(items: BidRuleAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveBatchedFlightSnapshotsFromAgreement(items: BidRuleAgreement[]): BatchedFlightSnapshot[] {
  const out: BatchedFlightSnapshot[] = [];
  for (const item of items) {
    const derived = newBatchedFlightSnapshot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateBatchedFlightSnapshot(item: BatchedFlightSnapshot): string {
  return classifyBidRuleAgreement(item.projectedVolume());
}
