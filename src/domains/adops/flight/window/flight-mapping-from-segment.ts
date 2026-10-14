import { FlightSegment } from "../ledger/flight-segment.js";
import { rollingFlightMetricWeight } from "../ledger/rolling-flight-metric-policy.js";
import { FlightMapping, newFlightMapping } from "./flight-mapping.js";

export function summarizeFlightSegmentsForMapping(items: FlightSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveFlightMappingsFromSegment(items: FlightSegment[]): FlightMapping[] {
  const out: FlightMapping[] = [];
  for (const item of items) {
    const derived = newFlightMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeFlightMapping(item: FlightMapping): number {
  return rollingFlightMetricWeight(2, true);
}
