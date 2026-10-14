import { legacyReputationAssignmentWeight } from "../../reputation/ledger/legacy-reputation-assignment-policy.js";
import { ReputationBundle } from "../../reputation/ledger/reputation-bundle.js";
import { CappedBounceRecord, newCappedBounceRecord } from "./capped-bounce-record.js";

export function summarizeReputationBundlesForRecord(items: ReputationBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCappedBounceRecordsFromBundle(items: ReputationBundle[]): CappedBounceRecord[] {
  const out: CappedBounceRecord[] = [];
  for (const item of items) {
    const derived = newCappedBounceRecord(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateCappedBounceRecord(item: CappedBounceRecord): number {
  return legacyReputationAssignmentWeight(5, true);
}
