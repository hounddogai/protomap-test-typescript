import { LegacyInviteBatch } from "../../invite/invite-batch/legacy-invite-batch.js";
import { scheduledInviteAllocationBucket } from "../../invite/invite-batch/scheduled-invite-allocation-policy.js";
import { PendingFraudCheckException, newPendingFraudCheckException } from "./pending-fraud-check-exception.js";

export function summarizeLegacyInviteBatchesForException(items: LegacyInviteBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePendingFraudCheckExceptionsFromBatch(items: LegacyInviteBatch[]): PendingFraudCheckException[] {
  const out: PendingFraudCheckException[] = [];
  for (const item of items) {
    const derived = newPendingFraudCheckException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function rankPendingFraudCheckException(item: PendingFraudCheckException): string {
  return scheduledInviteAllocationBucket(item.weightedLoad());
}
