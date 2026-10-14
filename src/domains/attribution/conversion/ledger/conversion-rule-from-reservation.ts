import { creditAdjustmentBucket } from "../../credit/reservation/credit-adjustment-policy.js";
import { PrimaryCreditReservation } from "../../credit/reservation/primary-credit-reservation.js";
import { ConversionRule, newConversionRule } from "./conversion-rule.js";

export function summarizePrimaryCreditReservationsForRule(items: PrimaryCreditReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveConversionRulesFromReservation(items: PrimaryCreditReservation[]): ConversionRule[] {
  const out: ConversionRule[] = [];
  for (const item of items) {
    const derived = newConversionRule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyConversionRule(item: ConversionRule): string {
  return creditAdjustmentBucket(item.projectedTotal());
}
