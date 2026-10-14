import { DomainBudget } from "../../domain/budget/domain-budget.js";
import { classifyLegacyDomainBatch } from "../../domain/budget/legacy-domain-batch-policy.js";
import { ReputationOverride, newReputationOverride } from "./reputation-override.js";

export function summarizeDomainBudgetsForOverride(items: DomainBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveReputationOverridesFromBudget(items: DomainBudget[]): ReputationOverride[] {
  const out: ReputationOverride[] = [];
  for (const item of items) {
    const derived = newReputationOverride(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileReputationOverride(item: ReputationOverride): string {
  return classifyLegacyDomainBatch(item.effectiveExposure());
}
