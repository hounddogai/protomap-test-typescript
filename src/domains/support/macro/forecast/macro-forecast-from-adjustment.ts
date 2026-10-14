import { SlaAdjustment } from "../../sla/schedule/sla-adjustment.js";
import { slaScheduleWeight } from "../../sla/schedule/sla-schedule-policy.js";
import { MacroForecast, newMacroForecast } from "./macro-forecast.js";

export function summarizeSlaAdjustmentsForForecast(items: SlaAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveMacroForecastsFromAdjustment(items: SlaAdjustment[]): MacroForecast[] {
  const out: MacroForecast[] = [];
  for (const item of items) {
    const derived = newMacroForecast(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveMacroForecast(item: MacroForecast): number {
  return slaScheduleWeight(7, true);
}
