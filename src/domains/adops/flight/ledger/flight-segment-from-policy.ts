import { normalizePlacementManifestCode } from "../../placement/policy/placement-manifest-policy.js";
import { PlacementPolicy } from "../../placement/policy/placement-policy.js";
import { FlightSegment, newFlightSegment } from "./flight-segment.js";

export function summarizePlacementPoliciesForSegment(items: PlacementPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveFlightSegmentsFromPolicy(items: PlacementPolicy[]): FlightSegment[] {
  const out: FlightSegment[] = [];
  for (const item of items) {
    const derived = newFlightSegment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreFlightSegment(item: FlightSegment): string {
  return normalizePlacementManifestCode(item.code);
}
