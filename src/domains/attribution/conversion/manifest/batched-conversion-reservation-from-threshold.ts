import { normalizeCreditThresholdCode } from "../../credit/threshold/credit-threshold-policy.js";
import { CreditThreshold } from "../../credit/threshold/credit-threshold.js";
import { BatchedConversionReservation, newBatchedConversionReservation } from "./batched-conversion-reservation.js";

export function summarizeCreditThresholdsForReservation(items: CreditThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveBatchedConversionReservationsFromThreshold(items: CreditThreshold[]): BatchedConversionReservation[] {
  const out: BatchedConversionReservation[] = [];
  for (const item of items) {
    const derived = newBatchedConversionReservation(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyBatchedConversionReservation(item: BatchedConversionReservation): string {
  return normalizeCreditThresholdCode(item.code);
}
