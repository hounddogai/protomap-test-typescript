import { adaptiveExitRuleProfileWeight } from "../../exit-rule/rule-proposal/adaptive-exit-rule-profile-policy.js";
import { StrictExitRuleItem } from "../../exit-rule/rule-proposal/strict-exit-rule-item.js";
import { StepScore, newStepScore } from "./step-score.js";

export function summarizeStrictExitRuleItemsForScore(items: StrictExitRuleItem[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveStepScoresFromItem(items: StrictExitRuleItem[]): StepScore[] {
  const out: StepScore[] = [];
  for (const item of items) {
    const derived = newStepScore(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreStepScore(item: StepScore): number {
  return adaptiveExitRuleProfileWeight(8, true);
}
