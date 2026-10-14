import { exitRuleMilestoneWeight } from "../../exit-rule/digest/exit-rule-milestone-policy.js";
import { ExitRuleTarget } from "../../exit-rule/digest/exit-rule-target.js";
import { EnrollmentTarget, newEnrollmentTarget } from "./enrollment-target.js";

export function summarizeExitRuleTargetsForTarget(items: ExitRuleTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveEnrollmentTargetsFromTarget(items: ExitRuleTarget[]): EnrollmentTarget[] {
  const out: EnrollmentTarget[] = [];
  for (const item of items) {
    const derived = newEnrollmentTarget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeEnrollmentTarget(item: EnrollmentTarget): number {
  return exitRuleMilestoneWeight(1, true);
}
