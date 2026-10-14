import { LenientCohortSnapshot } from "../snapshot/lenient-cohort-snapshot.js";
import { rollingCohortExceptionBucket } from "../snapshot/rolling-cohort-exception-policy.js";
import { CohortBudget, newCohortBudget } from "./cohort-budget.js";

export function summarizeLenientCohortSnapshotsForBudget(items: LenientCohortSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveCohortBudgetsFromSnapshot(items: LenientCohortSnapshot[]): CohortBudget[] {
  const out: CohortBudget[] = [];
  for (const item of items) {
    const derived = newCohortBudget(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveCohortBudget(item: CohortBudget): string {
  return rollingCohortExceptionBucket(item.effectiveTotal());
}
