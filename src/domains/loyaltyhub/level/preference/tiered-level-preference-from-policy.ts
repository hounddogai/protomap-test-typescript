import { PendingRedemptionPolicy } from "../../redemption/policy/pending-redemption-policy.js";
import { tieredRedemptionGroupWeight } from "../../redemption/policy/tiered-redemption-group-policy.js";
import { TieredLevelPreference, newTieredLevelPreference } from "./tiered-level-preference.js";

export function summarizePendingRedemptionPoliciesForPreference(items: PendingRedemptionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveTieredLevelPreferencesFromPolicy(items: PendingRedemptionPolicy[]): TieredLevelPreference[] {
  const out: TieredLevelPreference[] = [];
  for (const item of items) {
    const derived = newTieredLevelPreference(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectTieredLevelPreference(item: TieredLevelPreference): number {
  return tieredRedemptionGroupWeight(7, true);
}
