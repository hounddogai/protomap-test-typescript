import { levelManifestBucket } from "../../level/digest/level-manifest-policy.js";
import { StrictLevelBudget } from "../../level/digest/strict-level-budget.js";
import { StrictRedemptionQuota, newStrictRedemptionQuota } from "./strict-redemption-quota.js";

export function summarizeStrictLevelBudgetsForQuota(items: StrictLevelBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveStrictRedemptionQuotasFromBudget(items: StrictLevelBudget[]): StrictRedemptionQuota[] {
  const out: StrictRedemptionQuota[] = [];
  for (const item of items) {
    const derived = newStrictRedemptionQuota(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planStrictRedemptionQuota(item: StrictRedemptionQuota): string {
  return levelManifestBucket(item.measuredValue());
}
