import { DeflectionVariance } from "../../deflection/score/deflection-variance.js";
import { scheduledDeflectionScoreWeight } from "../../deflection/score/scheduled-deflection-score-policy.js";
import { MacroSchedule, newMacroSchedule } from "./macro-schedule.js";

export function summarizeDeflectionVariancesForSchedule(items: DeflectionVariance[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveMacroSchedulesFromVariance(items: DeflectionVariance[]): MacroSchedule[] {
  const out: MacroSchedule[] = [];
  for (const item of items) {
    const derived = newMacroSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planMacroSchedule(item: MacroSchedule): number {
  return scheduledDeflectionScoreWeight(7, true);
}
