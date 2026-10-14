import { classifyRollingSuppressionLedger } from "../../suppression/exception/rolling-suppression-ledger-policy.js";
import { SuppressionBatch } from "../../suppression/exception/suppression-batch.js";
import { StrictProofCheckpoint, newStrictProofCheckpoint } from "./strict-proof-checkpoint.js";

export function summarizeSuppressionBatchesForCheckpoint(items: SuppressionBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictProofCheckpointsFromBatch(items: SuppressionBatch[]): StrictProofCheckpoint[] {
  const out: StrictProofCheckpoint[] = [];
  for (const item of items) {
    const derived = newStrictProofCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankStrictProofCheckpoint(item: StrictProofCheckpoint): string {
  return classifyRollingSuppressionLedger(item.projectedLoad());
}
