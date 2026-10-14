import {
  adaptiveRedemptionSummaryWeight,
} from "../../redemption/redemption-variance/adaptive-redemption-summary-policy.js";
import { RollingRedemptionVariance } from "../../redemption/redemption-variance/rolling-redemption-variance.js";
import { TieredChallengeOverride, newTieredChallengeOverride } from "./tiered-challenge-override.js";

export function summarizeRollingRedemptionVariancesForOverride(items: RollingRedemptionVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredChallengeOverridesFromVariance(items: RollingRedemptionVariance[]): TieredChallengeOverride[] {
  const out: TieredChallengeOverride[] = [];
  for (const item of items) {
    const derived = newTieredChallengeOverride(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function rankTieredChallengeOverride(item: TieredChallengeOverride): number {
  return adaptiveRedemptionSummaryWeight(7, true);
}
