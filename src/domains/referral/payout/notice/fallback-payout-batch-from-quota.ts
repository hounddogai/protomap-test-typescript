import { PayoutQuota } from "../record-item/payout-quota.js";
import { normalizePrimaryPayoutRecordCode } from "../record-item/primary-payout-record-policy.js";
import { FallbackPayoutBatch, newFallbackPayoutBatch } from "./fallback-payout-batch.js";

export function summarizePayoutQuotasForBatch(items: PayoutQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveFallbackPayoutBatchesFromQuota(items: PayoutQuota[]): FallbackPayoutBatch[] {
  const out: FallbackPayoutBatch[] = [];
  for (const item of items) {
    const derived = newFallbackPayoutBatch(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchFallbackPayoutBatch(item: FallbackPayoutBatch): string {
  return normalizePrimaryPayoutRecordCode(item.code);
}
