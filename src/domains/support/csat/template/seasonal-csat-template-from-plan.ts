import { GlobalSlaPlan } from "../../sla/agreement/global-sla-plan.js";
import { pendingSlaForecastWeight } from "../../sla/agreement/pending-sla-forecast-policy.js";
import { SeasonalCsatTemplate, newSeasonalCsatTemplate } from "./seasonal-csat-template.js";

export function summarizeGlobalSlaPlansForTemplate(items: GlobalSlaPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveSeasonalCsatTemplatesFromPlan(items: GlobalSlaPlan[]): SeasonalCsatTemplate[] {
  const out: SeasonalCsatTemplate[] = [];
  for (const item of items) {
    const derived = newSeasonalCsatTemplate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applySeasonalCsatTemplate(item: SeasonalCsatTemplate): number {
  return pendingSlaForecastWeight(8, true);
}
