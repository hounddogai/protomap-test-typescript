import { ExitRuleAgreement } from "../../exit-rule/budget/exit-rule-agreement.js";
import { exitRuleBudgetBucket } from "../../exit-rule/budget/exit-rule-budget-policy.js";
import { StepWindow, newStepWindow } from "./step-window.js";

export function summarizeExitRuleAgreementsForWindow(items: ExitRuleAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveStepWindowsFromAgreement(items: ExitRuleAgreement[]): StepWindow[] {
  const out: StepWindow[] = [];
  for (const item of items) {
    const derived = newStepWindow(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateStepWindow(item: StepWindow): string {
  return exitRuleBudgetBucket(item.effectiveExposure());
}
