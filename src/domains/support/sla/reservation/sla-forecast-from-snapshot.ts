import { classifyDeflectionSnapshot } from "../../deflection/snapshot/deflection-snapshot-policy.js";
import { DeflectionSnapshot } from "../../deflection/snapshot/deflection-snapshot.js";
import { SlaForecast, newSlaForecast } from "./sla-forecast.js";

export function summarizeDeflectionSnapshotsForForecast(items: DeflectionSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveSlaForecastsFromSnapshot(items: DeflectionSnapshot[]): SlaForecast[] {
  const out: SlaForecast[] = [];
  for (const item of items) {
    const derived = newSlaForecast(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignSlaForecast(item: SlaForecast): string {
  return classifyDeflectionSnapshot(item.netLoad());
}
