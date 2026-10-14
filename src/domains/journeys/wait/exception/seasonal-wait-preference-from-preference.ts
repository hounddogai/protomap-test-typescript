import { classifyBatchedBranchAgreement } from "../../branch/agreement/batched-branch-agreement-policy.js";
import { PrimaryBranchPreference } from "../../branch/agreement/primary-branch-preference.js";
import { SeasonalWaitPreference, newSeasonalWaitPreference } from "./seasonal-wait-preference.js";

export function summarizePrimaryBranchPreferencesForPreference(items: PrimaryBranchPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveSeasonalWaitPreferencesFromPreference(items: PrimaryBranchPreference[]): SeasonalWaitPreference[] {
  const out: SeasonalWaitPreference[] = [];
  for (const item of items) {
    const derived = newSeasonalWaitPreference(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreSeasonalWaitPreference(item: SeasonalWaitPreference): string {
  return classifyBatchedBranchAgreement(item.effectiveTotal());
}
