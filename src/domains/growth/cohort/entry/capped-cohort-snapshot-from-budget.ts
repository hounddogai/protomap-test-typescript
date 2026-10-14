import { PendingCohortBudget } from "../cohort-quota/pending-cohort-budget.js";
import { normalizeTieredCohortQuotaCode } from "../cohort-quota/tiered-cohort-quota-policy.js";
import { CappedCohortSnapshot, newCappedCohortSnapshot } from "./capped-cohort-snapshot.js";

export function summarizePendingCohortBudgetsForSnapshot(items: PendingCohortBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveCappedCohortSnapshotsFromBudget(items: PendingCohortBudget[]): CappedCohortSnapshot[] {
  const out: CappedCohortSnapshot[] = [];
  for (const item of items) {
    const derived = newCappedCohortSnapshot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectCappedCohortSnapshot(item: CappedCohortSnapshot): string {
  return normalizeTieredCohortQuotaCode(item.code);
}
