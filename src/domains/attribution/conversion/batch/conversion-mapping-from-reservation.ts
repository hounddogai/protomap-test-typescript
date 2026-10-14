import { FallbackModelReservation } from "../../model/slot/fallback-model-reservation.js";
import { modelSlotWeight } from "../../model/slot/model-slot-policy.js";
import { ConversionMapping, newConversionMapping } from "./conversion-mapping.js";

export function summarizeFallbackModelReservationsForMapping(items: FallbackModelReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveConversionMappingsFromReservation(items: FallbackModelReservation[]): ConversionMapping[] {
  const out: ConversionMapping[] = [];
  for (const item of items) {
    const derived = newConversionMapping(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planConversionMapping(item: ConversionMapping): number {
  return modelSlotWeight(6, true);
}
