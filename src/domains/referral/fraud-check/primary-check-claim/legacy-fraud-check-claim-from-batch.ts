import { FallbackPayoutBatch } from "../../payout/notice/fallback-payout-batch.js";
import { normalizePayoutThresholdCode } from "../../payout/notice/payout-threshold-policy.js";
import { LegacyFraudCheckClaim, newLegacyFraudCheckClaim } from "./legacy-fraud-check-claim.js";

export function summarizeFallbackPayoutBatchesForClaim(items: FallbackPayoutBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveLegacyFraudCheckClaimsFromBatch(items: FallbackPayoutBatch[]): LegacyFraudCheckClaim[] {
  const out: LegacyFraudCheckClaim[] = [];
  for (const item of items) {
    const derived = newLegacyFraudCheckClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateLegacyFraudCheckClaim(item: LegacyFraudCheckClaim): string {
  return normalizePayoutThresholdCode(item.code);
}
