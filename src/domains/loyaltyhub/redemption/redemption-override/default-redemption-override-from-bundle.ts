import { ManualChallengeBundle } from "../../challenge/seasonal-challenge-override/manual-challenge-bundle.js";
import {
  tieredChallengeOverrideWeight,
} from "../../challenge/seasonal-challenge-override/tiered-challenge-override-policy.js";
import { DefaultRedemptionOverride, newDefaultRedemptionOverride } from "./default-redemption-override.js";

export function summarizeManualChallengeBundlesForOverride(items: ManualChallengeBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveDefaultRedemptionOverridesFromBundle(items: ManualChallengeBundle[]): DefaultRedemptionOverride[] {
  const out: DefaultRedemptionOverride[] = [];
  for (const item of items) {
    const derived = newDefaultRedemptionOverride(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeDefaultRedemptionOverride(item: DefaultRedemptionOverride): number {
  return tieredChallengeOverrideWeight(4, true);
}
