import { fraudCheckScoreWeight } from "../../fraud-check/check-plan/fraud-check-score-policy.js";
import { FraudCheckScore } from "../../fraud-check/check-plan/fraud-check-score.js";
import { TierVariance, newTierVariance } from "./tier-variance.js";

export function summarizeFraudCheckScoresForVariance(items: FraudCheckScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveTierVariancesFromScore(items: FraudCheckScore[]): TierVariance[] {
  const out: TierVariance[] = [];
  for (const item of items) {
    const derived = newTierVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchTierVariance(item: TierVariance): number {
  return fraudCheckScoreWeight(2, true);
}
