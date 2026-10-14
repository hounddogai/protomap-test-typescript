import {
  manualConversionReservationWeight,
} from "../../conversion/reservation/manual-conversion-reservation-policy.js";
import { ManualConversionReservation } from "../../conversion/reservation/manual-conversion-reservation.js";
import { PathMapping, newPathMapping } from "./path-mapping.js";

export function summarizeManualConversionReservationsForMapping(items: ManualConversionReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function derivePathMappingsFromReservation(items: ManualConversionReservation[]): PathMapping[] {
  const out: PathMapping[] = [];
  for (const item of items) {
    const derived = newPathMapping(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function computePathMapping(item: PathMapping): number {
  return manualConversionReservationWeight(3, true);
}
