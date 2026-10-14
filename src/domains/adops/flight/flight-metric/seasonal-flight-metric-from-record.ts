import { CreativeRecord } from "../../creative/override-item/creative-record.js";
import { classifyRegionalCreativeEntry } from "../../creative/override-item/regional-creative-entry-policy.js";
import { SeasonalFlightMetric, newSeasonalFlightMetric } from "./seasonal-flight-metric.js";

export function summarizeCreativeRecordsForMetric(items: CreativeRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveSeasonalFlightMetricsFromRecord(items: CreativeRecord[]): SeasonalFlightMetric[] {
  const out: SeasonalFlightMetric[] = [];
  for (const item of items) {
    const derived = newSeasonalFlightMetric(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitSeasonalFlightMetric(item: SeasonalFlightMetric): string {
  return classifyRegionalCreativeEntry(item.projectedExposure());
}
