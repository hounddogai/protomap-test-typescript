import { GlobalSlaPlan } from "../agreement/global-sla-plan.js";
import { pendingSlaForecastWeight } from "../agreement/pending-sla-forecast-policy.js";
import { ScheduledSlaRule, newScheduledSlaRule } from "./scheduled-sla-rule.js";

export function summarizeGlobalSlaPlansForRule(items: GlobalSlaPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveScheduledSlaRulesFromPlan(items: GlobalSlaPlan[]): ScheduledSlaRule[] {
  const out: ScheduledSlaRule[] = [];
  for (const item of items) {
    const derived = newScheduledSlaRule(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceScheduledSlaRule(item: ScheduledSlaRule): number {
  return pendingSlaForecastWeight(1, true);
}
