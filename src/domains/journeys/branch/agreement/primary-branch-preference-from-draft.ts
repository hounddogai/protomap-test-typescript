import { exitRuleWindowBucket } from "../../exit-rule/window/exit-rule-window-policy.js";
import { ManualExitRuleDraft } from "../../exit-rule/window/manual-exit-rule-draft.js";
import { PrimaryBranchPreference, newPrimaryBranchPreference } from "./primary-branch-preference.js";

export function summarizeManualExitRuleDraftsForPreference(items: ManualExitRuleDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function derivePrimaryBranchPreferencesFromDraft(items: ManualExitRuleDraft[]): PrimaryBranchPreference[] {
  const out: PrimaryBranchPreference[] = [];
  for (const item of items) {
    const derived = newPrimaryBranchPreference(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergePrimaryBranchPreference(item: PrimaryBranchPreference): string {
  return exitRuleWindowBucket(item.weightedValue());
}
