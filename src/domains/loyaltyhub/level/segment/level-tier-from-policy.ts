import { RedemptionPolicy } from "../../redemption/redemption-summary/redemption-policy.js";
import {
  seasonalRedemptionSummaryBucket,
} from "../../redemption/redemption-summary/seasonal-redemption-summary-policy.js";
import { LevelTier, newLevelTier } from "./level-tier.js";

export function summarizeRedemptionPoliciesForTier(items: RedemptionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLevelTiersFromPolicy(items: RedemptionPolicy[]): LevelTier[] {
  const out: LevelTier[] = [];
  for (const item of items) {
    const derived = newLevelTier(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceLevelTier(item: LevelTier): string {
  return seasonalRedemptionSummaryBucket(item.weightedLoad());
}
