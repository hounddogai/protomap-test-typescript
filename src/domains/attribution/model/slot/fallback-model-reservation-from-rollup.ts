import { CreditRollup } from "../../credit/threshold/credit-rollup.js";
import { normalizeCreditThresholdCode } from "../../credit/threshold/credit-threshold-policy.js";
import { FallbackModelReservation, newFallbackModelReservation } from "./fallback-model-reservation.js";

export function summarizeCreditRollupsForReservation(items: CreditRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveFallbackModelReservationsFromRollup(items: CreditRollup[]): FallbackModelReservation[] {
  const out: FallbackModelReservation[] = [];
  for (const item of items) {
    const derived = newFallbackModelReservation(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchFallbackModelReservation(item: FallbackModelReservation): string {
  return normalizeCreditThresholdCode(item.code);
}
