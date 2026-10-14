import { journeyRuleWeight } from "../../journey/assignment/journey-rule-policy.js";
import { JourneyRule } from "../../journey/assignment/journey-rule.js";
import { BranchMetric, newBranchMetric } from "./branch-metric.js";

export function summarizeJourneyRulesForMetric(items: JourneyRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveBranchMetricsFromRule(items: JourneyRule[]): BranchMetric[] {
  const out: BranchMetric[] = [];
  for (const item of items) {
    const derived = newBranchMetric(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveBranchMetric(item: BranchMetric): number {
  return journeyRuleWeight(5, true);
}
