import { placementDraftBucket } from "../../placement/assignment/placement-draft-policy.js";
import { PlacementTier } from "../../placement/assignment/placement-tier.js";
import { CappedBidRuleQuota, newCappedBidRuleQuota } from "./capped-bid-rule-quota.js";

export function summarizePlacementTiersForQuota(items: PlacementTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveCappedBidRuleQuotasFromTier(items: PlacementTier[]): CappedBidRuleQuota[] {
  const out: CappedBidRuleQuota[] = [];
  for (const item of items) {
    const derived = newCappedBidRuleQuota(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function projectCappedBidRuleQuota(item: CappedBidRuleQuota): string {
  return placementDraftBucket(item.weightedLoad());
}
