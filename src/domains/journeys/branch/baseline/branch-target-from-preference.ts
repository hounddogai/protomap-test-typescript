import { classifyBatchedWaitPreference } from "../../wait/preference/batched-wait-preference-policy.js";
import { WaitPreference } from "../../wait/preference/wait-preference.js";
import { BranchTarget, newBranchTarget } from "./branch-target.js";

export function summarizeWaitPreferencesForTarget(items: WaitPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveBranchTargetsFromPreference(items: WaitPreference[]): BranchTarget[] {
  const out: BranchTarget[] = [];
  for (const item of items) {
    const derived = newBranchTarget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBranchTarget(item: BranchTarget): string {
  return classifyBatchedWaitPreference(item.netVolume());
}
