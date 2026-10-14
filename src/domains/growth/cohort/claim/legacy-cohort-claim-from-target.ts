import { SeasonalCohortTarget } from "../cohort-template/seasonal-cohort-target.js";
import { classifyStrictCohortPlan } from "../cohort-template/strict-cohort-plan-policy.js";
import { LegacyCohortClaim, newLegacyCohortClaim } from "./legacy-cohort-claim.js";

export function summarizeSeasonalCohortTargetsForClaim(items: SeasonalCohortTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveLegacyCohortClaimsFromTarget(items: SeasonalCohortTarget[]): LegacyCohortClaim[] {
  const out: LegacyCohortClaim[] = [];
  for (const item of items) {
    const derived = newLegacyCohortClaim(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateLegacyCohortClaim(item: LegacyCohortClaim): string {
  return classifyStrictCohortPlan(item.effectiveTotal());
}
