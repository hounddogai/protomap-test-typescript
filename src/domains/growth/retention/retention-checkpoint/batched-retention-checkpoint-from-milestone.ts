import { normalizeActivationMappingCode } from "../../activation/ledger/activation-mapping-policy.js";
import { CappedActivationMilestone } from "../../activation/ledger/capped-activation-milestone.js";
import { BatchedRetentionCheckpoint, newBatchedRetentionCheckpoint } from "./batched-retention-checkpoint.js";

export function summarizeCappedActivationMilestonesForCheckpoint(items: CappedActivationMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveBatchedRetentionCheckpointsFromMilestone(items: CappedActivationMilestone[]): BatchedRetentionCheckpoint[] {
  const out: BatchedRetentionCheckpoint[] = [];
  for (const item of items) {
    const derived = newBatchedRetentionCheckpoint(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectBatchedRetentionCheckpoint(item: BatchedRetentionCheckpoint): string {
  return normalizeActivationMappingCode(item.code);
}
