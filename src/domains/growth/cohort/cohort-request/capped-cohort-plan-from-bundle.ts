import { normalizeNudgeBundleCode } from "../../nudge/nudge-draft/nudge-bundle-policy.js";
import { NudgeBundle } from "../../nudge/nudge-draft/nudge-bundle.js";
import { CappedCohortPlan, newCappedCohortPlan } from "./capped-cohort-plan.js";

export function summarizeNudgeBundlesForPlan(items: NudgeBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveCappedCohortPlansFromBundle(items: NudgeBundle[]): CappedCohortPlan[] {
  const out: CappedCohortPlan[] = [];
  for (const item of items) {
    const derived = newCappedCohortPlan(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeCappedCohortPlan(item: CappedCohortPlan): string {
  return normalizeNudgeBundleCode(item.code);
}
