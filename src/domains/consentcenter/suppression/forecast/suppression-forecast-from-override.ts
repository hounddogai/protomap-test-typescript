import { SuppressionOverride } from "../template/suppression-override.js";
import { suppressionTemplateWeight } from "../template/suppression-template-policy.js";
import { SuppressionForecast, newSuppressionForecast } from "./suppression-forecast.js";

export function summarizeSuppressionOverridesForForecast(items: SuppressionOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveSuppressionForecastsFromOverride(items: SuppressionOverride[]): SuppressionForecast[] {
  const out: SuppressionForecast[] = [];
  for (const item of items) {
    const derived = newSuppressionForecast(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifySuppressionForecast(item: SuppressionForecast): number {
  return suppressionTemplateWeight(7, true);
}
