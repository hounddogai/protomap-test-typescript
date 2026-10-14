import { BadgeTier } from "../../badge/plan/badge-tier.js";
import { classifyTieredBadgePlan } from "../../badge/plan/tiered-badge-plan-policy.js";
import { TieredLevelClaim, newTieredLevelClaim } from "./tiered-level-claim.js";

export function summarizeBadgeTiersForClaim(items: BadgeTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveTieredLevelClaimsFromTier(items: BadgeTier[]): TieredLevelClaim[] {
  const out: TieredLevelClaim[] = [];
  for (const item of items) {
    const derived = newTieredLevelClaim(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeTieredLevelClaim(item: TieredLevelClaim): string {
  return classifyTieredBadgePlan(item.adjustedExposure());
}
