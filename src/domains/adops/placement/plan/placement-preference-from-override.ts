import { classifyFlightClaim } from "../../flight/override-item/flight-claim-policy.js";
import { FlightOverride } from "../../flight/override-item/flight-override.js";
import { PlacementPreference, newPlacementPreference } from "./placement-preference.js";

export function summarizeFlightOverridesForPreference(items: FlightOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePlacementPreferencesFromOverride(items: FlightOverride[]): PlacementPreference[] {
  const out: PlacementPreference[] = [];
  for (const item of items) {
    const derived = newPlacementPreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitPlacementPreference(item: PlacementPreference): string {
  return classifyFlightClaim(item.projectedValue());
}
