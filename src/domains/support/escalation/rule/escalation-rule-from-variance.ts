import { weightedCsatVarianceWeight } from "../../csat/capped-csat-schedule/weighted-csat-variance-policy.js";
import { WeightedCsatVariance } from "../../csat/capped-csat-schedule/weighted-csat-variance.js";
import { EscalationRule, newEscalationRule } from "./escalation-rule.js";

export function summarizeWeightedCsatVariancesForRule(items: WeightedCsatVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveEscalationRulesFromVariance(items: WeightedCsatVariance[]): EscalationRule[] {
  const out: EscalationRule[] = [];
  for (const item of items) {
    const derived = newEscalationRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveEscalationRule(item: EscalationRule): number {
  return weightedCsatVarianceWeight(2, true);
}
