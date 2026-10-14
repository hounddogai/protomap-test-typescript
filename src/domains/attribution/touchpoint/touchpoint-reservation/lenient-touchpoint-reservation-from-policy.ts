import { classifyPathQuota } from "../../path/quota/path-quota-policy.js";
import { RegionalPathPolicy } from "../../path/quota/regional-path-policy.js";
import { LenientTouchpointReservation, newLenientTouchpointReservation } from "./lenient-touchpoint-reservation.js";

export function summarizeRegionalPathPoliciesForReservation(items: RegionalPathPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveLenientTouchpointReservationsFromPolicy(items: RegionalPathPolicy[]): LenientTouchpointReservation[] {
  const out: LenientTouchpointReservation[] = [];
  for (const item of items) {
    const derived = newLenientTouchpointReservation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectLenientTouchpointReservation(item: LenientTouchpointReservation): string {
  return classifyPathQuota(item.effectiveValue());
}
