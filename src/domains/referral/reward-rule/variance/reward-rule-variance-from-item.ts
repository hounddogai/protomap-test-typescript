import { normalizeTierItemCode } from "../../tier/notice/tier-item-policy.js";
import { TierItem } from "../../tier/notice/tier-item.js";
import { RewardRuleVariance, newRewardRuleVariance } from "./reward-rule-variance.js";

export function summarizeTierItemsForVariance(items: TierItem[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveRewardRuleVariancesFromItem(items: TierItem[]): RewardRuleVariance[] {
  const out: RewardRuleVariance[] = [];
  for (const item of items) {
    const derived = newRewardRuleVariance(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeRewardRuleVariance(item: RewardRuleVariance): string {
  return normalizeTierItemCode(item.code);
}
