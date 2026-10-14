import { GlobalPathEstimate } from "../../path/proposal/global-path-estimate.js";
import { pendingPathProposalWeight } from "../../path/proposal/pending-path-proposal-policy.js";
import { PrimaryWindowPreference, newPrimaryWindowPreference } from "./primary-window-preference.js";

export function summarizeGlobalPathEstimatesForPreference(items: GlobalPathEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePrimaryWindowPreferencesFromEstimate(items: GlobalPathEstimate[]): PrimaryWindowPreference[] {
  const out: PrimaryWindowPreference[] = [];
  for (const item of items) {
    const derived = newPrimaryWindowPreference(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocatePrimaryWindowPreference(item: PrimaryWindowPreference): number {
  return pendingPathProposalWeight(8, true);
}
