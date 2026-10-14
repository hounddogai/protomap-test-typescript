import { FallbackPayoutNotice } from "../payout-notice/fallback-payout-notice.js";
import { normalizePrimaryPayoutOverrideCode } from "../payout-notice/primary-payout-override-policy.js";
import { BatchedPayoutBatch, newBatchedPayoutBatch } from "./batched-payout-batch.js";

export function summarizeFallbackPayoutNoticesForBatch(items: FallbackPayoutNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBatchedPayoutBatchesFromNotice(items: FallbackPayoutNotice[]): BatchedPayoutBatch[] {
  const out: BatchedPayoutBatch[] = [];
  for (const item of items) {
    const derived = newBatchedPayoutBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceBatchedPayoutBatch(item: BatchedPayoutBatch): string {
  return normalizePrimaryPayoutOverrideCode(item.code);
}
