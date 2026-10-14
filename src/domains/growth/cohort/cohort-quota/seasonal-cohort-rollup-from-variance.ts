import { ManualPaywallVariance } from "../../paywall/policy/manual-paywall-variance.js";
import { paywallScoreWeight } from "../../paywall/policy/paywall-score-policy.js";
import { SeasonalCohortRollup, newSeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

export function summarizeManualPaywallVariancesForRollup(items: ManualPaywallVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveSeasonalCohortRollupsFromVariance(items: ManualPaywallVariance[]): SeasonalCohortRollup[] {
  const out: SeasonalCohortRollup[] = [];
  for (const item of items) {
    const derived = newSeasonalCohortRollup(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreSeasonalCohortRollup(item: SeasonalCohortRollup): number {
  return paywallScoreWeight(3, true);
}
