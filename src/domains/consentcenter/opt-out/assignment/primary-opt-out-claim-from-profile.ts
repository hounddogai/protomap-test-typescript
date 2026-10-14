import { optOutSegmentWeight } from "../review/opt-out-segment-policy.js";
import { WeightedOptOutProfile } from "../review/weighted-opt-out-profile.js";
import { PrimaryOptOutClaim, newPrimaryOptOutClaim } from "./primary-opt-out-claim.js";

export function summarizeWeightedOptOutProfilesForClaim(items: WeightedOptOutProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePrimaryOptOutClaimsFromProfile(items: WeightedOptOutProfile[]): PrimaryOptOutClaim[] {
  const out: PrimaryOptOutClaim[] = [];
  for (const item of items) {
    const derived = newPrimaryOptOutClaim(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computePrimaryOptOutClaim(item: PrimaryOptOutClaim): number {
  return optOutSegmentWeight(1, true);
}
