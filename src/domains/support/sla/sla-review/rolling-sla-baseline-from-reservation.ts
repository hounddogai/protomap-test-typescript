import {
  classifyBatchedDeflectionReservation,
} from "../../deflection/baseline/batched-deflection-reservation-policy.js";
import { LenientDeflectionReservation } from "../../deflection/baseline/lenient-deflection-reservation.js";
import { RollingSlaBaseline, newRollingSlaBaseline } from "./rolling-sla-baseline.js";

export function summarizeLenientDeflectionReservationsForBaseline(items: LenientDeflectionReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingSlaBaselinesFromReservation(items: LenientDeflectionReservation[]): RollingSlaBaseline[] {
  const out: RollingSlaBaseline[] = [];
  for (const item of items) {
    const derived = newRollingSlaBaseline(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitRollingSlaBaseline(item: RollingSlaBaseline): string {
  return classifyBatchedDeflectionReservation(item.netTotal());
}
