import { flightQuotaBucket } from "../../flight/quota/flight-quota-policy.js";
import { FlightQuota } from "../../flight/quota/flight-quota.js";
import { PlacementException, newPlacementException } from "./placement-exception.js";

export function summarizeFlightQuotasForException(items: FlightQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePlacementExceptionsFromQuota(items: FlightQuota[]): PlacementException[] {
  const out: PlacementException[] = [];
  for (const item of items) {
    const derived = newPlacementException(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePlacementException(item: PlacementException): string {
  return flightQuotaBucket(item.effectiveTotal());
}
