import { LenientReputationAssignment } from "../../reputation/exception/lenient-reputation-assignment.js";
import { reputationMappingBucket } from "../../reputation/exception/reputation-mapping-policy.js";
import { TieredWarmupClaim, newTieredWarmupClaim } from "./tiered-warmup-claim.js";

export function summarizeLenientReputationAssignmentsForClaim(items: LenientReputationAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveTieredWarmupClaimsFromAssignment(items: LenientReputationAssignment[]): TieredWarmupClaim[] {
  const out: TieredWarmupClaim[] = [];
  for (const item of items) {
    const derived = newTieredWarmupClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeTieredWarmupClaim(item: TieredWarmupClaim): string {
  return reputationMappingBucket(item.effectiveExposure());
}
