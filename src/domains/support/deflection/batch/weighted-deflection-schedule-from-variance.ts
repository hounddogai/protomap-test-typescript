import { classifyMacroScore } from "../../macro/score/macro-score-policy.js";
import { RegionalMacroVariance } from "../../macro/score/regional-macro-variance.js";
import { WeightedDeflectionSchedule, newWeightedDeflectionSchedule } from "./weighted-deflection-schedule.js";

export function summarizeRegionalMacroVariancesForSchedule(items: RegionalMacroVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveWeightedDeflectionSchedulesFromVariance(items: RegionalMacroVariance[]): WeightedDeflectionSchedule[] {
  const out: WeightedDeflectionSchedule[] = [];
  for (const item of items) {
    const derived = newWeightedDeflectionSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignWeightedDeflectionSchedule(item: WeightedDeflectionSchedule): string {
  return classifyMacroScore(item.adjustedLoad());
}
