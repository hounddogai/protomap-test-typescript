import { CappedRedemptionWindow } from "../../redemption/tier/capped-redemption-window.js";
import { normalizeLenientRedemptionTierCode } from "../../redemption/tier/lenient-redemption-tier-policy.js";
import { RewardAdjustment, newRewardAdjustment } from "./reward-adjustment.js";

export function summarizeCappedRedemptionWindowsForAdjustment(items: CappedRedemptionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveRewardAdjustmentsFromWindow(items: CappedRedemptionWindow[]): RewardAdjustment[] {
  const out: RewardAdjustment[] = [];
  for (const item of items) {
    const derived = newRewardAdjustment(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRewardAdjustment(item: RewardAdjustment): string {
  return normalizeLenientRedemptionTierCode(item.code);
}
