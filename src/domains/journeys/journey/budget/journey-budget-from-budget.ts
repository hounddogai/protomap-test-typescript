import { classifyPrimaryStepForecast } from "../../step/budget/primary-step-forecast-policy.js";
import { StepBudget } from "../../step/budget/step-budget.js";
import { JourneyBudget, newJourneyBudget } from "./journey-budget.js";

export function summarizeStepBudgetsForBudget(items: StepBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveJourneyBudgetsFromBudget(items: StepBudget[]): JourneyBudget[] {
  const out: JourneyBudget[] = [];
  for (const item of items) {
    const derived = newJourneyBudget(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyJourneyBudget(item: JourneyBudget): string {
  return classifyPrimaryStepForecast(item.weightedTotal());
}
