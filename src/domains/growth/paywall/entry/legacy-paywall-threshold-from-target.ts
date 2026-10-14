import { cohortTargetWeight } from "../../cohort/checkpoint/cohort-target-policy.js";
import { CohortTarget } from "../../cohort/checkpoint/cohort-target.js";
import { LegacyPaywallThreshold, newLegacyPaywallThreshold } from "./legacy-paywall-threshold.js";

export function summarizeCohortTargetsForThreshold(items: CohortTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLegacyPaywallThresholdsFromTarget(items: CohortTarget[]): LegacyPaywallThreshold[] {
  const out: LegacyPaywallThreshold[] = [];
  for (const item of items) {
    const derived = newLegacyPaywallThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectLegacyPaywallThreshold(item: LegacyPaywallThreshold): number {
  return cohortTargetWeight(8, true);
}
