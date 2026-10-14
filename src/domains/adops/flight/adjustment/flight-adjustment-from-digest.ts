import { normalizeDefaultFlightOverrideCode } from "../digest/default-flight-override-policy.js";
import { FlightDigest } from "../digest/flight-digest.js";
import { FlightAdjustment, newFlightAdjustment } from "./flight-adjustment.js";

export function summarizeFlightDigestsForAdjustment(items: FlightDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveFlightAdjustmentsFromDigest(items: FlightDigest[]): FlightAdjustment[] {
  const out: FlightAdjustment[] = [];
  for (const item of items) {
    const derived = newFlightAdjustment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveFlightAdjustment(item: FlightAdjustment): string {
  return normalizeDefaultFlightOverrideCode(item.code);
}
