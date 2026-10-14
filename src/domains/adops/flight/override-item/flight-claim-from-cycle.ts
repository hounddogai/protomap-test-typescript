import { normalizeAdaptiveCreativeCycleCode } from "../../creative/cycle/adaptive-creative-cycle-policy.js";
import { AdaptiveCreativeCycle } from "../../creative/cycle/adaptive-creative-cycle.js";
import { FlightClaim, newFlightClaim } from "./flight-claim.js";

export function summarizeAdaptiveCreativeCyclesForClaim(items: AdaptiveCreativeCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveFlightClaimsFromCycle(items: AdaptiveCreativeCycle[]): FlightClaim[] {
  const out: FlightClaim[] = [];
  for (const item of items) {
    const derived = newFlightClaim(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function projectFlightClaim(item: FlightClaim): string {
  return normalizeAdaptiveCreativeCycleCode(item.code);
}
