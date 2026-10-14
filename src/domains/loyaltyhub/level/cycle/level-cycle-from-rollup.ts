import { classifyRedemptionQuota } from "../../redemption/quota/redemption-quota-policy.js";
import { RedemptionRollup } from "../../redemption/quota/redemption-rollup.js";
import { LevelCycle, newLevelCycle } from "./level-cycle.js";

export function summarizeRedemptionRollupsForCycle(items: RedemptionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveLevelCyclesFromRollup(items: RedemptionRollup[]): LevelCycle[] {
  const out: LevelCycle[] = [];
  for (const item of items) {
    const derived = newLevelCycle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeLevelCycle(item: LevelCycle): string {
  return classifyRedemptionQuota(item.weightedTotal());
}
