import { modelAllocationBucket } from "../../model/allocation/model-allocation-policy.js";
import { ModelAllocation } from "../../model/allocation/model-allocation.js";
import { ScheduledPathForecast, newScheduledPathForecast } from "./scheduled-path-forecast.js";

export function summarizeModelAllocationsForForecast(items: ModelAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveScheduledPathForecastsFromAllocation(items: ModelAllocation[]): ScheduledPathForecast[] {
  const out: ScheduledPathForecast[] = [];
  for (const item of items) {
    const derived = newScheduledPathForecast(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitScheduledPathForecast(item: ScheduledPathForecast): string {
  return modelAllocationBucket(item.measuredValue());
}
