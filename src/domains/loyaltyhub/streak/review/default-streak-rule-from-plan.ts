import { LevelPlan } from "../../level/plan/level-plan.js";
import { levelRuleBucket } from "../../level/plan/level-rule-policy.js";
import { DefaultStreakRule, newDefaultStreakRule } from "./default-streak-rule.js";

export function summarizeLevelPlansForRule(items: LevelPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveDefaultStreakRulesFromPlan(items: LevelPlan[]): DefaultStreakRule[] {
  const out: DefaultStreakRule[] = [];
  for (const item of items) {
    const derived = newDefaultStreakRule(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planDefaultStreakRule(item: DefaultStreakRule): string {
  return levelRuleBucket(item.effectiveValue());
}
