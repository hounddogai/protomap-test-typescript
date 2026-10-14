import { normalizeDefaultStreakRuleCode } from "../../streak/review/default-streak-rule-policy.js";
import { DefaultStreakRule } from "../../streak/review/default-streak-rule.js";
import { ChallengeSummary, newChallengeSummary } from "./challenge-summary.js";

export function summarizeDefaultStreakRulesForSummary(items: DefaultStreakRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveChallengeSummariesFromRule(items: DefaultStreakRule[]): ChallengeSummary[] {
  const out: ChallengeSummary[] = [];
  for (const item of items) {
    const derived = newChallengeSummary(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveChallengeSummary(item: ChallengeSummary): string {
  return normalizeDefaultStreakRuleCode(item.code);
}
