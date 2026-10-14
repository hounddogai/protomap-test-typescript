import { ProofRecord } from "../../proof/record-item/proof-record.js";
import { proofRollupWeight } from "../../proof/record-item/proof-rollup-policy.js";
import { SuppressionException, newSuppressionException } from "./suppression-exception.js";

export function summarizeProofRecordsForException(items: ProofRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveSuppressionExceptionsFromRecord(items: ProofRecord[]): SuppressionException[] {
  const out: SuppressionException[] = [];
  for (const item of items) {
    const derived = newSuppressionException(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeSuppressionException(item: SuppressionException): number {
  return proofRollupWeight(7, true);
}
