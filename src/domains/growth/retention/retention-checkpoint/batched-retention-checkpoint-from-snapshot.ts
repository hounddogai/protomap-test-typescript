import { normalizeNudgeAgreementCode } from "../../nudge/nudge-forecast/nudge-agreement-policy.js";
import { RegionalNudgeSnapshot } from "../../nudge/nudge-forecast/regional-nudge-snapshot.js";
import { BatchedRetentionCheckpoint, newBatchedRetentionCheckpoint } from "./batched-retention-checkpoint.js";

export function summarizeRegionalNudgeSnapshotsForCheckpoint(items: RegionalNudgeSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveBatchedRetentionCheckpointsFromSnapshot(items: RegionalNudgeSnapshot[]): BatchedRetentionCheckpoint[] {
  const out: BatchedRetentionCheckpoint[] = [];
  for (const item of items) {
    const derived = newBatchedRetentionCheckpoint(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveBatchedRetentionCheckpoint(item: BatchedRetentionCheckpoint): string {
  return normalizeNudgeAgreementCode(item.code);
}
