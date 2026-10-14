import { BadgeGroup } from "../../badge/allocation/badge-group.js";
import { strictBadgeAllocationBucket } from "../../badge/allocation/strict-badge-allocation-policy.js";
import { RedemptionTier, newRedemptionTier } from "./redemption-tier.js";

export function summarizeBadgeGroupsForTier(items: BadgeGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveRedemptionTiersFromGroup(items: BadgeGroup[]): RedemptionTier[] {
  const out: RedemptionTier[] = [];
  for (const item of items) {
    const derived = newRedemptionTier(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function settleRedemptionTier(item: RedemptionTier): string {
  return strictBadgeAllocationBucket(item.effectiveTotal());
}
