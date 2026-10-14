import { classifyPrimaryBranchPreference } from "../../branch/agreement/primary-branch-preference-policy.js";
import { PrimaryBranchPreference } from "../../branch/agreement/primary-branch-preference.js";
import { StepException, newStepException } from "./step-exception.js";

export function summarizePrimaryBranchPreferencesForException(items: PrimaryBranchPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveStepExceptionsFromPreference(items: PrimaryBranchPreference[]): StepException[] {
  const out: StepException[] = [];
  for (const item of items) {
    const derived = newStepException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceStepException(item: StepException): string {
  return classifyPrimaryBranchPreference(item.weightedTotal());
}
