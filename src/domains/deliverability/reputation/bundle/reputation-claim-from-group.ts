import { warmupGroupBucket } from "../../warmup/allocation/warmup-group-policy.js";
import { WarmupGroup } from "../../warmup/allocation/warmup-group.js";
import { ReputationClaim, newReputationClaim } from "./reputation-claim.js";

export function summarizeWarmupGroupsForClaim(items: WarmupGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveReputationClaimsFromGroup(items: WarmupGroup[]): ReputationClaim[] {
  const out: ReputationClaim[] = [];
  for (const item of items) {
    const derived = newReputationClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchReputationClaim(item: ReputationClaim): string {
  return warmupGroupBucket(item.adjustedExposure());
}
