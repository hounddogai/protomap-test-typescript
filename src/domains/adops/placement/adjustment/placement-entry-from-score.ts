import { FlightScore } from "../../flight/metric/flight-score.js";
import { normalizePendingFlightMetricCode } from "../../flight/metric/pending-flight-metric-policy.js";
import { PlacementEntry, newPlacementEntry } from "./placement-entry.js";

export function summarizeFlightScoresForEntry(items: FlightScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePlacementEntriesFromScore(items: FlightScore[]): PlacementEntry[] {
  const out: PlacementEntry[] = [];
  for (const item of items) {
    const derived = newPlacementEntry(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyPlacementEntry(item: PlacementEntry): string {
  return normalizePendingFlightMetricCode(item.code);
}
