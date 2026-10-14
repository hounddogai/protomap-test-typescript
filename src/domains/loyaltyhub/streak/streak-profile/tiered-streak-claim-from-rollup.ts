import { LevelRollup } from "../../level/ledger/level-rollup.js";
import { normalizeLevelTemplateCode } from "../../level/ledger/level-template-policy.js";
import { TieredStreakClaim, newTieredStreakClaim } from "./tiered-streak-claim.js";

export function summarizeLevelRollupsForClaim(items: LevelRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveTieredStreakClaimsFromRollup(items: LevelRollup[]): TieredStreakClaim[] {
  const out: TieredStreakClaim[] = [];
  for (const item of items) {
    const derived = newTieredStreakClaim(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveTieredStreakClaim(item: TieredStreakClaim): string {
  return normalizeLevelTemplateCode(item.code);
}
