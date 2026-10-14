import { primarySlaReservationWeight } from "../../sla/sla-reservation/primary-sla-reservation-policy.js";
import { SlaBatch } from "../../sla/sla-reservation/sla-batch.js";
import { DeflectionVariance, newDeflectionVariance } from "./deflection-variance.js";

export function summarizeSlaBatchesForVariance(items: SlaBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDeflectionVariancesFromBatch(items: SlaBatch[]): DeflectionVariance[] {
  const out: DeflectionVariance[] = [];
  for (const item of items) {
    const derived = newDeflectionVariance(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyDeflectionVariance(item: DeflectionVariance): number {
  return primarySlaReservationWeight(1, true);
}
