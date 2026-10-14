import { FlightClaim } from "../../flight/override-item/flight-claim.js";
import { classifyFlightOverride } from "../../flight/override-item/flight-override-policy.js";
import { PacingSlot, newPacingSlot } from "./pacing-slot.js";

export function summarizeFlightClaimsForSlot(items: FlightClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function derivePacingSlotsFromClaim(items: FlightClaim[]): PacingSlot[] {
  const out: PacingSlot[] = [];
  for (const item of items) {
    const derived = newPacingSlot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankPacingSlot(item: PacingSlot): string {
  return classifyFlightOverride(item.netTotal());
}
