import { AdaptivePreferenceBudget } from "../../preference/baseline/adaptive-preference-budget.js";
import { preferenceBaselineBucket } from "../../preference/baseline/preference-baseline-policy.js";
import { ProofManifest, newProofManifest } from "./proof-manifest.js";

export function summarizeAdaptivePreferenceBudgetsForManifest(items: AdaptivePreferenceBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveProofManifestsFromBudget(items: AdaptivePreferenceBudget[]): ProofManifest[] {
  const out: ProofManifest[] = [];
  for (const item of items) {
    const derived = newProofManifest(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleProofManifest(item: ProofManifest): string {
  return preferenceBaselineBucket(item.netTotal());
}
