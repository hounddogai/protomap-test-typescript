import { tieredLevelClaimWeight } from "../level-claim/tiered-level-claim-policy.js";
import { TieredLevelClaim } from "../level-claim/tiered-level-claim.js";
import { LevelBundle, newLevelBundle } from "./level-bundle.js";

export function summarizeTieredLevelClaimsForBundle(items: TieredLevelClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveLevelBundlesFromClaim(items: TieredLevelClaim[]): LevelBundle[] {
  const out: LevelBundle[] = [];
  for (const item of items) {
    const derived = newLevelBundle(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectLevelBundle(item: LevelBundle): number {
  return tieredLevelClaimWeight(3, true);
}
