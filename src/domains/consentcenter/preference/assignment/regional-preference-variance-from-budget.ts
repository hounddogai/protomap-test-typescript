import { classifyAdaptiveProofDraft } from "../../proof/budget/adaptive-proof-draft-policy.js";
import { ProofBudget } from "../../proof/budget/proof-budget.js";
import { RegionalPreferenceVariance, newRegionalPreferenceVariance } from "./regional-preference-variance.js";

export function summarizeProofBudgetsForVariance(items: ProofBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRegionalPreferenceVariancesFromBudget(items: ProofBudget[]): RegionalPreferenceVariance[] {
  const out: RegionalPreferenceVariance[] = [];
  for (const item of items) {
    const derived = newRegionalPreferenceVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planRegionalPreferenceVariance(item: RegionalPreferenceVariance): string {
  return classifyAdaptiveProofDraft(item.projectedExposure());
}
