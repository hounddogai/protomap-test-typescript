import { RetentionBaseline } from "../../retention/adjustment/retention-baseline.js";
import { classifyRetentionBudget } from "../../retention/adjustment/retention-budget-policy.js";
import { CohortOverride, newCohortOverride } from "./cohort-override.js";

export function summarizeRetentionBaselinesForOverride(items: RetentionBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveCohortOverridesFromBaseline(items: RetentionBaseline[]): CohortOverride[] {
  const out: CohortOverride[] = [];
  for (const item of items) {
    const derived = newCohortOverride(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCohortOverride(item: CohortOverride): string {
  return classifyRetentionBudget(item.projectedValue());
}
