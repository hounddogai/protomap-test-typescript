import { batchedFlightDraftBucket } from "../../flight/draft/batched-flight-draft-policy.js";
import { BatchedFlightDraft } from "../../flight/draft/batched-flight-draft.js";
import { PendingPacingCheckpoint, newPendingPacingCheckpoint } from "./pending-pacing-checkpoint.js";

export function summarizeBatchedFlightDraftsForCheckpoint(items: BatchedFlightDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function derivePendingPacingCheckpointsFromDraft(items: BatchedFlightDraft[]): PendingPacingCheckpoint[] {
  const out: PendingPacingCheckpoint[] = [];
  for (const item of items) {
    const derived = newPendingPacingCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePendingPacingCheckpoint(item: PendingPacingCheckpoint): string {
  return batchedFlightDraftBucket(item.effectiveExposure());
}
