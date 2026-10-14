import { FlightEntry } from "../quota/flight-entry.js";
import { flightQuotaBucket } from "../quota/flight-quota-policy.js";
import { PendingFlightMetric, newPendingFlightMetric } from "./pending-flight-metric.js";

export function summarizeFlightEntriesForMetric(items: FlightEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function derivePendingFlightMetricsFromEntry(items: FlightEntry[]): PendingFlightMetric[] {
  const out: PendingFlightMetric[] = [];
  for (const item of items) {
    const derived = newPendingFlightMetric(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settlePendingFlightMetric(item: PendingFlightMetric): string {
  return flightQuotaBucket(item.weightedLoad());
}
