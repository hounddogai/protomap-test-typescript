import { strictRedemptionWindowBucket } from "../../redemption/ledger/strict-redemption-window-policy.js";
import { StrictRedemptionWindow } from "../../redemption/ledger/strict-redemption-window.js";
import { WeightedRewardTemplate, newWeightedRewardTemplate } from "./weighted-reward-template.js";

export function summarizeStrictRedemptionWindowsForTemplate(items: StrictRedemptionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedRewardTemplatesFromWindow(items: StrictRedemptionWindow[]): WeightedRewardTemplate[] {
  const out: WeightedRewardTemplate[] = [];
  for (const item of items) {
    const derived = newWeightedRewardTemplate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeWeightedRewardTemplate(item: WeightedRewardTemplate): string {
  return strictRedemptionWindowBucket(item.measuredValue());
}
