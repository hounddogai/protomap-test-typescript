import { normalizeCappedFlightGroupCode } from "../../flight/flight-group/capped-flight-group-policy.js";
import { CappedFlightGroup } from "../../flight/flight-group/capped-flight-group.js";
import { TieredPacingRequest, newTieredPacingRequest } from "./tiered-pacing-request.js";

export function summarizeCappedFlightGroupsForRequest(items: CappedFlightGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveTieredPacingRequestsFromGroup(items: CappedFlightGroup[]): TieredPacingRequest[] {
  const out: TieredPacingRequest[] = [];
  for (const item of items) {
    const derived = newTieredPacingRequest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computeTieredPacingRequest(item: TieredPacingRequest): string {
  return normalizeCappedFlightGroupCode(item.code);
}
