import { fraudCheckProposalBucket } from "../proposal/fraud-check-proposal-policy.js";
import { TieredFraudCheckCheckpoint } from "../proposal/tiered-fraud-check-checkpoint.js";
import { FallbackFraudCheckClaim, newFallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

export function summarizeTieredFraudCheckCheckpointsForClaim(items: TieredFraudCheckCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveFallbackFraudCheckClaimsFromCheckpoint(items: TieredFraudCheckCheckpoint[]): FallbackFraudCheckClaim[] {
  const out: FallbackFraudCheckClaim[] = [];
  for (const item of items) {
    const derived = newFallbackFraudCheckClaim(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateFallbackFraudCheckClaim(item: FallbackFraudCheckClaim): string {
  return fraudCheckProposalBucket(item.measuredValue());
}
