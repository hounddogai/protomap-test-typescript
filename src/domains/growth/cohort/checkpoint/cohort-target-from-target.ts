import { funnelTargetWeight } from "../../funnel/rule/funnel-target-policy.js";
import { FunnelTarget } from "../../funnel/rule/funnel-target.js";
import { CohortTarget, newCohortTarget } from "./cohort-target.js";

export function summarizeFunnelTargetsForTarget(items: FunnelTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCohortTargetsFromTarget(items: FunnelTarget[]): CohortTarget[] {
  const out: CohortTarget[] = [];
  for (const item of items) {
    const derived = newCohortTarget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchCohortTarget(item: CohortTarget): number {
  return funnelTargetWeight(3, true);
}
