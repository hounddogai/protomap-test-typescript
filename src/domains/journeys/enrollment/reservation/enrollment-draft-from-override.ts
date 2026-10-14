import { ExitRuleOverride } from "../../exit-rule/proposal/exit-rule-override.js";
import { globalExitRuleAllocationWeight } from "../../exit-rule/proposal/global-exit-rule-allocation-policy.js";
import { EnrollmentDraft, newEnrollmentDraft } from "./enrollment-draft.js";

export function summarizeExitRuleOverridesForDraft(items: ExitRuleOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveEnrollmentDraftsFromOverride(items: ExitRuleOverride[]): EnrollmentDraft[] {
  const out: EnrollmentDraft[] = [];
  for (const item of items) {
    const derived = newEnrollmentDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyEnrollmentDraft(item: EnrollmentDraft): number {
  return globalExitRuleAllocationWeight(4, true);
}
