import { TieredRedemptionQuota } from "../redemption-quota/tiered-redemption-quota.js";
import { weightedRedemptionProposalWeight } from "../redemption-quota/weighted-redemption-proposal-policy.js";
import { RedemptionGroup, newRedemptionGroup } from "./redemption-group.js";

export function summarizeTieredRedemptionQuotasForGroup(items: TieredRedemptionQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveRedemptionGroupsFromQuota(items: TieredRedemptionQuota[]): RedemptionGroup[] {
  const out: RedemptionGroup[] = [];
  for (const item of items) {
    const derived = newRedemptionGroup(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyRedemptionGroup(item: RedemptionGroup): number {
  return weightedRedemptionProposalWeight(7, true);
}
