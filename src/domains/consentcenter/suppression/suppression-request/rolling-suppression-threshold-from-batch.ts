import { defaultProofBatchBucket } from "../../proof/quota/default-proof-batch-policy.js";
import { DefaultProofBatch } from "../../proof/quota/default-proof-batch.js";
import { RollingSuppressionThreshold, newRollingSuppressionThreshold } from "./rolling-suppression-threshold.js";

export function summarizeDefaultProofBatchesForThreshold(items: DefaultProofBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveRollingSuppressionThresholdsFromBatch(items: DefaultProofBatch[]): RollingSuppressionThreshold[] {
  const out: RollingSuppressionThreshold[] = [];
  for (const item of items) {
    const derived = newRollingSuppressionThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankRollingSuppressionThreshold(item: RollingSuppressionThreshold): string {
  return defaultProofBatchBucket(item.netLoad());
}
