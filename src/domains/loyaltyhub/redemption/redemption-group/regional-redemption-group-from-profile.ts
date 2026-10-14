import { manualBadgeMilestoneWeight } from "../../badge/weighted-badge-profile/manual-badge-milestone-policy.js";
import { TieredBadgeProfile } from "../../badge/weighted-badge-profile/tiered-badge-profile.js";
import { RegionalRedemptionGroup, newRegionalRedemptionGroup } from "./regional-redemption-group.js";

export function summarizeTieredBadgeProfilesForGroup(items: TieredBadgeProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveRegionalRedemptionGroupsFromProfile(items: TieredBadgeProfile[]): RegionalRedemptionGroup[] {
  const out: RegionalRedemptionGroup[] = [];
  for (const item of items) {
    const derived = newRegionalRedemptionGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitRegionalRedemptionGroup(item: RegionalRedemptionGroup): number {
  return manualBadgeMilestoneWeight(1, true);
}
