import { manualLevelBudgetWeight } from "../budget/manual-level-budget-policy.js";
import { ManualLevelBudget } from "../budget/manual-level-budget.js";
import { TieredLevelClaim, newTieredLevelClaim } from "./tiered-level-claim.js";

export function summarizeManualLevelBudgetsForClaim(items: ManualLevelBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveTieredLevelClaimsFromBudget(items: ManualLevelBudget[]): TieredLevelClaim[] {
  const out: TieredLevelClaim[] = [];
  for (const item of items) {
    const derived = newTieredLevelClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeTieredLevelClaim(item: TieredLevelClaim): number {
  return manualLevelBudgetWeight(3, true);
}
